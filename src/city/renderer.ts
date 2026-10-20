import { AmbientRenderer, type AmbientRendererOptions } from "../ambient";

export class CityRenderer extends AmbientRenderer {
  constructor(canvas: HTMLCanvasElement, options: AmbientRendererOptions = {}) {
    super(canvas, "city", options);
  }
}
