import { cs } from "@backtickjs/core";
import type { Article, Profile, User } from "../api/types.js";
import { avatarOf, formatDate } from "../format.js";

// The author, the date, and what the reader can do: follow and favorite, or,
// for the author, edit and delete. Shown above and below the article.
export function ArticleMeta({
  article,
  user,
}: {
  article: Article;
  user: User | null;
}) {
  const { author, slug } = article;
  const profile = `/profile/${author.username}`;
  const back = `/article/${slug}`;

  const actions =
    user?.username === author.username ? (
      cs`(
        <>
          <a
            className="btn btn-sm btn-outline-secondary"
            href={${`/editor/${slug}`}}
          >
            <i className="ion-edit"></i> Edit Article
          </a>
          &nbsp;
          <form
            method="post"
            action={${`/article/${slug}/delete`}}
            style={{ display: "inline" }}
          >
            <button type="submit" className="btn btn-sm btn-outline-danger">
              <i className="ion-trash-a"></i> Delete Article
            </button>
          </form>
        </>
      )`
    ) : (
      <>
        <FollowButton profile={author} back={back} />
        &nbsp;&nbsp;
        <FavoriteButton article={article} back={back} />
      </>
    );

  return cs`(
    <div className="article-meta">
      <a href={$profile}>
        <img src={${avatarOf(author.image)}} />
      </a>
      <div className="info">
        <a href={$profile} className="author">
          {${author.username}}
        </a>
        <span className="date">{${formatDate(article.createdAt)}}</span>
      </div>
      {$actions}
    </div>
  )`;
}

// Follows or unfollows `profile`, then returns to `back`.
export function FollowButton({
  profile,
  back,
}: {
  profile: Profile;
  back: string;
}) {
  const action = `/profile/${profile.username}/${profile.following ? "unfollow" : "follow"}`;
  const label = `${profile.following ? "Unfollow" : "Follow"} ${profile.username}`;
  return cs`(
    <form method="post" action={$action} style={{ display: "inline" }}>
      <input type="hidden" name="back" value={$back} />
      <button
        type="submit"
        className="btn btn-sm btn-outline-secondary action-btn"
      >
        <i className="ion-plus-round"></i>
        &nbsp; {$label}
      </button>
    </form>
  )`;
}

// Favorites or unfavorites `article`, then returns to `back`.
function FavoriteButton({ article, back }: { article: Article; back: string }) {
  const action = `/article/${article.slug}/${article.favorited ? "unfavorite" : "favorite"}`;
  return cs`(
    <form method="post" action={$action} style={{ display: "inline" }}>
      <input type="hidden" name="back" value={$back} />
      <button
        type="submit"
        className={
          ${article.favorited
            ? "btn btn-sm btn-primary"
            : "btn btn-sm btn-outline-primary"}
        }
      >
        <i className="ion-heart"></i>
        &nbsp;{" "}
        {${article.favorited ? "Unfavorite Article" : "Favorite Article"}}{" "}
        <span className="counter">({${article.favoritesCount}})</span>
      </button>
    </form>
  )`;
}
