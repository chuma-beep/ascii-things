import { createAsciiBoxFooter } from "../../../examples/ascii-box-footer/ascii-box-footer";

const canvas = document.querySelector<HTMLCanvasElement>("[data-ascii-box-footer]");

if (canvas) {
  createAsciiBoxFooter(canvas, { size: 12 });
}
