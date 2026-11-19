import { cs } from "@backtickjs/core";
import { ArticleList, PAGE_SIZE } from "../components/ArticleList.js";
import { FollowButton } from "../components/ArticleMeta.js";
import { Layout } from "../components/Layout.js";
import { NavItem } from "../components/NavItem.js";
import { client } from "../api/client.js";
import { avatarOf } from "../format.js";
import { notFound } from "../navigation.js";
import { currentUser } from "../session.js";

// A profile, and the articles its user wrote or favorited.
export async function Profile({
  username,
  tab,
  page,
}: {
  username: string;
  tab: "articles" | "favorites";
  page: number;
}) {
  const home = `/profile/${encodeURIComponent(username)}`;
  const user = currentUser();
  const [found, articles] = await Promise.all([
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
  if (!found.data) notFound();
  if (!articles.data) throw new Error("Couldn't load the articles");
  const { profile } = found.data;
  const { image, bio } = profile;
  const tabHref = tab === "articles" ? home : `${home}/favorites`;
  const hrefOf = (n: number) => (n === 1 ? tabHref : `${tabHref}?page=${n}`);

  const action =
    user?.username === username ? (
      cs`(
        <a
          className="btn btn-sm btn-outline-secondary action-btn"
          href="/settings"
        >
          <i className="ion-gear-a"></i>
          &nbsp; Edit Profile Settings
        </a>
      )`
    ) : (
      <FollowButton profile={profile} back={tabHref} />
    );
  const tabs = (
    <>
      <NavItem href={home} active={tab === "articles"}>
        My Articles
      </NavItem>
      <NavItem href={`${home}/favorites`} active={tab === "favorites"}>
        Favorited Articles
      </NavItem>
    </>
  );
  const list = (
    <ArticleList
      articles={articles.data.articles}
      articlesCount={articles.data.articlesCount}
      page={page}
      hrefOf={hrefOf}
      back={hrefOf(page)}
    />
  );

  return (
    <Layout path={home}>
      {cs`(
        <div className="profile-page">
          <div className="user-info">
            <div className="container">
              <div className="row">
                <div className="col-xs-12 col-md-10 offset-md-1">
                  <img src={${avatarOf(image)}} className="user-img" />
                  <h4>{$username}</h4>
                  <p>{${bio ?? ""}}</p>
                  {$action}
                </div>
              </div>
            </div>
          </div>
          <div className="container">
            <div className="row">
              <div className="col-xs-12 col-md-10 offset-md-1">
                <div className="articles-toggle">
                  <ul className="nav nav-pills outline-active">{$tabs}</ul>
                </div>
                {$list}
              </div>
            </div>
          </div>
        </div>
      )`}
    </Layout>
  );
}
