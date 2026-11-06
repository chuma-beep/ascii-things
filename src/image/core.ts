export type AsciiImageCharset = "classic" | "blocks" | "dots" | string;

export type AsciiImageDither = "none" | "floyd-steinberg" | "bayer";

export type AsciiImageSource = string | Blob | HTMLImageElement | ImageBitmap | HTMLCanvasElement;

export interface AsciiImageOptions {
  /** Character count across the output. Default 80. */
  columns?: number;
  /** A named ramp or any string of characters from dark to light. */
  charset?: AsciiImageCharset;
  /** Flip the luminance ramp. */
  invert?: boolean;
  /** Dithering mode. Default none. */
  dither?: AsciiImageDither;
  /** Contrast multiplier around mid-grey. Default 1. */
  contrast?: number;
  /** Luminance offset, from -1 to 1. Default 0. */
  brightness?: number;
  /** Gamma correction. Values above 1 lift the midtones. Default 1. */
  gamma?: number;
  /**
   * Stretch the tonal range to the image's near-black and near-white
   * percentiles before applying contrast. Default true.
   */
  autoLevels?: boolean;
  /** Colour the drawn canvas from the source pixels. */
  color?: boolean;
  /** Monochrome ink. Default #ece8df. */
  foreground?: string;
  /** Canvas background. Default #070809. */
  background?: string;
  /** Font used when drawing to a canvas. */
  fontFamily?: string;
}

export interface AsciiImageResult {
  text: string;
  columns: number;
  rows: number;
  /** Row-major CSS colours for each character cell. */
  colors: string[];
}

export interface AsciiImageRenderOptions extends AsciiImageOptions {
  /** Drawing width in CSS pixels. Defaults to the canvas' rendered width. */
  width?: number;
  /** Backing-store pixel ratio. Defaults to the device ratio, capped at 2. */
  dpr?: number;
}

export const ASCII_CHARSETS = {
  classic: "@%#*+=-:. ",
  blocks: "█▓▒░ ",
  dots: "●◉◎○· ",
} as const;

const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function resolveCharset(charset?: AsciiImageCharset) {
  if (!charset) return ASCII_CHARSETS.classic;
  if (charset in ASCII_CHARSETS) {
    return ASCII_CHARSETS[charset as keyof typeof ASCII_CHARSETS];
  }
  return charset.length >= 2 ? charset : ASCII_CHARSETS.classic;
}

function resolveOptions(options: AsciiImageOptions = {}) {
  return {
    columns: Math.round(clamp(options.columns ?? 80, 8, 400)),
    charset: resolveCharset(options.charset),
    invert: options.invert ?? false,
    dither: options.dither ?? "none",
    contrast: clamp(options.contrast ?? 1, 0.1, 4),
    brightness: clamp(options.brightness ?? 0, -1, 1),
    gamma: clamp(options.gamma ?? 1, 0.2, 4),
    autoLevels: options.autoLevels ?? true,
    color: options.color ?? false,
    foreground: options.foreground ?? "#ece8df",
    background: options.background ?? "#070809",
    fontFamily: options.fontFamily ?? '"Geist Mono", ui-monospace, monospace',
  };
}

function luminance(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function grayscale(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  contrast: number,
  brightness: number,
  gamma: number,
  autoLevels: boolean,
) {
  const values = new Float32Array(width * height);
  let low = 0;
  let high = 255;

  if (autoLevels) {
    const histogram = new Uint32Array(256);
    let opaque = 0;
    for (let i = 0; i < values.length; i++) {
      const offset = i * 4;
      if (data[offset + 3] === 0) continue;
      histogram[Math.round(luminance(data[offset], data[offset + 1], data[offset + 2]))]++;
      opaque++;
    }

    if (opaque > 0) {
      const lowTarget = opaque * 0.01;
      const highTarget = opaque * 0.99;
      let cumulative = 0;
      for (let value = 0; value < histogram.length; value++) {
        cumulative += histogram[value];
        if (cumulative >= lowTarget) {
          low = value;
          break;
        }
      }
      cumulative = 0;
      for (let value = 0; value < histogram.length; value++) {
        cumulative += histogram[value];
        if (cumulative >= highTarget) {
          high = value;
          break;
        }
      }
      // A flat or nearly flat image has no range worth stretching.
      if (high - low < 4) {
        low = 0;
        high = 255;
      }
    }
  }

  const range = Math.max(1, high - low);
  for (let i = 0; i < values.length; i++) {
    const offset = i * 4;
    if (data[offset + 3] === 0) {
      values[i] = 0;
      continue;
    }
    const raw = luminance(data[offset], data[offset + 1], data[offset + 2]);
    const normalized = clamp((raw - low) / range, 0, 1);
    const adjusted = clamp((normalized - 0.5) * contrast + 0.5 + brightness, 0, 1);
    values[i] = Math.pow(adjusted, 1 / gamma) * 255;
  }
  return values;
}

function dither(values: Float32Array, width: number, height: number, mode: AsciiImageDither) {
  if (mode === "floyd-steinberg") {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const old = values[i];
        const next = old < 128 ? 0 : 255;
        const error = old - next;
        values[i] = next;
        if (x + 1 < width) values[i + 1] += (error * 7) / 16;
        if (y + 1 < height) {
          if (x > 0) values[i + width - 1] += (error * 3) / 16;
          values[i + width] += (error * 5) / 16;
          if (x + 1 < width) values[i + width + 1] += error / 16;
        }
      }
    }
    return;
  }

  if (mode === "bayer") {
    const levels = 16;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const threshold = (BAYER_4[y % 4][x % 4] + 0.5) / levels - 0.5;
        values[i] = clamp(values[i] + threshold * (255 / levels), 0, 255);
      }
    }
  }
}

/** Convert raw RGBA pixels into an ASCII grid. Exported for tests and custom pipelines. */
export function pixelsToAscii(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: AsciiImageOptions = {},
): AsciiImageResult {
  if (width <= 0 || height <= 0) throw new Error("Image dimensions must be positive.");
  const resolved = resolveOptions(options);
  const values = grayscale(
    data,
    width,
    height,
    resolved.contrast,
    resolved.brightness,
    resolved.gamma,
    resolved.autoLevels,
  );
  dither(values, width, height, resolved.dither);

  const ramp = resolved.charset;
  const levels = ramp.length - 1;
  const lines: string[] = [];
  const colors: string[] = [];

  for (let y = 0; y < height; y++) {
    let line = "";
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const value = resolved.invert ? 255 - values[i] : values[i];
      const index = Math.round((value / 255) * levels);
      line += ramp[clamp(index, 0, levels)];
      const offset = i * 4;
      colors.push(`rgb(${data[offset]} ${data[offset + 1]} ${data[offset + 2]})`);
    }
    lines.push(line);
  }

  return {
    text: lines.join("\n"),
    columns: width,
    rows: height,
    colors,
  };
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("A 2D canvas context is required.");
  return { canvas, context };
}

async function loadImageElement(url: string) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.decoding = "async";
  image.src = url;
  await image.decode();
  return image;
}

async function toDrawable(source: AsciiImageSource): Promise<CanvasImageSource> {
  if (typeof source === "string") return loadImageElement(source);

  if (typeof Blob !== "undefined" && source instanceof Blob) {
    if (typeof createImageBitmap === "function") return createImageBitmap(source);
    const url = URL.createObjectURL(source);
    try {
      return await loadImageElement(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) return source;

  if (typeof HTMLCanvasElement !== "undefined" && source instanceof HTMLCanvasElement) {
    if (source.width === 0 || source.height === 0) throw new Error("The canvas has no pixels.");
    return source;
  }

  if (typeof HTMLImageElement !== "undefined" && source instanceof HTMLImageElement) {
    if (!source.complete) {
      await new Promise<void>((resolve, reject) => {
        source.addEventListener("load", () => resolve(), { once: true });
        source.addEventListener("error", () => reject(new Error("Could not load the image.")), {
          once: true,
        });
      });
    }
    if (source.naturalWidth === 0) throw new Error("The image has no pixels.");
    return source;
  }

  throw new Error("Unsupported image source.");
}

function dimensions(source: CanvasImageSource) {
  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    return { width: source.width, height: source.height };
  }
  if (typeof HTMLCanvasElement !== "undefined" && source instanceof HTMLCanvasElement) {
    return { width: source.width, height: source.height };
  }
  return { width: 0, height: 0 };
}

async function sample(source: AsciiImageSource, options: AsciiImageOptions, cellAspect = 2) {
  const drawable = await toDrawable(source);
  const size = dimensions(drawable);
  if (!size.width || !size.height) throw new Error("Could not read the image dimensions.");
  const columns = resolveOptions(options).columns;
  const rows = Math.max(1, Math.round(((size.height / size.width) * columns) / cellAspect));
  const { context } = createCanvas(columns, rows);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  // Transparent pixels should read as empty space, not as white ink. Opaque
  // images cover this fill completely.
  context.fillStyle = "#000000";
  context.fillRect(0, 0, columns, rows);
  context.drawImage(drawable, 0, 0, columns, rows);
  const imageData = context.getImageData(0, 0, columns, rows);
  return { imageData, width: size.width, height: size.height };
}

/** Convert an image source into a plain-text ASCII grid. */
export async function imageToAscii(
  source: AsciiImageSource,
  options: AsciiImageOptions = {},
): Promise<string> {
  const { imageData } = await sample(source, options);
  return pixelsToAscii(imageData.data, imageData.width, imageData.height, options).text;
}

/** Render an image source into a canvas and return the generated text grid. */
export async function renderAsciiImage(
  canvas: HTMLCanvasElement,
  source: AsciiImageSource,
  options: AsciiImageRenderOptions = {},
): Promise<AsciiImageResult> {
  const resolved = resolveOptions(options);
  const width = Math.max(
    1,
    Math.round(options.width ?? canvas.clientWidth ?? canvas.parentElement?.clientWidth ?? 800),
  );
  const dpr = Math.min(2, Math.max(1, options.dpr ?? globalThis.devicePixelRatio ?? 1));

  // The source is sampled at the same cell aspect the canvas will draw. Using a
  // fixed 0.5 here makes the final image wider than the source whenever the
  // font's advance width differs from that assumption.
  const probe = canvas.getContext("2d");
  if (!probe) throw new Error("A 2D canvas context is required.");
  probe.font = `600 100px ${resolved.fontFamily}`;
  const charRatio = Math.max(0.35, probe.measureText("M").width / 100);
  const lineHeightRatio = 1.06;
  const cellAspect = lineHeightRatio / charRatio;

  const { imageData } = await sample(source, resolved, cellAspect);
  const result = pixelsToAscii(imageData.data, imageData.width, imageData.height, resolved);

  const cellWidth = width / result.columns;
  const fontSize = cellWidth / charRatio;
  const lineHeight = fontSize * lineHeightRatio;
  const height = Math.max(1, Math.round(result.rows * lineHeight));

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("A 2D canvas context is required.");
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.fillStyle = resolved.background;
  context.fillRect(0, 0, width, height);
  context.font = `600 ${fontSize}px ${resolved.fontFamily}`;
  context.textAlign = "left";
  context.textBaseline = "middle";

  const lines = result.text.split("\n");
  for (let row = 0; row < lines.length; row++) {
    const line = lines[row];
    for (let column = 0; column < line.length; column++) {
      const char = line[column];
      if (char === " ") continue;
      context.fillStyle = resolved.color
        ? result.colors[row * result.columns + column]
        : resolved.foreground;
      context.fillText(char, column * cellWidth, (row + 0.5) * lineHeight);
    }
  }

  return result;
}
