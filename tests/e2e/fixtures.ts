import { test as base, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

/**
 * Visual tests need one font raster regardless of which system fonts are
 * installed. Load the brand face from the dev dependency and apply it to page
 * text only. Canvas keeps its normal stack so the scene snapshots stay stable.
 */
export async function installVisualFont(page: Page) {
  const files = join(process.cwd(), "node_modules/@fontsource/geist-mono/files");
  const faces = [400, 500, 600, 700]
    .map((weight) => {
      const data = readFileSync(join(files, `geist-mono-latin-${weight}-normal.woff2`)).toString(
        "base64",
      );
      return `@font-face {
        font-family: "Geist Mono Test";
        font-style: normal;
        font-weight: ${weight};
        font-display: block;
        src: url(data:font/woff2;base64,${data}) format("woff2");
      }`;
    })
    .join("\n");

  await page.addInitScript(
    (css) => {
      const apply = () => {
        const style = document.createElement("style");
        style.dataset.testFont = "true";
        style.textContent = css;
        document.head.append(style);
      };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", apply, { once: true });
      } else {
        apply();
      }
    },
    `${faces}
    body :not(canvas) {
      font-family: "Geist Mono Test", monospace !important;
    }
    canvas {
      font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace !important;
    }`,
  );
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
