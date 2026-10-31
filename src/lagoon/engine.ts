import type { SceneAction, SceneHandle } from "../core/scene";
import {
  type AsciiLagoonOptions,
  DEFAULT_LAGOON_VARIANT,
  LAGOON_VARIANTS,
  type LagoonStats,
  type LagoonVariant,
} from "./options";
import { createLagoonPainter, type LagoonPainter, type LagoonScene, LAGOON_STAGE } from "./painter";

const PAINTER_SCENE: Record<LagoonVariant, LagoonScene> = {
  reef: "day",
  night: "night",
  turtle: "turtle",
  manta: "manta",
  seahorse: "seahorse",
  dolphin: "dolphin",
  hammerhead: "hammer",
  tang: "tang",
};

function normalizeVariant(value: string | undefined): LagoonVariant {
  return LAGOON_VARIANTS.some((variant) => variant.id === value)
    ? (value as LagoonVariant)
    : DEFAULT_LAGOON_VARIANT;
}

/**
 * Package adapter for the full-canvas Lagoon painter.
 *
 * The painter owns the drawing and its 1944×1760 authoring stage. This engine
 * gives it the same public lifecycle as every other ascii-things scene.
 */
export class LagoonEngine implements SceneHandle<LagoonStats> {
  private painter: LagoonPainter;
  private canvas: HTMLCanvasElement;
  private variant: LagoonVariant;
  private label: string | undefined;
  private paused = false;

  constructor(canvas: HTMLCanvasElement, options: AsciiLagoonOptions = {}) {
    this.canvas = canvas;
    this.label = options.label;
    this.variant = normalizeVariant(options.variant);
    this.painter = createLagoonPainter(canvas, {
      scene: PAINTER_SCENE[this.variant],
    });
    this.applyLabel();
    if (options.paused) {
      this.paused = true;
      this.painter.stop();
    }
  }

  pause() {
    this.paused = true;
    this.painter.stop();
  }

  resume() {
    this.paused = false;
    this.painter.start();
  }

  resize() {
    // The painter uses a fixed authoring canvas and is scaled by its host.
  }

  setOptions(partial: AsciiLagoonOptions) {
    if (partial.variant !== undefined) {
      const next = normalizeVariant(partial.variant);
      if (next !== this.variant) {
        this.variant = next;
        this.painter.setScene(PAINTER_SCENE[next]);
      }
    }

    if ("label" in partial) {
      this.label = partial.label;
      this.applyLabel();
    }

    if (partial.paused !== undefined && partial.paused !== this.paused) {
      if (partial.paused) this.pause();
      else this.resume();
    }
  }

  private applyLabel() {
    if (this.label) {
      this.canvas.setAttribute("role", "img");
      this.canvas.setAttribute("aria-label", this.label);
      this.canvas.removeAttribute("aria-hidden");
    } else {
      this.canvas.setAttribute("aria-hidden", "true");
      this.canvas.removeAttribute("role");
      this.canvas.removeAttribute("aria-label");
    }
  }

  trigger(_action: SceneAction, _x: number, _y: number) {
    // Lagoon is a passive, ambient scene.
  }

  getStats(): LagoonStats {
    return {
      fps: 30,
      frameMs: 1000 / 30,
      cells: LAGOON_STAGE.columns * LAGOON_STAGE.rows,
      columns: LAGOON_STAGE.columns,
      rows: LAGOON_STAGE.rows,
      variant: this.variant,
    };
  }

  destroy() {
    this.painter.destroy();
  }
}

/** Create a live Lagoon scene on a canvas. */
export function createLagoon(canvas: HTMLCanvasElement, options: AsciiLagoonOptions = {}) {
  return new LagoonEngine(canvas, options);
}
