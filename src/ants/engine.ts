import { AmbientEngine, type AmbientStats } from "../ambient";
import type { AsciiAntsOptions } from "./options";

export type AntStats = AmbientStats;

export class AntEngine extends AmbientEngine {
  constructor(canvas: HTMLCanvasElement, options: AsciiAntsOptions = {}) {
    super(canvas, "ants", options);
  }

  crumb(x: number, y: number): void {
    this.trigger("crumb", x, y);
  }
}

export function createAnts(canvas: HTMLCanvasElement, options: AsciiAntsOptions = {}): AntEngine {
  return new AntEngine(canvas, options);
}
