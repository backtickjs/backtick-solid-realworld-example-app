import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { User } from "./api/types.js";

// The signed-in user, as the API answered them at sign-in, token included:
// base64 JSON in a cookie, as SvelteKit's Conduit keeps it. Reading it costs
// no request; the API checks the token on every call that needs it.
const COOKIE = "jwt";

// What a route behind `signedIn` sees: a user, never null.
export type SignedInEnv = { Variables: { user: User } };

// What a route behind `signedOut` sees: no user.
export type SignedOutEnv = { Variables: { user: null } };

// What every route sees: either.
export type AppEnv = SignedInEnv | SignedOutEnv;

// Reads the signed-in user from the cookie, once per request, as SvelteKit's
// Conduit does in its `handle` hook.
export const session = createMiddleware<AppEnv>(async (context, next) => {
  context.set("user", userOf(getCookie(context, COOKIE)));
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

export function signIn(context: Context, user: User) {
  setCookie(
    context,
    COOKIE,
    Buffer.from(JSON.stringify(user)).toString("base64"),
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

function userOf(cookie: string | undefined): User | null {
  if (!cookie) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(cookie, "base64").toString()) as User;
  } catch {
    return null;
  }
}
