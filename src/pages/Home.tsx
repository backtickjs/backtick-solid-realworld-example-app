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
  // Your Feed is a signed-in user's; a tag's tab is shown on its page.
  const yourFeed = user
    ? cs`(
        <$NavItem
          href={${feedHref({ kind: "following" })}}
          active={${feed.kind === "following"}}
        >
          Your Feed
        </$NavItem>
      )`
    : null;
  const tagFeed =
    feed.kind === "tag"
      ? cs`(
          <$NavItem href={${feedHref(feed)}} active={true}>
            # {${feed.tag}}
          </$NavItem>
        )`
      : null;
  // What an empty list says: Your Feed points to the Global Feed.
  const empty =
    feed.kind === "following"
      ? cs`(
          <>
            Your feed is empty. Follow some authors, or read the{" "}
            <a href="/">Global Feed</a>.
          </>
        )`
      : undefined;

  // For readers who aren't signed in.
  const banner = user
    ? null
    : cs`(
        <div class="banner">
          <div class="container">
            <h1 class="logo-font">
              <img
                src="/assets/media/conduit-logo.svg"
                alt="Conduit"
                class="banner-logo"
              />
            </h1>
            <p>A place to share your knowledge.</p>
          </div>
        </div>
      )`;

  return (
    <Layout user={user} path="/">
      {cs`(
        <div class="home-page">
          {$banner}
          <div class="container page">
            <div class="row">
              <div class="col-md-9">
                <div class="feed-toggle">
                  <ul class="nav nav-pills outline-active">
                    {$yourFeed}
                    <$NavItem
                      href={${feedHref({ kind: "global" })}}
                      active={${feed.kind === "global"}}
                    >
                      Global Feed
                    </$NavItem>
                    {$tagFeed}
                  </ul>
                </div>
                {
                  ${(
                    <ArticleList
                      articles={articles}
                      articlesCount={articlesCount}
                      page={page}
                      url={context.req.url}
                      empty={empty}
                    />
                  )}
                }
              </div>
              <div class="col-md-3">
                <div class="sidebar">
                  <p>Popular Tags</p>
                  <div class="tag-list">{
                    ${tags.map(
                      (tag) => cs`(
                        <a
                          href={${`/tag/${encodeURIComponent(tag)}`}}
                          class="tag-pill tag-default"
                        >
                          {$tag}
                        </a>
                      )`,
                    )}
                  }</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )`}
    </Layout>
  );
}

// A feed's address: "/", "/?feed=following", "/tag/dragons".
function feedHref(feed: Feed) {
  const path =
    feed.kind === "tag" ? `/tag/${encodeURIComponent(feed.tag)}` : "/";
  const query = new URLSearchParams();
  if (feed.kind === "following") {
    query.set("feed", "following");
  }
  return query.size === 0 ? path : `${path}?${query}`;
}
