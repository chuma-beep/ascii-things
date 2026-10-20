import { angleDiff, clamp, current, TAU } from "../math";
import { createRng, type Rng } from "../rng";

export type JellyfishKind = "moon" | "lion" | "box" | "atolla" | "crystal";

export interface JellyfishSpec {
  kind?: JellyfishKind;
  size?: number;
}

export interface Jellyfish {
  id: number;
  kind: JellyfishKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  radius: number;
  sizeScale: number;
  depth: number;
  phase: number;
  contract: number;
  tilt: number;
  tentaclePhase: number;
}

export interface Plankton {
  x: number;
  y: number;
  vx: number;
  vy: number;
  depth: number;
  phase: number;
}

export interface PulseRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  age: number;
  life: number;
  kind: JellyfishKind | "shock";
}

export interface JellyfishPointer {
  x: number;
  y: number;
  active: boolean;
}

export type JellyfishWorldEvent =
  | { kind: "pulse"; x: number; y: number; id: number }
  | { kind: "shock"; x: number; y: number };

export interface JellyfishWorldOptions {
  jellies?: JellyfishSpec[];
  count?: number;
  seed?: number;
  scale?: number;
}

interface KindConfig {
  speed: number;
  pulse: number;
  tentacles: number;
  tentacleLength: number;
  bellWidth: number;
}

const KINDS: JellyfishKind[] = ["moon", "lion", "box", "atolla", "crystal"];
const DEFAULT_ROSTER: JellyfishKind[] = ["moon", "moon", "lion", "box", "atolla", "crystal"];

export const KIND_CONFIG: Record<JellyfishKind, KindConfig> = {
  moon: { speed: 30, pulse: 0.55, tentacles: 5, tentacleLength: 1.7, bellWidth: 1.55 },
  lion: { speed: 34, pulse: 0.7, tentacles: 8, tentacleLength: 1.15, bellWidth: 1.42 },
  box: { speed: 55, pulse: 1.05, tentacles: 4, tentacleLength: 2.1, bellWidth: 1.3 },
  atolla: { speed: 24, pulse: 0.45, tentacles: 7, tentacleLength: 2.6, bellWidth: 1.48 },
  crystal: { speed: 40, pulse: 0.9, tentacles: 5, tentacleLength: 1.3, bellWidth: 1.24 },
};

/**
 * A drifting bloom of jellyfish. Each animal pulses along its heading, rides
 * a divergence-free current, trails tentacles behind its bell, and leaves a
 * bioluminescent ring on every contraction. Deterministic for a given seed.
 */
export class JellyfishWorld {
  jellies: Jellyfish[] = [];
  plankton: Plankton[] = [];
  rings: PulseRing[] = [];
  pointer: JellyfishPointer = { x: 0, y: 0, active: false };
  events: JellyfishWorldEvent[] = [];
  time = 0;
  width = 0;
  height = 0;

  private seed: number;
  private rng: Rng;
  private options: JellyfishWorldOptions;
  private baseRadius = 32;
  private nextId = 1;

  constructor(options: JellyfishWorldOptions = {}) {
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
    this.baseRadius = clamp(Math.min(w, h) * 0.08, 36, 105);

    if (first || this.jellies.length === 0) {
      this.reset();
      return;
    }
    if (w === oldW && h === oldH) return;

    const sx = w / Math.max(1, oldW);
    const sy = h / Math.max(1, oldH);
    for (const j of this.jellies) {
      j.x = clamp(j.x * sx, j.radius, w - j.radius);
      j.y = clamp(j.y * sy, j.radius, h - j.radius);
      j.radius = this.jellyRadius(j.kind, j.sizeScale, j.depth);
    }
    for (const p of this.plankton) {
      p.x = clamp(p.x * sx, 0, w);
      p.y = clamp(p.y * sy, 0, h);
    }
    this.rings.length = 0;
  }

  setOptions(options: JellyfishWorldOptions) {
    this.options = { ...this.options, ...options };
    if (options.seed !== undefined) this.seed = options.seed;
    if (
      options.seed !== undefined ||
      options.count !== undefined ||
      options.jellies !== undefined ||
      options.scale !== undefined
    ) {
      this.reset();
    }
  }

  /** A click sends a pressure wave through the water. */
  shockwave(x: number, y: number): PulseRing {
    const maxRadius = Math.min(this.width, this.height) * 0.62;
    const ring: PulseRing = {
      x,
      y,
      radius: 12,
      maxRadius,
      age: 0,
      life: 2.4,
      kind: "shock",
    };
    this.rings.push(ring);
    this.events.push({ kind: "shock", x, y });

    for (const j of this.jellies) {
      const dx = j.x - x;
      const dy = j.y - y;
      const d = Math.hypot(dx, dy);
      if (d < 1 || d > maxRadius) continue;
      const force = (1 - d / maxRadius) * 180;
      j.vx += (dx / d) * force;
      j.vy += (dy / d) * force;
      j.contract = 1;
      j.phase = 0.04;
    }
    for (const p of this.plankton) {
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.hypot(dx, dy);
      if (d < 1 || d > maxRadius) continue;
      const force = (1 - d / maxRadius) * 70;
      p.vx += (dx / d) * force;
      p.vy += (dy / d) * force;
    }
    return ring;
  }

  step(dt: number) {
    if (this.width < 2 || this.height < 2) return;
    this.time += dt;

    for (const j of this.jellies) this.stepJelly(j, dt);
    this.separate(dt);
    this.stepPlankton(dt);
    this.stepRings(dt);

    if (this.events.length > 64) this.events.splice(0, this.events.length - 64);
    if (this.rings.length > 90) this.rings.splice(0, this.rings.length - 90);
  }

  private reset() {
    this.time = 0;
    this.events.length = 0;
    this.rings.length = 0;
    this.nextId = 1;
    this.rng = createRng(this.seed);

    const sizes = [1.15, 0.9, 1.02, 0.82, 1.1, 0.95];
    const specs = this.options.jellies?.length
      ? this.options.jellies
      : Array.from({ length: this.count() }, (_, i) => ({
          kind: DEFAULT_ROSTER[i % DEFAULT_ROSTER.length],
          size: sizes[i % sizes.length],
        }));

    const placed: Jellyfish[] = [];
    for (let i = 0; i < specs.length; i++) {
      const jelly = this.makeJelly(specs[i], i);
      let bestX = jelly.x;
      let bestY = jelly.y;
      let bestClearance = -Infinity;
      if (i === 0) {
        // Give the bloom a hero animal near the middle of the frame.
        bestX = this.width * (0.5 + this.rng.range(-0.05, 0.05));
        bestY = this.height * (0.43 + this.rng.range(-0.05, 0.05));
        placed.push({ ...jelly, x: bestX, y: bestY });
        continue;
      }
      for (let attempt = 0; attempt < 20; attempt++) {
        const point = this.randomPoint(jelly.radius);
        let clearance = Infinity;
        for (const other of placed) {
          clearance = Math.min(
            clearance,
            Math.hypot(point.x - other.x, point.y - other.y) - other.radius,
          );
        }
        if (clearance > bestClearance) {
          bestClearance = clearance;
          bestX = point.x;
          bestY = point.y;
        }
      }
      jelly.x = bestX;
      jelly.y = bestY;
      placed.push(jelly);
    }
    this.jellies = placed;
    this.plankton = this.makePlankton();
  }

  private count() {
    const ideal = Math.round((this.width * this.height) / 210000);
    return clamp(this.options.count ?? ideal, 4, 12);
  }

  private jellyRadius(kind: JellyfishKind, sizeScale: number, depth: number) {
    const widthFactor = KIND_CONFIG[kind].bellWidth / 1.4;
    return this.baseRadius * sizeScale * (0.78 + depth * 0.34) * widthFactor;
  }

  private makeJelly(spec: JellyfishSpec, index: number): Jellyfish {
    const kind = spec.kind && KINDS.includes(spec.kind) ? spec.kind : "moon";
    const sizeScale = clamp(spec.size ?? 1, 0.45, 2);
    const depth = this.rng.range(0, 1);
    const radius = this.jellyRadius(kind, sizeScale, depth);
    const point = this.randomPoint(radius);
    return {
      id: this.nextId++,
      kind,
      x: point.x,
      y: point.y,
      vx: this.rng.range(-4, 4),
      vy: this.rng.range(-4, 4),
      heading: -Math.PI / 2 + this.rng.range(-0.65, 0.65),
      radius,
      sizeScale,
      depth,
      phase: this.rng.range(0, 1),
      contract: 0,
      tilt: 0,
      tentaclePhase: this.rng.range(0, TAU) + index * 0.7,
    };
  }

  private randomPoint(radius: number) {
    const margin = radius * 2.15;
    return {
      x: margin + this.rng.range(0, Math.max(1, this.width - margin * 2)),
      y: margin + this.rng.range(0, Math.max(1, this.height - margin * 2)),
    };
  }

  private makePlankton(): Plankton[] {
    const n = clamp(Math.round((this.width * this.height) / 9000), 50, 180);
    return Array.from({ length: n }, () => ({
      x: this.rng.range(0, this.width),
      y: this.rng.range(0, this.height),
      vx: this.rng.range(-2, 2),
      vy: this.rng.range(-2, 2),
      depth: this.rng.range(0, 1),
      phase: this.rng.range(0, TAU),
    }));
  }

  private stepJelly(j: Jellyfish, dt: number) {
    const cfg = KIND_CONFIG[j.kind];
    j.phase += dt * cfg.pulse * (0.85 + j.depth * 0.26);
    if (j.phase >= 1) {
      j.phase -= 1;
      this.rings.push({
        x: j.x,
        y: j.y,
        radius: j.radius * 0.85,
        maxRadius: j.radius * 4.2,
        age: 0,
        life: 1.8,
        kind: j.kind,
      });
      this.events.push({ kind: "pulse", x: j.x, y: j.y, id: j.id });
    }

    const contracting = j.phase < 0.3 ? Math.sin((j.phase / 0.3) * Math.PI) : 0;
    j.contract += (contracting - j.contract) * Math.min(1, dt * 16);

    j.heading += Math.sin(this.time * 0.32 + j.id * 1.9) * 0.26 * dt;

    const margin = Math.max(j.radius * 1.55, 18);
    let desired: number | null = null;
    if (j.x < margin) desired = 0;
    else if (j.x > this.width - margin) desired = Math.PI;
    if (j.y < margin) desired = Math.PI / 2;
    else if (j.y > this.height - margin) desired = -Math.PI / 2;
    if (desired == null && (j.x < margin || j.x > this.width - margin)) {
      desired = Math.atan2(this.height * 0.5 - j.y, this.width * 0.5 - j.x);
    }
    if (desired != null) {
      j.heading += clamp(angleDiff(j.heading, desired), -1.9 * dt, 1.9 * dt);
    }

    if (this.pointer.active) {
      const dx = j.x - this.pointer.x;
      const dy = j.y - this.pointer.y;
      const d = Math.hypot(dx, dy);
      if (d > 1 && d < 230) {
        const away = Math.atan2(dy, dx);
        j.heading += angleDiff(j.heading, away) * Math.min(1, dt * 1.1);
        const push = (1 - d / 230) * 26;
        j.vx += (dx / d) * push * dt;
        j.vy += (dy / d) * push * dt;
      }
    }

    const thrust = cfg.speed * (1.5 + j.depth * 0.5) * j.contract;
    j.vx += Math.cos(j.heading) * thrust * dt;
    j.vy += Math.sin(j.heading) * thrust * dt;

    const drag = Math.exp(-dt * (0.55 + (1 - j.contract) * 0.24));
    j.vx *= drag;
    j.vy *= drag;

    const maxSpeed = cfg.speed * 1.8;
    const speed = Math.hypot(j.vx, j.vy);
    if (speed > maxSpeed) {
      j.vx = (j.vx / speed) * maxSpeed;
      j.vy = (j.vy / speed) * maxSpeed;
    }

    current(j.x, j.y, this.time, CURRENTS);
    j.x += (j.vx + CURRENTS.x * 0.42) * dt;
    j.y += (j.vy + CURRENTS.y * 0.42) * dt;

    const pad = j.radius * 1.55;
    if (j.x < pad) {
      j.x = pad;
      j.vx = Math.abs(j.vx) * 0.35;
    } else if (j.x > this.width - pad) {
      j.x = this.width - pad;
      j.vx = -Math.abs(j.vx) * 0.35;
    }
    if (j.y < pad) {
      j.y = pad;
      j.vy = Math.abs(j.vy) * 0.35;
    } else if (j.y > this.height - pad) {
      j.y = this.height - pad;
      j.vy = -Math.abs(j.vy) * 0.35;
    }

    const targetTilt = clamp(j.vx / (cfg.speed * 1.3), -1, 1) * 0.38;
    j.tilt += (targetTilt - j.tilt) * Math.min(1, dt * 2.4);
  }

  private separate(dt: number) {
    for (let i = 0; i < this.jellies.length; i++) {
      const a = this.jellies[i];
      for (let k = i + 1; k < this.jellies.length; k++) {
        const b = this.jellies[k];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const min = (a.radius + b.radius) * 1.15;
        if (d < 1 || d >= min) continue;
        const force = ((min - d) / min) * 34;
        const nx = dx / d;
        const ny = dy / d;
        a.vx -= nx * force * dt;
        a.vy -= ny * force * dt;
        b.vx += nx * force * dt;
        b.vy += ny * force * dt;
      }
    }
  }

  private stepPlankton(dt: number) {
    for (const p of this.plankton) {
      current(p.x, p.y, this.time, CURRENTS);
      p.vx *= Math.exp(-dt * 0.8);
      p.vy *= Math.exp(-dt * 0.8);
      p.x += (p.vx + CURRENTS.x * 0.22) * dt;
      p.y += (p.vy + CURRENTS.y * 0.22) * dt;
      if (p.x < -12) p.x = this.width + 12;
      if (p.x > this.width + 12) p.x = -12;
      if (p.y < -12) p.y = this.height + 12;
      if (p.y > this.height + 12) p.y = -12;
    }
  }

  private stepRings(dt: number) {
    for (const ring of this.rings) {
      ring.age += dt;
      const t = clamp(ring.age / ring.life, 0, 1);
      const eased = 1 - (1 - t) ** 3;
      ring.radius = 10 + (ring.maxRadius - 10) * eased;
    }
    this.rings = this.rings.filter((ring) => ring.age < ring.life);
  }
}

const CURRENTS = { x: 0, y: 0 };
