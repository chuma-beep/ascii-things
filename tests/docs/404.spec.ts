import AxeBuilder from "@axe-core/playwright";
import {
  collectPageErrors,
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForFonts,
} from "../e2e/fixtures";

async function openNotFound(page: import("@playwright/test").Page) {
  await page.goto("/404.html");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1")).toContainText("Nothing at this address.");
  await waitForFonts(page);
}

test("renders the recovery 404 with a live dog and no critical axe violations", async ({
  page,
}, testInfo) => {
  const errors = collectPageErrors(page);
  await openNotFound(page);

  await expect(page.locator("[data-requested-path]")).toHaveText("/404.html");
  await expect(page.locator(".search-scene canvas")).toBeVisible();
  await expect(page.getByText("thescene overview")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Scene overview" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((violation) => violation.impact === "critical");
  await testInfo.attach("404-axe.json", {
    body: JSON.stringify(results.violations, null, 2),
    contentType: "application/json",
  });
  expect(critical.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
  expect(errors).toEqual([]);
});

test("copies the requested path", async ({ page, context }) => {
  await openNotFound(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4322",
  });

  await page.getByRole("button", { name: "Copy" }).click();
  await expect(page.getByRole("status")).toHaveText("Path copied.");
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("/404.html");
});

test("mobile keeps the 404 readable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openNotFound(page);

  await expect(page.locator(".search-unit")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Recovery index" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
