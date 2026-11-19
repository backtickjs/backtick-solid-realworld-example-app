import { cs, type Client } from "@backtickjs/core";
import type { JSX } from "@backtickjs/jsx-react/jsx-runtime";
import type { ArticleSummary } from "../api/types.js";
import { avatarOf, formatDate } from "../format.js";

export const PAGE_SIZE = 10;

// A page of article previews, and links to the other pages. `hrefOf` gives
// the link to page `n`, counted from 1; `back` is this page's, where
// favoriting returns. `empty` is what an empty list says instead.
export function ArticleList({
  articles,
  articlesCount,
  page,
  hrefOf,
  back,
  empty = "No articles are here... yet.",
}: {
  articles: ArticleSummary[];
  articlesCount: number;
  page: number;
  hrefOf: (n: number) => string;
  back: string;
  empty?: string | Client<JSX.Element>;
}) {
  if (articles.length === 0) {
    return cs`(
      <div className="article-preview empty-feed-message">{$empty}</div>
    )`;
  }

  return (
    <>
      {articles.map((article) => (
        <ArticlePreview article={article} back={back} />
      ))}
      <Pagination
        pageCount={Math.ceil(articlesCount / PAGE_SIZE)}
        page={page}
        hrefOf={hrefOf}
      />
    </>
  );
}

function ArticlePreview({
  article,
  back,
}: {
  article: ArticleSummary;
  back: string;
}) {
  const profile = `/profile/${article.author.username}`;
  const tags = <TagList tags={article.tagList} />;
  return cs`(
    <div key={${article.slug}} className="article-preview">
      <div className="article-meta">
        <a href={$profile}>
          <img src={${avatarOf(article.author.image)}} />
        </a>
        <div className="info">
          <a href={$profile} className="author">
            {${article.author.username}}
          </a>
          <span className="date">{${formatDate(article.createdAt)}}</span>
        </div>
        <form
          method="post"
          action={
            ${`/article/${article.slug}/${article.favorited ? "unfavorite" : "favorite"}`}
          }
          className="pull-xs-right"
        >
          <input type="hidden" name="back" value={$back} />
          <button
            type="submit"
            className={
              ${article.favorited
                ? "btn btn-sm btn-primary"
                : "btn btn-sm btn-outline-primary"}
            }
          >
            <i className="ion-heart"></i> {${article.favoritesCount}}
          </button>
        </form>
      </div>
      <a href={${`/article/${article.slug}`}} className="preview-link">
        <h1>{${article.title}}</h1>
        <p>{${article.description}}</p>
        <span>Read more...</span>
        {$tags}
      </a>
    </div>
  )`;
}

// An article's tags, as previews and the article page show them.
export function TagList({ tags }: { tags: string[] }) {
  const items = tags.map(
    (tag) => cs`(
      <li key={$tag} className="tag-default tag-pill tag-outline">
        {$tag}
      </li>
    )`,
  );
  return cs`<ul className="tag-list">{$items}</ul>`;
}

// Links to every page, when there's more than one.
function Pagination({
  pageCount,
  page,
  hrefOf,
}: {
  pageCount: number;
  page: number;
  hrefOf: (n: number) => string;
}) {
  if (pageCount <= 1) {
    return null;
  }
  const links = Array.from({ length: pageCount }, (_, i) => {
    const n = i + 1;
    return cs`(
      <li key={$n} className={${n === page ? "page-item active" : "page-item"}}>
        <a className="page-link" href={${hrefOf(n)}}>
          {$n}
        </a>
      </li>
    )`;
  });
  return cs`<ul className="pagination">{$links}</ul>`;
}
