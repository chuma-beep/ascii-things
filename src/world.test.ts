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

  it("fits a seeded shark roster inside a small card when asked", () => {
    const world = new World({
      seed: 11,
      fishCount: 40,
      sharkScale: 1.05,
      orbitScale: 0.9,
      fitSharks: true,
      sharks: [
        { kind: "thresher", size: 1.1 },
        { kind: "hammerhead", size: 1 },
        { kind: "mako", size: 0.85 },
        { kind: "classic", size: 0.72 },
        { kind: "classic", size: 0.62 },
      ],
    });
    world.resize(590, 330, 9, 13);
    for (const shark of world.sharks) {
      for (let node = 0; node < shark.nodes.length; node += 2) {
        expect(shark.nodes[node]).toBeGreaterThanOrEqual(0);
        expect(shark.nodes[node]).toBeLessThanOrEqual(590);
        expect(shark.nodes[node + 1]).toBeGreaterThanOrEqual(0);
        expect(shark.nodes[node + 1]).toBeLessThanOrEqual(330);
      }
    }
  });

  it("places explicit sharks at their normalized anchors and keeps them composed", () => {
    const world = new World({
      seed: 5,
      fishCount: 0,
      sharks: [
        { kind: "classic", size: 1, x: 0.5, y: 0.5, heading: 0 },
        { kind: "classic", size: 1, x: 0.2, y: 0.2, heading: Math.PI / 2 },
      ],
    });
    world.resize(555, 320, 9, 13);
    const centre = world.sharks.find((shark) => shark.id === 1);
    expect(centre?.composed).toBe(true);
    expect(centre?.heading).toBe(0);
    expect(centre?.centerX).toBeCloseTo(277.5, 1);
    expect(centre?.centerY).toBeCloseTo(160, 1);

    for (let i = 0; i < 600; i++) world.step(1 / 60);
    const mid = centre ? (centre.nodes.length / 2) | 0 : 0;
    expect(
      Math.hypot(centre!.nodes[mid] - centre!.centerX, centre!.nodes[mid + 1] - centre!.centerY),
    ).toBeLessThan(60);
    for (const shark of world.sharks) {
      for (let node = 0; node < shark.nodes.length; node += 2) {
        expect(shark.nodes[node]).toBeGreaterThanOrEqual(0);
        expect(shark.nodes[node]).toBeLessThanOrEqual(555);
        expect(shark.nodes[node + 1]).toBeGreaterThanOrEqual(0);
        expect(shark.nodes[node + 1]).toBeLessThanOrEqual(320);
      }
    }
  });

  it("can change density without breaking the population", () => {
    const world = makeWorld(3);
    world.setOptions({ density: 0.5 });
    expect(world.fish.length).toBeGreaterThan(20);
    expect(world.fish.length).toBeLessThanOrEqual(340);
  });
});
