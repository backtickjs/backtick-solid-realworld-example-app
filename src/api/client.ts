import createClient from "openapi-fetch";
import { currentUser } from "../session.js";
import type { paths } from "./schema.js";

// The RealWorld API, which holds the data: every call is made as the
// signed-in user, with the token from their session cookie.
export const client = createClient<paths>({
  baseUrl: process.env.API_BASE ?? "https://api.realworld.show/api",
});

client.use({
  onRequest({ request }) {
    const user = currentUser();
    if (user) request.headers.set("Authorization", `Token ${user.token}`);
  },
});
