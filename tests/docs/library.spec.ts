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
