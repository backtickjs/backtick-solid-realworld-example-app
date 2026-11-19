import { cs } from "@backtickjs/core";
import { client } from "../api/client.js";
import type { Comment, User } from "../api/types.js";
import { TagList } from "../components/ArticleList.js";
import { ArticleMeta } from "../components/ArticleMeta.js";
import { Layout } from "../components/Layout.js";
import { avatarOf, formatDate } from "../format.js";
import { renderMarkdown } from "../markdown.js";
import { notFound } from "../navigation.js";
import { currentUser } from "../session.js";

// An article, its body rendered from Markdown, and its comments.
export async function Article({ slug }: { slug: string }) {
  const user = currentUser();
  const path = { slug };
  const [found, comments] = await Promise.all([
    client.GET("/articles/{slug}", { params: { path } }),
    client.GET("/articles/{slug}/comments", { params: { path } }),
  ]);
  if (!found.data) notFound();
  const { article } = found.data;
  const meta = <ArticleMeta article={article} user={user} />;
  const body = renderMarkdown(article.body);
  const tags = <TagList tags={article.tagList} />;
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
  const cards = (comments.data?.comments ?? []).map((comment) => (
    <CommentCard slug={article.slug} comment={comment} user={user} />
  ));

  return (
    <Layout path={`/article/${article.slug}`}>
      {cs`(
        <div className="article-page">
          <div className="banner">
            <div className="container">
              <h1>{${article.title}}</h1>
              {$meta}
            </div>
          </div>
          <div className="container page">
            <div className="row article-content">
              <div className="col-md-12">
                <div dangerouslySetInnerHTML={{ __html: $body }} />
                {$tags}
              </div>
            </div>
            <hr />
            <div className="article-actions">{$meta}</div>
            <div className="row">
              <div className="col-xs-12 col-md-8 offset-md-2">
                {$commentForm}
                {$cards}
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
      className="card comment-form"
    >
      <div className="card-block">
        <textarea
          className="form-control"
          name="comment"
          placeholder="Write a comment..."
          rows={3}
        ></textarea>
      </div>
      <div className="card-footer">
        <img src={${avatarOf(user.image)}} className="comment-author-img" />
        <button type="submit" className="btn btn-sm btn-primary">
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
          <span className="mod-options">
            <form
              method="post"
              action={${`/article/${slug}/comments/${comment.id}/delete`}}
              style={{ display: "inline" }}
            >
              <button
                type="submit"
                aria-label="Delete comment"
                style={{
                  border: 0,
                  padding: 0,
                  background: "none",
                  color: "inherit",
                }}
              >
                <i className="ion-trash-a"></i>
              </button>
            </form>
          </span>
        )`
      : null;
  return cs`(
    <div key={${comment.id}} className="card">
      <div className="card-block">
        <p className="card-text">{${comment.body}}</p>
      </div>
      <div className="card-footer">
        <a href={$profile} className="comment-author">
          <img
            src={${avatarOf(comment.author.image)}}
            className="comment-author-img"
          />
        </a>
        &nbsp;
        <a href={$profile} className="comment-author">
          {${comment.author.username}}
        </a>
        <span className="date-posted">{${formatDate(comment.createdAt)}}</span>
        {$remove}
      </div>
    </div>
  )`;
}
