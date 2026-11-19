import { bundler } from "@backtickjs/bundler";
import type { JSX } from "@backtickjs/jsx-react/jsx-runtime";

// The versions of React the page loads, below: what each page is bundled for.
const modules = {
  react: "19.2.3",
  "react/jsx-runtime": "19.2.3",
  "react-dom/client": "19.2.3",
};

// Development unless NODE_ENV says production, as hosts set it for a deploy.
const development = process.env.NODE_ENV !== "production";

// A page: its element, bundled for the browser, which the page's entry draws
// with React's `createRoot`, and React from a CDN.
export async function toHtml(element: JSX.Element): Promise<string> {
  const bundle = await bundler.build({ input: element, modules });
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
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/ionicons/2.0.1/css/ionicons.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700|Lora:400,700">
    <link rel="stylesheet" href="/styles.css">
    <link rel="icon" href="/favicon.png" sizes="32x32" type="image/png">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@19.2.3",
          "react/jsx-runtime": "https://esm.sh/react@19.2.3/jsx-runtime",
          "react-dom/client": "https://esm.sh/react-dom@19.2.3/client?external=react"
        }
      }
    </script>
  </head>
  <body>
    <div id="app"></div>
    <script type="module">
      import { createRoot } from "react-dom/client";
      import page from "data:text/javascript,${encodeURIComponent(code)}";
      createRoot(document.getElementById("app")).render(page);
    </script>
  </body>
</html>`;
}
