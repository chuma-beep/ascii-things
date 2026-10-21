import { describe, expect, it } from "vitest";
import { DITHER_MATRICES, DitherField, ditherThreshold, shouldDither } from "./core";

describe("ordered dither", () => {
  it("normalizes every matrix into the 0–1 range", () => {
    for (const [name] of Object.entries(DITHER_MATRICES)) {
      for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 1) {
          const threshold = ditherThreshold(name as keyof typeof DITHER_MATRICES, x, y);
          expect(threshold).toBeGreaterThan(0);
          expect(threshold).toBeLessThan(1);
        }
      }
    }
  });

  it("uses the expected Bayer 2 thresholds", () => {
    expect(ditherThreshold("bayer2", 0, 0)).toBe(0.125);
    expect(ditherThreshold("bayer2", 1, 0)).toBe(0.625);
    expect(ditherThreshold("bayer2", 0, 1)).toBe(0.875);
    expect(ditherThreshold("bayer2", 1, 1)).toBe(0.375);
  });

  it("wraps coordinates at the matrix edge", () => {
    expect(ditherThreshold("bayer4", 4, 0)).toBe(ditherThreshold("bayer4", 0, 0));
    expect(ditherThreshold("bayer4", 0, 4)).toBe(ditherThreshold("bayer4", 0, 0));
  });

  it("dithers deterministically", () => {
    const first = shouldDither(0.5, "bayer4", 3, 2);
    const second = shouldDither(0.5, "bayer4", 3, 2);
    expect(first).toBe(second);
    expect(shouldDither(0, "bayer4", 0, 0)).toBe(false);
    expect(shouldDither(1, "bayer4", 15, 15)).toBe(true);
  });

  it("treats `none` as a flat threshold", () => {
    expect(ditherThreshold("none", 3, 9)).toBe(0.5);
    expect(shouldDither(0.51, "none", 0, 0)).toBe(true);
    expect(shouldDither(0.49, "none", 0, 0)).toBe(false);
  });

  it("exports the renderer", () => {
    expect(typeof DitherField).toBe("function");
  });
});
