import { cs } from "@backtickjs/core";
import { ArticleList, PAGE_SIZE } from "../components/ArticleList.js";
import { FollowButton } from "../components/ArticleMeta.js";
import { Layout } from "../components/Layout.js";
import { NavItem } from "../components/NavItem.js";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { client } from "../api/client.js";
import { avatarOf } from "../format.js";
import type { AppEnv } from "../session.js";

// A profile, and the articles its user wrote or favorited.
export async function Profile({
  context,
  username,
  tab,
  page,
}: {
  context: Context<AppEnv>;
  username: string;
  tab: "articles" | "favorites";
  page: number;
}) {
  const user = context.get("user");
  const [profileResponse, articlesResponse] = await Promise.all([
    client.GET("/profiles/{username}", { params: { path: { username } } }),
    client.GET("/articles", {
      params: {
        query: {
          ...(tab === "articles"
            ? { author: username }
            : { favorited: username }),
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        },
      },
    }),
  ]);
  if (!profileResponse.data) {
    throw new HTTPException(404);
  }
  if (!articlesResponse.data) {
    throw new Error("Couldn't load the articles");
  }
  const { profile } = profileResponse.data;
  const { articles, articlesCount } = articlesResponse.data;
  const home = `/profile/${encodeURIComponent(username)}`;
  const { image, bio } = profile;

  const action =
    user?.username === username ? (
      cs`(
        <a class="btn btn-sm btn-outline-secondary action-btn" href="/settings">
          <i class="ion-gear-a"></i>
          &nbsp; Edit Profile Settings
        </a>
      )`
    ) : (
      <FollowButton profile={profile} />
    );
  return (
    <Layout user={user} path={home}>
      {cs`(
        <div class="profile-page">
          <div class="user-info">
            <div class="container">
              <div class="row">
                <div class="col-xs-12 col-md-10 offset-md-1">
                  <img src={${avatarOf(image)}} alt="" class="user-img" />
                  <h4>{$username}</h4>
                  <p>{${bio ?? ""}}</p>
                  {$action}
                </div>
              </div>
            </div>
          </div>
          <div class="container">
            <div class="row">
              <div class="col-xs-12 col-md-10 offset-md-1">
                <div class="articles-toggle">
                  <ul class="nav nav-pills outline-active">
                    <$NavItem href={$home} active={${tab === "articles"}}>
                      My Articles
                    </$NavItem>
                    <$NavItem
                      href={${`${home}/favorites`}}
                      active={${tab === "favorites"}}
                    >
                      Favorited Articles
                    </$NavItem>
                  </ul>
                </div>
                {
                  ${(
                    <ArticleList
                      articles={articles}
                      articlesCount={articlesCount}
                      page={page}
                      url={context.req.url}
                    />
                  )}
                }
              </div>
            </div>
          </div>
        </div>
      )`}
    </Layout>
  );
}
