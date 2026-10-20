import { collectPageErrors, expect, test, waitForFonts, waitForScene } from "./fixtures";

test("landing page loads with the expected title and no errors", async ({ page }) => {
  const errors = collectPageErrors(page);

  await page.goto("/");

  await expect(page).toHaveTitle("ascii-things — living ASCII scenes for the web");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your interface");
  await expect(page.locator("#hero-canvas")).toBeVisible();

  await page.getByRole("tab", { name: "HTML" }).click();
  await expect(page.locator("#panel-html")).toBeVisible();

  await waitForScene(page);
  await waitForFonts(page);
  await page.waitForTimeout(700);

  expect(errors, `unexpected browser errors:\n${errors.join("\n")}`).toEqual([]);
});
