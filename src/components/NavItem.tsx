import { cs, type Client } from "@backtickjs/core";
import type { JSX } from "@backtickjs/jsx-react/jsx-runtime";

// One link of a nav bar or a row of tabs, marked when it's the page's.
export function NavItem({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: string | JSX.Element | Client<JSX.Element>;
}) {
  return cs`(
    <li className="nav-item">
      <a className={${active ? "nav-link active" : "nav-link"}} href={$href}>
        {$children}
      </a>
    </li>
  )`;
}
