import type { BaseStats, RuntimeOptions, RuntimeRenderer, RuntimeWorld } from "./runtime";
import { SceneRuntime } from "./runtime";
import type { SceneAction, SceneHandle, SceneOptions, SceneStats } from "./scene";

/** Pointer state shared by the runtime and a custom world, when present. */
export interface SimulationPointer {
  x: number;
  y: number;
  active: boolean;
}

export interface SimulationOptions<
  W extends RuntimeWorld,
  R extends RuntimeRenderer<W>,
  S extends SceneStats = SceneStats,
  A extends string = SceneAction,
> extends RuntimeOptions {
  canvas: HTMLCanvasElement;
  world: W;
  renderer: R;
  /** Use scaled timing only when the simulation needs speed to affect dt itself. */
  timing?: "fixed" | "scaled";
  onPointerDown?: (x: number, y: number, pointer?: SimulationPointer) => void;
  onPointerMove?: (x: number, y: number, inside: boolean, pointer?: SimulationPointer) => void;
  flushEvents?: () => void;
  /** Return custom stats. Defaults to the runtime's measured base stats. */
  getStats?: (base: BaseStats, world: W) => S;
  /** Map a custom action to world state. */
  onAction?: (action: A, x: number, y: number, world: W) => void;
}

export interface SimulationHandle<
  W extends RuntimeWorld = RuntimeWorld,
  S extends SceneStats = SceneStats,
  A extends string = SceneAction,
> extends SceneHandle<S, A> {
  readonly canvas: HTMLCanvasElement;
  readonly world: W;
  readonly renderer: RuntimeRenderer<W>;
}

/**
 * Create a simulation around the shared scene runtime without imposing a world
 * model or a CellGrid renderer. The world and renderer own their behavior; the
 * runtime owns timing, canvas/DPR sizing, visibility, reduced motion, input
 * plumbing, labels, and teardown.
 */
export function createSimulation<
  W extends RuntimeWorld,
  R extends RuntimeRenderer<W>,
  S extends SceneStats = SceneStats,
  A extends string = SceneAction,
>(options: SimulationOptions<W, R, S, A>): SimulationHandle<W, S, A> {
  const runtime = new SceneRuntime<W, R>({
    canvas: options.canvas,
    world: options.world,
    renderer: options.renderer,
    speed: options.speed,
    interactive: options.interactive,
    maxDpr: options.maxDpr,
    adaptiveQuality: options.adaptiveQuality,
    label: options.label,
    fallback: options.fallback,
    paused: options.paused,
    fontFamily: options.fontFamily,
    timing: options.timing,
    onPointerDown: (x, y) => options.onPointerDown?.(x, y, options.world.pointer),
    onPointerMove: (x, y, inside) => options.onPointerMove?.(x, y, inside, options.world.pointer),
    flushEvents: options.flushEvents,
  });

  return {
    canvas: options.canvas,
    world: options.world,
    renderer: options.renderer,
    pause: () => runtime.pause(),
    resume: () => runtime.resume(),
    resize: () => runtime.resize(),
    destroy: () => runtime.destroy(),
    trigger: (action, x, y) => options.onAction?.(action, x, y, options.world),
    getStats: () =>
      options.getStats?.(runtime.baseStats(), options.world) ?? (runtime.baseStats() as S),
    setOptions: (partial: Partial<SceneOptions>) => {
      let resize = false;

      if (partial.speed !== undefined) {
        runtime.setSpeed(partial.speed);
        runtime.schedule();
      }
      if (partial.interactive !== undefined) runtime.setInteractive(partial.interactive);
      if (partial.maxDpr !== undefined) {
        runtime.setMaxDpr(partial.maxDpr);
        resize = true;
      }
      if (partial.adaptiveQuality !== undefined) {
        runtime.setAdaptiveQuality(partial.adaptiveQuality);
      }
      if (partial.label !== undefined) runtime.setLabel(partial.label);
      if (partial.fallback !== undefined) runtime.setFallback(partial.fallback);
      if (partial.paused !== undefined) runtime.setPaused(partial.paused);
      if (partial.fontFamily !== undefined) runtime.setFontFamily(partial.fontFamily);
      if (resize) runtime.resize();
    },
  };
}
