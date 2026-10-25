import { describe, expect, it } from "vitest";
import { pixelsToAscii } from "./core";

function pixels(values: Array<[number, number, number]>): Uint8ClampedArray {
  const data = new Uint8ClampedArray(values.length * 4);
  values.forEach(([r, g, b], index) => {
    data[index * 4] = r;
    data[index * 4 + 1] = g;
    data[index * 4 + 2] = b;
    data[index * 4 + 3] = 255;
  });
  return data;
}

describe("pixelsToAscii", () => {
  it("maps black to the dense end of the ramp", () => {
    const result = pixelsToAscii(
      pixels([
        [0, 0, 0],
        [255, 255, 255],
        [255, 255, 255],
        [0, 0, 0],
      ]),
      2,
      2,
      { charset: "@ " },
    );

    expect(result.text).toBe("@ \n @");
    expect(result.columns).toBe(2);
    expect(result.rows).toBe(2);
    expect(result.colors).toEqual([
      "rgb(0 0 0)",
      "rgb(255 255 255)",
      "rgb(255 255 255)",
      "rgb(0 0 0)",
    ]);
  });

  it("flips the ramp when inverted", () => {
    const result = pixelsToAscii(
      pixels([
        [0, 0, 0],
        [255, 255, 255],
      ]),
      2,
      1,
      { charset: "@ ", invert: true },
    );

    expect(result.text).toBe(" @");
  });

  it("accepts a custom charset", () => {
    const result = pixelsToAscii(
      pixels([
        [0, 0, 0],
        [255, 255, 255],
      ]),
      2,
      1,
      { charset: "abc" },
    );

    expect(result.text).toBe("ac");
  });

  it("produces deterministic Bayer output", () => {
    const data = pixels([
      [80, 80, 80],
      [130, 130, 130],
      [180, 180, 180],
      [220, 220, 220],
    ]);
    const options = { charset: "@%#*+=-:. ", dither: "bayer" as const };

    expect(pixelsToAscii(data, 2, 2, options)).toEqual(pixelsToAscii(data, 2, 2, options));
  });

  it("lifts blacks with brightness", () => {
    const black = pixels([[0, 0, 0]]);
    const base = pixelsToAscii(black, 1, 1, { charset: "@%#*+=-:. " }).text;
    const lifted = pixelsToAscii(black, 1, 1, {
      charset: "@%#*+=-:. ",
      brightness: 0.5,
    }).text;

    expect(base).toBe("@");
    expect(lifted).not.toBe(base);
  });

  it("darkens midtones with lower gamma", () => {
    const mid = pixels([[128, 128, 128]]);
    const base = pixelsToAscii(mid, 1, 1, { charset: "@%#*+=-:. " }).text;
    const darker = pixelsToAscii(mid, 1, 1, {
      charset: "@%#*+=-:. ",
      gamma: 0.5,
    }).text;

    expect(base).toBe("=");
    expect(darker).not.toBe(base);
  });

  it("rejects empty dimensions", () => {
    expect(() => pixelsToAscii(new Uint8ClampedArray(), 0, 1)).toThrow();
  });
});
