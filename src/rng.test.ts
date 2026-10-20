import { describe, expect, it } from "vitest";
import { createRng } from "./rng";

describe("createRng", () => {
  it("is deterministic for the same seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    const left = Array.from({ length: 8 }, () => a.next());
    const right = Array.from({ length: 8 }, () => b.next());
    expect(left).toEqual(right);
  });

  it("stays in range", () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      const n = rng.int(3, 6);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(6);
    }
  });

  it("produces different sequences for different seeds", () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });
});
