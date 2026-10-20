import { test as base, expect, type Page } from "@playwright/test";

export interface SceneStats {
  fps: number;
  frameMs: number;
  cells: number;
  columns: number;
  rows: number;
  dogs?: number;
  state?: string;
}

interface AsciiWindow {
  asciiScene?: { getStats(): SceneStats };
}

/**
 * Block the Google Fonts request with an empty stylesheet instead of aborting
 * it. That keeps snapshots independent of network access without producing a
 * console error, then the CSS stack falls back to the platform monospace face.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route("https://fonts.googleapis.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/css", body: "" }),
    );
    await page.route("https://fonts.gstatic.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "font/woff2", body: "" }),
    );
    await use(page);
  },
});

export { expect };

export function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

export async function waitForFonts(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

export async function waitForScene(page: Page, timeout = 15_000) {
  await page.waitForFunction(
    () => Boolean((window as unknown as AsciiWindow).asciiScene),
    undefined,
    { timeout },
  );
}

export async function readSceneStats(page: Page): Promise<SceneStats> {
  return page.evaluate(() => {
    const scene = (window as unknown as AsciiWindow).asciiScene;
    if (!scene) throw new Error("window.asciiScene is not available");
    return scene.getStats();
  });
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      innerWidth: window.innerWidth,
    };
  });
  expect(
    overflow.scrollWidth,
    `page overflows horizontally: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}, innerWidth=${overflow.innerWidth}`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

/** Wait until the scene has rendered enough frames to produce stable stats. */
export async function waitForStats(page: Page, duration = 2_000) {
  await page.waitForTimeout(duration);
}
