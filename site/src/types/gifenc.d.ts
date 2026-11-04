declare module "gifenc/dist/gifenc.esm.js" {
  export * from "gifenc";
}

declare module "gifenc" {
  export type GifPalette = number[][];
  export type GifFormat = "rgb565" | "rgb444" | "rgba4444";

  export interface GifFrameOptions {
    palette?: GifPalette;
    delay?: number;
    repeat?: number;
    first?: boolean;
    transparent?: boolean;
    transparentIndex?: number;
    dispose?: number;
  }

  export interface GifEncoderInstance {
    writeFrame(index: Uint8Array, width: number, height: number, options?: GifFrameOptions): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    reset(): void;
  }

  export function GIFEncoder(options?: Record<string, unknown>): GifEncoderInstance;
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: {
      format?: GifFormat;
      oneBitAlpha?: boolean | number;
      clearAlpha?: boolean;
      clearAlphaThreshold?: number;
      clearAlphaColor?: number;
    },
  ): GifPalette;
  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: GifPalette,
    format?: GifFormat,
  ): Uint8Array;
}
