import { cs } from "@backtickjs/core";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { client } from "../api/client.js";
import type { Comment, User } from "../api/types.js";
import { TagList } from "../components/ArticleList.js";
import { ArticleMeta } from "../components/ArticleMeta.js";
import { Layout } from "../components/Layout.js";
import { avatarOf, formatDate } from "../format.js";
import { renderMarkdown } from "../markdown.js";
import type { AppEnv } from "../session.js";

// An article, its body rendered from Markdown, and its comments.
export async function Article({
  context,
  slug,
}: {
  context: Context<AppEnv>;
  slug: string;
}) {
  const user = context.get("user");
  const path = { slug };
  const [articleResponse, commentsResponse] = await Promise.all([
    client.GET("/articles/{slug}", { params: { path } }),
    client.GET("/articles/{slug}/comments", { params: { path } }),
  ]);
  if (!articleResponse.data) {
    throw new HTTPException(404);
  }
  const { article } = articleResponse.data;
  const comments = commentsResponse.data?.comments ?? [];
  const body = renderMarkdown(article.body);
  // Signing in from here comes back here.
  const next = `?next=${encodeURIComponent(`/article/${article.slug}`)}`;
  const commentForm = user ? (
    <CommentForm slug={article.slug} user={user} />
  ) : (
    cs`(
      <p>
        <a href={${`/login${next}`}}>Sign in</a> or{" "}
        <a href={${`/register${next}`}}>sign up</a> to add comments on this
        article.
      </p>
    )`
  );

  return (
    <Layout user={user} path={`/article/${article.slug}`}>
      {cs`(
        <div class="article-page">
          <div class="banner">
            <div class="container">
              <h1>{${article.title}}</h1>
              {${(<ArticleMeta article={article} user={user} />)}}
            </div>
          </div>
          <div class="container page">
            <div class="row article-content">
              <div class="col-md-12">
                <div innerHTML={$body} />
                <$TagList tags={${article.tagList}} />
              </div>
            </div>
            <hr />
            <div class="article-actions">
              {${(<ArticleMeta article={article} user={user} />)}}
            </div>
            <div class="row">
              <div class="col-xs-12 col-md-8 offset-md-2">
                {$commentForm}
                {
                  ${comments.map((comment) => (
                    <CommentCard
                      slug={article.slug}
                      comment={comment}
                      user={user}
                    />
                  ))}
                }
              </div>
            </div>
          </div>
        </div>
      )`}
    </Layout>
  );
}

function CommentForm({ slug, user }: { slug: string; user: User }) {
  return cs`(
    <form
      method="post"
      action={${`/article/${slug}/comments`}}
      class="card comment-form"
    >
      <div class="card-block">
        <textarea
          class="form-control"
          name="comment"
          placeholder="Write a comment..."
          rows={3}
        ></textarea>
      </div>
      <div class="card-footer">
        <img src={${avatarOf(user.image)}} class="comment-author-img" />
        <button type="submit" class="btn btn-sm btn-primary">
          Post Comment
        </button>
      </div>
    </form>
  )`;
}

// One comment, with a way to delete it for its author.
function CommentCard({
  slug,
  comment,
  user,
}: {
  slug: string;
  comment: Comment;
  user: User | null;
}) {
  const profile = `/profile/${comment.author.username}`;
  const remove =
    user?.username === comment.author.username
      ? cs`(
          <span class="mod-options">
            <form
              method="post"
              action={${`/article/${slug}/comments/${comment.id}/delete`}}
              style={{ display: "inline" }}
            >
              <button
                type="submit"
                aria-label="Delete comment"
                style={{
                  border: "0",
                  padding: "0",
                  background: "none",
                  color: "inherit",
                }}
              >
                <i class="ion-trash-a"></i>
              </button>
            </form>
          </span>
        )`
      : null;
  return cs`(
    <div class="card">
      <div class="card-block">
        <p class="card-text">{${comment.body}}</p>
      </div>
      <div class="card-footer">
        <a href={$profile} class="comment-author">
          <img
            src={${avatarOf(comment.author.image)}}
            class="comment-author-img"
          />
        </a>
        &nbsp;
        <a href={$profile} class="comment-author">
          {${comment.author.username}}
        </a>
        <span class="date-posted">{${formatDate(comment.createdAt)}}</span>
        {$remove}
      </div>
    </div>
  )`;
}
