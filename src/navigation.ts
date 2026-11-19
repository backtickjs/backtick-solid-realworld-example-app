import { HTTPException } from "hono/http-exception";

// As Next.js's: stop rendering, and answer with the not-found page.
export function notFound(): never {
  throw new HTTPException(404);
}

// What `redirect` throws, for the app's error handler to answer.
export class Redirect extends Error {
  constructor(readonly location: string) {
    super(`Redirect to ${location}`);
  }
}

// As Next.js's: stop rendering, and send the browser to `path`.
export function redirect(path: string): never {
  throw new Redirect(path);
}
