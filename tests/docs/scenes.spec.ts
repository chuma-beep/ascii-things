import { expect, test } from "@playwright/test";
import { createScenePreset, encodePreset, SCENE_IDS } from "../../site/src/lib/presets";
import { waitForFonts } from "../e2e/fixtures";

test.use({ reducedMotion: "reduce", viewport: { width: 1440, height: 1000 } });

for (const scene of SCENE_IDS) {
  test(`renders the ${scene} scene`, async ({ page }) => {
    const preset = createScenePreset({
      scene,
      palette: "abyss",
      glyphs: "ascii",
      seed: 7,
      columns: 110,
      density: 1,
      speed: 1,
      calm: true,
      paused: true,
      interactive: false,
    });

    await page.goto(`/playground/?p=${encodePreset(preset)}`, { waitUntil: "networkidle" });

    const canvas = page.locator(`canvas.ascii-${scene}`);
    await expect(canvas).toBeVisible();
    await waitForFonts(page);
    await page.waitForTimeout(1_200);

    await expect(canvas).toHaveScreenshot(`${scene}.png`, {
      animations: "disabled",
      threshold: 0.2,
      maxDiffPixelRatio: 0.005,
    });
  });
}
