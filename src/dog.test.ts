import { describe, expect, it } from "vitest";
import { DogWorld } from "./dog/world";

const makeWorld = (seed = 11) => {
  const world = new DogWorld({ seed, count: 2 });
  world.resize(1280, 720, 10, 15);
  return world;
};

describe("DogWorld", () => {
  it("is deterministic for a given seed", () => {
    const a = makeWorld(5);
    const b = makeWorld(5);
    for (let i = 0; i < 120; i++) {
      a.step(1 / 60);
      b.step(1 / 60);
    }
    expect(a.dogs.map((d) => [d.x, d.y, d.state, d.battery])).toEqual(
      b.dogs.map((d) => [d.x, d.y, d.state, d.battery]),
    );
  });

  it("keeps the dog finite, grounded, and in bounds over 600 steps", () => {
    const world = makeWorld(9);
    for (let i = 0; i < 600; i++) world.step(1 / 60);
    for (const dog of world.dogs) {
      expect(Number.isFinite(dog.x)).toBe(true);
      expect(Number.isFinite(dog.y)).toBe(true);
      expect(dog.y).toBeCloseTo(world.groundY, 5);
      expect(dog.x).toBeGreaterThanOrEqual(0);
      expect(dog.x).toBeLessThanOrEqual(world.width);
    }
  });

  it("chases and nudges a thrown ball", () => {
    const world = makeWorld(7);
    world.throwBall(world.width * 0.38, world.groundY - 120);
    let nudged = false;
    for (let i = 0; i < 900 && !nudged; i++) {
      world.step(1 / 60);
      nudged = world.events.some((event) => event.kind === "nudge");
    }
    expect(nudged).toBe(true);
  });

  it("sends a low-battery dog to its charging dock", () => {
    const world = makeWorld(3);
    const dog = world.dogs[0];
    dog.battery = 8;
    world.step(1 / 60);
    expect(dog.state).toBe("charge");
    expect(world.dock.owner).toBe(dog.id);
  });
});
