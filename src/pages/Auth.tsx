import { cs } from "@backtickjs/core";
import type { Context } from "hono";
import type { Errors } from "../api/types.js";
import { ErrorMessages } from "../components/ErrorMessages.js";
import { Layout } from "../components/Layout.js";
import type { SignedOutEnv } from "../session.js";

// What the form was sent with, to fill it again when the API refuses it. Never
// the password. Empty when missing: Solid would write undefined into a field.
export interface AuthForm {
  context: Context<SignedOutEnv>;
  username?: string;
  email?: string;
  errors?: Errors;
}

// The sign-in page, at /login.
export function Login({ context, email = "", errors }: AuthForm) {
  return (
    <Layout user={context.get("user")} path="/login">
      {cs`(
        <div class="auth-page">
          <div class="container page">
            <div class="row">
              <div class="col-md-6 offset-md-3 col-xs-12">
                <h1 class="text-xs-center">Sign in</h1>
                <p class="text-xs-center">
                  <a href="/register">Need an account?</a>
                </p>
                <$ErrorMessages errors={$errors} />
                <form method="post">
                  <fieldset class="form-group">
                    <input
                      class="form-control form-control-lg"
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={$email}
                    />
                  </fieldset>
                  <fieldset class="form-group">
                    <input
                      class="form-control form-control-lg"
                      type="password"
                      name="password"
                      placeholder="Password"
                    />
                  </fieldset>
                  <button
                    type="submit"
                    class="btn btn-lg btn-primary pull-xs-right"
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

// The sign-up page, at /register.
export function Register({
  context,
  username = "",
  email = "",
  errors,
}: AuthForm) {
  return (
    <Layout user={context.get("user")} path="/register">
      {cs`(
        <div class="auth-page">
          <div class="container page">
            <div class="row">
              <div class="col-md-6 offset-md-3 col-xs-12">
                <h1 class="text-xs-center">Sign up</h1>
                <p class="text-xs-center">
                  <a href="/login">Have an account?</a>
                </p>
                <$ErrorMessages errors={$errors} />
                <form method="post">
                  <fieldset class="form-group">
                    <input
                      class="form-control form-control-lg"
                      type="text"
                      name="username"
                      placeholder="Username"
                      value={$username}
                    />
                  </fieldset>
                  <fieldset class="form-group">
                    <input
                      class="form-control form-control-lg"
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={$email}
                    />
                  </fieldset>
                  <fieldset class="form-group">
                    <input
                      class="form-control form-control-lg"
                      type="password"
                      name="password"
                      placeholder="Password"
                    />
                  </fieldset>
                  <button
                    type="submit"
                    class="btn btn-lg btn-primary pull-xs-right"
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
