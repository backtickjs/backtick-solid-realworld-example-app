import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

// Article bodies as HTML, sanitized so a body can't run script: what
// SvelteKit's Conduit does, with the same libraries.
export function renderMarkdown(source: string): string {
  return sanitizeHtml(marked.parse(source, { async: false }));
}
