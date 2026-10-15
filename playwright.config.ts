import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  workers: 4,
  expect: { timeout: 10_000 },
  use: { baseURL: "http://localhost:3101", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1360, height: 900 } }, testIgnore: /responsive\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: { command: "npx next start -p 3101", url: "http://localhost:3101/cards", reuseExistingServer: true, timeout: 120_000 },
});
