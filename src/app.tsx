import { readFile } from "node:fs/promises";
import { type Context, Hono } from "hono";
import { compress } from "hono/compress";
import { contextStorage } from "hono/context-storage";
import { HTTPException } from "hono/http-exception";
import { client } from "./api/client.js";
import { toHtml } from "./html.js";
import { Article } from "./pages/Article.js";
import { Login, Register } from "./pages/Auth.js";
import { type Draft, Editor } from "./pages/Editor.js";
import { type Feed, Home } from "./pages/Home.js";
import { NotFound } from "./pages/NotFound.js";
import { Profile } from "./pages/Profile.js";
import { Settings } from "./pages/Settings.js";
import {
  type AppEnv,
  session,
  signedIn,
  signedOut,
  signIn,
  signOut,
} from "./session.js";

// The Conduit: its pages and its forms. Vercel serves it from server.ts, and
// src/dev.ts on this computer; both serve public/ as files first.
export const app = new Hono<AppEnv>();

// Every answer compressed: gzip or deflate, as the browser accepts.
app.use(compress());

// RealWorld's theme and the images the pages show, from the submodule. Each
// is named so Vercel bundles it with the function; its CDN keeps them until
// the next deploy.
app.get(
  "/assets/theme/styles.css",
  asset(
    new URL("../realworld/assets/theme/styles.css", import.meta.url),
    "text/css",
  ),
);
app.get(
  "/assets/media/conduit-logo.svg",
  asset(
    new URL("../realworld/assets/media/conduit-logo.svg", import.meta.url),
    "image/svg+xml",
  ),
);
app.get(
  "/assets/media/default-avatar.svg",
  asset(
    new URL("../realworld/assets/media/default-avatar.svg", import.meta.url),
    "image/svg+xml",
  ),
);

// The request, for what any component asks of it, and the signed-in user,
// from the session cookie: `context.get("user")`.
app.use(contextStorage());
app.use(session);

// Pages. A route passes the page its request and what the URL names; the
// page fetches what it shows, and redirects or answers not found itself.

app.get("/", async (context) => {
  const following = context.req.query("feed") === "following";
  const feed: Feed = following ? { kind: "following" } : { kind: "global" };
  const page = pageOf(context.req.query("page"));
  return context.html(
    await toHtml(<Home context={context} feed={feed} page={page} />),
  );
});
app.get("/tag/:tag", async (context) => {
  const feed: Feed = { kind: "tag", tag: context.req.param("tag") };
  const page = pageOf(context.req.query("page"));
  return context.html(
    await toHtml(<Home context={context} feed={feed} page={page} />),
  );
});

app.get("/article/:slug", async (context) =>
  context.html(
    await toHtml(
      <Article context={context} slug={context.req.param("slug")} />,
    ),
  ),
);

app.get("/profile/:username", async (context) =>
  context.html(
    await toHtml(
      <Profile
        context={context}
        username={context.req.param("username")}
        tab="articles"
        page={pageOf(context.req.query("page"))}
      />,
    ),
  ),
);
app.get("/profile/:username/favorites", async (context) =>
  context.html(
    await toHtml(
      <Profile
        context={context}
        username={context.req.param("username")}
        tab="favorites"
        page={pageOf(context.req.query("page"))}
      />,
    ),
  ),
);

app.get("/login", signedOut, async (context) =>
  context.html(await toHtml(<Login context={context} />)),
);
app.get("/register", signedOut, async (context) =>
  context.html(await toHtml(<Register context={context} />)),
);
app.get("/settings", signedIn, async (context) =>
  context.html(await toHtml(<Settings context={context} />)),
);
app.get("/editor", signedIn, async (context) =>
  context.html(await toHtml(<Editor context={context} />)),
);
app.get("/editor/:slug", signedIn, async (context) =>
  context.html(
    await toHtml(<Editor context={context} slug={context.req.param("slug")} />),
  ),
);

// Forms. Each does what it was sent for and redirects, or shows its page
// again with what the API refused.

app.post("/login", signedOut, async (context) => {
  const form = await context.req.parseBody();
  const email = text(form.email);
  const { data, error } = await client.POST("/users/login", {
    body: { user: { email, password: text(form.password) } },
  });
  if (!data) {
    return context.html(
      await toHtml(
        <Login context={context} email={email} errors={error.errors} />,
      ),
      422,
    );
  }
  signIn(context, data.user);
  return context.redirect(pathOf(context.req.query("next")), 303);
});

app.post("/register", signedOut, async (context) => {
  const form = await context.req.parseBody();
  const username = text(form.username);
  const email = text(form.email);
  const { data, error } = await client.POST("/users", {
    body: { user: { username, email, password: text(form.password) } },
  });
  if (!data) {
    return context.html(
      await toHtml(
        <Register
          context={context}
          username={username}
          email={email}
          errors={error.errors}
        />,
      ),
      422,
    );
  }
  signIn(context, data.user);
  return context.redirect(pathOf(context.req.query("next")), 303);
});

app.post("/settings", signedIn, async (context) => {
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
      await toHtml(
        <Settings context={context} values={values} errors={error.errors} />,
      ),
      422,
    );
  }
  // The cookie keeps the user as the API now answers them.
  signIn(context, data.user);
  return context.redirect(`/profile/${data.user.username}`, 303);
});

app.post("/logout", (context) => {
  signOut(context);
  return context.redirect("/", 303);
});

app.post("/editor", signedIn, async (context) => {
  const draft = draftOf(await context.req.parseBody({ all: true }));
  const { data, error } = await client.POST("/articles", {
    body: { article: draft },
  });
  if (!data) {
    return context.html(
      await toHtml(
        <Editor context={context} draft={draft} errors={error.errors} />,
      ),
      422,
    );
  }
  return context.redirect(`/article/${data.article.slug}`, 303);
});
app.post("/editor/:slug", signedIn, async (context) => {
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
      await toHtml(
        <Editor
          context={context}
          slug={slug}
          draft={draft}
          errors={error.errors}
        />,
      ),
      422,
    );
  }
  return context.redirect(`/article/${data.article.slug}`, 303);
});

app.post("/article/:slug/delete", signedIn, async (context) => {
  await client.DELETE("/articles/{slug}", {
    params: { path: { slug: context.req.param("slug") } },
  });
  return context.redirect("/", 303);
});
app.post("/article/:slug/favorite", signedIn, async (context) => {
  await client.POST("/articles/{slug}/favorite", {
    params: { path: { slug: context.req.param("slug") } },
  });
  return context.redirect(
    refererOf(context, `/article/${context.req.param("slug")}`),
    303,
  );
});
app.post("/article/:slug/unfavorite", signedIn, async (context) => {
  await client.DELETE("/articles/{slug}/favorite", {
    params: { path: { slug: context.req.param("slug") } },
  });
  return context.redirect(
    refererOf(context, `/article/${context.req.param("slug")}`),
    303,
  );
});

app.post("/article/:slug/comments", signedIn, async (context) => {
  const slug = context.req.param("slug");
  const form = await context.req.parseBody();
  await client.POST("/articles/{slug}/comments", {
    params: { path: { slug } },
    body: { comment: { body: text(form.comment) } },
  });
  return context.redirect(`/article/${slug}`, 303);
});
app.post("/article/:slug/comments/:id/delete", signedIn, async (context) => {
  const slug = context.req.param("slug");
  await client.DELETE("/articles/{slug}/comments/{id}", {
    params: { path: { slug, id: Number(context.req.param("id")) } },
  });
  return context.redirect(`/article/${slug}`, 303);
});

app.post("/profile/:username/follow", signedIn, async (context) => {
  await client.POST("/profiles/{username}/follow", {
    params: { path: { username: context.req.param("username") } },
  });
  return context.redirect(
    refererOf(context, `/profile/${context.req.param("username")}`),
    303,
  );
});
app.post("/profile/:username/unfollow", signedIn, async (context) => {
  await client.DELETE("/profiles/{username}/follow", {
    params: { path: { username: context.req.param("username") } },
  });
  return context.redirect(
    refererOf(context, `/profile/${context.req.param("username")}`),
    303,
  );
});

app.notFound(async (context) =>
  context.html(await toHtml(<NotFound context={context} />), 404),
);

// What a page throws to stop: Hono's HTTPException, a 404 answered with the
// not-found page and anything else with the response it carries. Any other
// error is answered rather than crashed on, so the browser can show why.
app.onError(async (error, context) => {
  if (error instanceof HTTPException) {
    if (error.status === 404) {
      return context.html(await toHtml(<NotFound context={context} />), 404);
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

// The page a form was sent from, as the browser's Referer says, if it's a page
// of this site, or `fallback`: a form can't send the browser elsewhere.
function refererOf(context: Context, fallback: string) {
  const referer = context.req.header("referer");
  if (referer === undefined || !URL.canParse(referer)) {
    return fallback;
  }
  const url = new URL(referer);
  if (url.origin !== new URL(context.req.url).origin) {
    return fallback;
  }
  return url.pathname + url.search;
}

// `path`, if it's a page of this site, or the home page: a link can't send
// the browser elsewhere.
function pathOf(path: string | undefined) {
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/";
}

// A file of the app's, answered as `type`.
function asset(file: URL, type: string) {
  return async (context: Context) =>
    context.body(await readFile(file), 200, {
      "Content-Type": type,
      "Cache-Control": "public, max-age=3600, s-maxage=31536000",
    });
}
