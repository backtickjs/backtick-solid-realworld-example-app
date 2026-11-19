import { cs } from "@backtickjs/core";
import type { Context } from "hono";
import type { AppEnv } from "../session.js";
import { Layout } from "../components/Layout.js";

// A page or an article that doesn't exist.
export function NotFound({ context }: { context: Context<AppEnv> }) {
  return (
    <Layout user={context.get("user")} path="">
      {cs`(
        <div className="container page">
          <h1>Page not found</h1>
          <p>
            <a href="/">Back to the home page</a>
          </p>
        </div>
      )`}
    </Layout>
  );
}
