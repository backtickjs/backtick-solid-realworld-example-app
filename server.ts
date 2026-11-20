// The Conduit's Vercel Function: the app, as `npm run build` compiles it into
// dist/. Vercel serves public/ itself.
import type { Hono } from "hono";
import { app } from "./dist/app.js";
import type { AppEnv } from "./dist/session.js";

export default app satisfies Hono<AppEnv>;
