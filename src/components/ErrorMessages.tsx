import { cs } from "@backtickjs/core";
import type { Errors } from "../api/types.js";

// What the API refused, one line per message: "email is invalid".
export function ErrorMessages({ errors }: { errors?: Errors }) {
  const lines = Object.entries(errors ?? {}).flatMap(([field, messages]) =>
    messages.map((message) => `${field} ${message}`),
  );
  if (lines.length === 0) {
    return null;
  }

  const items = lines.map((line) => cs`<li>{$line}</li>`);
  return cs`<ul class="error-messages">{$items}</ul>`;
}
