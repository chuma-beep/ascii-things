import type { Page } from "@playwright/test";
import { expect, test } from "../e2e/fixtures";

const boxLayout = async (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        marginTop: style.marginTop,
        height: rect.height,
        top: rect.top,
      };
    }),
  );

test("kanji detail metadata boxes share one aligned baseline", async ({ page }) => {
  await page.goto("/kanji/koi/", { waitUntil: "networkidle" });

  const boxes = await boxLayout(page, ".kanji-detail__meta > div");
  expect(boxes).toHaveLength(3);

  for (const box of boxes) expect(box.marginTop).toBe("0px");
  expect(new Set(boxes.map((box) => box.height)).size).toBe(1);
  expect(new Set(boxes.map((box) => box.top)).size).toBe(1);
});

test("composed readout boxes ignore prose divider margins", async ({ page }) => {
  await page.goto("/guide/ui-components/", { waitUntil: "networkidle" });

  const items = await boxLayout(page, ".ascii-readout-item");
  expect(items.length).toBeGreaterThan(0);

  for (const item of items) expect(item.marginTop).toBe("0px");
  expect(new Set(items.map((item) => item.height)).size).toBe(1);
});
