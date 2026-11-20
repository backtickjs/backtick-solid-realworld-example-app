import createClient from "openapi-fetch";
import { getContext } from "hono/context-storage";
import { HTTPException } from "hono/http-exception";
import { type AppEnv, signOut } from "../session.js";
import type { paths } from "./schema.js";

// The RealWorld API, which holds the data: every call is made as the
// signed-in user, with the token from their session cookie.
export const client = createClient<paths>({
  baseUrl: process.env.API_BASE ?? "https://api.realworld.show/api",
});

client.use({
  onRequest({ request }) {
    const context = getContext<AppEnv>();
    const user = context.get("user");
    if (user) {
      request.headers.set("Authorization", `Token ${user.token}`);
    }
    // The visitor's address, as Vercel sets it: the API keeps a few sessions
    // per address, so without it every visitor shares this server's.
    const visitor = context.req.header("x-forwarded-for");
    if (visitor) {
      request.headers.set("X-Forwarded-For", visitor);
    }
  },
  // A token the API no longer accepts signs the user out, to sign in again
  // and come back to the page they asked for.
  onResponse({ response }) {
    const context = getContext<AppEnv>();
    if (response.status !== 401 || !context.get("user")) {
      return;
    }
    signOut(context);
    const { pathname, search } = new URL(context.req.url);
    const next =
      context.req.method === "GET"
        ? `?next=${encodeURIComponent(pathname + search)}`
        : "";
    throw new HTTPException(303, {
      res: context.redirect(`/login${next}`, 303),
    });
  },
});
