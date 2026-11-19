import { cs } from "@backtickjs/core";
import { For, Show } from "solid-js" with { backtick: "client" };
import type { Errors } from "../api/types.js";

// What the API refused, one line per message: "email is invalid".
export const ErrorMessages = cs`(props: { errors?: Errors }) => {
  const lines = Object.entries(props.errors ?? {}).flatMap(
    ([field, messages]) => messages.map((message) => field + " " + message),
  );
  return (
    <$Show when={lines.length > 0}>
      <ul class="error-messages">
        <$For each={lines}>{(line) => <li>{line}</li>}</$For>
      </ul>
    </$Show>
  );
}`;
