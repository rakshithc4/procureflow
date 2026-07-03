import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // ponytail: single worker — the mock backend (src/mocks/db.ts) is one
  // shared in-memory store per dev-server process, not per test. Parallel
  // workers race on the same fixture rows. Move to per-worker mock state if
  // this suite's runtime ever becomes a problem.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "mock", testMatch: /.*\.spec\.ts/, testIgnore: /.*\.live\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "live", testMatch: /.*\.live\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: { NEXTAUTH_SECRET: "test-secret-for-e2e-mock-mode-only", MOCK_SAP: "1" },
  },
});
