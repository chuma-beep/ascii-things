import { describe, expect, it } from "vitest";
import { AntWorld } from "./world";

const makeWorld = (seed = 11) => {
  const world = new AntWorld({ seed });
  world.resize(1200, 700, 10, 15);
  return world;
};

describe("AntWorld", () => {
  it("is deterministic for a given seed and size", () => {
    const a = makeWorld(5);
    const b = makeWorld(5);
    for (let i = 0; i < 600; i++) {
      a.step(1 / 60);
      b.step(1 / 60);
    }
    expect(a.ants.map((ant) => [ant.x, ant.y, ant.carrying])).toEqual(
      b.ants.map((ant) => [ant.x, ant.y, ant.carrying]),
    );
    expect([...a.trail.entries()]).toEqual([...b.trail.entries()]);
    expect(a.delivered).toBe(b.delivered);
  });

  it("keeps a colony of 30–60 ants in bounds and delivers food", () => {
    const world = makeWorld(9);
    for (let i = 0; i < 60 * 45; i++) world.step(1 / 60);
    expect(world.ants.length).toBeGreaterThanOrEqual(30);
    expect(world.ants.length).toBeLessThanOrEqual(60);
    expect(world.delivered).toBeGreaterThan(0);
    for (const ant of world.ants) {
      expect(Number.isFinite(ant.x)).toBe(true);
      expect(Number.isFinite(ant.y)).toBe(true);
      expect(ant.x).toBeGreaterThanOrEqual(0);
      expect(ant.x).toBeLessThanOrEqual(world.width);
      expect(ant.y).toBeGreaterThanOrEqual(0);
      expect(ant.y).toBeLessThanOrEqual(world.height);
    }
    expect([...world.trail.values()].some((value) => value > 0.05)).toBe(true);
  });

  it("drops a crumb and lets the colony find it", () => {
    const world = makeWorld(3);
    const before = world.food.length;
    const crumb = world.crumb(world.width * 0.62, world.height * 0.42);
    expect(world.food.length).toBe(before + 1);
    expect(crumb.kind).toBe("crumb");
    let carried = false;
    for (let i = 0; i < 60 * 40 && !carried; i++) {
      world.step(1 / 60);
      carried = world.ants.some((ant) => ant.carrying);
    }
    expect(carried).toBe(true);
  });
});
