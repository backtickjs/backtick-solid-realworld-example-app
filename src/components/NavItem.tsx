import { cs } from "@backtickjs/core";
import type { JSX } from "solid-js";

// One link of a nav bar or a row of tabs, marked when it's the page's. `icon`
// is an Ionicons class drawn before the label: "ion-compose".
export const NavItem = cs`(props: {
  href: string;
  active: boolean;
  icon?: string;
  children: JSX.Element;
}) => (
  <li class="nav-item">
    <a class={props.active ? "nav-link active" : "nav-link"} href={props.href}>
      {props.icon === undefined ? null : (
        <>
          <i class={props.icon}></i>&nbsp;
        </>
      )}
      {props.children}
    </a>
  </li>
)`;
