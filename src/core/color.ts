import type { RGB } from "../palette";

/** `rgb()`/`rgba()` helper for palette triples. */
export const rgba = ([r, g, b]: RGB, a: number) => `rgba(${r},${g},${b},${a})`;
