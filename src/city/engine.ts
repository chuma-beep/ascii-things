import { AmbientEngine, type AmbientStats } from "../ambient";
import type { AsciiCityOptions } from "./options";

export type CityStats = AmbientStats;

export class CityEngine extends AmbientEngine {
  constructor(canvas: HTMLCanvasElement, options: AsciiCityOptions = {}) {
    super(canvas, "city", options);
  }

  rush(x: number, y: number): void {
    this.trigger("rush", x, y);
  }
}

export function createCity(canvas: HTMLCanvasElement, options: AsciiCityOptions = {}): CityEngine {
  return new CityEngine(canvas, options);
}
