import { GIFEncoder, applyPalette, quantize } from "gifenc/dist/gifenc.esm.js";

export interface GifOptions {
  /** Capture length in milliseconds. Default 3000. */
  duration?: number;
  /** Frames per second. Default 12. */
  fps?: number;
  /** Longest edge of the captured GIF. Default 640. */
  maxWidth?: number;
  /** Palette size. Default 128. */
  colors?: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Captures the current canvas as a looping animated GIF. Frames are sampled at
 * a capped size so a few seconds of a large canvas stays shareable.
 */
export async function recordGif(
  canvas: HTMLCanvasElement,
  options: GifOptions = {},
): Promise<Blob> {
  if (typeof document === "undefined") {
    throw new Error("GIF capture needs a browser document.");
  }

  const duration = clamp(options.duration ?? 3000, 500, 10_000);
  const fps = Math.round(clamp(options.fps ?? 12, 5, 30));
  const colors = Math.round(clamp(options.colors ?? 128, 16, 256));
  const sourceWidth = Math.max(1, canvas.width || 1);
  const sourceHeight = Math.max(1, canvas.height || 1);
  const width = Math.max(1, Math.round(Math.min(options.maxWidth ?? 640, sourceWidth)));
  const height = Math.max(1, Math.round((width * sourceHeight) / sourceWidth));
  const delay = Math.round(1000 / fps);
  const frameCount = Math.max(1, Math.round((duration / 1000) * fps));

  const frame = document.createElement("canvas");
  frame.width = width;
  frame.height = height;
  const context = frame.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("This browser cannot create a 2D capture canvas.");
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const gif = GIFEncoder();
  let palette: number[][] | null = null;

  for (let index = 0; index < frameCount; index++) {
    context.clearRect(0, 0, width, height);
    context.drawImage(canvas, 0, 0, width, height);

    let data: Uint8ClampedArray;
    try {
      data = context.getImageData(0, 0, width, height).data;
    } catch {
      throw new Error("This canvas cannot be read for GIF capture.");
    }

    if (!palette) {
      palette = quantize(data, colors, { format: "rgb444" });
      if (!palette.length) {
        throw new Error("The canvas was empty when GIF capture started.");
      }
    }

    const indexed = applyPalette(data, palette, "rgb444");
    gif.writeFrame(indexed, width, height, {
      palette: index === 0 ? palette : undefined,
      delay,
      repeat: 0,
    });

    if (index < frameCount - 1) await sleep(delay);
  }

  gif.finish();
  const bytes = gif.bytes();
  if (!bytes.length) {
    throw new Error("The GIF capture was empty.");
  }
  return new Blob([bytes], { type: "image/gif" });
}
