import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { HTTPException } from "hono/http-exception";
import { client } from "./api/client.js";
import { toHtml } from "./html.js";
import { Redirect } from "./navigation.js";
import { Article } from "./pages/Article.js";
import { Login, Register } from "./pages/Auth.js";
import { type Draft, Editor } from "./pages/Editor.js";
import { type Feed, Home } from "./pages/Home.js";
import { NotFound } from "./pages/NotFound.js";
import { Profile } from "./pages/Profile.js";
import { Settings } from "./pages/Settings.js";
import { requireUser, signIn, signOut } from "./session.js";

const app = new Hono();

// The request, for what any component asks of it: the signed-in user.
app.use(contextStorage());

// The app's own files: its icons.
app.use("/*", serveStatic({ root: "./public" }));

// The Conduit theme and the default avatar, from the RealWorld submodule.
app.use(
  "/styles.css",
  serveStatic({ path: "./realworld/assets/theme/styles.css" }),
);
app.use(
  "/default-avatar.svg",
  serveStatic({ path: "./realworld/assets/media/default-avatar.svg" }),
);

// Pages. Each fetches what it shows, and answers not found or redirects
// itself (navigation.ts).

app.get("/", async (context) => {
  const page = pageOf(context.req.query("page"));
  const feed: Feed =
    context.req.query("feed") === "following"
      ? { kind: "following" }
      : { kind: "global" };
  return context.html(await toHtml(<Home feed={feed} page={page} />));
});
app.get("/tag/:tag", async (context) => {
  const feed: Feed = { kind: "tag", tag: context.req.param("tag") };
  const page = pageOf(context.req.query("page"));
  return context.html(await toHtml(<Home feed={feed} page={page} />));
});

app.get("/article/:slug", async (context) =>
  context.html(await toHtml(<Article slug={context.req.param("slug")} />)),
);

app.get("/profile/:username", async (context) => {
  const username = context.req.param("username");
  const page = pageOf(context.req.query("page"));
  return context.html(
    await toHtml(<Profile username={username} tab="articles" page={page} />),
  );
});
app.get("/profile/:username/favorites", async (context) => {
  const username = context.req.param("username");
  const page = pageOf(context.req.query("page"));
  return context.html(
    await toHtml(<Profile username={username} tab="favorites" page={page} />),
  );
});

app.get("/login", async (context) => context.html(await toHtml(<Login />)));
app.get("/register", async (context) =>
  context.html(await toHtml(<Register />)),
);
app.get("/settings", async (context) =>
  context.html(await toHtml(<Settings />)),
);
app.get("/editor", async (context) => context.html(await toHtml(<Editor />)));
app.get("/editor/:slug", async (context) =>
  context.html(await toHtml(<Editor slug={context.req.param("slug")} />)),
);

// Forms. Each does what it was sent for and redirects, or shows its page
// again with what the API refused.

app.post("/login", async (context) => {
  const form = await context.req.parseBody();
  const email = text(form.email);
  const { data, error } = await client.POST("/users/login", {
    body: { user: { email, password: text(form.password) } },
  });
  if (!data) {
    return context.html(
      await toHtml(<Login email={email} errors={error.errors} />),
      422,
    );
  }
  signIn(data.user);
  return context.redirect(pathOf(context.req.query("next")), 303);
});

app.post("/register", async (context) => {
  const form = await context.req.parseBody();
  const username = text(form.username);
  const email = text(form.email);
  const { data, error } = await client.POST("/users", {
    body: { user: { username, email, password: text(form.password) } },
  });
  if (!data) {
    return context.html(
      await toHtml(
        <Register username={username} email={email} errors={error.errors} />,
      ),
      422,
    );
  }
  signIn(data.user);
  return context.redirect(pathOf(context.req.query("next")), 303);
});

app.post("/settings", async (context) => {
  requireUser();
  const form = await context.req.parseBody();
  const values = {
    image: text(form.image),
    username: text(form.username),
    bio: text(form.bio),
    email: text(form.email),
  };
  const password = text(form.password);
  const { data, error } = await client.PUT("/user", {
    // A blank password keeps the current one.
    body: { user: password ? { ...values, password } : values },
  });
  if (!data) {
    return context.html(
      await toHtml(<Settings values={values} errors={error.errors} />),
      422,
    );
  }
  // The cookie keeps the user as the API now answers them.
  signIn(data.user);
  return context.redirect(`/profile/${data.user.username}`, 303);
});

app.post("/logout", (context) => {
  signOut();
  return context.redirect("/", 303);
});

app.post("/editor", async (context) => {
  requireUser();
  const draft = draftOf(await context.req.parseBody({ all: true }));
  const { data, error } = await client.POST("/articles", {
    body: { article: draft },
  });
  if (!data) {
    return context.html(
      await toHtml(<Editor draft={draft} errors={error.errors} />),
      422,
    );
  }
  return context.redirect(`/article/${data.article.slug}`, 303);
});
app.post("/editor/:slug", async (context) => {
  requireUser();
  const slug = context.req.param("slug");
  const draft = draftOf(await context.req.parseBody({ all: true }));
  const { data, error, response } = await client.PUT("/articles/{slug}", {
    params: { path: { slug } },
    body: { article: draft },
  });
  // None at `slug`, or someone else's.
  if (response.status === 403 || response.status === 404) {
    return context.notFound();
  }
  if (!data) {
    return context.html(
      await toHtml(<Editor slug={slug} draft={draft} errors={error.errors} />),
      422,
    );
  }
  return context.redirect(`/article/${data.article.slug}`, 303);
});

app.post("/article/:slug/delete", async (context) => {
  requireUser();
  await client.DELETE("/articles/{slug}", {
    params: { path: { slug: context.req.param("slug") } },
  });
  return context.redirect("/", 303);
});
app.post("/article/:slug/favorite", async (context) => {
  requireUser();
  await client.POST("/articles/{slug}/favorite", {
    params: { path: { slug: context.req.param("slug") } },
  });
  return context.redirect(backOf(await context.req.parseBody()), 303);
});
app.post("/article/:slug/unfavorite", async (context) => {
  requireUser();
  await client.DELETE("/articles/{slug}/favorite", {
    params: { path: { slug: context.req.param("slug") } },
  });
  return context.redirect(backOf(await context.req.parseBody()), 303);
});

app.post("/article/:slug/comments", async (context) => {
  requireUser();
  const slug = context.req.param("slug");
  const form = await context.req.parseBody();
  await client.POST("/articles/{slug}/comments", {
    params: { path: { slug } },
    body: { comment: { body: text(form.comment) } },
  });
  return context.redirect(`/article/${slug}`, 303);
});
app.post("/article/:slug/comments/:id/delete", async (context) => {
  requireUser();
  const slug = context.req.param("slug");
  await client.DELETE("/articles/{slug}/comments/{id}", {
    params: { path: { slug, id: Number(context.req.param("id")) } },
  });
  return context.redirect(`/article/${slug}`, 303);
});

app.post("/profile/:username/follow", async (context) => {
  requireUser();
  await client.POST("/profiles/{username}/follow", {
    params: { path: { username: context.req.param("username") } },
  });
  return context.redirect(backOf(await context.req.parseBody()), 303);
});
app.post("/profile/:username/unfollow", async (context) => {
  requireUser();
  await client.DELETE("/profiles/{username}/follow", {
    params: { path: { username: context.req.param("username") } },
  });
  return context.redirect(backOf(await context.req.parseBody()), 303);
});

app.notFound(async (context) => context.html(await toHtml(<NotFound />), 404));

// What a page's `notFound()` and `redirect()` throw, answered; anything else
// answered rather than crashed on, so the browser can show why.
app.onError(async (error, context) => {
  // Through the context, which keeps the cookies set before it.
  if (error instanceof Redirect) return context.redirect(error.location, 303);
  if (error instanceof HTTPException) {
    if (error.status === 404) {
      return context.html(await toHtml(<NotFound />), 404);
    }
    return error.getResponse();
  }
  console.error(error);
  return context.text(String(error), 500);
});

// `?page=N`, counted from 1, as the feeds' links write it.
function pageOf(query: string | undefined) {
  const page = Number(query);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

// A form field's text: a file or a missing field is empty.
function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

// The editor's fields, as a form sends them: each tag its own `tag` field,
// so an article without tags gets an empty list.
function draftOf(form: Record<string, unknown>): Draft {
  return {
    title: text(form.title),
    description: text(form.description),
    body: text(form.body),
    tagList: [form.tag ?? []].flat().map(text).filter(Boolean),
  };
}

// Where a form asked to return, if it's a page of this site.
function backOf(form: Record<string, unknown>) {
  return pathOf(text(form.back));
}

// `path`, if it's a page of this site, or the home page: a link can't send
// the browser elsewhere.
function pathOf(path: string | undefined) {
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/";
}

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log("Backtick server on http://localhost:3000");
});
