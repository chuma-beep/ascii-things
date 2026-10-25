import { defineConfig } from "@playwright/test";

const PORT = 4322;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/docs",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-docs" }]],
  use: {
    baseURL,
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    colorScheme: "dark",
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    launchOptions: {
      args: ["--font-render-hinting=none"],
    },
  },
  projects: [{ name: "chromium" }],
  webServer: {
    command: `python3 -m http.server ${PORT} --directory site/dist`,
    url: `${baseURL}/image/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
