import { AmbientRenderer, type AmbientRendererOptions } from "../ambient";

export class KoiRenderer extends AmbientRenderer {
  constructor(canvas: HTMLCanvasElement, options: AmbientRendererOptions = {}) {
    super(canvas, "koi", options);
  }
}
