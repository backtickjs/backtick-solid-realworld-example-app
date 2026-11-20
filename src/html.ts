import { bundler } from "@backtickjs/bundler";
import { cs } from "@backtickjs/core";
import type { JSX } from "@backtickjs/jsx-solid/jsx-runtime";

// The version of Solid the page loads, below: what each page is bundled for.
const modules = {
  "solid-js": "1.9.17",
  "solid-js/web": "1.9.17",
};

// Development unless NODE_ENV says production, as hosts set it for a deploy.
const development = process.env.NODE_ENV !== "production";

// A page: its element as a component, bundled for the browser, which the
// page's entry draws with Solid's `render`, and Solid's minified build from a
// CDN. Solid makes a page's nodes when `render` calls its component, so the
// element is spliced into one. It's drawn into <app-root>, the element the
// shared theme grows to keep the footer at the bottom.
export async function toHtml(element: JSX.Element): Promise<string> {
  const page = cs`() => $element`;
  const bundle = await bundler.build({ input: page, modules });
  // In development, a map back to the files you wrote, for the browser's
  // devtools.
  const { code } = bundle.generate({
    format: "es",
    sourcemap: development ? "inline" : false,
  });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Conduit</title>
    <link rel="stylesheet" href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700|Lora:400,700">
    <link rel="stylesheet" href="/assets/theme/styles.css">
    <link rel="icon" href="/favicon.png" sizes="32x32" type="image/png">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
    <script defer src="/_vercel/insights/script.js"></script>
    <script type="importmap">
      {
        "imports": {
          "solid-js": "https://cdn.jsdelivr.net/npm/solid-js@1.9.17/dist/solid.min.js",
          "solid-js/web": "https://cdn.jsdelivr.net/npm/solid-js@1.9.17/web/dist/web.min.js"
        }
      }
    </script>
  </head>
  <body>
    <app-root></app-root>
    <script type="module">
      import { render } from "solid-js/web";
      import Page from "data:text/javascript,${encodeURIComponent(code)}";
      render(Page, document.querySelector("app-root"));
    </script>
  </body>
</html>`;
}
