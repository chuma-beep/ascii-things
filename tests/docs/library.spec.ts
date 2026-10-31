import { expect, expectNoHorizontalOverflow, test } from "../e2e/fixtures";

test("mobile library search uses a compact placeholder", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/library/");
  await page.waitForLoadState("networkidle");

  const search = page.locator("#library-search");
  await expect(search).toBeVisible();
  await expect(search).toHaveAttribute("placeholder", "Search scenes, WebGL…");
  await expect(search).toHaveAttribute("title", "Search scenes, WebGL, kanji, components, tools");
  await expectNoHorizontalOverflow(page);
});

test("progressively loads library cards, keeps filters sticky, and returns to top", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/library/");
  await page.waitForLoadState("networkidle");

  const cards = page.locator(".library-card:visible");
  const count = page.locator("[data-library-count]");
  const more = page.locator("[data-library-more]");

  await expect(cards).toHaveCount(9);
  await expect(count).toHaveText(/^9 of \d+ items$/);
  await expect(more).toBeVisible();

  await more.click();
  await expect(cards).toHaveCount(18);
  await expect(count).toHaveText(/^18 of \d+ items$/);

  await page.evaluate(() => window.scrollTo(0, 1200));
  await expect
    .poll(() =>
      page.evaluate(() => {
        const toolbar = document.querySelector(".library-toolbar");
        const header = document.querySelector("header.header");
        return Math.abs(
          (toolbar?.getBoundingClientRect().top ?? 0) -
            (header?.getBoundingClientRect().bottom ?? 0),
        );
      }),
    )
    .toBeLessThan(2);

  const sticky = await page.evaluate(() => {
    const toolbar = document.querySelector(".library-toolbar");
    return {
      position: toolbar ? getComputedStyle(toolbar).position : "",
    };
  });
  expect(sticky.position).toBe("sticky");

  const topButton = page.getByRole("button", { name: "Back to top" });
  await expect(topButton).toBeVisible();
  await topButton.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  const kanjiFilter = page.locator('[data-filter="kanji"]');
  await kanjiFilter.click();
  await expect(kanjiFilter).toHaveAttribute("aria-pressed", "true");

  const kanjiTotal = await page.locator('.library-card[data-kanji="true"]').count();
  const visibleKanji = Math.min(kanjiTotal, 9);
  await expect(cards).toHaveCount(visibleKanji);
  await expect(count).toHaveText(
    kanjiTotal > 9
      ? new RegExp(`^9 of ${kanjiTotal} items$`)
      : new RegExp(`^${kanjiTotal} item${kanjiTotal === 1 ? "" : "s"}$`),
  );
});

test.describe("active sidebar link in light theme", () => {
  test.use({ colorScheme: "light", viewport: { width: 1280, height: 900 } });

  test("keeps the current library item readable", async ({ page }) => {
    await page.goto("/library/");
    await page.waitForLoadState("networkidle");

    const active = page.locator('.sidebar-content a[aria-current="page"]');
    await expect(active).toBeVisible();
    await expect(active).toHaveCSS("color", "rgb(108, 42, 8)");
  });
});

test.describe("active sidebar link in dark theme", () => {
  test.use({ colorScheme: "dark", viewport: { width: 1280, height: 900 } });

  test("keeps the current library item readable", async ({ page }) => {
    await page.goto("/library/");
    await page.waitForLoadState("networkidle");

    const active = page.locator('.sidebar-content a[aria-current="page"]');
    await expect(active).toBeVisible();
    await expect(active).toHaveCSS("color", "rgb(255, 196, 154)");
  });
});
