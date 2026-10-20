import { AmbientEngine, type AmbientStats } from "../ambient";
import type { AsciiKoiOptions } from "./options";

export type KoiStats = AmbientStats;

export class KoiEngine extends AmbientEngine {
  constructor(canvas: HTMLCanvasElement, options: AsciiKoiOptions = {}) {
    super(canvas, "koi", options);
  }

  feed(x: number, y: number): void {
    this.trigger("feed", x, y);
  }
}

export function createKoi(canvas: HTMLCanvasElement, options: AsciiKoiOptions = {}): KoiEngine {
  return new KoiEngine(canvas, options);
}
