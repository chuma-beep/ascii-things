import {
  expect,
  expectNoHorizontalOverflow,
  readSceneStats,
  test,
  waitForFonts,
  waitForScene,
  waitForStats,
} from "./fixtures";

test.describe("performance smoke", () => {
  test("landing scene stays fast at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await waitForScene(page);
    await waitForFonts(page);
    await waitForStats(page);

    const stats = await readSceneStats(page);
    expect(stats.cells, "scene rendered no cells").toBeGreaterThan(0);
    expect(stats.fps, `fps too low: ${JSON.stringify(stats)}`).toBeGreaterThanOrEqual(45);
    expect(stats.frameMs, `frame time too high: ${JSON.stringify(stats)}`).toBeLessThanOrEqual(24);
    await expectNoHorizontalOverflow(page);
  });

  test("landing scene stays fast at 390x844", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await waitForScene(page);
    await waitForFonts(page);
    await waitForStats(page);

    const stats = await readSceneStats(page);
    expect(stats.cells, "scene rendered no cells").toBeGreaterThan(0);
    expect(stats.fps, `fps too low: ${JSON.stringify(stats)}`).toBeGreaterThanOrEqual(45);
    expect(stats.frameMs, `frame time too high: ${JSON.stringify(stats)}`).toBeLessThanOrEqual(24);
    await expectNoHorizontalOverflow(page);
  });

  test("UI example hero canvas is present and painted", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/examples/ui/");
    await waitForFonts(page);

    const canvas = page.locator(".ascii-dog-hero canvas.ascii-dog");
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(1_000);

    const painted = await canvas.evaluate((element) => {
      const node = element as HTMLCanvasElement;
      if (node.width < 1 || node.height < 1) return { size: 0, paintedPixels: 0 };
      const context = node.getContext("2d");
      if (!context) return { size: node.width * node.height, paintedPixels: 0 };
      const pixels = context.getImageData(0, 0, node.width, node.height).data;
      let paintedPixels = 0;
      for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index] > 0) paintedPixels++;
      }
      return { size: node.width * node.height, paintedPixels };
    });

    expect(painted.size, "hero canvas has no backing store").toBeGreaterThan(0);
    expect(painted.paintedPixels, "hero canvas is blank").toBeGreaterThan(0);
  });
});
