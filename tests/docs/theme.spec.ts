import { expect, test } from "@playwright/test";

test("shares one theme choice across the landing page, docs, and standalone pages", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const initial = await page.locator("html").getAttribute("data-theme");
  await page.locator("#theme-toggle").click();
  const toggled = await page.locator("html").getAttribute("data-theme");

  expect(toggled).not.toBe(initial);
  if (!toggled) throw new Error("The landing theme toggle did not set a theme.");
  expect(await page.evaluate(() => localStorage.getItem("starlight-theme"))).toBe(toggled);

  await page.goto("/playground/", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", toggled);

  await page.goto("/showcase/", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", toggled);

  await page.locator("[data-theme-toggle]").click();
  const next = await page.locator("html").getAttribute("data-theme");
  expect(next).not.toBe(toggled);
  if (!next) throw new Error("The showcase theme toggle did not set a theme.");

  for (const path of ["/404.html", "/design-ideas/", "/footer-lab/", "/lagoon-lab/"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", next);
    await expect(page.locator("[data-theme-toggle]").first()).toBeVisible();
  }

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", next);
});
