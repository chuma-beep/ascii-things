import { angleDiff, clamp, TAU } from "../math";
import { createRng, type Rng } from "../rng";

export type RobotKind = "scout" | "hauler" | "sentinel";
export type RobotState = "patrol" | "scan" | "job" | "dock" | "charge";

export interface RobotSpec {
  kind?: RobotKind;
  size?: number;
}

export interface Robot {
  id: number;
  kind: RobotKind;
  x: number;
  y: number;
  heading: number;
  speed: number;
  length: number;
  sizeScale: number;
  battery: number;
  state: RobotState;
  stateTime: number;
  targetX: number;
  targetY: number;
  dock: number;
  scan: number;
  tread: number;
  blink: number;
  stuck: number;
}

export interface Dock {
  x: number;
  y: number;
  w: number;
  h: number;
  owner: number | null;
}

export interface Crate {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RobotPointer {
  x: number;
  y: number;
  active: boolean;
}

export type RobotWorldEvent =
  | { kind: "dock"; x: number; y: number; id: number }
  | { kind: "undock"; x: number; y: number; id: number }
  | { kind: "job"; x: number; y: number; id: number }
  | { kind: "low"; x: number; y: number; id: number };

export interface RobotWorldOptions {
  robots?: RobotSpec[];
  count?: number;
  seed?: number;
  scale?: number;
}

const KINDS: RobotKind[] = ["scout", "hauler", "sentinel"];
const KIND_SPEED: Record<RobotKind, number> = { scout: 1.18, hauler: 0.86, sentinel: 0.98 };
const KIND_TURN: Record<RobotKind, number> = { scout: 2.8, hauler: 1.9, sentinel: 2.2 };
const KIND_SIZE: Record<RobotKind, number> = { scout: 0.86, hauler: 1.16, sentinel: 1 };

const LOW_BATTERY = 26;
const CHARGE_RATE = 30;
const DRAIN_MOVING = 2.0;
const DRAIN_IDLE = 0.55;

/**
 * A small fleet of tracked robots on a factory floor. Each robot patrols,
 * stops to scan, avoids its neighbours and the crates, and returns to a
 * charging bay when its battery gets low. Deterministic for a given seed.
 */
export class RobotWorld {
  robots: Robot[] = [];
  docks: Dock[] = [];
  crates: Crate[] = [];
  pointer: RobotPointer = { x: 0, y: 0, active: false };
  events: RobotWorldEvent[] = [];
  time = 0;
  width = 0;
  height = 0;

  private seed: number;
  private rng: Rng;
  private options: RobotWorldOptions;
  private baseLength = 30;
  private nextId = 1;

  constructor(options: RobotWorldOptions = {}) {
    this.options = options;
    this.seed = options.seed ?? Math.floor(Math.random() * 0x100000000);
    this.rng = createRng(this.seed);
  }

  resize(width: number, height: number, _cellW: number, _cellH: number) {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const first = this.width === 0;
    const oldW = this.width;
    const oldH = this.height;
    this.width = w;
    this.height = h;
    this.baseLength = clamp(Math.min(w, h) * 0.09, 48, 96);

    if (first || this.robots.length === 0) {
      this.reset();
      return;
    }
    if (w === oldW && h === oldH) return;

    const sx = w / Math.max(1, oldW);
    const sy = h / Math.max(1, oldH);
    for (const r of this.robots) {
      r.x = clamp(r.x * sx, r.length, w - r.length);
      r.y = clamp(r.y * sy, r.length, h - r.length);
      r.targetX = clamp(r.targetX * sx, 0, w);
      r.targetY = clamp(r.targetY * sy, 0, h);
      r.length = this.robotLength(r.kind, r.sizeScale);
    }
    for (const c of this.crates) {
      c.x = clamp(c.x * sx, 0, w);
      c.y = clamp(c.y * sy, 0, h);
      c.w = clamp(c.w * sx, 30, w * 0.4);
      c.h = clamp(c.h * sy, 24, h * 0.3);
    }
    this.layoutDocks();
  }

  setOptions(options: RobotWorldOptions) {
    this.options = { ...this.options, ...options };
    if (options.seed !== undefined) this.seed = options.seed;
    if (
      options.seed !== undefined ||
      options.count !== undefined ||
      options.robots !== undefined ||
      options.scale !== undefined
    ) {
      this.reset();
    }
  }

  /** Send the nearest idle robot to a point. Returns the chosen robot. */
  dispatch(x: number, y: number): Robot | null {
    let best: Robot | null = null;
    let bestDist = Infinity;
    for (const r of this.robots) {
      if (r.state !== "patrol" && r.state !== "scan") continue;
      const d = (r.x - x) ** 2 + (r.y - y) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = r;
      }
    }
    if (!best) return null;
    best.state = "job";
    best.stateTime = 0;
    best.targetX = clamp(x, 0, this.width);
    best.targetY = clamp(y, 0, this.height);
    this.events.push({ kind: "job", x: best.targetX, y: best.targetY, id: best.id });
    return best;
  }

  step(dt: number) {
    if (this.width < 2 || this.height < 2) return;
    this.time += dt;
    for (const r of this.robots) this.stepRobot(r, dt);
  }

  private reset() {
    this.time = 0;
    this.events.length = 0;
    this.nextId = 1;
    this.rng = createRng(this.seed);
    this.layoutDocks();
    this.crates = this.makeCrates();
    const specs = this.options.robots?.length
      ? this.options.robots
      : Array.from({ length: this.count() }, (_, i) => ({ kind: KINDS[i % KINDS.length] }));
    this.robots = specs.map((spec, i) => this.makeRobot(spec, i));
  }

  private count() {
    const ideal = Math.round((this.width * this.height) / 90000);
    return clamp(this.options.count ?? ideal, 1, 16);
  }

  private layoutDocks() {
    const n = this.width < 760 ? 2 : 3;
    const margin = clamp(this.width * 0.025, 16, 36);
    const padW = clamp(this.width * 0.085, 58, 120);
    const padH = clamp(this.height * 0.06, 40, 70);
    const y = this.height - padH * 0.5 - margin;
    const old = this.docks;
    this.docks = Array.from({ length: n }, (_, i) => ({
      x: (this.width * (i + 1)) / (n + 1),
      y,
      w: padW,
      h: padH,
      owner: old[i]?.owner ?? null,
    }));
    for (const dock of this.docks) {
      if (dock.owner != null && !this.robots.some((r) => r.id === dock.owner)) dock.owner = null;
    }
  }

  private makeCrates(): Crate[] {
    const specs = this.width < 760
      ? [
          [0.2, 0.3, 0.16, 0.12],
          [0.72, 0.24, 0.14, 0.1],
        ]
      : [
          [0.17, 0.28, 0.13, 0.11],
          [0.7, 0.2, 0.11, 0.09],
          [0.44, 0.5, 0.14, 0.12],
        ];
    return specs.map(([x, y, w, h]) => ({
      x: this.width * x + this.rng.range(-12, 12),
      y: this.height * y + this.rng.range(-10, 10),
      w: Math.max(34, this.width * w),
      h: Math.max(26, this.height * h),
    }));
  }

  private makeRobot(spec: RobotSpec, index: number): Robot {
    const kind = spec.kind ?? KINDS[index % KINDS.length];
    const sizeScale = spec.size ?? 1;
    const length = this.robotLength(kind, sizeScale);
    const margin = length + 12;
    let x = this.width * 0.5;
    let y = this.height * 0.35;
    for (let attempt = 0; attempt < 40; attempt++) {
      const tx = this.rng.range(margin, Math.max(margin + 1, this.width - margin));
      const ty = this.rng.range(margin, Math.max(margin + 1, this.height * 0.68));
      if (this.insideCrate(tx, ty, length * 0.7)) continue;
      const crowded = this.robots.some((r) => Math.hypot(r.x - tx, r.y - ty) < (r.length + length) * 0.9);
      if (crowded) continue;
      x = tx;
      y = ty;
      break;
    }
    const robot: Robot = {
      id: this.nextId++,
      kind,
      x,
      y,
      heading: this.rng.range(0, TAU),
      speed: 0,
      length,
      sizeScale,
      battery: this.rng.range(38, 94),
      state: "patrol",
      stateTime: 0,
      targetX: x,
      targetY: y,
      dock: -1,
      scan: this.rng.range(0, TAU),
      tread: this.rng.range(0, 8),
      blink: this.rng.range(0, TAU),
      stuck: 0,
    };
    this.pickTarget(robot);
    return robot;
  }

  private robotLength(kind: RobotKind, sizeScale: number) {
    return this.baseLength * KIND_SIZE[kind] * sizeScale * (this.options.scale ?? 1);
  }

  private insideCrate(x: number, y: number, margin: number) {
    return this.crates.some(
      (c) =>
        x > c.x - c.w / 2 - margin &&
        x < c.x + c.w / 2 + margin &&
        y > c.y - c.h / 2 - margin &&
        y < c.y + c.h / 2 + margin,
    );
  }

  private pickTarget(r: Robot) {
    const margin = r.length + 20;
    for (let attempt = 0; attempt < 16; attempt++) {
      const x = this.rng.range(margin, Math.max(margin + 1, this.width - margin));
      const y = this.rng.range(margin, Math.max(margin + 1, this.height * 0.8));
      if (this.insideCrate(x, y, r.length * 0.6)) continue;
      if (Math.hypot(x - r.x, y - r.y) < 90) continue;
      r.targetX = x;
      r.targetY = y;
      return;
    }
    r.targetX = this.width * 0.5;
    r.targetY = this.height * 0.35;
  }

  private stepRobot(r: Robot, dt: number) {
    if (r.state !== "charge") {
      const drain = r.speed > 4 ? DRAIN_MOVING : DRAIN_IDLE;
      r.battery = Math.max(0, r.battery - drain * dt);
    }
    if (r.battery <= LOW_BATTERY && r.state !== "dock" && r.state !== "charge") {
      this.startDock(r);
    }

    const dock = r.dock >= 0 ? this.docks[r.dock] : undefined;
    switch (r.state) {
      case "patrol": {
        if (this.arrived(r, 12)) {
          r.state = "scan";
          r.stateTime = this.rng.range(0.8, 1.8);
          r.scan = 0;
        }
        break;
      }
      case "scan": {
        r.stateTime -= dt;
        r.scan += dt * 3.4;
        if (r.stateTime <= 0) {
          r.state = "patrol";
          this.pickTarget(r);
        }
        break;
      }
      case "job": {
        r.stateTime += dt;
        if (this.arrived(r, 12) || r.stateTime > 14) {
          r.state = "patrol";
          this.pickTarget(r);
        }
        break;
      }
      case "dock": {
        if (!dock) {
          r.state = "patrol";
          r.dock = -1;
          this.pickTarget(r);
          break;
        }
        if (dock.owner != null && dock.owner !== r.id) {
          r.targetX = dock.x;
          r.targetY = dock.y - dock.h * 1.5;
        } else {
          dock.owner = r.id;
          r.targetX = dock.x;
          r.targetY = dock.y;
          if (this.arrived(r, Math.max(9, r.length * 0.35))) {
            r.state = "charge";
            r.stateTime = 0;
            r.speed = 0;
            this.events.push({ kind: "dock", x: dock.x, y: dock.y, id: r.id });
          }
        }
        break;
      }
      case "charge": {
        r.battery = Math.min(100, r.battery + CHARGE_RATE * dt);
        r.stateTime += dt;
        if (r.battery >= 100) {
          if (dock) dock.owner = null;
          r.dock = -1;
          r.state = "patrol";
          this.pickTarget(r);
          this.events.push({ kind: "undock", x: r.x, y: r.y, id: r.id });
        }
        break;
      }
    }

    this.drive(r, dt);
    r.blink += dt * 2.2;
  }

  private startDock(r: Robot) {
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < this.docks.length; i++) {
      const dock = this.docks[i];
      if (dock.owner != null && dock.owner !== r.id) continue;
      const d = Math.hypot(dock.x - r.x, dock.y - r.y);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    if (best < 0) {
      for (let i = 0; i < this.docks.length; i++) {
        const d = Math.hypot(this.docks[i].x - r.x, this.docks[i].y - r.y);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
    }
    if (best < 0) return;
    r.dock = best;
    r.state = "dock";
    r.stateTime = 0;
    r.targetX = this.docks[best].x;
    r.targetY = this.docks[best].y;
    this.events.push({ kind: "low", x: r.x, y: r.y, id: r.id });
  }

  private arrived(r: Robot, radius: number) {
    return Math.hypot(r.targetX - r.x, r.targetY - r.y) < radius;
  }

  private drive(r: Robot, dt: number) {
    const desired = this.desiredHeading(r);
    const diff = angleDiff(r.heading, desired);
    const turnRate = KIND_TURN[r.kind] * (r.speed < 8 ? 1.25 : 1);
    r.heading += clamp(diff, -turnRate * dt, turnRate * dt);

    const target = this.targetSpeed(r, desired);
    const accel = 82;
    if (r.speed < target) r.speed = Math.min(target, r.speed + accel * dt);
    else r.speed = Math.max(target, r.speed - accel * 1.7 * dt);

    r.x += Math.cos(r.heading) * r.speed * dt;
    r.y += Math.sin(r.heading) * r.speed * dt;
    r.tread += r.speed * dt * 0.13;

    const pad = r.length * 0.52;
    if (r.x < pad) r.x = pad;
    if (r.y < pad) r.y = pad;
    if (r.x > this.width - pad) r.x = this.width - pad;
    if (r.y > this.height - pad) r.y = this.height - pad;

    if (target > 8 && r.speed < 4) r.stuck += dt;
    else r.stuck = Math.max(0, r.stuck - dt * 2);
    if (r.stuck > 1.5) {
      r.stuck = 0;
      r.heading += this.rng.next() < 0.5 ? 0.8 : -0.8;
      if (r.state === "patrol" || r.state === "job") this.pickTarget(r);
    }
  }

  private targetSpeed(r: Robot, desired: number) {
    if (r.state === "scan" || r.state === "charge") return 0;
    let base = 54 * (this.baseLength / 32) * KIND_SPEED[r.kind];
    if (r.state === "dock") base *= 0.85;
    if (r.state === "job") base *= 1.15;
    if (r.battery < LOW_BATTERY) base *= 0.8;
    const dist = Math.hypot(r.targetX - r.x, r.targetY - r.y);
    if (dist < 46) base *= Math.max(0.2, dist / 46);
    const diff = Math.abs(angleDiff(r.heading, desired));
    if (diff > 1) base *= 0.25;
    else if (diff > 0.5) base *= 0.62;
    return base;
  }

  private desiredHeading(r: Robot) {
    let dx = r.targetX - r.x;
    let dy = r.targetY - r.y;
    let ax = 0;
    let ay = 0;

    for (const other of this.robots) {
      if (other === r) continue;
      const ox = r.x - other.x;
      const oy = r.y - other.y;
      const d = Math.hypot(ox, oy);
      const minD = (r.length + other.length) * 0.95;
      if (d > 0.001 && d < minD) {
        const push = (1 - d / minD) * 2.6;
        ax += (ox / d) * push;
        ay += (oy / d) * push;
      }
    }

    for (const c of this.crates) {
      const nx = clamp(r.x, c.x - c.w / 2, c.x + c.w / 2);
      const ny = clamp(r.y, c.y - c.h / 2, c.y + c.h / 2);
      let ox = r.x - nx;
      let oy = r.y - ny;
      let d = Math.hypot(ox, oy);
      const minD = r.length * 0.62 + 10;
      if (d < 0.001) {
        // Centre is inside the crate: push out along the nearest face.
        const left = r.x - (c.x - c.w / 2);
        const right = c.x + c.w / 2 - r.x;
        const top = r.y - (c.y - c.h / 2);
        const bottom = c.y + c.h / 2 - r.y;
        const m = Math.min(left, right, top, bottom);
        if (m === left) { ox = -1; oy = 0; }
        else if (m === right) { ox = 1; oy = 0; }
        else if (m === top) { ox = 0; oy = -1; }
        else { ox = 0; oy = 1; }
        d = 1;
      }
      if (d < minD) {
        const push = (1 - d / minD) * 3.2;
        ax += (ox / d) * push;
        ay += (oy / d) * push;
      }
    }

    const wall = r.length * 0.9;
    if (r.x < wall) ax += (1 - r.x / wall) * 3;
    if (r.x > this.width - wall) ax -= (1 - (this.width - r.x) / wall) * 3;
    if (r.y < wall) ay += (1 - r.y / wall) * 3;
    if (r.y > this.height - wall) ay -= (1 - (this.height - r.y) / wall) * 3;

    if (this.pointer.active && r.state !== "job") {
      const ox = r.x - this.pointer.x;
      const oy = r.y - this.pointer.y;
      const d = Math.hypot(ox, oy);
      const minD = r.length * 2.4;
      if (d > 0.001 && d < minD) {
        const push = (1 - d / minD) * 2.2;
        ax += (ox / d) * push;
        ay += (oy / d) * push;
      }
    }

    if (ax !== 0 || ay !== 0) {
      dx += ax * r.length * 2.4;
      dy += ay * r.length * 2.4;
    }
    if (Math.abs(dx) + Math.abs(dy) < 0.001) return r.heading;
    return Math.atan2(dy, dx);
  }
}
