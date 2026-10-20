import { SceneRuntime } from "../core/runtime";
import type { AsciiDogOptions } from "./options";
import { DogRenderer } from "./renderer";
import { DogWorld } from "./world";

export interface DogStats {
  fps: number;
  frameMs: number;
  cells: number;
  columns: number;
  rows: number;
  dogs: number;
  charging: number;
  state: string;
  ball: boolean;
}

/**
 * Wires the robot-dog World + DogRenderer to a canvas: fixed-timestep loop,
 * resize, pointer input, pausing off-screen, and prefers-reduced-motion.
 *
 * Prefer `createDog(canvas, options)` for the public API.
 */
export class DogEngine {
  private world: DogWorld;
  private renderer: DogRenderer;
  private runtime: SceneRuntime<DogWorld, DogRenderer>;
  private options: AsciiDogOptions;

  constructor(canvas: HTMLCanvasElement, options: AsciiDogOptions = {}) {
    this.options = options;
    this.world = new DogWorld({
      dogs: options.dogs,
      count: options.count,
      seed: options.seed,
      scale: options.scale,
      spread: options.spread,
    });
    this.renderer = new DogRenderer(canvas, {
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
      paused: options.paused,
      fontFamily: options.fontFamily,
      onPointerDown: (x, y) => this.world.throwBall(x, y),
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

  /** Throw the ball from a UI control, in canvas-local pixels. */
  throwBall(x: number, y: number) {
    if (this.runtime.prefersReducedMotion) return;
    this.world.throwBall(x, y);
    this.runtime.flushEvents();
    this.runtime.renderIfIdle();
  }

  /** Live-update palette, speed, dogs, quality, and label. */
  setOptions(partial: AsciiDogOptions) {
    this.options = { ...this.options, ...partial };

    if (partial.speed !== undefined) this.runtime.setSpeed(partial.speed);
    if (partial.interactive !== undefined) this.runtime.setInteractive(partial.interactive);
    if (partial.maxDpr !== undefined) this.runtime.setMaxDpr(partial.maxDpr);
    if (partial.label !== undefined) this.runtime.setLabel(partial.label);
    if (partial.paused !== undefined) this.runtime.setPaused(partial.paused);
    if (partial.fontFamily !== undefined) this.runtime.setFontFamily(partial.fontFamily);

    this.renderer.setOptions({
      palette: partial.palette,
      calm: partial.calm,
      columns: partial.columns,
      maxCells: partial.maxCells,
    });

    const structural =
      partial.dogs !== undefined ||
      partial.count !== undefined ||
      partial.seed !== undefined ||
      partial.scale !== undefined ||
      partial.spread !== undefined;
    if (structural) {
      this.world.setOptions({
        dogs: partial.dogs,
        count: partial.count,
        seed: partial.seed,
        scale: partial.scale,
        spread: partial.spread,
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

  getStats(): DogStats {
    return {
      ...this.runtime.baseStats(),
      dogs: this.world.dogs.length,
      charging: this.world.dogs.filter((d) => d.state === "charge").length,
      state: this.world.dogs[0]?.state ?? "walk",
      ball: this.world.ball.active,
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

/** Create a living ASCII robot dog on a canvas. */
export function createDog(canvas: HTMLCanvasElement, options: AsciiDogOptions = {}) {
  return new DogEngine(canvas, options);
}
