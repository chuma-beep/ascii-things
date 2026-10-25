import type { AsciiImageDither } from "ascii-things/image";

export type ImageDrawable = HTMLCanvasElement | HTMLImageElement | ImageBitmap;

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StudioOptions {
  columns: number;
  ramp: string;
  dither: AsciiImageDither;
  invert: boolean;
  contrast: number;
  brightness: number;
  gamma: number;
  color: boolean;
  foreground: string;
  background: string;
  transparent: boolean;
  edge: boolean;
  edgeStrength: number;
}

export interface StudioSource {
  id: string;
  name: string;
  drawable: ImageDrawable;
  width: number;
  height: number;
  bytes?: number;
  thumbUrl: string;
  crop: CropRect;
  isDemo?: boolean;
}

export const FULL_CROP: CropRect = { x: 0, y: 0, w: 1, h: 1 };

export const DEFAULT_OPTIONS: StudioOptions = {
  columns: 96,
  ramp: " .:-=+*#%@",
  dither: "none",
  invert: false,
  contrast: 1,
  brightness: 0,
  gamma: 1,
  color: false,
  foreground: "#ece8df",
  background: "#070809",
  transparent: false,
  edge: false,
  edgeStrength: 1.4,
};

const FINE_LIGHT = " .'\u0060^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

export interface RampPreset {
  name: string;
  value: string;
  note: string;
}

/**
 * The studio draws cream glyphs on a dark screen, so ramps run light-to-dense:
 * black pixels become space and white pixels become the fullest glyph.
 */
export const RAMPS: RampPreset[] = [
  { name: "Classic", value: " .:-=+*#%@", note: "10 steps" },
  { name: "Fine", value: FINE_LIGHT, note: "70 steps" },
  { name: "Blocks", value: " ░▒▓█", note: "5 steps" },
  { name: "Dots", value: " ·•●", note: "4 steps" },
  { name: "Braille", value: " ⠁⠃⠇⡇⣇⣿", note: "7 steps" },
  { name: "Kanji", value: " 永龍風水火土空海月花鳥", note: "12 steps" },
];

export const MAX_FILES = 20;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_SOURCE_EDGE = 1800;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeCrop(crop: CropRect): CropRect {
  const w = clamp(crop.w, 0.06, 1);
  const h = clamp(crop.h, 0.06, 1);
  return {
    x: clamp(crop.x, 0, 1 - w),
    y: clamp(crop.y, 0, 1 - h),
    w,
    h,
  };
}

export function safeBaseName(name: string) {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "ascii"
  );
}
