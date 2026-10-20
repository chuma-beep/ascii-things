import { AmbientEngine, type AmbientStats } from "../ambient";
import type { AsciiStarlingsOptions } from "./options";

export type StarlingStats = AmbientStats;

export class StarlingEngine extends AmbientEngine {
  constructor(canvas: HTMLCanvasElement, options: AsciiStarlingsOptions = {}) {
    super(canvas, "starlings", options);
  }

  scatter(x: number, y: number): void {
    this.trigger("scatter", x, y);
  }
}

export function createStarlings(
  canvas: HTMLCanvasElement,
  options: AsciiStarlingsOptions = {},
): StarlingEngine {
  return new StarlingEngine(canvas, options);
}
