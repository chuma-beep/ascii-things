import { AmbientRenderer, type AmbientRendererOptions } from "../ambient";

export class AntRenderer extends AmbientRenderer {
  constructor(canvas: HTMLCanvasElement, options: AmbientRendererOptions = {}) {
    super(canvas, "ants", options);
  }
}
