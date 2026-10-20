import type { SceneAction } from "./core/scene";
import { SceneRuntime } from "./core/runtime";
import type { AsciiSharksOptions } from "./options";
import { AsciiRenderer, type RendererOptions } from "./renderer";
import { World, type SharkSpec } from "./world";

export interface OceanStats {
  fps: number;
  frameMs: number;
  cells: number;
  columns: number;
  rows: number;
  fish: number;
  sharks: number;
}

/**
 * Wires the shark World + AsciiRenderer to a canvas: fixed-timestep loop,
 * resize, pointer input, pausing off-screen, and prefers-reduced-motion.
 *
 * Prefer `createSharks(canvas, options)` for the public API.
 */
export class OceanEngine {
  private world: World;
  private renderer: AsciiRenderer;
  private runtime: SceneRuntime<World, AsciiRenderer>;
  private options: AsciiSharksOptions;

  constructor(canvas: HTMLCanvasElement, options: AsciiSharksOptions | SharkSpec[] = {}) {
    // Back-compat: the original demo passed a shark roster directly.
    const opts: AsciiSharksOptions = Array.isArray(options) ? { sharks: options } : options;
    this.options = opts;
    this.world = new World({
      sharks: opts.sharks,
      seed: opts.seed,
      density: opts.density,
      sharkScale: opts.sharkScale,
    });
    this.renderer = new AsciiRenderer(canvas, {
      palette: opts.palette,
      columns: opts.columns,
      maxCells: opts.maxCells,
      calm: opts.calm,
      onEvent: opts.onEvent,
    });
    this.runtime = new SceneRuntime({
      canvas,
      world: this.world,
      renderer: this.renderer,
      speed: opts.speed,
      interactive: opts.interactive,
      maxDpr: opts.maxDpr,
      adaptiveQuality: opts.adaptiveQuality,
      label: opts.label,
      paused: opts.paused,
      fontFamily: opts.fontFamily,
      timing: "scaled",
      onPointerDown: (x, y) => this.world.splash(x, y),
    });
  }

  /** Stop the clock without tearing down the scene (modals, route transitions). */
  pause() {
    this.runtime.pause();
  }

  /** Resume after pause(). */
  resume() {
    this.runtime.resume();
  }

  /** Splash the water from a UI control, in canvas-local pixels. */
  splash(x: number, y: number) {
    if (this.runtime.prefersReducedMotion) return;
    this.world.splash(x, y);
    this.runtime.flushEvents();
    this.runtime.renderIfIdle();
  }

  /** Trigger the scene's signature action. */
  trigger(action: SceneAction, x: number, y: number) {
    if (action === "splash") this.splash(x, y);
  }

  /** Live-update palette, speed, density, roster, quality, and label. */
  setOptions(partial: AsciiSharksOptions) {
    this.options = { ...this.options, ...partial };

    if (partial.speed !== undefined) this.runtime.setSpeed(partial.speed);
    if (partial.interactive !== undefined) this.runtime.setInteractive(partial.interactive);
    if (partial.maxDpr !== undefined) this.runtime.setMaxDpr(partial.maxDpr);
    if (partial.adaptiveQuality !== undefined)
      this.runtime.setAdaptiveQuality(partial.adaptiveQuality);
    if (partial.label !== undefined) this.runtime.setLabel(partial.label);
    if (partial.paused !== undefined) this.runtime.setPaused(partial.paused);
    if (partial.fontFamily !== undefined) this.runtime.setFontFamily(partial.fontFamily);

    const rendererUpdate: RendererOptions = {};
    if (partial.palette !== undefined) rendererUpdate.palette = partial.palette;
    if (partial.calm !== undefined) rendererUpdate.calm = partial.calm;
    if (partial.onEvent !== undefined) rendererUpdate.onEvent = partial.onEvent;
    if (Object.keys(rendererUpdate).length) this.renderer.setOptions(rendererUpdate);

    const structural =
      partial.sharks !== undefined ||
      partial.seed !== undefined ||
      partial.density !== undefined ||
      partial.sharkScale !== undefined;
    if (structural) {
      this.world.setOptions({
        sharks: partial.sharks,
        seed: partial.seed,
        density: partial.density,
        sharkScale: partial.sharkScale,
      });
    }

    if (structural || partial.columns !== undefined || partial.maxCells !== undefined)
      this.runtime.resize();
    if (partial.speed !== undefined) this.runtime.schedule();
  }

  /** Force a size/DPR read; ResizeObserver normally does this for you. */
  resize() {
    this.runtime.resize();
  }

  getStats(): OceanStats {
    return {
      ...this.runtime.baseStats(),
      fish: this.world.fish.length,
      sharks: this.world.sharks.length,
    };
  }

  destroy() {
    this.runtime.destroy();
  }
}

/** Create a living ASCII shark scene on a canvas. */
export function createSharks(canvas: HTMLCanvasElement, options: AsciiSharksOptions = {}) {
  return new OceanEngine(canvas, options);
}

export type { SharkSpec };
