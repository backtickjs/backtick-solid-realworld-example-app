import { cs, type Client } from "@backtickjs/core";
import type { JSX } from "@backtickjs/jsx-solid/jsx-runtime";
import { For, Show } from "solid-js" with { backtick: "client" };
import type { ArticleSummary } from "../api/types.js";
import { avatarOf, formatDate } from "../format.js";

export const PAGE_SIZE = 10;

// A page of article previews, and links to the other pages. `url` is this
// page's; the other pages are it with another `?page=`. `empty` is what an
// empty list says instead.
export function ArticleList({
  articles,
  articlesCount,
  page,
  url,
  empty = "No articles are here... yet.",
}: {
  articles: ArticleSummary[];
  articlesCount: number;
  page: number;
  url: string;
  empty?: string | Client<JSX.Element>;
}) {
  if (articles.length === 0) {
    return cs`<div class="article-preview empty-feed-message">{$empty}</div>`;
  }

  const hrefs = Array.from(
    { length: Math.ceil(articlesCount / PAGE_SIZE) },
    (_, i) => pageHref(url, i + 1),
  );
  return (
    <>
      {articles.map((article) => (
        <ArticlePreview article={article} />
      ))}
      {cs`<$Pagination hrefs={$hrefs} page={$page} />`}
    </>
  );
}

// `url`'s path and query at page `page`: "/tag/dragons?page=2". Page 1 has
// no `?page=`.
function pageHref(url: string, page: number) {
  const href = new URL(url);
  if (page === 1) {
    href.searchParams.delete("page");
  } else {
    href.searchParams.set("page", String(page));
  }
  return href.pathname + href.search;
}

function ArticlePreview({ article }: { article: ArticleSummary }) {
  const profile = `/profile/${article.author.username}`;
  return cs`(
    <div class="article-preview">
      <div class="article-meta">
        <a href={$profile}>
          <img
            src={${avatarOf(article.author.image)}}
            alt={${article.author.username}}
          />
        </a>
        <div class="info">
          <a href={$profile} class="author">
            {${article.author.username}}
          </a>
          <span class="date">{${formatDate(article.createdAt)}}</span>
        </div>
        <form
          method="post"
          action={
            ${`/article/${article.slug}/${article.favorited ? "unfavorite" : "favorite"}`}
          }
          class="pull-xs-right"
        >
          <button
            type="submit"
            class={
              ${article.favorited
                ? "btn btn-sm btn-primary"
                : "btn btn-sm btn-outline-primary"}
            }
          >
            <i class="ion-heart"></i> {${article.favoritesCount}}
          </button>
        </form>
      </div>
      <a href={${`/article/${article.slug}`}} class="preview-link">
        <h1>{${article.title}}</h1>
        <p>{${article.description}}</p>
        <span>Read more...</span>
        <$TagList tags={${article.tagList}} />
      </a>
    </div>
  )`;
}

// An article's tags, as previews and the article page show them.
export const TagList = cs`(props: { tags: string[] }) => (
  <ul class="tag-list">
    <$For each={props.tags}>
      {(tag) => <li class="tag-default tag-pill tag-outline">{tag}</li>}
    </$For>
  </ul>
)`;

// Links to every page, when there's more than one: `hrefs` holds each page's,
// in order, and `page` is this one, counted from 1.
const Pagination = cs`(props: { hrefs: string[]; page: number }) => (
  <$Show when={props.hrefs.length > 1}>
    <ul class="pagination">
      <$For each={props.hrefs}>
        {(href, i) => (
          <li class={i() + 1 === props.page ? "page-item active" : "page-item"}>
            <a class="page-link" href={href}>
              {i() + 1}
            </a>
          </li>
        )}
      </$For>
    </ul>
  </$Show>
)`;
