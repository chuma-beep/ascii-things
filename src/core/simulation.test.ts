import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSimulation } from "./simulation";
import type { SceneStats } from "./scene";
import type { RuntimeRenderer, RuntimeWorld } from "./runtime";

type CellularAction = "explode" | "reset";

class TestWorld implements RuntimeWorld {
  steps = 0;
  resizes: Array<[number, number, number, number]> = [];

  step() {
    this.steps++;
  }

  resize(width: number, height: number, cellWidth: number, cellHeight: number) {
    this.resizes.push([width, height, cellWidth, cellHeight]);
  }
}

class TestRenderer implements RuntimeRenderer<TestWorld> {
  cellWidth = 8;
  cellHeight = 12;
  cellCount = 0;
  columnCount = 0;
  rowCount = 0;
  resizes: Array<[number, number, number]> = [];
  renders = 0;

  resize(width: number, height: number, dpr: number) {
    this.resizes.push([width, height, dpr]);
    this.columnCount = Math.ceil(width / this.cellWidth);
    this.rowCount = Math.ceil(height / this.cellHeight);
    this.cellCount = this.columnCount * this.rowCount;
  }

  render() {
    this.renders++;
  }

  setFontFamily() {}
}

function makeCanvas() {
  const attrs = new Map<string, string>();
  return {
    width: 0,
    height: 0,
    getBoundingClientRect: () =>
      ({
        width: 640,
        height: 360,
        left: 0,
        top: 0,
        right: 640,
        bottom: 360,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect,
    setAttribute: (name: string, value: string) => attrs.set(name, value),
    removeAttribute: (name: string) => attrs.delete(name),
  } as unknown as HTMLCanvasElement;
}

beforeEach(() => {
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
    fonts: { load: () => Promise.resolve() },
    documentElement: { addEventListener: () => {}, removeEventListener: () => {} },
  });
  vi.stubGlobal("getComputedStyle", () => ({ fontFamily: "monospace" }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("requestAnimationFrame", () => 1);
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createSimulation", () => {
  it("runs a custom world without events, pointer, or time", () => {
    const world = new TestWorld();
    const renderer = new TestRenderer();
    const simulation = createSimulation<TestWorld, TestRenderer>({
      canvas: makeCanvas(),
      world,
      renderer,
      label: "Custom simulation",
    });

    expect(world.resizes).toEqual([[640, 360, 8, 12]]);
    expect(renderer.resizes[0]).toEqual([640, 360, 2]);
    expect(simulation.world).toBe(world);
    expect(simulation.renderer).toBe(renderer);
    expect(simulation.getStats()).toMatchObject({ columns: 80, rows: 30 });
    expect(simulation.canvas).toBeInstanceOf(Object);
  });

  it("keeps custom action types and lifecycle idempotent", () => {
    const world = new TestWorld();
    const renderer = new TestRenderer();
    const actions: CellularAction[] = [];
    const simulation = createSimulation<TestWorld, TestRenderer, SceneStats, CellularAction>({
      canvas: makeCanvas(),
      world,
      renderer,
      onAction: (action) => actions.push(action),
    });

    simulation.trigger("explode", 10, 20);
    simulation.trigger("reset", 0, 0);
    expect(actions).toEqual(["explode", "reset"]);

    simulation.pause();
    simulation.resume();
    simulation.destroy();
    simulation.destroy();
    expect(world.steps).toBe(0);
  });

  it("resizes when maxDpr changes", () => {
    const renderer = new TestRenderer();
    const simulation = createSimulation<TestWorld, TestRenderer>({
      canvas: makeCanvas(),
      world: new TestWorld(),
      renderer,
    });
    const before = renderer.resizes.length;
    simulation.setOptions({ maxDpr: 1 });
    expect(renderer.resizes.length).toBeGreaterThan(before);
  });
});
