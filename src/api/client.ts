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
    const user = getContext<AppEnv>().get("user");
    if (user) {
      request.headers.set("Authorization", `Token ${user.token}`);
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
