import { cs, type Client } from "@backtickjs/core";
import type { JSX } from "@backtickjs/jsx-react/jsx-runtime";
import { avatarOf } from "../format.js";
import { currentUser } from "../session.js";
import { NavItem } from "./NavItem.js";

// The header and footer around every page. `path` is the page's, to mark its
// link active.
export function Layout({
  path,
  children,
}: {
  path: string;
  children: JSX.Element | Client<JSX.Element>;
}) {
  const user = currentUser();
  const links = user ? (
    <>
      <NavItem href="/" active={path === "/"}>
        Home
      </NavItem>
      <NavItem href="/editor" active={path === "/editor"}>
        {cs`(
          <>
            <i className="ion-compose"></i>&nbsp;New Article
          </>
        )`}
      </NavItem>
      <NavItem href="/settings" active={path === "/settings"}>
        {cs`(
          <>
            <i className="ion-gear-a"></i>&nbsp;Settings
          </>
        )`}
      </NavItem>
      <NavItem
        href={`/profile/${user.username}`}
        active={path === `/profile/${user.username}`}
      >
        {cs`(
          <>
            <img src={${avatarOf(user.image)}} className="user-pic" />
            {${user.username}}
          </>
        )`}
      </NavItem>
    </>
  ) : (
    <>
      <NavItem href="/" active={path === "/"}>
        Home
      </NavItem>
      <NavItem href="/login" active={path === "/login"}>
        Sign in
      </NavItem>
      <NavItem href="/register" active={path === "/register"}>
        Sign up
      </NavItem>
    </>
  );

  return cs`(
    <>
      <nav className="navbar navbar-light">
        <div className="container">
          <a className="navbar-brand" href="/">
            conduit
          </a>
          <ul className="nav navbar-nav pull-xs-right">{$links}</ul>
        </div>
      </nav>
      {$children}
      <footer>
        <div className="container">
          <a href="/" className="logo-font">
            conduit
          </a>
          <span className="attribution">
            An interactive learning project. Code &amp; design licensed under
            MIT.
          </span>
        </div>
      </footer>
    </>
  )`;
}
