import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FIXED_STEP, type RuntimeRenderer, type RuntimeWorld, SceneRuntime } from "./runtime";

class TestWorld implements RuntimeWorld {
  time = 0;
  events: unknown[] = [];
  pointer = { x: 0, y: 0, active: false };
  steps: number[] = [];
  resizes: Array<[number, number, number, number]> = [];

  step(dt: number) {
    this.time += dt;
    this.steps.push(dt);
  }

  resize(width: number, height: number, cellWidth: number, cellHeight: number) {
    this.resizes.push([width, height, cellWidth, cellHeight]);
  }
}

class TestRenderer implements RuntimeRenderer<TestWorld> {
  cellWidth = 10;
  cellHeight = 15;
  cellCount = 0;
  columnCount = 0;
  rowCount = 0;
  fontFamilies: string[] = [];
  resizes: Array<[number, number, number]> = [];
  renders: Array<{ world: TestWorld; dt: number }> = [];

  resize(width: number, height: number, dpr: number) {
    this.resizes.push([width, height, dpr]);
    this.columnCount = Math.ceil(width / this.cellWidth);
    this.rowCount = Math.ceil(height / this.cellHeight);
    this.cellCount = this.columnCount * this.rowCount;
  }

  render(world: TestWorld, dt: number) {
    this.renders.push({ world, dt });
  }

  setFontFamily(family: string) {
    this.fontFamilies.push(family);
  }
}

function makeCanvas(width = 800, height = 450) {
  const attrs = new Map<string, string>();
  const listeners = new Map<string, Set<(event: unknown) => void>>();
  return {
    attrs,
    listeners,
    width: 0,
    height: 0,
    addEventListener: (type: string, listener: (event: unknown) => void) =>
      addListener(listeners, type, listener),
    removeEventListener: (type: string, listener: (event: unknown) => void) =>
      removeListener(listeners, type, listener),
    dispatch: (type: string, event: unknown) => dispatch(listeners, type, event),
    getBoundingClientRect: () =>
      ({
        width,
        height,
        left: 10,
        top: 20,
        right: width + 10,
        bottom: height + 20,
        x: 10,
        y: 20,
        toJSON: () => ({}),
      }) as DOMRect,
    setAttribute: (name: string, value: string) => {
      attrs.set(name, value);
    },
    removeAttribute: (name: string) => {
      attrs.delete(name);
    },
  };
}

let reduced = false;
let mediaChange: (() => void) | undefined;
let now = 0;
let nextFrameId = 1;
let frames: Map<number, FrameRequestCallback>;
let windowListeners: Map<string, Set<(event: unknown) => void>>;
let documentListeners: Map<string, Set<(event: unknown) => void>>;
let resizeObservers: FakeResizeObserver[];
let intersectionObservers: FakeIntersectionObserver[];

class FakeResizeObserver {
  disconnected = false;
  constructor(public callback: ResizeObserverCallback) {
    resizeObservers.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
}

class FakeIntersectionObserver {
  disconnected = false;
  constructor(public callback: IntersectionObserverCallback) {
    intersectionObservers.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

function addListener(
  map: Map<string, Set<(event: unknown) => void>>,
  type: string,
  listener: (event: unknown) => void,
) {
  let listeners = map.get(type);
  if (!listeners) {
    listeners = new Set();
    map.set(type, listeners);
  }
  listeners.add(listener);
}

function removeListener(
  map: Map<string, Set<(event: unknown) => void>>,
  type: string,
  listener: (event: unknown) => void,
) {
  map.get(type)?.delete(listener);
}

function dispatch(map: Map<string, Set<(event: unknown) => void>>, type: string, event: unknown) {
  for (const listener of map.get(type) ?? []) listener(event);
}

function dispatchWindow(type: string, event: unknown) {
  dispatch(windowListeners, type, event);
}

function runFrame(time: number) {
  now = time;
  const entry = [...frames.entries()].at(-1);
  if (!entry) throw new Error("no frame scheduled");
  frames.delete(entry[0]);
  entry[1](time);
}

function makeRuntime(
  options: {
    timing?: "fixed" | "scaled";
    speed?: number;
    interactive?: boolean;
    maxDpr?: number;
    label?: string;
    fallback?: string;
    onPointerDown?: (x: number, y: number) => void;
    flushEvents?: () => void;
  } = {},
) {
  const canvas = makeCanvas();
  const world = new TestWorld();
  const renderer = new TestRenderer();
  const runtime = new SceneRuntime<TestWorld, TestRenderer>({
    canvas: canvas as unknown as HTMLCanvasElement,
    world,
    renderer,
    ...options,
  });
  return { canvas, world, renderer, runtime };
}

beforeEach(() => {
  reduced = false;
  mediaChange = undefined;
  now = 0;
  nextFrameId = 1;
  frames = new Map();
  windowListeners = new Map();
  documentListeners = new Map();
  resizeObservers = [];
  intersectionObservers = [];

  const fakeWindow = {
    devicePixelRatio: 3,
    matchMedia: () => ({
      get matches() {
        return reduced;
      },
      addEventListener: (type: string, listener: () => void) => {
        if (type === "change") mediaChange = listener;
      },
      removeEventListener: (type: string, listener: () => void) => {
        if (type === "change" && mediaChange === listener) mediaChange = undefined;
      },
    }),
    addEventListener: (type: string, listener: (event: unknown) => void) =>
      addListener(windowListeners, type, listener),
    removeEventListener: (type: string, listener: (event: unknown) => void) =>
      removeListener(windowListeners, type, listener),
  };

  const fakeDocument = {
    visibilityState: "visible" as DocumentVisibilityState,
    fonts: { load: () => new Promise(() => {}) },
    addEventListener: (type: string, listener: (event: unknown) => void) =>
      addListener(documentListeners, type, listener),
    removeEventListener: (type: string, listener: (event: unknown) => void) =>
      removeListener(documentListeners, type, listener),
    documentElement: {
      addEventListener: (type: string, listener: (event: unknown) => void) =>
        addListener(documentListeners, type, listener),
      removeEventListener: (type: string, listener: (event: unknown) => void) =>
        removeListener(documentListeners, type, listener),
    },
  };

  vi.stubGlobal("window", fakeWindow);
  vi.stubGlobal("document", fakeDocument);
  vi.stubGlobal("getComputedStyle", () => ({ fontFamily: "monospace" }));
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frames.delete(id);
  });
  vi.spyOn(performance, "now").mockImplementation(() => now);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("SceneRuntime", () => {
  it("sizes the renderer and world with the DPR cap, and starts the loop", () => {
    const { canvas, world, renderer } = makeRuntime({ maxDpr: 2 });
    expect(renderer.resizes).toEqual([[800, 450, 2]]);
    expect(world.resizes).toEqual([[800, 450, 10, 15]]);
    expect(renderer.fontFamilies).toEqual(["monospace"]);
    expect(canvas.attrs.get("aria-hidden")).toBe("true");
    expect(frames.size).toBe(1);
  });

  it("uses fixed world steps and wall-clock render dt in fixed mode", () => {
    const { world, renderer } = makeRuntime({ speed: 1 });
    runFrame(20);
    expect(world.steps).toEqual([FIXED_STEP]);
    expect(renderer.renders.at(-1)?.dt).toBeCloseTo(0.02, 6);
  });

  it("scales the world step and render dt in scaled mode", () => {
    const { world, renderer } = makeRuntime({ speed: 0.5, timing: "scaled" });
    runFrame(40);
    expect(world.steps).toEqual([FIXED_STEP * 0.5]);
    expect(renderer.renders.at(-1)?.dt).toBeCloseTo(0.02, 6);
  });

  it("pauses, clears events, and resumes the clock", () => {
    const { world, runtime } = makeRuntime();
    world.events.push({ kind: "test" });
    runtime.pause();
    expect(frames.size).toBe(0);
    expect(world.events).toHaveLength(0);

    now = 500;
    runtime.resume();
    expect(frames.size).toBe(1);
  });

  it("settles and renders one still frame for reduced motion", () => {
    reduced = true;
    const { world, renderer, runtime } = makeRuntime({ speed: 0.1, timing: "scaled" });
    expect(runtime.prefersReducedMotion).toBe(true);
    expect(frames.size).toBe(0);
    expect(world.steps).toHaveLength(960);
    expect(world.steps[0]).toBeCloseTo(FIXED_STEP * 0.1, 8);
    expect(world.time).toBeCloseTo(1.6, 6);
    expect(renderer.renders.at(-1)?.dt).toBeCloseTo(FIXED_STEP * 0.25, 8);
  });

  it("stops scheduling while off-screen and resumes when visible", () => {
    makeRuntime();
    const observer = intersectionObservers[0];
    observer.trigger(false);
    expect(frames.size).toBe(0);
    observer.trigger(true);
    expect(frames.size).toBe(1);
  });

  it("stops scheduling in a hidden document and resumes when visible", () => {
    const { world } = makeRuntime();
    world.events.push({ kind: "test" });

    const doc = document as unknown as { visibilityState: DocumentVisibilityState };
    doc.visibilityState = "hidden";
    dispatch(documentListeners, "visibilitychange", {});
    expect(frames.size).toBe(0);
    expect(world.events).toHaveLength(0);

    doc.visibilityState = "visible";
    dispatch(documentListeners, "visibilitychange", {});
    expect(frames.size).toBe(1);
  });

  it("tracks pointer position and dispatches inside presses only", () => {
    const presses: Array<[number, number]> = [];
    const { world, runtime } = makeRuntime({
      onPointerDown: (x, y) => presses.push([x, y]),
    });

    dispatchWindow("pointermove", { clientX: 110, clientY: 70, pointerType: "mouse" });
    expect(world.pointer).toEqual({ x: 100, y: 50, active: true });

    dispatchWindow("pointermove", { clientX: 110, clientY: 70, pointerType: "touch" });
    expect(world.pointer.active).toBe(false);

    dispatchWindow("pointerdown", { clientX: 110, clientY: 70, pointerType: "mouse" });
    expect(presses).toEqual([[100, 50]]);

    dispatchWindow("pointerdown", { clientX: 0, clientY: 0, pointerType: "mouse" });
    expect(presses).toHaveLength(1);

    reduced = true;
    dispatchWindow("pointerdown", { clientX: 110, clientY: 70, pointerType: "mouse" });
    expect(presses).toHaveLength(1);

    reduced = false;
    runtime.setInteractive(false);
    dispatchWindow("pointerdown", { clientX: 110, clientY: 70, pointerType: "mouse" });
    expect(presses).toHaveLength(1);
  });

  it("drives a virtual pointer and primary action from the keyboard", () => {
    const presses: Array<[number, number]> = [];
    const { canvas, world, runtime } = makeRuntime({
      label: "A keyboard-controlled scene",
      onPointerDown: (x, y) => presses.push([x, y]),
    });
    const key = (value: string) =>
      ({
        key: value,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        preventDefault: vi.fn(),
      }) as unknown as KeyboardEvent;

    expect(canvas.attrs.get("tabindex")).toBe("0");
    expect(canvas.attrs.get("aria-keyshortcuts")).toContain("ArrowRight");

    canvas.dispatch("keydown", key("ArrowRight"));
    expect(world.pointer).toEqual({ x: 440, y: 225, active: true });

    canvas.dispatch("keydown", key("ArrowUp"));
    expect(world.pointer).toEqual({ x: 440, y: 202.5, active: true });

    const press = key(" ");
    canvas.dispatch("keydown", press);
    expect(presses).toEqual([[440, 202.5]]);
    expect(press.preventDefault).toHaveBeenCalled();

    reduced = true;
    const blocked = key("ArrowLeft");
    canvas.dispatch("keydown", blocked);
    expect(world.pointer.x).toBe(440);
    expect(blocked.preventDefault).not.toHaveBeenCalled();

    reduced = false;
    runtime.setInteractive(false);
    expect(canvas.attrs.has("tabindex")).toBe(false);
    expect(canvas.listeners.get("keydown")?.size ?? 0).toBe(0);
  });

  it("updates the accessibility label in both directions", () => {
    const { canvas, runtime } = makeRuntime();
    runtime.setLabel("A live scene");
    expect(canvas.attrs.get("role")).toBe("img");
    expect(canvas.attrs.get("aria-label")).toBe("A live scene");
    expect(canvas.attrs.has("aria-hidden")).toBe(false);

    runtime.setLabel(undefined);
    expect(canvas.attrs.get("aria-hidden")).toBe("true");
    expect(canvas.attrs.has("role")).toBe(false);
  });

  it("exposes a static fallback as a description without replacing a label", () => {
    const { canvas, runtime } = makeRuntime({ label: "A live scene" });
    runtime.setFallback("A calm reef with three fish and a passing turtle.");
    expect(canvas.attrs.get("aria-label")).toBe("A live scene");
    expect(canvas.attrs.get("aria-description")).toBe(
      "A calm reef with three fish and a passing turtle.",
    );
    expect(canvas.attrs.get("data-ascii-fallback")).toBe(
      "A calm reef with three fish and a passing turtle.",
    );

    runtime.setFallback(undefined);
    expect(canvas.attrs.has("aria-description")).toBe(false);
    expect(canvas.attrs.has("data-ascii-fallback")).toBe(false);
    expect(canvas.attrs.get("aria-label")).toBe("A live scene");
  });

  it("uses a fallback as the accessible name when no label is set", () => {
    const { canvas, runtime } = makeRuntime({ fallback: "A still ASCII reef." });
    expect(canvas.attrs.get("role")).toBe("img");
    expect(canvas.attrs.get("aria-label")).toBe("A still ASCII reef.");
    expect(canvas.attrs.get("aria-description")).toBe("A still ASCII reef.");
    expect(canvas.attrs.has("aria-hidden")).toBe(false);

    runtime.setFallback(undefined);
    expect(canvas.attrs.get("aria-hidden")).toBe("true");
    expect(canvas.attrs.has("role")).toBe(false);
    expect(canvas.attrs.has("aria-label")).toBe(false);
  });

  it("flushes events before rendering and reports base stats", () => {
    const order: string[] = [];
    const world = new TestWorld();
    const renderer = new TestRenderer();
    const runtime = new SceneRuntime<TestWorld, TestRenderer>({
      canvas: makeCanvas() as unknown as HTMLCanvasElement,
      world,
      renderer,
      flushEvents: () => {
        order.push("flush");
        world.events.length = 0;
      },
    });
    renderer.render = () => {
      order.push("render");
    };
    world.events.push({ kind: "test" });
    runFrame(34);
    expect(order).toEqual(["flush", "render"]);
    const stats = runtime.baseStats();
    expect(stats.cells).toBe(renderer.cellCount);
    expect(stats.columns).toBe(renderer.columnCount);
    expect(stats.rows).toBe(renderer.rowCount);
    expect(stats.fps).toBeCloseTo(1000 / Math.max(1, stats.frameMs), 8);
  });

  it("tears down observers, listeners, and queued events", () => {
    const { canvas, world, runtime } = makeRuntime();
    world.events.push({ kind: "test" });
    runtime.destroy();
    expect(resizeObservers[0].disconnected).toBe(true);
    expect(intersectionObservers[0].disconnected).toBe(true);
    expect(frames.size).toBe(0);
    expect(world.events).toHaveLength(0);
    expect(documentListeners.get("visibilitychange")?.size ?? 0).toBe(0);
    expect(canvas.listeners.get("keydown")?.size ?? 0).toBe(0);
    expect(canvas.attrs.has("tabindex")).toBe(false);
    expect(canvas.attrs.has("aria-keyshortcuts")).toBe(false);

    dispatchWindow("pointermove", { clientX: 110, clientY: 70, pointerType: "mouse" });
    expect(world.pointer.active).toBe(false);
  });
});
