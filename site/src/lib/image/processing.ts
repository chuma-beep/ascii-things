import { MAX_SOURCE_EDGE, type CropRect, type ImageDrawable } from "./types";

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("A 2D canvas context is required.");
  return { canvas, context };
}

/** Crop a source image into a working canvas, capped for predictable memory use. */
export function drawCrop(
  source: ImageDrawable,
  sourceWidth: number,
  sourceHeight: number,
  crop: CropRect,
): HTMLCanvasElement {
  const safeWidth = Math.max(1, sourceWidth);
  const safeHeight = Math.max(1, sourceHeight);
  const sx = Math.round(crop.x * safeWidth);
  const sy = Math.round(crop.y * safeHeight);
  const sw = Math.max(1, Math.round(crop.w * safeWidth));
  const sh = Math.max(1, Math.round(crop.h * safeHeight));
  const scale = Math.min(1, MAX_SOURCE_EDGE / Math.max(sw, sh));
  const { canvas, context } = createCanvas(sw * scale, sh * scale);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function luminance(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Convert a working canvas to a white-on-black Sobel edge field. */
export function applySobel(source: HTMLCanvasElement, strength: number): HTMLCanvasElement {
  const context = source.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("A 2D canvas context is required.");
  const { width, height } = source;
  if (width < 3 || height < 3) return source;

  const image = context.getImageData(0, 0, width, height);
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i += 1) {
    const offset = i * 4;
    gray[i] = luminance(image.data[offset], image.data[offset + 1], image.data[offset + 2]);
  }

  const output = context.createImageData(width, height);
  const gain = Math.max(0.2, strength);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const offset = index * 4;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        output.data[offset] = 0;
        output.data[offset + 1] = 0;
        output.data[offset + 2] = 0;
        output.data[offset + 3] = 255;
        continue;
      }

      const topLeft = gray[index - width - 1];
      const top = gray[index - width];
      const topRight = gray[index - width + 1];
      const left = gray[index - 1];
      const right = gray[index + 1];
      const bottomLeft = gray[index + width - 1];
      const bottom = gray[index + width];
      const bottomRight = gray[index + width + 1];

      const gx = -topLeft - 2 * left - bottomLeft + topRight + 2 * right + bottomRight;
      const gy = -topLeft - 2 * top - topRight + bottomLeft + 2 * bottom + bottomRight;
      const magnitude = Math.min(255, Math.hypot(gx, gy) * gain);
      output.data[offset] = magnitude;
      output.data[offset + 1] = magnitude;
      output.data[offset + 2] = magnitude;
      output.data[offset + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
  return source;
}

export function buildProcessedCanvas(
  source: ImageDrawable,
  sourceWidth: number,
  sourceHeight: number,
  crop: CropRect,
  edge: boolean,
  edgeStrength: number,
): HTMLCanvasElement {
  const cropped = drawCrop(source, sourceWidth, sourceHeight, crop);
  return edge ? applySobel(cropped, edgeStrength) : cropped;
}
