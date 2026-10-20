import { describe, expect, it } from "vitest";
import { KoiWorld } from "./world";

const makeWorld = (seed = 11) => {
  const world = new KoiWorld({ seed });
  world.resize(1200, 700, 10, 15);
  return world;
};

describe("KoiWorld", () => {
  it("is deterministic for a given seed and size", () => {
    const a = makeWorld(5);
    const b = makeWorld(5);
    for (let i = 0; i < 600; i++) {
      a.step(1 / 60);
      b.step(1 / 60);
    }
    expect(a.koi.map((k) => [k.x, k.y, k.heading, k.speed])).toEqual(
      b.koi.map((k) => [k.x, k.y, k.heading, k.speed]),
    );
    expect(a.pads.map((pad) => [pad.x, pad.y, pad.r])).toEqual(
      b.pads.map((pad) => [pad.x, pad.y, pad.r]),
    );
  });

  it("keeps 5–10 koi in bounds over 45 seconds", () => {
    const world = makeWorld(9);
    for (let i = 0; i < 60 * 45; i++) world.step(1 / 60);
    expect(world.koi.length).toBeGreaterThanOrEqual(5);
    expect(world.koi.length).toBeLessThanOrEqual(10);
    expect(world.ripples.length).toBe(0);
    for (const k of world.koi) {
      expect(Number.isFinite(k.x)).toBe(true);
      expect(Number.isFinite(k.y)).toBe(true);
      expect(k.x).toBeGreaterThanOrEqual(0);
      expect(k.x).toBeLessThanOrEqual(world.width);
      expect(k.y).toBeGreaterThanOrEqual(0);
      expect(k.y).toBeLessThanOrEqual(world.height);
    }
  });

  it("scatters food, raises a ripple, and the koi eat", () => {
    const world = makeWorld(3);
    const ripple = world.feed(world.width * 0.5, world.height * 0.5);
    expect(world.pellets.length).toBeGreaterThanOrEqual(5);
    expect(world.ripples).toContain(ripple);
    let eaten = 0;
    for (let i = 0; i < 60 * 30; i++) {
      world.step(1 / 60);
      eaten += world.events.filter((event) => event.kind === "nibble").length;
      world.events.length = 0;
    }
    expect(eaten).toBeGreaterThan(0);
    expect(world.ripples.length).toBe(0);
  });
});
