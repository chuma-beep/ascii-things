import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import {
  collectPageErrors,
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForFonts,
} from "../e2e/fixtures";

async function openIdeas(page: Page) {
  await page.goto("/design-ideas/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1:visible")).toHaveCount(1);
  await expect(page.locator(".di-featured")).toBeVisible();
  await waitForFonts(page);
}

test("loads six recipes, copy actions, and has no critical axe violations", async ({
  page,
}, testInfo) => {
  const errors = collectPageErrors(page);
  await openIdeas(page);

  await expect(page.locator("h1")).toHaveText("Design ideas.");
  await expect(page.locator(".di-featured")).toContainText("Command deck");
  await expect(page.locator(".di-card")).toHaveCount(5);
  await expect(page.locator(".di-cta")).toHaveCount(1);
  await expect(page.locator("[data-copy]")).toHaveCount(13);
  await expect(page.locator(".di-header__meta")).toContainText("06 recipes / 9 scenes");
  await expectNoHorizontalOverflow(page);

  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((violation) => violation.impact === "critical");
  await testInfo.attach("design-ideas-axe.json", {
    body: JSON.stringify(results.violations, null, 2),
    contentType: "application/json",
  });
  expect(critical.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
  expect(errors).toEqual([]);
});

test("copies the featured starter code and agent prompt", async ({ page, context }) => {
  const errors = collectPageErrors(page);
  await openIdeas(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4322",
  });

  await page.getByRole("button", { name: "Copy starter code" }).click();
  await expect(page.locator("[data-copy-status]")).toContainText(
    "Command deck starter code copied.",
  );
  const code = await page.evaluate(() => navigator.clipboard.readText());
  expect(code).toContain('import "ascii-things/element"');
  expect(code).toContain("command-deck");
  expect(code.length).toBeGreaterThan(1_000);

  await page.locator(".di-featured").getByRole("button", { name: "Copy prompt" }).click();
  await expect(page.locator("[data-copy-status]")).toContainText("Command deck prompt copied.");
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt).toContain("Using ascii-things");
  expect(prompt).toContain("Command deck");
  expect(prompt).toContain("prefers-reduced-motion");
  expect(errors).toEqual([]);
});

test("featured preview mounts a crisp live scene", async ({ page }) => {
  const errors = collectPageErrors(page);
  await openIdeas(page);

  const scene = page.locator(".di-featured [data-design-scene]");
  await page.locator(".di-featured").scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-live", "true", { timeout: 5_000 });

  const metrics = await scene.evaluate((element) => {
    const dog = element.querySelector("ascii-dog");
    const canvas = dog?.shadowRoot?.querySelector("canvas");
    return {
      tag: dog?.tagName.toLowerCase(),
      backingWidth: canvas?.width ?? 0,
      clientWidth: canvas?.clientWidth ?? 0,
    };
  });

  expect(metrics.tag).toBe("ascii-dog");
  expect(metrics.backingWidth).toBeGreaterThanOrEqual(metrics.clientWidth);
  expect(errors).toEqual([]);
});

test("glyph specimen uses the live kanji field", async ({ page, context }) => {
  await openIdeas(page);
  const specimen = page.locator("#specimen-sheet");

  await expect(specimen).toContainText("Glyph specimen");
  await expect(specimen).toContainText("永龍風水火");

  const source = await specimen
    .locator(".di-specimen__art img")
    .evaluate((image) => (image as HTMLImageElement).currentSrc);
  expect(source).toContain("kanji-field.webp");

  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4322",
  });
  await specimen.getByRole("button", { name: "Copy code" }).click();
  await expect(page.locator("[data-copy-status]")).toContainText(
    "Glyph specimen starter code copied.",
  );
  const code = await page.evaluate(() => navigator.clipboard.readText());
  expect(code).toContain('import "ascii-things/webgl/element"');
  expect(code).toContain('variant="field"');
  expect(code).toContain("漢字");
});

test("recipe previews open their full-page demos", async ({ page }) => {
  const errors = collectPageErrors(page);
  await openIdeas(page);

  const previews = page.locator(".di-featured__preview, .di-card__preview");
  await expect(previews).toHaveCount(6);
  expect(
    await previews.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href"))),
  ).toEqual([
    "/design-ideas/command-deck/",
    "/design-ideas/signal-room/",
    "/design-ideas/quiet-pond/",
    "/design-ideas/night-commute/",
    "/design-ideas/specimen-sheet/",
    "/design-ideas/launch-sequence/",
  ]);
  await expect(page.locator(".di-open-link")).toHaveCount(6);

  await page.locator("#specimen-sheet .di-card__preview").click();
  await expect(page).toHaveURL(/\/design-ideas\/specimen-sheet\/$/);
  await expect(page.locator(".glyph-specimen")).toBeVisible();
  await expect(page.locator("ascii-surface")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("command deck demo fits the viewport", async ({ page }) => {
  await page.goto("/design-ideas/command-deck/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".command-deck")).toBeVisible();
  await waitForFonts(page);

  const metrics = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
  }));

  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.innerHeight + 1);
});

test("mobile keeps every recipe readable without horizontal overflow", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openIdeas(page);
  await expect(page.locator(".di-card")).toHaveCount(5);
  await expect(page.locator(".di-cta")).toBeVisible();
  await expect(page.locator("h1:visible")).toHaveCount(1);
  await expectNoHorizontalOverflow(page);

  await testInfo.attach("design-ideas-mobile.png", {
    body: await page.screenshot({ fullPage: false }),
    contentType: "image/png",
  });
});

test("reduced motion keeps a static image fallback", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openIdeas(page);

  const source = await page
    .locator(".di-featured img")
    .first()
    .evaluate((image) => (image as HTMLImageElement).currentSrc);
  expect(source).toContain(".jpg");
});

test("searches and filters design ideas", async ({ page }) => {
  await page.goto("/design-ideas/");
  await page.waitForLoadState("networkidle");

  const input = page.locator("#di-search-input");
  const status = page.locator("[data-search-status]");
  await expect(input).toBeVisible();
  await expect(page.locator("[data-search]:visible")).toHaveCount(6);

  await input.fill("koi");
  await expect(page.locator("[data-search]:visible")).toHaveCount(1);
  await expect(status).toHaveText("1 of 6 recipes");

  await input.fill("zzzz");
  await expect(page.locator("[data-search]:visible")).toHaveCount(0);
  await expect(status).toHaveText("0 of 6 recipes");
});
