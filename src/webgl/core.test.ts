import { describe, expect, it } from "vitest";
import {
  AsciiSurfaceEngine,
  SURFACE_DEFAULTS,
  glyphIndex,
  parseColor,
  resolveGlyphs,
  surfaceCell,
} from "./core";

describe("ascii webgl surface", () => {
  it("resolves a compact, unique glyph ramp", () => {
    expect(resolveGlyphs("abca")).toBe("abc");
    expect(resolveGlyphs("")).toBe(SURFACE_DEFAULTS.glyphs);
    expect(resolveGlyphs("a")).toBe(SURFACE_DEFAULTS.glyphs);
    expect(resolveGlyphs(" .:-")).toBe(".:-");
    expect(Array.from(resolveGlyphs("0123456789abcdefghij")).length).toBe(16);
  });

  it("maps brightness levels to glyph indices", () => {
    expect(glyphIndex(0, 9)).toBe(0);
    expect(glyphIndex(0.5, 9)).toBe(4);
    expect(glyphIndex(1, 9)).toBe(8);
    expect(glyphIndex(2, 9)).toBe(8);
    expect(glyphIndex(0.5, 1)).toBe(0);
  });

  it("parses hex and rgba colours", () => {
    expect(parseColor("#fff")).toEqual([1, 1, 1, 1]);
    expect(parseColor("#ff7a1a")).toEqual([1, 122 / 255, 26 / 255, 1]);
    const rgba = parseColor("rgba(236, 232, 223, 0.7)");
    expect(rgba[0]).toBeCloseTo(236 / 255, 5);
    expect(rgba[3]).toBeCloseTo(0.7, 5);
    expect(parseColor("transparent")).toEqual([0, 0, 0, 0]);
  });

  it("derives a monospace cell", () => {
    const auto = surfaceCell(0, 900);
    expect(auto.height).toBe(10);
    expect(auto.width).toBeCloseTo(6.2, 5);
    const fixed = surfaceCell(14, 900);
    expect(fixed.height).toBe(14);
    expect(fixed.width).toBeCloseTo(8.68, 5);
  });

  it("exposes the renderer", () => {
    expect(typeof AsciiSurfaceEngine).toBe("function");
  });
});
