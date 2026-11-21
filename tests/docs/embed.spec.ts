import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "reduce", viewport: { width: 1440, height: 1000 } });

test("embed page creates the requested lagoon scene", async ({ page }) => {
  await page.goto("/embed/?scene=lagoon&variant=turtle&palette=neon&columns=80&paused=1", {
    waitUntil: "networkidle",
  });

  const scene = page.locator("ascii-lagoon");
  await expect(scene).toBeVisible();
  await expect(scene).toHaveAttribute("variant", "turtle");
  await expect(scene).toHaveAttribute("palette", "neon");
  await expect(scene).toHaveAttribute("paused", "true");

  await page.waitForFunction(() => {
    const host = document.querySelector("ascii-lagoon");
    return Boolean(host?.shadowRoot?.querySelector("canvas"));
  });

  const size = await scene.evaluate((host) => {
    const canvas = host.shadowRoot?.querySelector("canvas") as HTMLCanvasElement | null;
    return canvas ? { width: canvas.width, height: canvas.height } : null;
  });

  expect(size?.width).toBeGreaterThan(0);
  expect(size?.height).toBeGreaterThan(0);
});

test("builder updates the preview and snippet", async ({ page }) => {
  await page.goto("/embed/builder/", { waitUntil: "networkidle" });

  await page.selectOption("#scene", "sharks");
  await page.selectOption("#palette", "paper");

  await expect(page.locator("#preview")).toHaveAttribute("src", /scene=sharks/);
  await expect(page.locator("#snippet")).toContainText(
    "https://ascii-things.dev/embed/?scene=sharks",
  );
  await expect(page.locator("#snippet")).toContainText("palette=paper");
});
