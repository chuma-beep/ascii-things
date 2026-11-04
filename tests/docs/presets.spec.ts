import { expect, test } from "@playwright/test";
import { createScenePreset, createSurfacePreset, encodePreset } from "../../site/src/lib/presets";

test("restores a shared scene preset before writing URL state", async ({ page }) => {
  const preset = createScenePreset({
    scene: "sharks",
    palette: "amber",
    glyphs: "kanji",
    seed: 33,
    columns: 88,
    density: 1.2,
    speed: 0.6,
    calm: true,
    paused: true,
    interactive: false,
  });

  await page.goto(`/playground/?p=${encodePreset(preset)}`);
  await expect(
    page.getByRole("tablist", { name: "Playground scene" }).getByRole("tab", { name: /Sharks/i }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("tablist", { name: "Playground palette" }).getByRole("tab", {
      name: /Amber CRT/i,
    }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".docs-playground-controls input[type=number]").first()).toHaveValue(
    "33",
  );
  await expect(page.getByRole("button", { name: /Link copied/i })).toHaveCount(0);
  await expect(page).toHaveURL(/p=/);
});

test("restores a shared surface preset", async ({ page }) => {
  const preset = createSurfacePreset({
    variant: "torus-3d",
    density: 0.55,
    cell: 7,
    speed: 0.8,
    fg: "#7fbcff",
    bg: "#04121f",
    accent: "#c7e8a4",
    interactive: true,
  });

  await page.goto(`/surface-playground/?p=${encodePreset(preset)}`);
  await expect(page.getByLabel("Variant")).toHaveValue("torus-3d");
  await expect(page.locator("canvas.ascii-surface")).toBeVisible();
  await expect(page).toHaveURL(/p=/);
});
