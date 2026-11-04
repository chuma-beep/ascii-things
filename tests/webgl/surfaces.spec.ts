import { expect, test } from "@playwright/test";

test("every WebGL variant mounts without shader or runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  const pages = [
    { path: "/webgl/", count: 6 },
    { path: "/webgl/more/", count: 6 },
    { path: "/webgl/3d/", count: 4 },
  ];

  let total = 0;
  for (const target of pages) {
    await page.goto(target.path);
    await page.waitForLoadState("networkidle");

    const canvases = page.locator(".webgl-card canvas.ascii-surface");
    await expect(canvases).toHaveCount(target.count);
    await expect(canvases.first()).toBeVisible();
    total += target.count;

    const renderers = await canvases.evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLCanvasElement).dataset.renderer),
    );
    expect(
      renderers.every((renderer) => renderer && renderer !== "none"),
      `all renderers on ${target.path}`,
    ).toBe(true);
  }

  expect(total).toBe(16);
  expect(errors).toEqual([]);
});

test("the surface playground uses the fallback when WebGL is unavailable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (contextId: string, ...args: unknown[]) {
      if (String(contextId).startsWith("webgl")) return null;
      return original.call(this, contextId, ...args);
    } as typeof original;
  });

  await page.goto(
    "/surface-playground/?p=eyJ2IjoxLCJraW5kIjoic3VyZmFjZSIsInZhcmlhbnQiOiJnbG9iZSIsImRlbnNpdHkiOjAuM30",
  );
  await page.waitForLoadState("networkidle");

  const canvas = page.locator("canvas.ascii-surface");
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-renderer", "2d");
  expect(errors).toEqual([]);
});
