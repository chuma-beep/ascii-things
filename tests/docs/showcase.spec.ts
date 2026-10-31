import { expect, expectNoHorizontalOverflow, test } from "../e2e/fixtures";

test("live showcase renders all pieces without archive stills", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/showcase/");
  await page.waitForLoadState("networkidle");

  const cards = page.locator("[data-showcase-card]");
  const count = page.locator("[data-showcase-count]");

  await expect(cards).toHaveCount(50);
  await expect(count).toHaveText("50 pieces");
  await expect(page.locator("[data-showcase-more]")).toHaveCount(0);
  await expect(page.locator(".showcase-card picture, .showcase-card img")).toHaveCount(0);

  await expect(page.locator(".showcase-hero__frame")).toBeVisible();
  await expect(page.locator(".showcase-hero__frame ascii-lagoon-night")).toHaveCount(1, {
    timeout: 15_000,
  });

  const componentFilter = page.locator('[data-showcase-filter="component"]');
  await componentFilter.click();
  await expect(componentFilter).toHaveAttribute("aria-pressed", "true");

  const componentTotal = await page
    .locator('[data-showcase-card][data-category="component"]')
    .count();
  await expect(page.locator("[data-showcase-card]:visible")).toHaveCount(componentTotal);
  await expect(count).toHaveText(`${componentTotal} pieces`);
});

test("showcase cards expose recipe and copy actions", async ({ page, context }) => {
  await page.goto("/showcase/");
  await page.waitForLoadState("networkidle");

  const card = page.locator("[data-showcase-card]:visible").first();
  const recipe = card.getByRole("link", { name: /design recipe/i });
  const copy = card.getByRole("button", { name: /copy link to/i });

  await expect(recipe).toHaveAttribute("href", "/design-ideas/");
  await expect(copy).toBeVisible();

  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  });
  await card.scrollIntoViewIfNeeded();
  await copy.click();
  await expect(copy).toHaveText("Copied");

  const href = await card.locator(".showcase-card__media").getAttribute("href");
  if (!href) throw new Error("Showcase card is missing its media link.");
  const expected = new URL(href, page.url()).href;
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
});

test("showcase scene previews mount and unmount with the viewport", async ({ page }) => {
  await page.goto("/showcase/");
  await page.waitForLoadState("networkidle");

  const scene = page.locator('[data-showcase-card][data-category="scene"]').first();
  const live = scene.locator(".showcase-card__live");

  await scene.scrollIntoViewIfNeeded();
  await expect(live).toHaveAttribute("data-mounted", "true", { timeout: 15_000 });
  await expect(live.locator("ascii-lagoon-night")).toHaveCount(1);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(live).not.toHaveAttribute("data-mounted", "true", { timeout: 5_000 });
  await expect(live.locator("ascii-lagoon-night")).toHaveCount(0);
  await expect(page).toHaveURL(/\/showcase\/$/);
});

test("showcase webgl previews mount the requested surface", async ({ page }) => {
  await page.goto("/showcase/");
  await page.waitForLoadState("networkidle");

  const webgl = page.locator('[data-showcase-card][data-category="webgl"]').first();
  const live = webgl.locator(".showcase-card__live");
  const surface = live.locator("ascii-surface");

  await webgl.scrollIntoViewIfNeeded();
  await expect(live).toHaveAttribute("data-mounted", "true", { timeout: 15_000 });
  await expect(surface).toHaveCount(1);
  await expect(surface).not.toHaveAttribute("variant", "");
});

test("mobile showcase keeps archive cards usable without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/showcase/");
  await page.waitForLoadState("networkidle");

  const cards = page.locator("[data-showcase-card]:visible");
  await expect(cards).toHaveCount(50);
  await expectNoHorizontalOverflow(page);

  const first = cards.first();
  await expect(first.getByRole("button", { name: /copy link to/i })).toBeVisible();
  await expect(first.getByRole("link", { name: /design recipe/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
