import { SceneRuntime } from "../core/runtime";
import type { AsciiJellyfishOptions } from "./options";
import { JellyfishRenderer } from "./renderer";
import { JellyfishWorld } from "./world";

export interface JellyfishStats {
  fps: number;
  frameMs: number;
  cells: number;
  columns: number;
  rows: number;
  jellies: number;
  pulsing: number;
  plankton: number;
  rings: number;
}

/**
 * Wires the jellyfish World + JellyfishRenderer to a canvas: fixed-timestep
 * loop, resize, pointer input, off-screen pausing, and reduced motion.
 *
 * Prefer `createJellyfish(canvas, options)` for the public API.
 */
export class JellyfishEngine {
  private world: JellyfishWorld;
  private renderer: JellyfishRenderer;
  private runtime: SceneRuntime<JellyfishWorld, JellyfishRenderer>;
  private options: AsciiJellyfishOptions;

  constructor(canvas: HTMLCanvasElement, options: AsciiJellyfishOptions = {}) {
    this.options = options;
    this.world = new JellyfishWorld({
      jellies: options.jellies,
      count: options.count,
      seed: options.seed,
      scale: options.scale,
    });
    this.renderer = new JellyfishRenderer(canvas, {
      palette: options.palette,
      columns: options.columns,
      maxCells: options.maxCells,
      calm: options.calm,
    });
    this.runtime = new SceneRuntime({
      canvas,
      world: this.world,
      renderer: this.renderer,
      speed: options.speed,
      interactive: options.interactive,
      maxDpr: options.maxDpr,
      label: options.label,
      onPointerDown: (x, y) => this.world.shockwave(x, y),
      flushEvents: () => this.flushEvents(),
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

  /** Live-update palette, speed, bloom, quality, and label. */
  setOptions(partial: AsciiJellyfishOptions) {
    this.options = { ...this.options, ...partial };

    if (partial.speed !== undefined) this.runtime.setSpeed(partial.speed);
    if (partial.interactive !== undefined) this.runtime.setInteractive(partial.interactive);
    if (partial.maxDpr !== undefined) this.runtime.setMaxDpr(partial.maxDpr);
    if (partial.label !== undefined) this.runtime.setLabel(partial.label);

    this.renderer.setOptions({
      palette: partial.palette,
      calm: partial.calm,
      columns: partial.columns,
      maxCells: partial.maxCells,
    });

    const structural =
      partial.jellies !== undefined ||
      partial.count !== undefined ||
      partial.seed !== undefined ||
      partial.scale !== undefined;
    if (structural) {
      this.world.setOptions({
        jellies: partial.jellies,
        count: partial.count,
        seed: partial.seed,
        scale: partial.scale,
      });
    }

    if (structural || partial.columns !== undefined || partial.maxCells !== undefined)
      this.runtime.resize();
    if (partial.speed !== undefined) this.runtime.schedule();
    this.runtime.renderIfIdle();
  }

  /** Force a size/DPR read; ResizeObserver normally does this for you. */
  resize() {
    this.runtime.resize();
  }

  getStats(): JellyfishStats {
    return {
      ...this.runtime.baseStats(),
      jellies: this.world.jellies.length,
      pulsing: this.world.jellies.filter((j) => j.contract > 0.2).length,
      plankton: this.world.plankton.length,
      rings: this.world.rings.length,
    };
  }

  destroy() {
    this.runtime.destroy();
  }

  private flushEvents() {
    const onEvent = this.options.onEvent;
    if (onEvent) for (const event of this.world.events) onEvent(event);
    this.world.events.length = 0;
  }
}

/** Create a living ASCII jellyfish bloom on a canvas. */
export function createJellyfish(canvas: HTMLCanvasElement, options: AsciiJellyfishOptions = {}) {
  return new JellyfishEngine(canvas, options);
}
