import { AmbientRenderer, type AmbientRendererOptions } from "../ambient";

export class FireflyRenderer extends AmbientRenderer {
  constructor(canvas: HTMLCanvasElement, options: AmbientRendererOptions = {}) {
    super(canvas, "fireflies", options);
  }
}
