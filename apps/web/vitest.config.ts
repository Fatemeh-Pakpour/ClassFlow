import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // e2e/ holds Playwright specs, run by `pnpm test:e2e`, not by Vitest.
    include: ["src/**/*.test.ts"],
  },
});
