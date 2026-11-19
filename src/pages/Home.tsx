import { cs } from "@backtickjs/core";
import { ArticleList, PAGE_SIZE } from "../components/ArticleList.js";
import { Layout } from "../components/Layout.js";
import { NavItem } from "../components/NavItem.js";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { client } from "../api/client.js";
import type { AppEnv } from "../session.js";

// Which articles the home page lists.
export type Feed =
  { kind: "global" } | { kind: "following" } | { kind: "tag"; tag: string };

// The home page: a page of a feed, and the popular tags beside it.
export async function Home({
  context,
  feed,
  page,
}: {
  context: Context<AppEnv>;
  feed: Feed;
  page: number;
}) {
  const user = context.get("user");
  // Your Feed is a signed-in user's.
  if (feed.kind === "following" && !user) {
    throw new HTTPException(303, { res: context.redirect("/login") });
  }
  const query = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };
  const [articlesResponse, tagsResponse] = await Promise.all([
    feed.kind === "following"
      ? client.GET("/articles/feed", { params: { query } })
      : client.GET("/articles", {
          params: {
            query: {
              ...query,
              tag: feed.kind === "tag" ? feed.tag : undefined,
            },
          },
        }),
    client.GET("/tags"),
  ]);
  if (!articlesResponse.data) {
    throw new Error("Couldn't load the articles");
  }
  const { articles, articlesCount } = articlesResponse.data;
  const tags = tagsResponse.data?.tags ?? [];
  const tabs = (
    <>
      {user ? (
        <NavItem
          href={hrefOf({ kind: "following" })}
          active={feed.kind === "following"}
        >
          Your Feed
        </NavItem>
      ) : null}
      <NavItem
        href={hrefOf({ kind: "global" })}
        active={feed.kind === "global"}
      >
        Global Feed
      </NavItem>
      {feed.kind === "tag" ? (
        <NavItem href={hrefOf(feed)} active>
          {`# ${feed.tag}`}
        </NavItem>
      ) : null}
    </>
  );
  const popular = tags.map(
    (tag) => cs`(
      <a
        key={$tag}
        href={${`/tag/${encodeURIComponent(tag)}`}}
        className="tag-pill tag-default"
      >
        {$tag}
      </a>
    )`,
  );
  const list = (
    <ArticleList
      articles={articles}
      articlesCount={articlesCount}
      page={page}
      hrefOf={(n) => hrefOf(feed, n)}
      back={hrefOf(feed, page)}
      empty={
        feed.kind === "following"
          ? cs`(
              <>
                Your feed is empty. Follow some authors, or read the{" "}
                <a href="/">Global Feed</a>.
              </>
            )`
          : undefined
      }
    />
  );

  return (
    <Layout user={user} path="/">
      {cs`(
        <div className="home-page">
          <div className="banner">
            <div className="container">
              <h1 className="logo-font">conduit</h1>
              <p>A place to share your knowledge.</p>
            </div>
          </div>
          <div className="container page">
            <div className="row">
              <div className="col-md-9">
                <div className="feed-toggle">
                  <ul className="nav nav-pills outline-active">{$tabs}</ul>
                </div>
                {$list}
              </div>
              <div className="col-md-3">
                <div className="sidebar">
                  <p>Popular Tags</p>
                  <div className="tag-list">{$popular}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )`}
    </Layout>
  );
}

// A feed's address, at page `page`: "/", "/?feed=following&page=2", "/tag/dragons".
function hrefOf(feed: Feed, page = 1) {
  const path =
    feed.kind === "tag" ? `/tag/${encodeURIComponent(feed.tag)}` : "/";
  const query = new URLSearchParams();
  if (feed.kind === "following") {
    query.set("feed", "following");
  }
  if (page > 1) {
    query.set("page", String(page));
  }
  return query.size === 0 ? path : `${path}?${query}`;
}
