import { describe, expect, it } from "vitest";
import { JellyfishWorld } from "./jellyfish/world";

function makeWorld(seed = 7, count = 6) {
  const world = new JellyfishWorld({ seed, count });
  world.resize(1280, 720, 10, 15);
  return world;
}

describe("JellyfishWorld", () => {
  it("is deterministic for a seed", () => {
    const a = makeWorld(11);
    const b = makeWorld(11);
    expect(
      a.jellies.map((j) => [j.kind, j.x, j.y, j.radius, j.depth, j.phase]),
    ).toEqual(b.jellies.map((j) => [j.kind, j.x, j.y, j.radius, j.depth, j.phase]));
    expect(a.plankton.map((p) => [p.x, p.y, p.depth])).toEqual(
      b.plankton.map((p) => [p.x, p.y, p.depth]),
    );
  });

  it("keeps a finite, bounded bloom over 600 steps", () => {
    const world = makeWorld();
    for (let i = 0; i < 600; i++) world.step(1 / 60);
    expect(world.jellies).toHaveLength(6);
    for (const jelly of world.jellies) {
      expect(Number.isFinite(jelly.x)).toBe(true);
      expect(Number.isFinite(jelly.y)).toBe(true);
      expect(jelly.x).toBeGreaterThanOrEqual(0);
      expect(jelly.x).toBeLessThanOrEqual(1280);
      expect(jelly.y).toBeGreaterThanOrEqual(0);
      expect(jelly.y).toBeLessThanOrEqual(720);
      expect(jelly.radius).toBeGreaterThan(0);
      expect(jelly.phase).toBeGreaterThanOrEqual(0);
      expect(jelly.phase).toBeLessThan(1);
      expect(jelly.contract).toBeGreaterThanOrEqual(0);
      expect(jelly.contract).toBeLessThanOrEqual(1);
    }
    for (const ring of world.rings) {
      expect(Number.isFinite(ring.radius)).toBe(true);
      expect(ring.age).toBeLessThan(ring.life);
    }
    for (const p of world.plankton) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(p.x).toBeGreaterThanOrEqual(-12);
      expect(p.x).toBeLessThanOrEqual(1292);
    }
  });

  it("emits a ring and an event when a bell contracts", () => {
    const world = makeWorld(3, 1);
    const jelly = world.jellies[0];
    jelly.phase = 0.999;
    const before = world.rings.length;
    world.step(1 / 60);
    expect(world.rings.length).toBeGreaterThan(before);
    expect(world.events.some((e) => e.kind === "pulse" && e.id === jelly.id)).toBe(true);
  });

  it("pushes nearby jellyfish outward on a shockwave", () => {
    const world = makeWorld(5, 1);
    const jelly = world.jellies[0];
    jelly.x = 900;
    jelly.y = 500;
    jelly.vx = 0;
    jelly.vy = 0;
    const ring = world.shockwave(500, 500);
    expect(ring.kind).toBe("shock");
    expect(jelly.vx).toBeGreaterThan(0);
    expect(jelly.contract).toBe(1);
    expect(world.events.some((e) => e.kind === "shock")).toBe(true);
  });
});
