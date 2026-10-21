import { describe, expect, it } from "vitest";
import type {
  AsciiImageCharset,
  AsciiImageDither,
  AsciiImageOptions,
  AsciiImageRenderOptions,
  AsciiImageResult,
  AsciiImageSource,
} from "./index";
import type { AsciiImageElement } from "./element";
import type { AsciiImageProps } from "./react";

type ImageTypeSurface = [
  AsciiImageCharset,
  AsciiImageDither,
  AsciiImageOptions,
  AsciiImageRenderOptions,
  AsciiImageResult,
  AsciiImageSource,
  AsciiImageProps,
  AsciiImageElement,
];

describe("image public types", () => {
  it("imports the frozen type names", () => {
    const surface: ImageTypeSurface[number] | undefined = undefined;
    expect(surface).toBeUndefined();
  });
});
