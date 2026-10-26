import AxeBuilder from "@axe-core/playwright";
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import type { Page } from "@playwright/test";
import {
  collectPageErrors,
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForFonts,
} from "../e2e/fixtures";

const FIXTURE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="280" viewBox="0 0 420 280">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#070809"/>
      <stop offset="0.5" stop-color="#ff7a1a"/>
      <stop offset="1" stop-color="#ece8df"/>
    </linearGradient>
  </defs>
  <rect width="420" height="280" fill="url(#sky)"/>
  <circle cx="300" cy="92" r="54" fill="#ece8df"/>
  <path d="M0 220 L110 118 L210 220 Z" fill="#121417"/>
  <path d="M150 240 L280 108 L420 240 Z" fill="#1c1e21"/>
  <rect x="42" y="52" width="128" height="18" fill="#070809"/>
  <rect x="42" y="76" width="86" height="10" fill="#070809"/>
</svg>`;

function upload(name: string) {
  return { name, mimeType: "image/svg+xml", buffer: Buffer.from(FIXTURE_SVG) };
}

async function openStudio(page: Page) {
  await page.goto("/image/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1:visible")).toHaveCount(1);
  await expect(page.locator(".studio-preview canvas")).toBeVisible();
  await expect(page.locator(".studio-stats b").first()).toHaveText("96", { timeout: 20_000 });
  await waitForFonts(page);
}

async function download(page: Page, name: string) {
  const [event] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name }).click(),
  ]);
  expect(event.suggestedFilename()).toBeTruthy();
  const path = await event.path();
  if (!path) throw new Error("Download did not produce a file path.");
  expect(statSync(path).size).toBeGreaterThan(100);
  return path;
}

test("loads the demo, renders a canvas, and has no critical axe violations", async ({
  page,
}, testInfo) => {
  const errors = collectPageErrors(page);
  await openStudio(page);

  const renderTab = page.getByRole("tab", { name: "Render" });
  const textTab = page.getByRole("tab", { name: "Text" });
  await expect(renderTab).toHaveAttribute("aria-selected", "true");
  await expect(renderTab).toHaveAttribute("aria-controls", "studio-panel-render");
  await expect(renderTab).toHaveAttribute("tabindex", "0");
  await expect(textTab).toHaveAttribute("aria-controls", "studio-panel-text");
  await expect(textTab).toHaveAttribute("tabindex", "-1");
  await expect(page.locator("#studio-panel-render")).toBeVisible();
  await expect(page.locator("#studio-panel-text")).toBeHidden();

  await renderTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(textTab).toBeFocused();
  await expect(textTab).toHaveAttribute("aria-selected", "true");
  await expect(textTab).toHaveAttribute("tabindex", "0");
  await expect(renderTab).toHaveAttribute("tabindex", "-1");
  await expect(page.locator("#studio-panel-text")).toBeVisible();
  await expect(page.locator("#studio-panel-render")).toBeHidden();

  await page.keyboard.press("ArrowLeft");
  await expect(renderTab).toBeFocused();
  await expect(renderTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#studio-panel-render")).toBeVisible();

  const pixels = await page.locator(".studio-preview canvas").evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    if (!context) return 0;
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let index = 3; index < data.length; index += 4) {
      if (data[index] > 0) count += 1;
    }
    return count;
  });
  expect(pixels).toBeGreaterThan(100);
  await expect(page.locator(".studio-stats")).toContainText("960 × 680 source");
  await expectNoHorizontalOverflow(page);

  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((violation) => violation.impact === "critical");
  await testInfo.attach("image-studio-axe.json", {
    body: JSON.stringify(results.violations, null, 2),
    contentType: "application/json",
  });
  expect(critical.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
  expect(errors).toEqual([]);
});

test("uploads an image, updates crop and edge mode, copies text, and exports every format", async ({
  page,
  context,
}, testInfo) => {
  const errors = collectPageErrors(page);
  await openStudio(page);

  await page.locator('input[type="file"]').setInputFiles(upload("fixture.svg"));
  await expect(page.locator(".studio-source .studio-panel-title")).toContainText("fixture.svg");
  await expect(page.locator(".studio-stats")).toContainText("420 × 280 source");
  await expect(page.locator(".studio-stats b").first()).toHaveText("96");

  const crop = page.locator("#studio-crop-zoom");
  await crop.evaluate((element) => {
    const input = element as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, "2");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.locator(".studio-crop-box")).toHaveAttribute("style", /width:\s*50%/);
  await expect(page.locator(".studio-source-meta")).toContainText("2× crop");

  await page.getByRole("checkbox", { name: /Sobel edges/ }).check();
  await expect(page.locator(".studio-render-error")).toHaveCount(0);
  await expect(page.locator(".studio-stats b").first()).toHaveText("96");

  await page.getByRole("tab", { name: "Text" }).click();
  await expect(page.locator(".studio-text-output")).toBeVisible();
  await expect(page.locator(".studio-text-output")).not.toHaveText("Rendering…");
  const text = await page.locator(".studio-text-output").textContent();
  expect(text?.length ?? 0).toBeGreaterThan(100);
  expect(text).toMatch(/[.:=+*#%@]/);

  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: "http://127.0.0.1:4322",
  });
  await page.getByRole("button", { name: "Copy ASCII" }).click();
  await expect(page.locator(".studio-notice")).toContainText("copied");
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toBe(text);

  const txtPath = await download(page, "TXT");
  expect(readFileSync(txtPath, "utf8").length).toBeGreaterThan(100);

  const pngPath = await download(page, "PNG 2×");
  const png = readFileSync(pngPath);
  expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(png.length).toBeGreaterThan(1_000);

  const svgPath = await download(page, "SVG");
  const svg = readFileSync(svgPath, "utf8");
  expect(svg).toContain("<svg");
  expect(svg).toContain("generated by ascii-things");

  await testInfo.attach("image-studio-upload.png", {
    body: await page.screenshot({ fullPage: false }),
    contentType: "image/png",
  });
  expect(errors).toEqual([]);
});

test("batch mode uploads several images and downloads a ZIP with text, PNG, and SVG entries", async ({
  page,
}) => {
  test.slow();
  const errors = collectPageErrors(page);
  await openStudio(page);

  await page.getByRole("button", { name: "Batch", exact: true }).click();
  await page
    .locator('input[type="file"]')
    .setInputFiles([upload("orbit.svg"), upload("signal.svg")]);
  await expect(page.locator(".studio-queue-item")).toHaveCount(3);
  await expect(page.locator(".studio-batch")).toBeVisible();

  const zipPath = await download(page, "Download ZIP");
  const listing = execFileSync("unzip", ["-l", zipPath], { encoding: "utf8" });
  expect(listing).toContain("text/robot-dog-demo-ascii.txt");
  expect(listing).toContain("png/orbit-ascii.png");
  expect(listing).toContain("svg/signal-ascii.svg");
  expect(readFileSync(zipPath).length).toBeGreaterThan(1_000);
  expect(errors).toEqual([]);
});

test("mobile keeps the studio usable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStudio(page);
  await expect(page.locator(".studio-source")).toBeVisible();
  await expect(page.locator(".studio-stage")).toBeVisible();
  await expect(page.locator(".studio-controls")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page.locator("h1:visible")).toHaveCount(1);
});

test("light theme is supported", async ({ page }) => {
  await openStudio(page);
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "light";
    localStorage.setItem("starlight-theme", "light");
  });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const colors = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const panel = getComputedStyle(document.querySelector(".studio-panel") as Element);
    return { body: body.backgroundColor, panel: panel.backgroundColor };
  });
  expect(colors.body).not.toBe("rgb(7, 8, 9)");
  expect(colors.panel).not.toBe("rgba(0, 0, 0, 0)");
});
