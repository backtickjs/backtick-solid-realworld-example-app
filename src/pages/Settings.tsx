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
  const errorMessages = <ErrorMessages errors={errors} />;
  return (
    <Layout user={user} path="/settings">
      {cs`(
        <div className="settings-page">
          <div className="container page">
            <div className="row">
              <div className="col-md-6 offset-md-3 col-xs-12">
                <h1 className="text-xs-center">Your Settings</h1>
                {$errorMessages}
                <form method="post">
                  <fieldset>
                    <fieldset className="form-group">
                      <input
                        className="form-control"
                        type="text"
                        name="image"
                        placeholder="URL of profile picture"
                        defaultValue={${form.image ?? ""}}
                      />
                    </fieldset>
                    <fieldset className="form-group">
                      <input
                        className="form-control form-control-lg"
                        type="text"
                        name="username"
                        placeholder="Your Name"
                        defaultValue={${form.username}}
                      />
                    </fieldset>
                    <fieldset className="form-group">
                      <textarea
                        className="form-control form-control-lg"
                        rows={8}
                        name="bio"
                        placeholder="Short bio about you"
                        defaultValue={${form.bio ?? ""}}
                      ></textarea>
                    </fieldset>
                    <fieldset className="form-group">
                      <input
                        className="form-control form-control-lg"
                        type="email"
                        name="email"
                        placeholder="Email"
                        defaultValue={${form.email}}
                      />
                    </fieldset>
                    <fieldset className="form-group">
                      <input
                        className="form-control form-control-lg"
                        type="password"
                        name="password"
                        placeholder="New Password"
                      />
                    </fieldset>
                    <button
                      type="submit"
                      className="btn btn-lg btn-primary pull-xs-right"
                    >
                      Update Settings
                    </button>
                  </fieldset>
                </form>
                <hr />
                <form method="post" action="/logout">
                  <button type="submit" className="btn btn-outline-danger">
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
