import { expect, test, waitForFonts, waitForScene } from "./fixtures";

test.describe("visual baselines", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });

  test("landing hero", async ({ page }) => {
    await page.goto("/");
    await waitForScene(page);
    await waitForFonts(page);
    // Reduced motion settles the world, but the HUD refreshes on a 500 ms timer.
    // Wait until those values are stable before capturing.
    await page.waitForTimeout(1_600);

    await expect(page).toHaveScreenshot("landing-hero.png");
  });

  test("landing scene gallery", async ({ page }) => {
    await page.goto("/");
    await waitForScene(page);
    await waitForFonts(page);
    await page.waitForTimeout(400);

    // The gallery is taller than the viewport; the fixed header would otherwise
    // paint over its first row when it scrolls into view.
    await page.addStyleTag({ content: ".site-header { visibility: hidden !important; }" });
    const grid = page.locator(".scene-grid");
    await grid.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(200);

    await expect(grid).toHaveScreenshot("landing-scene-gallery.png");
  });

  test("UI example hero", async ({ page }) => {
    await page.goto("/examples/ui/");
    await page.waitForLoadState("networkidle");
    await waitForFonts(page);
    await page.waitForTimeout(1_600);

    const hero = page.locator(".ascii-dog-hero");
    await expect(hero).toBeVisible();
    await hero.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(200);

    await expect(hero).toHaveScreenshot("ui-hero.png");
  });

  test.describe("mobile", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("landing hero", async ({ page }) => {
      await page.goto("/");
      await waitForScene(page);
      await waitForFonts(page);
      await page.waitForTimeout(1_600);

      await expect(page).toHaveScreenshot("landing-hero-mobile.png");
    });
  });
});
