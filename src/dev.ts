// The Conduit on this computer, as Vercel serves it: public/ as files, then
// the app.
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { app } from "./app.js";

const dev = new Hono();
dev.use(serveStatic({ root: "./public" }));
dev.all("*", (context) => app.fetch(context.req.raw));

serve({ fetch: dev.fetch, port: 3000 }, () => {
  console.log("Backtick server on http://localhost:3000");
});
