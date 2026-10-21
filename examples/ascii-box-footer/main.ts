import { type AsciiBoxFooter, createAsciiBoxFooter } from "./ascii-box-footer";

const canvas = document.querySelector<HTMLCanvasElement>("#ascii-box");
const sizeInput = document.querySelector<HTMLInputElement>("#size");
const sizeOutput = document.querySelector<HTMLSpanElement>("#size-output");
const scanButton = document.querySelector<HTMLButtonElement>("#scan");
const motionButton = document.querySelector<HTMLButtonElement>("#motion");

if (canvas && sizeInput && sizeOutput && scanButton && motionButton) {
  const state = { size: 12, scan: true, paused: false };
  let instance: AsciiBoxFooter | null = null;

  const mount = () => {
    instance?.destroy();
    instance = null;
    if (state.paused) return;
    instance = createAsciiBoxFooter(canvas, { size: state.size, scan: state.scan });
  };

  sizeInput.addEventListener("input", () => {
    state.size = Number(sizeInput.value);
    sizeOutput.textContent = `${state.size}px`;
    mount();
  });

  scanButton.addEventListener("click", () => {
    state.scan = !state.scan;
    scanButton.textContent = state.scan ? "on" : "off";
    mount();
  });

  motionButton.addEventListener("click", () => {
    state.paused = !state.paused;
    motionButton.textContent = state.paused ? "paused" : "running";
    mount();
  });

  mount();
}
