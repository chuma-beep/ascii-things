import { AmbientRenderer, type AmbientRendererOptions } from "../ambient";

export class ServerRenderer extends AmbientRenderer {
  constructor(canvas: HTMLCanvasElement, options: AmbientRendererOptions = {}) {
    super(canvas, "servers", options);
  }
}
