import { expect, test } from "@playwright/test";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test("AI picker opens the matching prompt and copies it", async ({ page }) => {
  await page.goto("/");

  const trigger = page.locator('.ai-picker [data-ai-tool="claude"]');
  const panel = page.locator("#ai-panel");

  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(panel).toBeVisible();
  await expect(panel.locator(".ai-tool.is-active")).toContainText("Claude Code");

  const copy = panel.locator('[data-ai-copy="claude"]');
  await expect(copy).toBeFocused();
  await copy.click();
  await expect(copy).toHaveText("COPIED");

  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain("ascii-things/core");
  expect(clipboard).toContain("https://ascii-things-docs.pages.dev/guide/framework/");

  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("AI picker closes on outside click", async ({ page }) => {
  await page.goto("/");

  const trigger = page.locator('.ai-picker [data-ai-tool="chatgpt"]');
  const panel = page.locator("#ai-panel");

  await trigger.click();
  await expect(panel).toBeVisible();
  await expect(panel.locator(".ai-tool.is-active")).toContainText("ChatGPT / Codex");

  await page.mouse.click(24, 500);
  await expect(panel).toBeHidden();
});

test("AI picker stays usable at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const trigger = page.locator('.ai-picker [data-ai-tool="cursor"]');
  await expect(trigger).toBeVisible();
  await trigger.click();

  const panel = page.locator("#ai-panel");
  await expect(panel).toBeVisible();
  await expect(panel.locator(".ai-tool.is-active")).toContainText("Cursor");
});

test("Muse Code and Antigravity prompts are available and copy", async ({ page }) => {
  await page.goto("/");
  await page.locator('.ai-picker [data-ai-tool="claude"]').click();

  const panel = page.locator("#ai-panel");
  const musecode = panel.locator('[data-ai-copy="musecode"]');
  const antigravity = panel.locator('[data-ai-copy="antigravity"]');

  await expect(musecode).toBeVisible();
  await musecode.click();
  await expect(musecode).toHaveText("COPIED");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Muse Code");

  await antigravity.click();
  await expect(antigravity).toHaveText("COPIED");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Google Antigravity");
});
