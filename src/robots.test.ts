import { describe, expect, it } from "vitest";
import { RobotWorld } from "./robots/world";

function makeWorld(seed = 7, count = 6) {
  const world = new RobotWorld({ seed, count });
  world.resize(1280, 720, 10, 15);
  return world;
}

describe("RobotWorld", () => {
  it("is deterministic for a seed", () => {
    const a = makeWorld(11);
    const b = makeWorld(11);
    expect(a.robots.map((r) => [r.kind, r.x, r.y, r.battery])).toEqual(
      b.robots.map((r) => [r.kind, r.x, r.y, r.battery]),
    );
    expect(a.docks.map((d) => [d.x, d.y])).toEqual(b.docks.map((d) => [d.x, d.y]));
  });

  it("keeps a finite, bounded fleet over 600 steps", () => {
    const world = makeWorld();
    for (let i = 0; i < 600; i++) world.step(1 / 60);
    expect(world.robots).toHaveLength(6);
    for (const robot of world.robots) {
      expect(Number.isFinite(robot.x)).toBe(true);
      expect(Number.isFinite(robot.y)).toBe(true);
      expect(robot.x).toBeGreaterThanOrEqual(0);
      expect(robot.x).toBeLessThanOrEqual(1280);
      expect(robot.y).toBeGreaterThanOrEqual(0);
      expect(robot.y).toBeLessThanOrEqual(720);
      expect(robot.battery).toBeGreaterThanOrEqual(0);
      expect(robot.battery).toBeLessThanOrEqual(100);
    }
    for (const dock of world.docks) {
      if (dock.owner != null) {
        expect(world.robots.some((r) => r.id === dock.owner)).toBe(true);
      }
    }
  });

  it("dispatches the nearest idle robot to a point", () => {
    const world = makeWorld();
    const target = world.robots[0];
    const robot = world.dispatch(target.x + 80, target.y);
    expect(robot).not.toBeNull();
    expect(robot!.state).toBe("job");
    expect(robot!.targetX).toBeCloseTo(target.x + 80);
  });

  it("sends a low-battery robot toward a dock", () => {
    const world = makeWorld();
    world.robots[0].battery = 8;
    world.step(1 / 60);
    expect(world.robots[0].state === "dock" || world.robots[0].state === "charge").toBe(true);
  });
});
