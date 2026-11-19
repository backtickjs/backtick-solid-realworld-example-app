import { cs } from "@backtickjs/core";
import type { Errors } from "../api/types.js";
import { ErrorMessages } from "../components/ErrorMessages.js";
import { Layout } from "../components/Layout.js";
import { redirect } from "../navigation.js";
import { currentUser } from "../session.js";

// What the form was sent with, to fill it again when the API refuses it. Never
// the password.
export interface AuthForm {
  username?: string;
  email?: string;
  errors?: Errors;
}

// The sign-in page, at /login: home instead for a signed-in user.
export function Login({ email, errors }: AuthForm) {
  if (currentUser()) redirect("/");
  const errorMessages = <ErrorMessages errors={errors} />;
  return (
    <Layout path="/login">
      {cs`(
        <div className="auth-page">
          <div className="container page">
            <div className="row">
              <div className="col-md-6 offset-md-3 col-xs-12">
                <h1 className="text-xs-center">Sign in</h1>
                <p className="text-xs-center">
                  <a href="/register">Need an account?</a>
                </p>
                {$errorMessages}
                <form method="post">
                  <fieldset className="form-group">
                    <input
                      className="form-control form-control-lg"
                      type="email"
                      name="email"
                      placeholder="Email"
                      defaultValue={$email}
                    />
                  </fieldset>
                  <fieldset className="form-group">
                    <input
                      className="form-control form-control-lg"
                      type="password"
                      name="password"
                      placeholder="Password"
                    />
                  </fieldset>
                  <button
                    type="submit"
                    className="btn btn-lg btn-primary pull-xs-right"
                  >
                    Sign in
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

// The sign-up page, at /register: home instead for a signed-in user.
export function Register({ username, email, errors }: AuthForm) {
  if (currentUser()) redirect("/");
  const errorMessages = <ErrorMessages errors={errors} />;
  return (
    <Layout path="/register">
      {cs`(
        <div className="auth-page">
          <div className="container page">
            <div className="row">
              <div className="col-md-6 offset-md-3 col-xs-12">
                <h1 className="text-xs-center">Sign up</h1>
                <p className="text-xs-center">
                  <a href="/login">Have an account?</a>
                </p>
                {$errorMessages}
                <form method="post">
                  <fieldset className="form-group">
                    <input
                      className="form-control form-control-lg"
                      type="text"
                      name="username"
                      placeholder="Username"
                      defaultValue={$username}
                    />
                  </fieldset>
                  <fieldset className="form-group">
                    <input
                      className="form-control form-control-lg"
                      type="email"
                      name="email"
                      placeholder="Email"
                      defaultValue={$email}
                    />
                  </fieldset>
                  <fieldset className="form-group">
                    <input
                      className="form-control form-control-lg"
                      type="password"
                      name="password"
                      placeholder="Password"
                    />
                  </fieldset>
                  <button
                    type="submit"
                    className="btn btn-lg btn-primary pull-xs-right"
                  >
                    Sign up
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
