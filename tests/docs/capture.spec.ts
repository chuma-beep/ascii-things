import { expect, test } from "@playwright/test";

test.use({
  reducedMotion: "reduce",
  viewport: { width: 1440, height: 1000 },
});

test("scene GIF capture downloads an animated GIF", async ({ page }) => {
  await page.goto("/playground/", { waitUntil: "networkidle" });
  await expect(page.locator("canvas.ascii-dog")).toBeVisible();

  const downloadStarted = page.waitForEvent("download", { timeout: 45_000 });
  await page.getByRole("button", { name: "Record GIF", exact: true }).click();
  const download = await downloadStarted;

  expect(download.suggestedFilename()).toBe("ascii-dog-7.gif");
  const path = await download.path();
  expect(path).toBeTruthy();
});
