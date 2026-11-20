import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { client } from "./api/client.js";
import type { User } from "./api/types.js";

// The signed-in user, as the API last answered them, token included, and when
// it did: base64 JSON in a cookie, as SvelteKit's Conduit keeps the user.
const COOKIE = "jwt";

// How long the API's word on a token holds before it's asked again: Angular's
// Conduit asks once when the app starts, about once per visit.
const CHECK_EVERY = 10 * 60 * 1000;

interface Session {
  user: User;
  // When the API last accepted the token, in milliseconds since the epoch.
  checkedAt: number;
}

// What a route behind `signedIn` sees: a user, never null.
export type SignedInEnv = { Variables: { user: User } };

// What a route behind `signedOut` sees: no user.
export type SignedOutEnv = { Variables: { user: null } };

// What every route sees: either.
export type AppEnv = SignedInEnv | SignedOutEnv;

// Reads the signed-in user from the cookie. Past CHECK_EVERY, it asks the API
// whether their token still holds, as Angular's Conduit does at startup: a 4XX
// signs them out, a 5XX keeps the session for the next request.
export const session = createMiddleware<AppEnv>(async (context, next) => {
  const stored = sessionOf(getCookie(context, COOKIE));
  let user = stored?.user ?? null;
  if (stored && Date.now() - stored.checkedAt > CHECK_EVERY) {
    const { data, response } = await client.GET("/user", {
      headers: { Authorization: `Token ${stored.user.token}` },
    });
    if (data) {
      user = data.user;
      signIn(context, user);
    } else if (response.status < 500) {
      user = null;
      signOut(context);
    }
  }
  context.set("user", user);
  await next();
});

// For a route only a signed-in user can use: anyone else goes to the sign-in
// page instead.
export const signedIn = createMiddleware<SignedInEnv>(async (context, next) => {
  if (!context.get("user")) {
    return context.redirect("/login", 303);
  }
  await next();
});

// For a route only a visitor can use, as signing in: a signed-in user goes
// home instead.
export const signedOut = createMiddleware<SignedOutEnv>(
  async (context, next) => {
    if (context.get("user")) {
      return context.redirect("/", 303);
    }
    await next();
  },
);

// Signs `user` in, as the API just answered them.
export function signIn(context: Context, user: User) {
  const value: Session = { user, checkedAt: Date.now() };
  setCookie(
    context,
    COOKIE,
    Buffer.from(JSON.stringify(value)).toString("base64"),
    {
      httpOnly: true,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  );
}

export function signOut(context: Context) {
  deleteCookie(context, COOKIE, { path: "/" });
}

function sessionOf(cookie: string | undefined): Session | null {
  if (!cookie) {
    return null;
  }
  try {
    const value = JSON.parse(Buffer.from(cookie, "base64").toString());
    return value.user && typeof value.checkedAt === "number" ? value : null;
  } catch {
    return null;
  }
}
