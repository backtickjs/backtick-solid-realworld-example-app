import { cs, type Client } from "@backtickjs/core";
import type { JSX } from "@backtickjs/jsx-solid/jsx-runtime";

// Between an icon and its label, as the templates write it: &nbsp;
const NBSP = "\u00a0";

// One link of a nav bar or a row of tabs, marked when it's the page's. `icon`
// is an Ionicons class drawn before the label: "ion-compose".
export function NavItem({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon?: string;
  children: string | JSX.Element | Client<JSX.Element>;
}) {
  const iconElement = icon === undefined ? null : cs`<i class={$icon}></i>`;
  return cs`(
    <li class="nav-item">
      <a class={${active ? "nav-link active" : "nav-link"}} href={$href}>
        {$iconElement}
        {${icon === undefined ? "" : NBSP}}
        {$children}
      </a>
    </li>
  )`;
}
