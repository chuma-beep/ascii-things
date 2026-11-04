import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const target of [
  { name: "playground", path: "/playground/", ready: ".docs-playground" },
  {
    name: "surface playground",
    path: "/surface-playground/",
    ready: "canvas.ascii-surface",
  },
  { name: "image studio", path: "/image/", ready: ".image-studio" },
]) {
  test(`${target.name} has no critical axe violations`, async ({ page }) => {
    await page.goto(target.path);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(target.ready).first()).toBeVisible();
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((violation) => violation.impact === "critical");
    expect(
      critical.map((violation) => `${violation.id}: ${violation.help}`),
      `critical accessibility violations on ${target.path}`,
    ).toEqual([]);
  });
}
