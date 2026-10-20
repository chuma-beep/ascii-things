import { defineConfig } from "@playwright/test";

const PORT = 5200;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  // One worker keeps the performance and screenshot gates deterministic.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  snapshotPathTemplate:
    "tests/e2e/__screenshots__/{testFilePath}/{arg}-{projectName}-{platform}{ext}",
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.005,
      scale: "css",
      threshold: 0.2,
    },
  },
  use: {
    baseURL,
    browserName: "chromium",
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    launchOptions: {
      // Keep glyph rasterization stable across local Linux and CI.
      args: ["--font-render-hinting=none"],
    },
  },
  projects: [{ name: "chromium" }],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
