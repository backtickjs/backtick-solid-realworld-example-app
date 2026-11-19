import { cs, type Client } from "@backtickjs/core";
import type { JSX } from "@backtickjs/jsx-solid/jsx-runtime";
import { avatarOf } from "../format.js";
import { NavItem } from "./NavItem.js";
import type { User } from "../api/types.js";

// The header and footer around every page. `path` is the page's, to mark its
// link active.
export function Layout({
  user,
  path,
  children,
}: {
  // The signed-in user, for the header's links, or null.
  user: User | null;
  path: string;
  children: JSX.Element | Client<JSX.Element>;
}) {
  const links = user
    ? cs`(
        <>
          <$NavItem
            href="/editor"
            active={${path === "/editor"}}
            icon="ion-compose"
          >
            New Article
          </$NavItem>
          <$NavItem
            href="/settings"
            active={${path === "/settings"}}
            icon="ion-gear-a"
          >
            Settings
          </$NavItem>
          <$NavItem
            href={${`/profile/${user.username}`}}
            active={${path === `/profile/${user.username}`}}
          >
            <img src={${avatarOf(user.image)}} class="user-pic" />
            {${user.username}}
          </$NavItem>
        </>
      )`
    : cs`(
        <>
          <$NavItem href="/login" active={${path === "/login"}}>
            Sign in
          </$NavItem>
          <$NavItem href="/register" active={${path === "/register"}}>
            Sign up
          </$NavItem>
        </>
      )`;

  return cs`(
    <>
      <nav class="navbar navbar-light">
        <div class="container">
          <a class="navbar-brand" href="/">
            conduit
          </a>
          <ul class="nav navbar-nav pull-xs-right">
            <$NavItem href="/" active={${path === "/"}}>
              Home
            </$NavItem>
            {$links}
          </ul>
        </div>
      </nav>
      {$children}
      <footer>
        <div class="container">
          <a href="/" class="logo-font">
            conduit
          </a>
          <span class="attribution">
            An interactive learning project. Code &amp; design licensed under
            MIT.
          </span>
        </div>
      </footer>
    </>
  )`;
}
