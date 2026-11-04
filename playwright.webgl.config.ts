import { defineConfig } from "@playwright/test";

const PORT = 4324;

export default defineConfig({
  testDir: "./tests/webgl",
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    viewport: { width: 1440, height: 1000 },
    colorScheme: "dark",
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  webServer: {
    command: `python3 -m http.server ${PORT} --directory site/dist`,
    url: `http://127.0.0.1:${PORT}/webgl/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
