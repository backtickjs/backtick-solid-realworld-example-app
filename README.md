# ![RealWorld Example App](logo.png)

> ### [Backtick](https://backtickjs.dev) + [Solid](https://www.solidjs.com) codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://docs.realworld.show/) spec and API.

### [Demo](https://realworld.backtickjs.dev)&nbsp;&nbsp;&nbsp;&nbsp;[RealWorld](https://github.com/realworld-apps/realworld)

This codebase was created to demonstrate a fully fledged application built with Backtick and Solid, including CRUD operations, authentication, routing, pagination, and more. A Hono server fetches each page's data from the RealWorld API and sends the page as a Backtick bundle, which Solid draws in the browser.

For more information on how this works with other frontends/backends, head over to the [RealWorld](https://github.com/realworld-apps/realworld) repo.

## Running locally

Requires Node.js 22.15 or later.

```sh
git clone --recurse-submodules https://github.com/backtickjs/backtick-solid-realworld-example-app.git
cd backtick-solid-realworld-example-app
npm install
npm start
```

Then open http://localhost:3000.

The `realworld` submodule holds the shared theme and the E2E suite. In a clone made without `--recurse-submodules`, run `git submodule update --init` first.

To build and start in prod mode:

```sh
npm run build
npm run preview
```

To run RealWorld's E2E suite against it:

```sh
npx playwright install chromium  # once
npm run e2e
```

Pages call the public RealWorld API; set `API_BASE` to use another (default `https://api.realworld.show/api`).
