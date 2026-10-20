import { AmbientEngine, type AmbientStats } from "../ambient";
import type { AsciiFirefliesOptions } from "./options";

export type FireflyStats = AmbientStats;

export class FireflyEngine extends AmbientEngine {
  constructor(canvas: HTMLCanvasElement, options: AsciiFirefliesOptions = {}) {
    super(canvas, "fireflies", options);
  }

  flare(x: number, y: number): void {
    this.trigger("flare", x, y);
  }
}

export function createFireflies(
  canvas: HTMLCanvasElement,
  options: AsciiFirefliesOptions = {},
): FireflyEngine {
  return new FireflyEngine(canvas, options);
}
