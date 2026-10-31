import { SceneRuntime } from "../core/runtime";
import type { SceneAction, SceneStats } from "../core/scene";
import { KanjiKoiRenderer } from "../kanji/koi-renderer";
import type { AmbientEvent, AmbientKind, AsciiAmbientOptions } from "./options";
import { AmbientRenderer } from "./renderer";
import { AmbientWorld } from "./world";

export interface AmbientStats extends SceneStats {
  birds?: number;
  predators?: number;
  fireflies?: number;
  lit?: number;
  ants?: number;
  food?: number;
  carrying?: number;
  koi?: number;
  ripples?: number;
  cars?: number;
  buildings?: number;
  lights?: number;
  servers?: number;
  packets?: number;
  alerts?: number;
}

const ACTIONS: Record<AmbientKind, SceneAction> = {
  starlings: "scatter",
  fireflies: "flare",
  ants: "crumb",
  koi: "feed",
  city: "rush",
  servers: "ping",
};

export class AmbientEngine {
  readonly kind: AmbientKind;
  protected options: AsciiAmbientOptions;
  protected world: AmbientWorld;
  protected renderer: AmbientRenderer;
  protected runtime: SceneRuntime<AmbientWorld, AmbientRenderer>;

  constructor(canvas: HTMLCanvasElement, kind: AmbientKind, options: AsciiAmbientOptions = {}) {
    this.kind = kind;
    this.options = options;
    this.world = new AmbientWorld(kind, {
      seed: options.seed,
      count: options.count,
      scale: options.scale,
    });
    this.renderer =
      kind === "koi" && options.glyphs === "kanji"
        ? new KanjiKoiRenderer(canvas, kind, {
            palette: options.palette,
            columns: options.columns,
            maxCells: options.maxCells,
            calm: options.calm,
          })
        : new AmbientRenderer(canvas, kind, {
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
      timing: "fixed",
      onPointerDown: (x, y) => this.act(x, y),
      flushEvents: () => this.flushEvents(),
    });
  }

  pause() {
    this.runtime.pause();
  }

  resume() {
    this.runtime.resume();
  }

  resize() {
    this.runtime.resize();
  }

  trigger(action: SceneAction, x: number, y: number) {
    if (action !== ACTIONS[this.kind]) return;
    this.act(x, y);
  }

  setOptions(partial: AsciiAmbientOptions) {
    const structural =
      partial.seed !== undefined || partial.count !== undefined || partial.scale !== undefined;
    this.options = { ...this.options, ...partial };

    if (partial.speed !== undefined) this.runtime.setSpeed(partial.speed);
    if (partial.interactive !== undefined) this.runtime.setInteractive(partial.interactive);
    if (partial.maxDpr !== undefined) this.runtime.setMaxDpr(partial.maxDpr);
    if (partial.adaptiveQuality !== undefined) {
      this.runtime.setAdaptiveQuality(partial.adaptiveQuality);
    }
    if (partial.paused !== undefined) this.runtime.setPaused(partial.paused);
    if (partial.label !== undefined) this.runtime.setLabel(partial.label);
    if (partial.fontFamily !== undefined) this.runtime.setFontFamily(partial.fontFamily);

    this.renderer.setOptions({
      palette: partial.palette,
      columns: partial.columns,
      maxCells: partial.maxCells,
      calm: partial.calm,
    });

    if (structural) {
      this.world.setOptions({
        seed: partial.seed,
        count: partial.count,
        scale: partial.scale,
      });
      this.runtime.resize();
    } else {
      this.runtime.schedule();
      this.runtime.renderIfIdle();
    }
  }

  getStats(): AmbientStats {
    const base = this.runtime.baseStats();
    const world = this.world;
    switch (this.kind) {
      case "starlings":
        return { ...base, birds: world.birds.length, predators: 1 };
      case "fireflies":
        return {
          ...base,
          fireflies: world.fireflies.length,
          lit: world.fireflies.filter((fly) => fly.flare > 0.25).length,
        };
      case "ants":
        return {
          ...base,
          ants: world.ants.length,
          food: world.crumbs.length,
          carrying: world.ants.filter((ant) => ant.carrying).length,
        };
      case "koi":
        return { ...base, koi: world.koi.length, ripples: world.ripples.length };
      case "city":
        return {
          ...base,
          cars: world.cars.length,
          buildings: world.buildings.length,
          lights: world.buildings.length * 6,
        };
      case "servers":
        return {
          ...base,
          servers: world.servers.length,
          packets: world.packets.length,
          alerts: world.alert > 0 ? 1 : 0,
        };
    }
  }

  destroy() {
    this.runtime.destroy();
  }

  protected act(x: number, y: number) {
    if (this.runtime.prefersReducedMotion) {
      this.runtime.flushEvents();
      return;
    }
    this.world.act(ACTIONS[this.kind], x, y);
    this.runtime.flushEvents();
    this.runtime.renderIfIdle();
  }

  private flushEvents() {
    if (!this.options.onEvent) {
      this.world.events.length = 0;
      return;
    }
    const events: AmbientEvent[] = this.world.events.splice(0);
    for (const event of events) this.options.onEvent(event);
  }
}
