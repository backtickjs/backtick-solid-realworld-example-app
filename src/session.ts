import { getContext } from "hono/context-storage";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { User } from "./api/types.js";
import { redirect } from "./navigation.js";

// The signed-in user, as the API answered them at sign-in, token included:
// base64 JSON in a cookie, as SvelteKit's Conduit keeps it. Reading it costs
// no request; the API checks the token on every call that needs it.
const COOKIE = "jwt";

export function signIn(user: User) {
  setCookie(
    getContext(),
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

export function signOut() {
  deleteCookie(getContext(), COOKIE, { path: "/" });
}

// The signed-in user, or null.
export function currentUser(): User | null {
  const value = getCookie(getContext(), COOKIE);
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64").toString()) as User;
  } catch {
    return null;
  }
}

// The signed-in user, or, for a visitor, the sign-in page instead.
export function requireUser(): User {
  return currentUser() ?? redirect("/login");
}
