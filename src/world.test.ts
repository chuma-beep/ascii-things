import { describe, expect, it } from "vitest";
import { World } from "./world";

function makeWorld(seed = 7) {
  const world = new World({ seed, fishCount: 80 });
  world.resize(800, 600, 10, 15);
  return world;
}

describe("World", () => {
  it("is deterministic for the same seed", () => {
    const a = makeWorld(7);
    const b = makeWorld(7);
    for (let i = 0; i < 120; i++) {
      a.step(1 / 60);
      b.step(1 / 60);
    }
    expect(a.fish.map((f) => [f.x, f.y])).toEqual(b.fish.map((f) => [f.x, f.y]));
  });

  it("keeps agents finite and inside the soft bounds", () => {
    const world = makeWorld(11);
    for (let i = 0; i < 600; i++) world.step(1 / 60);
    expect(world.fish).toHaveLength(80);
    for (const fish of world.fish) {
      expect(Number.isFinite(fish.x)).toBe(true);
      expect(Number.isFinite(fish.y)).toBe(true);
      expect(fish.x).toBeGreaterThan(-80);
      expect(fish.x).toBeLessThan(880);
      expect(fish.y).toBeGreaterThan(-80);
      expect(fish.y).toBeLessThan(680);
    }
    for (const shark of world.sharks) {
      for (const value of shark.nodes) expect(Number.isFinite(value)).toBe(true);
    }
  });

  it("can change density without breaking the population", () => {
    const world = makeWorld(3);
    world.setOptions({ density: 0.5 });
    expect(world.fish.length).toBeGreaterThan(20);
    expect(world.fish.length).toBeLessThanOrEqual(340);
  });
});
