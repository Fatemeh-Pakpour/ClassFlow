import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { authFile } from "./e2e/support/auth0";

// Test credentials (E2E_USER_EMAIL, E2E_USER_PASSWORD) live in the same
// git-ignored file as the app's Auth0 settings.
const envFile = path.join(__dirname, ".env.local");
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const baseURL = "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // These tests drive a live Auth0 tenant; run serially to stay clear of
  // brute-force protection and rate limits.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "logged-out",
      testMatch: /(login|signup)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "logged-in",
      testMatch: /session\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: authFile },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
