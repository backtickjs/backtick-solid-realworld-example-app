import { cs } from "@backtickjs/core";
import type { Context } from "hono";
import type { Errors, User } from "../api/types.js";
import { ErrorMessages } from "../components/ErrorMessages.js";
import { Layout } from "../components/Layout.js";
import type { SignedInEnv } from "../session.js";

// The signed-in user's settings, and the way out. `values` are what the form
// was sent with when the API refused it.
export function Settings({
  context,
  values,
  errors,
}: {
  context: Context<SignedInEnv>;
  values?: Partial<User>;
  errors?: Errors;
}) {
  const user = context.get("user");
  const form = { ...user, ...values };
  return (
    <Layout user={user} path="/settings">
      {cs`(
        <div class="settings-page">
          <div class="container page">
            <div class="row">
              <div class="col-md-6 offset-md-3 col-xs-12">
                <h1 class="text-xs-center">Your Settings</h1>
                <$ErrorMessages errors={$errors} />
                <form method="post">
                  <fieldset>
                    <fieldset class="form-group">
                      <input
                        class="form-control"
                        type="text"
                        name="image"
                        placeholder="URL of profile picture"
                        value={${form.image ?? ""}}
                      />
                    </fieldset>
                    <fieldset class="form-group">
                      <input
                        class="form-control form-control-lg"
                        type="text"
                        name="username"
                        placeholder="Your Name"
                        value={${form.username}}
                      />
                    </fieldset>
                    <fieldset class="form-group">
                      <textarea
                        class="form-control form-control-lg"
                        rows={8}
                        name="bio"
                        placeholder="Short bio about you"
                        value={${form.bio ?? ""}}
                      ></textarea>
                    </fieldset>
                    <fieldset class="form-group">
                      <input
                        class="form-control form-control-lg"
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={${form.email}}
                      />
                    </fieldset>
                    <fieldset class="form-group">
                      <input
                        class="form-control form-control-lg"
                        type="password"
                        name="password"
                        placeholder="New Password"
                      />
                    </fieldset>
                    <button
                      type="submit"
                      class="btn btn-lg btn-primary pull-xs-right"
                    >
                      Update Settings
                    </button>
                  </fieldset>
                </form>
                <hr />
                <form method="post" action="/logout">
                  <button type="submit" class="btn btn-outline-danger">
                    Or click here to logout.
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )`}
    </Layout>
  );
}
