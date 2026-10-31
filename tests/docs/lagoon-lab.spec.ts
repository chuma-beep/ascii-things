import { expect, expectNoHorizontalOverflow, test } from "../e2e/fixtures";
import type { Page } from "@playwright/test";

const PANELS = ["ambient", "search", "chat", "embed"] as const;

async function turtleSignature(page: Page) {
  return page.evaluate(() => {
    const source = document.querySelector<HTMLCanvasElement>("[data-lagoon-canvas]");
    if (!source) return "";
    const sample = document.createElement("canvas");
    sample.width = 96;
    sample.height = 96;
    const context = sample.getContext("2d");
    if (!context) return "";
    context.drawImage(source, 300, 300, 1500, 1300, 0, 0, 96, 96);
    const pixels = context.getImageData(0, 0, 96, 96).data;
    let hash = 2166136261;
    for (let i = 0; i < pixels.length; i += 4) {
      hash ^= pixels[i] + pixels[i + 1] * 3 + pixels[i + 2] * 7 + pixels[i + 3] * 11;
      hash = Math.imul(hash, 16777619);
    }
    return String(hash >>> 0);
  });
}

async function mantaSignature(page: Page) {
  return page.evaluate(() => {
    const source = document.querySelector<HTMLCanvasElement>("[data-lagoon-canvas]");
    if (!source) return "";
    const sample = document.createElement("canvas");
    sample.width = 128;
    sample.height = 128;
    const context = sample.getContext("2d");
    if (!context) return "";
    context.drawImage(source, 0, 0, 128, 128);
    const pixels = context.getImageData(0, 0, 128, 128).data;
    let hash = 2166136261;
    for (let i = 0; i < pixels.length; i += 4) {
      hash ^= pixels[i] + pixels[i + 1] * 3 + pixels[i + 2] * 7;
      hash = Math.imul(hash, 16777619);
    }
    return String(hash >>> 0);
  });
}

async function seahorseSignature(page: Page) {
  return page.evaluate(() => {
    const source = document.querySelector<HTMLCanvasElement>("[data-lagoon-canvas]");
    if (!source) return "";
    const sample = document.createElement("canvas");
    sample.width = 96;
    sample.height = 128;
    const context = sample.getContext("2d");
    if (!context) return "";
    context.drawImage(source, 700, 220, 640, 1240, 0, 0, 96, 128);
    const pixels = context.getImageData(0, 0, 96, 128).data;
    let hash = 2166136261;
    for (let i = 0; i < pixels.length; i += 4) {
      hash ^= pixels[i] + pixels[i + 1] * 3 + pixels[i + 2] * 7;
      hash = Math.imul(hash, 16777619);
    }
    return String(hash >>> 0);
  });
}

async function dolphinSignature(page: Page) {
  return page.evaluate(() => {
    const source = document.querySelector<HTMLCanvasElement>("[data-lagoon-canvas]");
    if (!source) return "";
    const sample = document.createElement("canvas");
    sample.width = 128;
    sample.height = 128;
    const context = sample.getContext("2d");
    if (!context) return "";
    context.drawImage(source, 260, 260, 1420, 1280, 0, 0, 128, 128);
    const pixels = context.getImageData(0, 0, 128, 128).data;
    let hash = 2166136261;
    for (let i = 0; i < pixels.length; i += 4) {
      hash ^= pixels[i] + pixels[i + 1] * 3 + pixels[i + 2] * 7 + pixels[i + 3] * 11;
      hash = Math.imul(hash, 16777619);
    }
    return String(hash >>> 0);
  });
}

async function hammerSignature(page: Page) {
  return page.evaluate(() => {
    const source = document.querySelector<HTMLCanvasElement>("[data-lagoon-canvas]");
    if (!source) return "";
    const sample = document.createElement("canvas");
    sample.width = 128;
    sample.height = 128;
    const context = sample.getContext("2d");
    if (!context) return "";
    context.drawImage(source, 260, 900, 1440, 760, 0, 0, 128, 128);
    const pixels = context.getImageData(0, 0, 128, 128).data;
    let hash = 2166136261;
    for (let i = 0; i < pixels.length; i += 4) {
      hash ^= pixels[i] + pixels[i + 1] * 3 + pixels[i + 2] * 7 + pixels[i + 3] * 11;
      hash = Math.imul(hash, 16777619);
    }
    return String(hash >>> 0);
  });
}

async function tangSignature(page: Page) {
  return page.evaluate(() => {
    const source = document.querySelector<HTMLCanvasElement>("[data-lagoon-canvas]");
    if (!source) return "";
    const sample = document.createElement("canvas");
    sample.width = 128;
    sample.height = 128;
    const context = sample.getContext("2d");
    if (!context) return "";
    context.drawImage(source, 260, 260, 1440, 1240, 0, 0, 128, 128);
    const pixels = context.getImageData(0, 0, 128, 128).data;
    let hash = 2166136261;
    for (let i = 0; i < pixels.length; i += 4) {
      hash ^= pixels[i] + pixels[i + 1] * 3 + pixels[i + 2] * 7 + pixels[i + 3] * 11;
      hash = Math.imul(hash, 16777619);
    }
    return String(hash >>> 0);
  });
}

test("lagoon lab keeps one stage across all four uses", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/lagoon-lab/", { waitUntil: "networkidle" });

  await expect(page.locator("[data-lagoon-stage]")).toHaveCount(1);
  await expect(page.locator("[data-lagoon-canvas]")).toHaveCount(1);
  await expect(page.locator('[data-panel="ambient"]')).toBeVisible();

  const ambient = page.getByRole("tab", { name: "Ambient" });
  const search = page.getByRole("tab", { name: "Search" });
  const chat = page.getByRole("tab", { name: "Chat" });
  const card = page.getByRole("tab", { name: "Card" });

  await expect(ambient).toHaveAttribute("aria-selected", "true");
  await expect(ambient).toHaveAttribute("tabindex", "0");
  await expect(search).toHaveAttribute("tabindex", "-1");

  await search.click();
  await expect(search).toHaveAttribute("aria-selected", "true");
  await expect(page.locator('[data-panel="search"]')).toBeVisible();
  await expect(page.locator('[data-panel="ambient"]')).toBeHidden();
  await expect(page.locator("[data-rail-title]")).toHaveText("Search");
  await expect.poll(() => page.evaluate(() => window.location.hash)).toBe("#search");

  await chat.click();
  await expect(page.locator('[data-panel="chat"]')).toBeVisible();
  await expect(page.locator("[data-rail-title]")).toHaveText("Chat");

  await card.click();
  await expect(page.locator('[data-panel="embed"]')).toBeVisible();
  await expect(page.locator("[data-lagoon-lab]")).toHaveAttribute("data-mode", "embed");

  await expect(page.locator("[data-lagoon-stage]")).toHaveCount(1);
  await expect(page.locator("[data-lagoon-canvas]")).toHaveCount(1);
  await expect(page.locator("[data-lagoon-stage]")).toHaveAttribute(
    "data-lagoon-state",
    /running|paused|static/,
  );

  await ambient.focus();
  await page.keyboard.press("ArrowRight");
  await expect(search).toHaveAttribute("aria-selected", "true");
  await expect(search).toBeFocused();
});

test("scene selector switches Day lagoon to Night reef across every mode", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/lagoon-lab/", { waitUntil: "networkidle" });

  const root = page.locator("[data-lagoon-lab]");
  const stage = page.locator("[data-lagoon-stage]");
  const day = page.getByRole("radio", { name: "Day lagoon" });
  const night = page.getByRole("radio", { name: "Night reef" });

  const canvasLuma = () =>
    page.evaluate(() => {
      const source = document.querySelector<HTMLCanvasElement>("[data-lagoon-canvas]");
      const sample = document.createElement("canvas");
      sample.width = 32;
      sample.height = 32;
      const context = sample.getContext("2d");
      if (!source || !context) return 0;
      context.drawImage(source, 0, 0, 32, 32);
      const pixels = context.getImageData(0, 0, 32, 32).data;
      let total = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        total += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      }
      return total / (32 * 32);
    });

  await expect(day).toBeChecked();
  await expect(night).not.toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "day");
  await expect(stage).toHaveAttribute("data-lagoon-scene", "day");
  await expect(page.locator("[data-rail-scene]")).toHaveText("Day lagoon");

  const dayLuma = await canvasLuma();

  await night.check();
  await expect(night).toBeChecked();
  await expect(day).not.toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "night");
  await expect(stage).toHaveAttribute("data-lagoon-scene", "night");
  await expect(page.locator("[data-rail-scene]")).toHaveText("Night reef");

  await page.waitForTimeout(220);
  const nightLuma = await canvasLuma();
  expect(nightLuma).toBeLessThan(dayLuma * 0.55);

  for (const mode of PANELS) {
    await page.locator(`[data-mode-tab="${mode}"]`).click();
    await expect(page.locator(`[data-panel="${mode}"]`)).toBeVisible();
    await expect(root).toHaveAttribute("data-scene", "night");
    await expect(stage).toHaveAttribute("data-lagoon-scene", "night");
    await expectNoHorizontalOverflow(page);
  }

  await day.check();
  await expect(day).toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "day");
  await expect(stage).toHaveAttribute("data-lagoon-scene", "day");
});

test("Turtle close-up is a third scene and survives every mode", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/lagoon-lab/", { waitUntil: "networkidle" });

  const root = page.locator("[data-lagoon-lab]");
  const stage = page.locator("[data-lagoon-stage]");
  const day = page.getByRole("radio", { name: "Day lagoon" });
  const night = page.getByRole("radio", { name: "Night reef" });
  const turtle = page.getByRole("radio", { name: "Turtle close-up" });

  await expect(day).toBeChecked();
  await expect(turtle).not.toBeChecked();

  await turtle.check();
  await expect(turtle).toBeChecked();
  await expect(day).not.toBeChecked();
  await expect(night).not.toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "turtle");
  await expect(stage).toHaveAttribute("data-lagoon-scene", "turtle");
  await expect(page.locator("[data-rail-scene]")).toHaveText("Turtle close-up");

  await page.waitForTimeout(280);
  const luma = await page.evaluate(() => {
    const source = document.querySelector<HTMLCanvasElement>("[data-lagoon-canvas]");
    const sample = document.createElement("canvas");
    sample.width = 32;
    sample.height = 32;
    const context = sample.getContext("2d");
    if (!source || !context) return 0;
    context.drawImage(source, 0, 0, 32, 32);
    const pixels = context.getImageData(0, 0, 32, 32).data;
    let total = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      total += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    }
    return total / (32 * 32);
  });
  expect(luma).toBeGreaterThan(40);

  for (const mode of PANELS) {
    await page.locator(`[data-mode-tab="${mode}"]`).click();
    await expect(page.locator(`[data-panel="${mode}"]`)).toBeVisible();
    await expect(root).toHaveAttribute("data-scene", "turtle");
    await expect(stage).toHaveAttribute("data-lagoon-scene", "turtle");
    await expectNoHorizontalOverflow(page);
  }

  await expect(stage).toHaveAttribute("data-lagoon-state", /running|paused|static/);

  await day.check();
  await expect(day).toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "day");
  await expect(stage).toHaveAttribute("data-lagoon-scene", "day");
});

test("Turtle close-up keeps swimming over time", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/lagoon-lab/", { waitUntil: "networkidle" });

  const stage = page.locator("[data-lagoon-stage]");
  await page.getByRole("radio", { name: "Turtle close-up" }).check();
  await expect(stage).toHaveAttribute("data-lagoon-scene", "turtle");
  await expect(stage).toHaveAttribute("data-lagoon-state", "running");

  await page.waitForTimeout(450);
  const first = await turtleSignature(page);
  await page.waitForTimeout(700);
  const second = await turtleSignature(page);

  expect(first).not.toBe("");
  expect(second).not.toBe(first);
});

test("Manta flyby is a fourth scene and keeps both mantas moving", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/lagoon-lab/", { waitUntil: "networkidle" });

  const root = page.locator("[data-lagoon-lab]");
  const stage = page.locator("[data-lagoon-stage]");
  const day = page.getByRole("radio", { name: "Day lagoon" });
  const night = page.getByRole("radio", { name: "Night reef" });
  const turtle = page.getByRole("radio", { name: "Turtle close-up" });
  const manta = page.getByRole("radio", { name: "Manta flyby" });

  await expect(page.getByRole("radio")).toHaveCount(8);
  await expect(day).toBeChecked();
  await expect(manta).not.toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "day");

  await manta.check();
  await expect(manta).toBeChecked();
  await expect(day).not.toBeChecked();
  await expect(night).not.toBeChecked();
  await expect(turtle).not.toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "manta");
  await expect(stage).toHaveAttribute("data-lagoon-scene", "manta");
  await expect(page.locator("[data-rail-scene]")).toHaveText("Manta flyby");
  await expect(stage).toHaveAttribute("data-lagoon-state", "running");

  await page.waitForTimeout(350);
  const first = await mantaSignature(page);
  await page.waitForTimeout(700);
  const second = await mantaSignature(page);
  expect(first).not.toBe("");
  expect(second).not.toBe(first);

  for (const mode of PANELS) {
    await page.locator(`[data-mode-tab="${mode}"]`).click();
    await expect(page.locator(`[data-panel="${mode}"]`)).toBeVisible();
    await expect(root).toHaveAttribute("data-scene", "manta");
    await expect(stage).toHaveAttribute("data-lagoon-scene", "manta");
    await expectNoHorizontalOverflow(page);
  }

  await day.check();
  await expect(day).toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "day");
  await expect(stage).toHaveAttribute("data-lagoon-scene", "day");
});

test("Seahorse is a fifth scene and keeps the portrait alive", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/lagoon-lab/", { waitUntil: "networkidle" });

  const root = page.locator("[data-lagoon-lab]");
  const stage = page.locator("[data-lagoon-stage]");
  const day = page.getByRole("radio", { name: "Day lagoon" });
  const night = page.getByRole("radio", { name: "Night reef" });
  const turtle = page.getByRole("radio", { name: "Turtle close-up" });
  const manta = page.getByRole("radio", { name: "Manta flyby" });
  const seahorse = page.getByRole("radio", { name: "Seahorse" });

  await expect(page.getByRole("radio")).toHaveCount(8);
  await expect(day).toBeChecked();
  await expect(seahorse).not.toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "day");

  await seahorse.check();
  await expect(seahorse).toBeChecked();
  await expect(day).not.toBeChecked();
  await expect(night).not.toBeChecked();
  await expect(turtle).not.toBeChecked();
  await expect(manta).not.toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "seahorse");
  await expect(stage).toHaveAttribute("data-lagoon-scene", "seahorse");
  await expect(page.locator("[data-rail-scene]")).toHaveText("Seahorse");
  await expect(stage).toHaveAttribute("data-lagoon-state", "running");

  await page.waitForTimeout(400);
  const first = await seahorseSignature(page);
  await page.waitForTimeout(800);
  const second = await seahorseSignature(page);
  expect(first).not.toBe("");
  expect(second).not.toBe(first);

  const luma = await page.evaluate(() => {
    const source = document.querySelector<HTMLCanvasElement>("[data-lagoon-canvas]");
    const sample = document.createElement("canvas");
    sample.width = 32;
    sample.height = 32;
    const context = sample.getContext("2d");
    if (!source || !context) return 0;
    context.drawImage(source, 0, 0, 32, 32);
    const pixels = context.getImageData(0, 0, 32, 32).data;
    let total = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      total += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    }
    return total / (32 * 32);
  });
  expect(luma).toBeGreaterThan(40);

  for (const mode of PANELS) {
    await page.locator(`[data-mode-tab="${mode}"]`).click();
    await expect(page.locator(`[data-panel="${mode}"]`)).toBeVisible();
    await expect(root).toHaveAttribute("data-scene", "seahorse");
    await expect(stage).toHaveAttribute("data-lagoon-scene", "seahorse");
    await expectNoHorizontalOverflow(page);
  }

  await day.check();
  await expect(day).toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "day");
  await expect(stage).toHaveAttribute("data-lagoon-scene", "day");
});

test("Dolphin pod is a sixth scene and keeps all three animals moving", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/lagoon-lab/", { waitUntil: "networkidle" });

  const root = page.locator("[data-lagoon-lab]");
  const stage = page.locator("[data-lagoon-stage]");
  const day = page.getByRole("radio", { name: "Day lagoon" });
  const night = page.getByRole("radio", { name: "Night reef" });
  const turtle = page.getByRole("radio", { name: "Turtle close-up" });
  const manta = page.getByRole("radio", { name: "Manta flyby" });
  const seahorse = page.getByRole("radio", { name: "Seahorse" });
  const dolphin = page.getByRole("radio", { name: "Dolphin pod" });

  await expect(page.getByRole("radio")).toHaveCount(8);
  await expect
    .poll(() =>
      page.$$eval("[data-scene-input]", (inputs) =>
        inputs.map((input) => (input as HTMLInputElement).value),
      ),
    )
    .toEqual(["day", "night", "turtle", "manta", "seahorse", "dolphin", "hammer", "tang"]);
  await expect(day).toBeChecked();
  await expect(dolphin).not.toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "day");
  await expectNoHorizontalOverflow(page);

  await dolphin.check();
  await expect(dolphin).toBeChecked();
  await expect(day).not.toBeChecked();
  await expect(night).not.toBeChecked();
  await expect(turtle).not.toBeChecked();
  await expect(manta).not.toBeChecked();
  await expect(seahorse).not.toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "dolphin");
  await expect(stage).toHaveAttribute("data-lagoon-scene", "dolphin");
  await expect(page.locator("[data-rail-scene]")).toHaveText("Dolphin pod");
  await expect(stage).toHaveAttribute("data-lagoon-state", "running");

  await page.waitForTimeout(450);
  const first = await dolphinSignature(page);
  await page.waitForTimeout(850);
  const second = await dolphinSignature(page);
  expect(first).not.toBe("");
  expect(second).not.toBe(first);

  const luma = await page.evaluate(() => {
    const source = document.querySelector<HTMLCanvasElement>("[data-lagoon-canvas]");
    const sample = document.createElement("canvas");
    sample.width = 32;
    sample.height = 32;
    const context = sample.getContext("2d");
    if (!source || !context) return 0;
    context.drawImage(source, 0, 0, 32, 32);
    const pixels = context.getImageData(0, 0, 32, 32).data;
    let total = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      total += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    }
    return total / (32 * 32);
  });
  expect(luma).toBeGreaterThan(40);

  for (const mode of PANELS) {
    await page.locator(`[data-mode-tab="${mode}"]`).click();
    await expect(page.locator(`[data-panel="${mode}"]`)).toBeVisible();
    await expect(root).toHaveAttribute("data-scene", "dolphin");
    await expect(stage).toHaveAttribute("data-lagoon-scene", "dolphin");
    await expectNoHorizontalOverflow(page);
  }

  await day.check();
  await expect(day).toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "day");
  await expect(stage).toHaveAttribute("data-lagoon-scene", "day");
});

test("Hammerhead pass is a seventh scene and keeps both sharks moving", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/lagoon-lab/", { waitUntil: "networkidle" });

  const root = page.locator("[data-lagoon-lab]");
  const stage = page.locator("[data-lagoon-stage]");
  const day = page.getByRole("radio", { name: "Day lagoon" });
  const night = page.getByRole("radio", { name: "Night reef" });
  const turtle = page.getByRole("radio", { name: "Turtle close-up" });
  const manta = page.getByRole("radio", { name: "Manta flyby" });
  const seahorse = page.getByRole("radio", { name: "Seahorse" });
  const dolphin = page.getByRole("radio", { name: "Dolphin pod" });
  const hammer = page.getByRole("radio", { name: "Hammerhead pass" });

  await expect(page.getByRole("radio")).toHaveCount(8);
  await expect
    .poll(() =>
      page.$$eval("[data-scene-input]", (inputs) =>
        inputs.map((input) => (input as HTMLInputElement).value),
      ),
    )
    .toEqual(["day", "night", "turtle", "manta", "seahorse", "dolphin", "hammer", "tang"]);
  await expect(day).toBeChecked();
  await expect(hammer).not.toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "day");
  await expectNoHorizontalOverflow(page);

  await hammer.check();
  await expect(hammer).toBeChecked();
  await expect(day).not.toBeChecked();
  await expect(night).not.toBeChecked();
  await expect(turtle).not.toBeChecked();
  await expect(manta).not.toBeChecked();
  await expect(seahorse).not.toBeChecked();
  await expect(dolphin).not.toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "hammer");
  await expect(stage).toHaveAttribute("data-lagoon-scene", "hammer");
  await expect(page.locator("[data-rail-scene]")).toHaveText("Hammerhead pass");
  await expect(stage).toHaveAttribute("data-lagoon-state", "running");

  await page.waitForTimeout(450);
  const first = await hammerSignature(page);
  await page.waitForTimeout(850);
  const second = await hammerSignature(page);
  expect(first).not.toBe("");
  expect(second).not.toBe(first);

  const luma = await page.evaluate(() => {
    const source = document.querySelector<HTMLCanvasElement>("[data-lagoon-canvas]");
    const sample = document.createElement("canvas");
    sample.width = 32;
    sample.height = 32;
    const context = sample.getContext("2d");
    if (!source || !context) return 0;
    context.drawImage(source, 0, 0, 32, 32);
    const pixels = context.getImageData(0, 0, 32, 32).data;
    let total = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      total += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    }
    return total / (32 * 32);
  });
  expect(luma).toBeGreaterThan(40);

  for (const mode of PANELS) {
    await page.locator(`[data-mode-tab="${mode}"]`).click();
    await expect(page.locator(`[data-panel="${mode}"]`)).toBeVisible();
    await expect(root).toHaveAttribute("data-scene", "hammer");
    await expect(stage).toHaveAttribute("data-lagoon-scene", "hammer");
    await expectNoHorizontalOverflow(page);
  }

  await day.check();
  await expect(day).toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "day");
  await expect(stage).toHaveAttribute("data-lagoon-scene", "day");
});

test("Tang school is an eighth scene and keeps the school moving", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/lagoon-lab/", { waitUntil: "networkidle" });

  const root = page.locator("[data-lagoon-lab]");
  const stage = page.locator("[data-lagoon-stage]");
  const day = page.getByRole("radio", { name: "Day lagoon" });
  const night = page.getByRole("radio", { name: "Night reef" });
  const turtle = page.getByRole("radio", { name: "Turtle close-up" });
  const manta = page.getByRole("radio", { name: "Manta flyby" });
  const seahorse = page.getByRole("radio", { name: "Seahorse" });
  const dolphin = page.getByRole("radio", { name: "Dolphin pod" });
  const hammer = page.getByRole("radio", { name: "Hammerhead pass" });
  const tang = page.getByRole("radio", { name: "Tang school" });

  await expect(page.getByRole("radio")).toHaveCount(8);
  await expect
    .poll(() =>
      page.$$eval("[data-scene-input]", (inputs) =>
        inputs.map((input) => (input as HTMLInputElement).value),
      ),
    )
    .toEqual(["day", "night", "turtle", "manta", "seahorse", "dolphin", "hammer", "tang"]);
  await expect(day).toBeChecked();
  await expect(tang).not.toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "day");
  await expectNoHorizontalOverflow(page);

  await tang.check();
  await expect(tang).toBeChecked();
  await expect(day).not.toBeChecked();
  await expect(night).not.toBeChecked();
  await expect(turtle).not.toBeChecked();
  await expect(manta).not.toBeChecked();
  await expect(seahorse).not.toBeChecked();
  await expect(dolphin).not.toBeChecked();
  await expect(hammer).not.toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "tang");
  await expect(stage).toHaveAttribute("data-lagoon-scene", "tang");
  await expect(page.locator("[data-rail-scene]")).toHaveText("Tang school");
  await expect(stage).toHaveAttribute("data-lagoon-state", "running");

  await page.waitForTimeout(450);
  const first = await tangSignature(page);
  await page.waitForTimeout(850);
  const second = await tangSignature(page);
  expect(first).not.toBe("");
  expect(second).not.toBe(first);

  const luma = await page.evaluate(() => {
    const source = document.querySelector<HTMLCanvasElement>("[data-lagoon-canvas]");
    const sample = document.createElement("canvas");
    sample.width = 32;
    sample.height = 32;
    const context = sample.getContext("2d");
    if (!source || !context) return 0;
    context.drawImage(source, 0, 0, 32, 32);
    const pixels = context.getImageData(0, 0, 32, 32).data;
    let total = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      total += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    }
    return total / (32 * 32);
  });
  expect(luma).toBeGreaterThan(40);

  for (const mode of PANELS) {
    await page.locator(`[data-mode-tab="${mode}"]`).click();
    await expect(page.locator(`[data-panel="${mode}"]`)).toBeVisible();
    await expect(root).toHaveAttribute("data-scene", "tang");
    await expect(stage).toHaveAttribute("data-lagoon-scene", "tang");
    await expectNoHorizontalOverflow(page);
  }

  await day.check();
  await expect(day).toBeChecked();
  await expect(root).toHaveAttribute("data-scene", "day");
  await expect(stage).toHaveAttribute("data-lagoon-scene", "day");
});

test("search filters the local index, reports a count, and recovers from empty", async ({
  page,
}) => {
  await page.goto("/lagoon-lab/#search", { waitUntil: "networkidle" });

  const input = page.getByRole("searchbox", { name: "Search the lagoon index" });
  const count = page.locator("[data-search-count]");
  const items = page.locator("[data-search-item]:visible");
  const empty = page.locator("[data-search-empty]");

  await expect(input).toBeVisible();
  await expect(count).toHaveText(/^12 results$/i);
  await expect(items).toHaveCount(12);
  await expect(empty).toBeHidden();

  await page.locator("[data-search-form]").click({ position: { x: 16, y: 92 } });
  await expect(input).toBeFocused();

  await input.fill("koi");
  await expect(count).toHaveText(/^1 result$/i);
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText("Koi pond");

  await input.press("Enter");
  await expect(items.first().getByRole("link")).toBeFocused();

  await input.fill("zzz");
  await expect(count).toHaveText(/^0 results$/i);
  await expect(items).toHaveCount(0);
  await expect(page.locator("[data-search-results]")).toBeHidden();
  await expect(empty).toBeVisible();
  await expect(empty).toContainText("zzz");

  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(count).toHaveText(/^12 results$/i);
  await expect(empty).toBeHidden();
  await expect(page.locator("[data-search-results]")).toBeVisible();
  await expect(items).toHaveCount(12);

  await input.fill("scene koi");
  await expect(items).toHaveCount(1);
  await expect(count).toHaveText(/^1 result$/i);

  await input.press("Escape");
  await expect(input).toHaveValue("");
  await expect(items).toHaveCount(12);
});

test("chat sends with Enter, keeps Shift+Enter newlines, and refocuses", async ({ page }) => {
  await page.goto("/lagoon-lab/#chat", { waitUntil: "networkidle" });

  const input = page.getByRole("textbox", { name: "Message Honu" });
  const form = page.locator("[data-chat-form]");
  const reply = page.locator("[data-chat-reply]");

  await form.click({ position: { x: 22, y: 98 } });
  await expect(input).toBeFocused();

  await input.fill("hello");
  await input.press("Shift+Enter");
  await input.type("there");
  await expect(input).toHaveValue("hello\nthere");

  await input.press("Enter");
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(reply).toBeVisible();
  await expect(reply).toContainText("You said");
  await expect(reply).toContainText("hello");
  await expect(reply).toContainText("there");

  await input.fill("turtle");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(reply).toContainText("Honu surfaces");

  await input.fill("flower");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
  await expect(reply).toContainText("plumeria");
});

test("mobile lagoon modes stay usable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/lagoon-lab/", { waitUntil: "networkidle" });

  const stage = page.locator("[data-lagoon-stage]");
  const box = await stage.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width ?? 0).toBeLessThanOrEqual(390);

  for (const mode of PANELS) {
    await page.locator(`[data-mode-tab="${mode}"]`).click();
    await expect(page.locator(`[data-panel="${mode}"]`)).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expect(await stage.boundingBox()).not.toBeNull();
  }

  await page.locator('[data-mode-tab="search"]').click();
  await page.getByRole("searchbox", { name: "Search the lagoon index" }).fill("koi");
  await expect(page.locator("[data-search-item]:visible")).toHaveCount(1);
  await expectNoHorizontalOverflow(page);

  await page.locator('[data-mode-tab="chat"]').click();
  const input = page.getByRole("textbox", { name: "Message Honu" });
  await input.fill("mobile hello");
  await input.press("Enter");
  await expect(page.locator("[data-chat-reply]")).toContainText("mobile hello");
  await expectNoHorizontalOverflow(page);

  await page.getByRole("radio", { name: "Night reef" }).check();
  await expect(page.locator("[data-lagoon-stage]")).toHaveAttribute("data-lagoon-scene", "night");
  await expectNoHorizontalOverflow(page);

  await page.getByRole("radio", { name: "Turtle close-up" }).check();
  await expect(page.locator("[data-lagoon-stage]")).toHaveAttribute("data-lagoon-scene", "turtle");
  await expectNoHorizontalOverflow(page);

  await page.getByRole("radio", { name: "Manta flyby" }).check();
  await expect(page.locator("[data-lagoon-stage]")).toHaveAttribute("data-lagoon-scene", "manta");
  await expectNoHorizontalOverflow(page);

  await page.getByRole("radio", { name: "Seahorse" }).check();
  await expect(page.locator("[data-lagoon-stage]")).toHaveAttribute(
    "data-lagoon-scene",
    "seahorse",
  );
  await expectNoHorizontalOverflow(page);

  await page.getByRole("radio", { name: "Dolphin pod" }).check();
  await expect(page.locator("[data-lagoon-stage]")).toHaveAttribute("data-lagoon-scene", "dolphin");
  await expectNoHorizontalOverflow(page);

  await page.getByRole("radio", { name: "Hammerhead pass" }).check();
  await expect(page.locator("[data-lagoon-stage]")).toHaveAttribute("data-lagoon-scene", "hammer");
  await expectNoHorizontalOverflow(page);

  await page.getByRole("radio", { name: "Tang school" }).check();
  await expect(page.locator("[data-lagoon-stage]")).toHaveAttribute("data-lagoon-scene", "tang");
  await expectNoHorizontalOverflow(page);
  const mobileFits = await page.evaluate(
    () => document.documentElement.scrollHeight <= window.innerHeight + 1,
  );
  expect(mobileFits).toBe(true);

  for (const mode of PANELS) {
    await page.locator(`[data-mode-tab="${mode}"]`).click();
    await expect(page.locator(`[data-panel="${mode}"]`)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("renders a still lagoon and keeps the overlays available", async ({ page }) => {
    await page.goto("/lagoon-lab/", { waitUntil: "networkidle" });

    const stage = page.locator("[data-lagoon-stage]");
    await expect(stage).toHaveAttribute("data-lagoon-state", "static");

    await page.waitForTimeout(500);
    const frames = await stage.getAttribute("data-lagoon-frames");
    await page.waitForTimeout(600);
    await expect(stage).toHaveAttribute("data-lagoon-frames", frames ?? "");

    await page.getByRole("tab", { name: "Search" }).click();
    await expect(page.getByRole("searchbox", { name: "Search the lagoon index" })).toBeVisible();

    await page.getByRole("radio", { name: "Night reef" }).check();
    await expect(stage).toHaveAttribute("data-lagoon-scene", "night");
    await expect(stage).toHaveAttribute("data-lagoon-state", "static");

    await page.getByRole("radio", { name: "Turtle close-up" }).check();
    await expect(stage).toHaveAttribute("data-lagoon-scene", "turtle");
    await expect(stage).toHaveAttribute("data-lagoon-state", "static");
    const turtleStill = await turtleSignature(page);
    await page.waitForTimeout(500);
    const turtleFrames = await stage.getAttribute("data-lagoon-frames");
    await page.waitForTimeout(600);
    await expect(stage).toHaveAttribute("data-lagoon-frames", turtleFrames ?? "");
    expect(await turtleSignature(page)).toBe(turtleStill);

    await page.getByRole("radio", { name: "Manta flyby" }).check();
    await expect(stage).toHaveAttribute("data-lagoon-scene", "manta");
    await expect(stage).toHaveAttribute("data-lagoon-state", "static");
    const mantaStill = await mantaSignature(page);
    await page.waitForTimeout(500);
    const mantaFrames = await stage.getAttribute("data-lagoon-frames");
    await page.waitForTimeout(600);
    await expect(stage).toHaveAttribute("data-lagoon-frames", mantaFrames ?? "");
    expect(await mantaSignature(page)).toBe(mantaStill);

    await page.getByRole("radio", { name: "Seahorse" }).check();
    await expect(stage).toHaveAttribute("data-lagoon-scene", "seahorse");
    await expect(stage).toHaveAttribute("data-lagoon-state", "static");
    const seahorseStill = await seahorseSignature(page);
    await page.waitForTimeout(500);
    const seahorseFrames = await stage.getAttribute("data-lagoon-frames");
    await page.waitForTimeout(600);
    await expect(stage).toHaveAttribute("data-lagoon-frames", seahorseFrames ?? "");
    expect(await seahorseSignature(page)).toBe(seahorseStill);

    await page.getByRole("radio", { name: "Dolphin pod" }).check();
    await expect(stage).toHaveAttribute("data-lagoon-scene", "dolphin");
    await expect(stage).toHaveAttribute("data-lagoon-state", "static");
    const dolphinStill = await dolphinSignature(page);
    await page.waitForTimeout(500);
    const dolphinFrames = await stage.getAttribute("data-lagoon-frames");
    await page.waitForTimeout(600);
    await expect(stage).toHaveAttribute("data-lagoon-frames", dolphinFrames ?? "");
    expect(await dolphinSignature(page)).toBe(dolphinStill);

    await page.getByRole("radio", { name: "Hammerhead pass" }).check();
    await expect(stage).toHaveAttribute("data-lagoon-scene", "hammer");
    await expect(stage).toHaveAttribute("data-lagoon-state", "static");
    const hammerStill = await hammerSignature(page);
    await page.waitForTimeout(500);
    const hammerFrames = await stage.getAttribute("data-lagoon-frames");
    await page.waitForTimeout(600);
    await expect(stage).toHaveAttribute("data-lagoon-frames", hammerFrames ?? "");
    expect(await hammerSignature(page)).toBe(hammerStill);

    await page.getByRole("radio", { name: "Tang school" }).check();
    await expect(stage).toHaveAttribute("data-lagoon-scene", "tang");
    await expect(stage).toHaveAttribute("data-lagoon-state", "static");
    const tangStill = await tangSignature(page);
    await page.waitForTimeout(500);
    const tangFrames = await stage.getAttribute("data-lagoon-frames");
    await page.waitForTimeout(600);
    await expect(stage).toHaveAttribute("data-lagoon-frames", tangFrames ?? "");
    expect(await tangSignature(page)).toBe(tangStill);
  });
});
