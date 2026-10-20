import { AmbientEngine, type AmbientStats } from "../ambient";
import type { AsciiServersOptions } from "./options";

export type ServerStats = AmbientStats;

export class ServerEngine extends AmbientEngine {
  constructor(canvas: HTMLCanvasElement, options: AsciiServersOptions = {}) {
    super(canvas, "servers", options);
  }

  ping(x: number, y: number): void {
    this.trigger("ping", x, y);
  }
}

export function createServers(
  canvas: HTMLCanvasElement,
  options: AsciiServersOptions = {},
): ServerEngine {
  return new ServerEngine(canvas, options);
}
