import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import {
  collectPageErrors,
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForFonts,
} from "../e2e/fixtures";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

async function openStage(page: Page, path = "/design-ideas/") {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await waitForFonts(page);
  const stage = page.locator("[data-composition-stage]");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toBeVisible();
  return stage;
}

test("design ideas compositions switch scenes, copy prompts, and download starters", async ({
  page,
}, testInfo) => {
  const errors = collectPageErrors(page);
  const stage = await openStage(page);
  const panels = stage.locator("[data-composition-panel]");

  await expect(stage).toHaveAttribute("data-composition-scene", "dog");
  await expect(panels).toHaveCount(3);
  await expect(panels.nth(0)).toHaveAttribute("data-surface", "paper");
  await expect(panels.nth(1)).toHaveAttribute("data-surface", "abyss");
  await expect(panels.nth(2)).toHaveAttribute("data-surface", "immersive");
  await expect(panels.nth(0)).toHaveAttribute("data-scene", "dog");
  await expect(panels.nth(1)).toHaveAttribute("data-scene", "dog");
  await expect(panels.nth(2)).toHaveAttribute("data-scene", "dog");
  await expect.poll(async () => panels.locator("canvas").count()).toBe(3);
  await expect.poll(async () => stage.locator("ascii-dog").count()).toBe(3);

  const abyss = stage.locator('[data-surface="abyss"]');
  await abyss.getByRole("button", { name: "Copy prompt" }).click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt).toContain("Design an abyss composition");
  expect(prompt).toContain("<ascii-dog");
  expect(prompt).toContain("npm install ascii-things");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    abyss.getByRole("button", { name: "Download HTML" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("ascii-things-abyss-dog.html");
  const path = await download.path();
  if (!path) throw new Error("The composition download did not produce a file path.");
  const html = readFileSync(path, "utf8");
  expect(html).toContain("<!doctype html>");
  expect(html).toContain("<ascii-dog");
  expect(html).toContain("npm install ascii-things");
  expect(html).toContain('import "ascii-things/element"');

  await expectNoHorizontalOverflow(page);

  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((violation) => violation.impact === "critical");
  await testInfo.attach("compositions-axe.json", {
    body: JSON.stringify(results.violations, null, 2),
    contentType: "application/json",
  });
  expect(critical.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
  expect(errors).toEqual([]);
});

test("landing composition band exposes three surfaces", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await waitForFonts(page);

  const band = page.locator(".composition-band");
  await band.scrollIntoViewIfNeeded();
  await expect(band.locator(".composition-mini")).toHaveCount(3);
  await expectNoHorizontalOverflow(page);
});

test("shared Lagoon mirrors one live painter across all surfaces", async ({ page }) => {
  const errors = collectPageErrors(page);
  const stage = await openStage(page);
  const panels = stage.locator("[data-composition-panel]");
  const liveHosts = stage.locator("[data-composition-live]");

  await stage.getByRole("button", { name: "Day lagoon" }).click();
  await expect(stage).toHaveAttribute("data-composition-scene", "lagoon");
  await expect.poll(async () => stage.locator("ascii-lagoon-day").count()).toBe(1);
  await expect(panels.locator("canvas[data-composition-mirror]")).toHaveCount(2);

  for (let index = 0; index < 3; index += 1) {
    await expect(liveHosts.nth(index)).toHaveAttribute("data-live", "true");
  }

  const mirrorPixels = () =>
    panels
      .nth(1)
      .locator("canvas[data-composition-mirror]")
      .evaluate((canvas) => {
        const context = canvas.getContext("2d");
        if (!context) return "";
        return Array.from(context.getImageData(0, 0, 8, 8).data).join(",");
      });

  const first = await mirrorPixels();
  await page.waitForTimeout(450);
  expect(await mirrorPixels()).not.toBe(first);

  await stage.getByRole("button", { name: "Robot dog" }).click();
  await expect(stage).toHaveAttribute("data-composition-scene", "dog");
  await expect(stage.locator("ascii-lagoon-day")).toHaveCount(0);
  await expect(stage.locator("canvas[data-composition-mirror]")).toHaveCount(0);
  await expect.poll(async () => stage.locator("ascii-dog").count()).toBe(3);

  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("composition stage stacks on mobile without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = collectPageErrors(page);
  const stage = await openStage(page);

  await expect(stage.locator("[data-composition-panel]")).toHaveCount(3);
  await expect(stage.locator(".cmp-rail")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const boxes = await stage
    .locator("[data-composition-panel]")
    .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().top));
  expect(boxes[0]).toBeLessThan(boxes[1]);
  expect(boxes[1]).toBeLessThan(boxes[2]);
  expect(errors).toEqual([]);
});

test("navigation exposes compositions without treating the lagoon as a section", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(
    page.locator('.nav-library__panel a[href="/design-ideas/#compositions"]'),
  ).toHaveCount(1);
  await expect(page.locator('.nav-library__panel a[href="/lagoon-lab/"]')).toHaveCount(0);
  await expect(page.locator('.nav-library__panel a[href="/design-ideas/"]')).toHaveText(
    "Design ideas",
  );
});
