import { expect, test } from "@playwright/test";

test("social card studio renders and downloads a 1200x630 PNG", async ({ page }) => {
  await page.goto("/social-card/");
  await expect(page.locator(".social-card canvas")).toBeVisible();

  await page.getByLabel("Scene").selectOption("koi");
  await page.getByLabel("Palette").selectOption("terminal");
  await page.getByRole("textbox", { name: "Title", exact: true }).fill("A living pond");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Download 1200/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^ascii-card-koi-\d+\.png$/);
});
