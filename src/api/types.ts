import type { Article, GenericErrorModel } from "./schema.js";

// What the pages read, as the API answers it for the signed-in user:
// `following` and `favorited` are theirs.
export type { Article, Comment, Profile, User } from "./schema.js";

// An article as lists show it: without its body.
export type ArticleSummary = Omit<Article, "body">;

// What a form was refused for, messages by field: { email: ["is invalid"] }.
export type Errors = GenericErrorModel["errors"];
