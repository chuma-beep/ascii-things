import { AmbientRenderer, type AmbientRendererOptions } from "../ambient";

export class StarlingRenderer extends AmbientRenderer {
  constructor(canvas: HTMLCanvasElement, options: AmbientRendererOptions = {}) {
    super(canvas, "starlings", options);
  }
}
