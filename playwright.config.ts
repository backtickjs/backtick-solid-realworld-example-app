import { defineConfig } from "@playwright/test";
import { baseConfig } from "./realworld/specs/e2e/playwright.base";

// The suite in `ssr` mode: this server calls the RealWorld API on the
// browser's behalf, with the token in an httpOnly cookie.
process.env.TEST_MODE ??= "ssr";

export default defineConfig({
  ...baseConfig,
  testDir: "./realworld/specs/e2e",
  use: { ...baseConfig.use, baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
