import type { SceneAction } from "../core/scene";
import { SceneRuntime } from "../core/runtime";
import type { AsciiRobotsOptions } from "./options";
import { RobotRenderer } from "./renderer";
import { RobotWorld, type Robot } from "./world";

export interface RobotStats {
  fps: number;
  frameMs: number;
  cells: number;
  columns: number;
  rows: number;
  robots: number;
  charging: number;
  docks: number;
}

/**
 * Wires the robot World + RobotRenderer to a canvas: fixed-timestep loop,
 * resize, pointer input, pausing off-screen, and prefers-reduced-motion.
 *
 * Prefer `createRobots(canvas, options)` for the public API.
 */
export class RobotEngine {
  private world: RobotWorld;
  private renderer: RobotRenderer;
  private runtime: SceneRuntime<RobotWorld, RobotRenderer>;
  private options: AsciiRobotsOptions;

  constructor(canvas: HTMLCanvasElement, options: AsciiRobotsOptions = {}) {
    this.options = options;
    this.world = new RobotWorld({
      robots: options.robots,
      count: options.count,
      seed: options.seed,
      scale: options.scale,
    });
    this.renderer = new RobotRenderer(canvas, {
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
      adaptiveQuality: options.adaptiveQuality,
      label: options.label,
      paused: options.paused,
      fontFamily: options.fontFamily,
      onPointerDown: (x, y) => this.world.dispatch(x, y),
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

  /** Dispatch a robot to a point from a UI control, in canvas-local pixels. */
  dispatch(x: number, y: number): Robot | null {
    if (this.runtime.prefersReducedMotion) return null;
    const robot = this.world.dispatch(x, y);
    this.runtime.flushEvents();
    this.runtime.renderIfIdle();
    return robot;
  }

  /** Trigger the scene's signature action. */
  trigger(action: SceneAction, x: number, y: number) {
    if (action === "dispatch") this.dispatch(x, y);
  }

  /** Live-update palette, speed, fleet, quality, and label. */
  setOptions(partial: AsciiRobotsOptions) {
    this.options = { ...this.options, ...partial };

    if (partial.speed !== undefined) this.runtime.setSpeed(partial.speed);
    if (partial.interactive !== undefined) this.runtime.setInteractive(partial.interactive);
    if (partial.maxDpr !== undefined) this.runtime.setMaxDpr(partial.maxDpr);
    if (partial.adaptiveQuality !== undefined)
      this.runtime.setAdaptiveQuality(partial.adaptiveQuality);
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
      partial.robots !== undefined ||
      partial.count !== undefined ||
      partial.seed !== undefined ||
      partial.scale !== undefined;
    if (structural) {
      this.world.setOptions({
        robots: partial.robots,
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

  getStats(): RobotStats {
    return {
      ...this.runtime.baseStats(),
      robots: this.world.robots.length,
      charging: this.world.robots.filter((r) => r.state === "charge").length,
      docks: this.world.docks.length,
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

/** Create a living ASCII robot floor on a canvas. */
export function createRobots(canvas: HTMLCanvasElement, options: AsciiRobotsOptions = {}) {
  return new RobotEngine(canvas, options);
}
