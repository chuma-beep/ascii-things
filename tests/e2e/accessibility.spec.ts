import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test, waitForFonts } from "./fixtures";

const PAGES = [
  { name: "landing", path: "/" },
  { name: "UI example", path: "/examples/ui/" },
];

interface ViolationSummary {
  id: string;
  impact?: string | null;
  help: string;
  nodes: unknown[];
}

function summarize(page: Page, violation: ViolationSummary) {
  const count = violation.nodes.length;
  return `- [${violation.impact ?? "unknown"}] ${violation.id}: ${violation.help} (${count} node${count === 1 ? "" : "s"}) on ${page.url()}`;
}

for (const target of PAGES) {
  test(`${target.name} has no critical axe violations`, async ({ page }, testInfo) => {
    await page.goto(target.path);
    await page.waitForLoadState("networkidle");
    if (target.path !== "/") {
      await expect(page.locator(".ascii-dog-hero")).toBeVisible();
    }
    await waitForFonts(page);
    // Let React mount and the scene settle before auditing.
    await page.waitForTimeout(500);

    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((violation) => violation.impact === "critical");
    const serious = results.violations.filter((violation) => violation.impact === "serious");

    for (const violation of serious) {
      testInfo.annotations.push({
        type: "axe:serious",
        description: summarize(page, violation),
      });
    }

    await testInfo.attach("axe-results", {
      body: JSON.stringify(results.violations, null, 2),
      contentType: "application/json",
    });

    expect(
      critical.map((violation) => summarize(page, violation)),
      `critical accessibility violations:\n${critical
        .map((violation) => summarize(page, violation))
        .join("\n")}`,
    ).toEqual([]);

    if (serious.length > 0) {
      console.warn(
        `${serious.length} serious axe violation(s) on ${target.path} (reported, not gated):\n${serious
          .map((violation) => summarize(page, violation))
          .join("\n")}`,
      );
    }
  });
}
