import { expect, expectNoHorizontalOverflow, test, waitForFonts, waitForScene } from "./fixtures";

test.describe("prefers-reduced-motion: reduce", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });

  test("hero canvas holds a still frame", async ({ page }) => {
    await page.goto("/");
    await waitForScene(page);
    await waitForFonts(page);
    await page.waitForTimeout(300);

    const canvas = page.locator("#hero-canvas");
    await expect(canvas).toBeVisible();

    const first = await canvas.screenshot({ animations: "disabled", caret: "hide" });
    await page.waitForTimeout(400);
    const second = await canvas.screenshot({ animations: "disabled", caret: "hide" });

    expect(second.equals(first), "canvas changed while reduced motion was active").toBe(true);
  });
});

test.describe("mobile layout at 390px", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });

  test("landing page does not overflow horizontally", async ({ page }) => {
    await page.goto("/");
    await waitForScene(page);
    await waitForFonts(page);
    await page.waitForTimeout(300);

    await expectNoHorizontalOverflow(page);
  });
});
