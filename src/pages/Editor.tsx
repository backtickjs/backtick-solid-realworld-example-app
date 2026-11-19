import { cs } from "@backtickjs/core";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { client } from "../api/client.js";
import type { Errors } from "../api/types.js";
import { ErrorMessages } from "../components/ErrorMessages.js";
import { Layout } from "../components/Layout.js";
import { TagInput } from "../components/TagInput.js";
import type { SignedInEnv } from "../session.js";

// What the editor sends.
export interface Draft {
  title: string;
  description: string;
  body: string;
  tagList: string[];
}

const EMPTY: Draft = { title: "", description: "", body: "", tagList: [] };

// A new article at /editor, or an article being edited at /editor/:slug, by
// its author. `draft` is what a refused form was sent with.
export async function Editor({
  context,
  slug,
  draft,
  errors,
}: {
  context: Context<SignedInEnv>;
  slug?: string;
  draft?: Draft;
  errors?: Errors;
}) {
  const user = context.get("user");
  if (slug !== undefined && draft === undefined) {
    const { data } = await client.GET("/articles/{slug}", {
      params: { path: { slug } },
    });
    if (!data) {
      throw new HTTPException(404);
    }
    // Only its author edits it.
    if (data.article.author.username !== user.username) {
      throw new HTTPException(303, {
        res: context.redirect(`/article/${slug}`),
      });
    }
    draft = data.article;
  }
  draft ??= EMPTY;
  const errorMessages = <ErrorMessages errors={errors} />;
  return (
    <Layout
      user={user}
      path={slug === undefined ? "/editor" : `/editor/${slug}`}
    >
      {cs`(
        <div className="editor-page">
          <div className="container page">
            <div className="row">
              <div className="col-md-10 offset-md-1 col-xs-12">
                {$errorMessages}
                <form method="post">
                  <fieldset>
                    <fieldset className="form-group">
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        name="title"
                        placeholder="Article Title"
                        defaultValue={${draft.title}}
                      />
                    </fieldset>
                    <fieldset className="form-group">
                      <input
                        type="text"
                        className="form-control"
                        name="description"
                        placeholder="What's this article about?"
                        defaultValue={${draft.description}}
                      />
                    </fieldset>
                    <fieldset className="form-group">
                      <textarea
                        className="form-control"
                        rows={8}
                        name="body"
                        placeholder="Write your article (in markdown)"
                        defaultValue={${draft.body}}
                      ></textarea>
                    </fieldset>
                    <fieldset className="form-group">
                      <$TagInput initial={${draft.tagList}} />
                    </fieldset>
                    <button
                      className="btn btn-lg pull-xs-right btn-primary"
                      type="submit"
                    >
                      Publish Article
                    </button>
                  </fieldset>
                </form>
              </div>
            </div>
          </div>
        </div>
      )`}
    </Layout>
  );
}
