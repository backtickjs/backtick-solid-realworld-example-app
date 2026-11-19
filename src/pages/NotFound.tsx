import { cs } from "@backtickjs/core";
import { Layout } from "../components/Layout.js";

// A page or an article that doesn't exist.
export function NotFound() {
  return (
    <Layout path="">
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
