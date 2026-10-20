import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDog, DogEngine } from "./dog";
import { createJellyfish, JellyfishEngine } from "./jellyfish";
import { PALETTES, resolvePalette } from "./palette";
import { createRobots, RobotEngine } from "./robots";
import { OceanEngine } from "./sharks";

function makeContext() {
  const gradient = { addColorStop: () => {} };
  return {
    setTransform: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    ellipse: () => {},
    arc: () => {},
    rect: () => {},
    clip: () => {},
    save: () => {},
    restore: () => {},
    setLineDash: () => {},
    createLinearGradient: () => gradient,
    fillText: () => {},
    measureText: () => ({ width: 0 }),
    drawImage: () => {},
    globalAlpha: 1,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "center",
    textBaseline: "middle",
  };
}

function makeCanvas() {
  const context = makeContext();
  return {
    width: 0,
    height: 0,
    getContext: () => context,
    getBoundingClientRect: () =>
      ({
        width: 800,
        height: 450,
        left: 0,
        top: 0,
        right: 800,
        bottom: 450,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect,
    setAttribute: () => {},
    removeAttribute: () => {},
  };
}

let observers: Array<{ disconnect: () => void; disconnected: boolean }>;

class FakeObserver {
  disconnected = false;
  constructor(_callback: unknown) {
    observers.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
}

beforeEach(() => {
  observers = [];
  vi.stubGlobal("window", {
    devicePixelRatio: 2,
    matchMedia: () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  vi.stubGlobal("document", {
    fonts: { load: () => new Promise(() => {}) },
    documentElement: { addEventListener: () => {}, removeEventListener: () => {} },
    createElement: () => makeCanvas(),
  });
  vi.stubGlobal("getComputedStyle", () => ({ fontFamily: "monospace" }));
  vi.stubGlobal("ResizeObserver", FakeObserver);
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  vi.stubGlobal("requestAnimationFrame", () => 1);
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("engine migration", () => {
  it("constructs every engine on the shared runtime and reports base stats", () => {
    const cases = [
      {
        engine: new OceanEngine(makeCanvas() as unknown as HTMLCanvasElement, { seed: 3 }),
        scene: "sharks",
        action: "splash" as const,
      },
      {
        engine: new RobotEngine(makeCanvas() as unknown as HTMLCanvasElement, { seed: 3 }),
        scene: "robots",
        action: "dispatch" as const,
      },
      {
        engine: new JellyfishEngine(makeCanvas() as unknown as HTMLCanvasElement, { seed: 3 }),
        scene: "jellyfish",
        action: "shockwave" as const,
      },
      {
        engine: new DogEngine(makeCanvas() as unknown as HTMLCanvasElement, { seed: 3 }),
        scene: "dog",
        action: "throwBall" as const,
      },
    ];

    for (const { engine, scene, action } of cases) {
      const stats = engine.getStats();
      expect(stats.cells, scene).toBeGreaterThan(0);
      expect(stats.columns, scene).toBeGreaterThan(0);
      expect(stats.rows, scene).toBeGreaterThan(0);
      expect(stats.frameMs, scene).toBeGreaterThan(0);
      engine.setOptions({
        columns: 80,
        palette: "paper",
        calm: true,
        paused: true,
        fontFamily: "monospace",
        adaptiveQuality: false,
      });
      expect(engine.getStats().cells, scene).toBeGreaterThan(0);
      engine.trigger(action, 120, 90);
      engine.pause();
      engine.resume();
      engine.setOptions({ paused: false });
      engine.destroy();
    }

    expect(observers).toHaveLength(8);
    expect(observers.every((observer) => observer.disconnected)).toBe(true);
  });

  it("resolves auto palettes from the host colour scheme", () => {
    expect(resolvePalette("auto")).toBe(PALETTES.abyss);
    expect(resolvePalette("paper")).toBe(PALETTES.paper);
  });

  it("keeps the public create functions and shark roster back-compat", () => {
    const sharks = new OceanEngine(makeCanvas() as unknown as HTMLCanvasElement, [
      { kind: "classic", size: 1 },
    ]);
    expect(sharks).toBeInstanceOf(OceanEngine);
    expect(sharks.getStats().sharks).toBe(1);
    sharks.destroy();

    const robots = createRobots(makeCanvas() as unknown as HTMLCanvasElement, { seed: 1 });
    const jellyfish = createJellyfish(makeCanvas() as unknown as HTMLCanvasElement, { seed: 1 });
    const dog = createDog(makeCanvas() as unknown as HTMLCanvasElement, { seed: 1 });
    expect(robots).toBeInstanceOf(RobotEngine);
    expect(jellyfish).toBeInstanceOf(JellyfishEngine);
    expect(dog).toBeInstanceOf(DogEngine);
    robots.destroy();
    jellyfish.destroy();
    dog.destroy();
  });
});
