import { clamp, TAU } from "../math";
import { createRng, type Rng } from "../rng";

export type DogState = "walk" | "trot" | "sniff" | "sit" | "alert" | "chase" | "charge";

export interface DogSpec {
  /** Relative body size. Default 1. */
  size?: number;
}

export interface Dog {
  id: number;
  x: number;
  y: number;
  heading: 1 | -1;
  length: number;
  sizeScale: number;
  state: DogState;
  stateTime: number;
  stateDuration: number;
  gait: number;
  battery: number;
  tail: number;
  blink: number;
  targetX: number;
  poseSit: number;
  poseSniff: number;
  charging: boolean;
  low: boolean;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
  spin: number;
  chasePending: boolean;
}

export interface DogDock {
  x: number;
  y: number;
  w: number;
  h: number;
  owner: number | null;
}

export interface DogCone {
  x: number;
  h: number;
  w: number;
}

export interface DogPointer {
  x: number;
  y: number;
  active: boolean;
}

export type DogWorldEvent =
  | { kind: "ball"; x: number; y: number }
  | { kind: "nudge"; x: number; y: number; id: number }
  | { kind: "charge"; x: number; y: number; id: number }
  | { kind: "low"; x: number; y: number; id: number }
  | { kind: "sit"; x: number; y: number; id: number };

export interface DogWorldOptions {
  dogs?: DogSpec[];
  count?: number;
  seed?: number;
  scale?: number;
  /** Normalized band (0–1 of width) where the pack starts. */
  spread?: [number, number];
}

const LOW_BATTERY = 18;
const CHARGE_RATE = 24;
const DRAIN_MOVING = 0.9;
const DRAIN_IDLE = 0.32;

/**
 * A robot dog on a test range. It patrols, trots, sniffs, sits, chases a
 * thrown ball, and returns to its dock when the battery gets low.
 * Deterministic for a given seed.
 */
export class DogWorld {
  dogs: Dog[] = [];
  ball: Ball = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    active: false,
    spin: 0,
    chasePending: false,
  };
  dock: DogDock = { x: 0, y: 0, w: 100, h: 18, owner: null };
  cones: DogCone[] = [];
  pointer: DogPointer = { x: 0, y: 0, active: false };
  events: DogWorldEvent[] = [];
  time = 0;
  width = 0;
  height = 0;
  groundY = 0;

  private seed: number;
  private rng: Rng;
  private options: DogWorldOptions;
  private baseLength = 110;
  private nextId = 1;

  constructor(options: DogWorldOptions = {}) {
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
    this.groundY = h * 0.73;
    this.baseLength = clamp(Math.min(w, h) * 0.2, 84, 190);

    if (first || this.dogs.length === 0) {
      this.reset();
      return;
    }
    if (w === oldW && h === oldH) return;

    const sx = w / Math.max(1, oldW);
    const sy = h / Math.max(1, oldH);
    for (const dog of this.dogs) {
      dog.x = clamp(dog.x * sx, this.edge(), w - this.edge());
      dog.y = this.groundY;
      dog.length = this.dogLength(dog.sizeScale);
      dog.targetX = clamp(dog.targetX * sx, this.edge(), w - this.edge());
    }
    this.ball.radius = this.ballRadius();
    this.ball.x = clamp(this.ball.x * sx, this.ball.radius, w - this.ball.radius);
    this.ball.y = this.groundY - this.ball.radius;
    this.layoutDock();
    this.layoutCones();
  }

  setOptions(options: DogWorldOptions) {
    this.options = { ...this.options, ...options };
    if (options.seed !== undefined) this.seed = options.seed;
    if (
      options.seed !== undefined ||
      options.count !== undefined ||
      options.dogs !== undefined ||
      options.scale !== undefined ||
      options.spread !== undefined
    ) {
      this.reset();
    }
  }

  /** Throw the ball toward a point. The nearest dog will give chase. */
  throwBall(x: number, y: number) {
    const radius = this.ballRadius();
    this.ball.x = clamp(x, radius, this.width - radius);
    this.ball.y = clamp(y, radius, this.groundY - radius);
    this.ball.vx = this.rng.range(-80, 80);
    this.ball.vy = -this.rng.range(210, 390);
    this.ball.radius = radius;
    this.ball.active = true;
    this.ball.spin = 0;
    this.ball.chasePending = true;
    this.events.push({ kind: "ball", x: this.ball.x, y: this.ball.y });
  }

  step(dt: number) {
    if (this.width < 2 || this.height < 2) return;
    this.time += dt;
    for (const dog of this.dogs) this.stepDog(dog, dt);
    this.stepBall(dt);
    if (this.events.length > 48) this.events.splice(0, this.events.length - 48);
  }

  private reset() {
    this.time = 0;
    this.events.length = 0;
    this.dock.owner = null;
    this.nextId = 1;
    this.rng = createRng(this.seed);
    this.layoutDock();
    this.layoutCones();

    const specs = this.options.dogs?.length
      ? this.options.dogs
      : Array.from({ length: this.count() }, () => ({ size: 1 }));
    this.dogs = specs.map((spec, i) => this.makeDog(spec, i, specs.length));

    const radius = this.ballRadius();
    this.ball = {
      x: this.width * 0.76,
      y: this.groundY - radius,
      vx: 0,
      vy: 0,
      radius,
      active: true,
      spin: 0,
      chasePending: false,
    };
  }

  private count() {
    const ideal = Math.round(this.width / 800);
    return clamp(this.options.count ?? ideal, 1, 3);
  }

  private dogLength(sizeScale: number) {
    return this.baseLength * (this.options.scale ?? 1) * sizeScale;
  }

  private ballRadius() {
    return clamp(this.baseLength * 0.09, 8, 17);
  }

  private edge() {
    return clamp(this.baseLength * 1.08, 60, 190);
  }

  private makeDog(spec: DogSpec, index: number, total = 1): Dog {
    const sizeScale = clamp(spec.size ?? 1, 0.55, 1.8);
    const length = this.dogLength(sizeScale);
    const [lo, hi] = this.options.spread ?? [0.28, 0.72];
    const spacing = total <= 1 ? (lo + hi) / 2 : lo + (index / (total - 1)) * (hi - lo);
    const x = clamp(
      this.width * spacing + this.rng.range(-18, 18),
      this.edge(),
      this.width - this.edge(),
    );
    const dog: Dog = {
      id: this.nextId++,
      x,
      y: this.groundY,
      heading: this.rng.next() < 0.5 ? -1 : 1,
      length,
      sizeScale,
      state: "walk",
      stateTime: 0,
      stateDuration: this.rng.range(2.5, 5),
      gait: this.rng.range(0, TAU),
      battery: this.rng.range(58, 94),
      tail: this.rng.range(0, TAU),
      blink: this.rng.range(0, 4),
      targetX: x + this.rng.range(-1, 1) * this.width * 0.2,
      poseSit: 0,
      poseSniff: 0,
      charging: false,
      low: false,
    };
    return dog;
  }

  private layoutDock() {
    const w = clamp(this.baseLength * 0.95, 72, 150);
    this.dock = {
      x: this.width - w / 2 - clamp(this.width * 0.045, 18, 46),
      y: this.groundY,
      w,
      h: clamp(this.baseLength * 0.16, 16, 28),
      owner: this.dock?.owner ?? null,
    };
    if (this.dock.owner != null && !this.dogs.some((d) => d.id === this.dock.owner)) {
      this.dock.owner = null;
    }
  }

  private layoutCones() {
    const h = clamp(this.baseLength * 0.42, 32, 70);
    this.cones = [
      { x: this.width * 0.16, h, w: h * 0.64 },
      { x: this.width * 0.34, h: h * 0.8, w: h * 0.54 },
      { x: this.width * 0.5, h, w: h * 0.64 },
      { x: this.width * 0.68, h: h * 0.8, w: h * 0.54 },
      { x: this.width * 0.84, h, w: h * 0.64 },
    ];
  }

  private stepDog(dog: Dog, dt: number) {
    dog.stateTime += dt;
    dog.blink = (dog.blink + dt) % 4.7;
    dog.tail += dt * (dog.state === "chase" ? 10 : dog.state === "sit" ? 1.3 : 4.4);
    const sitTarget = dog.state === "sit" || dog.state === "charge" ? 1 : 0;
    const sniffTarget = dog.state === "sniff" ? 1 : 0;
    dog.poseSit += (sitTarget - dog.poseSit) * Math.min(1, dt * 5);
    dog.poseSniff += (sniffTarget - dog.poseSniff) * Math.min(1, dt * 5);

    const moving = dog.state === "walk" || dog.state === "trot" || dog.state === "chase";
    dog.battery = clamp(dog.battery - dt * (moving ? DRAIN_MOVING : DRAIN_IDLE), 0, 100);

    if (dog.battery <= LOW_BATTERY && dog.state !== "charge") {
      if (!dog.low) {
        dog.low = true;
        this.events.push({ kind: "low", x: dog.x, y: dog.y, id: dog.id });
      }
      if (this.dock.owner == null || this.dock.owner === dog.id) {
        this.dock.owner = dog.id;
        this.setCharge(dog);
      }
    }

    if (dog.state === "charge") {
      this.stepCharge(dog, dt);
      return;
    }

    if (dog.state === "chase") {
      dog.gait += dt * 11;
      const arrived = this.moveToward(dog, this.ball.x, dog.length * 1.55, dt);
      if (arrived && this.ball.active) this.nudgeBall(dog);
      if (!this.ball.active || (!this.ball.chasePending && Math.abs(this.ball.vx) < 6)) {
        this.setState(dog, "alert", 0.9);
      }
      return;
    }

    if (dog.state === "walk" || dog.state === "trot") {
      const speed = dog.state === "trot" ? dog.length * 1.25 : dog.length * 0.52;
      dog.gait += dt * (speed / Math.max(1, dog.length)) * 8;
      const arrived = this.moveToward(dog, dog.targetX, speed, dt);
      if (arrived || dog.stateTime >= dog.stateDuration) this.decide(dog);
      return;
    }

    // sniff, sit, alert: hold the pose for a moment, then choose again.
    if (dog.stateTime >= dog.stateDuration) this.decide(dog);
  }

  private stepCharge(dog: Dog, dt: number) {
    const padX = this.dock.x - dog.length * 0.16;
    if (Math.abs(dog.x - padX) > 5) {
      this.moveToward(dog, padX, dog.length * 0.75, dt);
      dog.gait += dt * 7;
      return;
    }
    dog.x = padX;
    dog.heading = 1;
    dog.battery = clamp(dog.battery + CHARGE_RATE * dt, 0, 100);
    if (!dog.charging) {
      dog.charging = true;
      this.events.push({ kind: "charge", x: dog.x, y: dog.y, id: dog.id });
    }
    if (dog.battery >= 98) {
      dog.charging = false;
      dog.low = false;
      if (this.dock.owner === dog.id) this.dock.owner = null;
      this.setState(dog, "walk", this.rng.range(3, 6));
    }
  }

  private moveToward(dog: Dog, target: number, speed: number, dt: number) {
    const dx = target - dog.x;
    if (Math.abs(dx) < 3) return true;
    dog.heading = dx < 0 ? -1 : 1;
    dog.x = clamp(
      dog.x + dog.heading * Math.min(Math.abs(dx), speed * dt),
      this.edge(),
      this.width - this.edge(),
    );
    return false;
  }

  private decide(dog: Dog) {
    if (dog.battery <= LOW_BATTERY && (this.dock.owner == null || this.dock.owner === dog.id)) {
      this.dock.owner = dog.id;
      this.setCharge(dog);
      return;
    }
    if (this.ball.chasePending && this.ball.active) {
      this.setState(dog, "chase", 6);
      return;
    }
    const roll = this.rng.next();
    if (roll < 0.3) {
      this.setState(dog, "walk", this.rng.range(2.5, 5.5));
    } else if (roll < 0.52) {
      this.setState(dog, "trot", this.rng.range(1.6, 3.2));
    } else if (roll < 0.72) {
      this.setState(dog, "sniff", this.rng.range(1.8, 3.4));
    } else if (roll < 0.9) {
      this.setState(dog, "sit", this.rng.range(2.2, 4.4));
      this.events.push({ kind: "sit", x: dog.x, y: dog.y, id: dog.id });
    } else {
      this.setState(dog, "alert", this.rng.range(1, 1.8));
    }
  }

  private setState(dog: Dog, state: DogState, duration: number) {
    dog.state = state;
    dog.stateTime = 0;
    dog.stateDuration = duration;
    if (state === "walk" || state === "trot") {
      const reach = this.rng.range(0.16, 0.48) * this.width;
      const dir = this.rng.next() < 0.5 ? -1 : 1;
      dog.targetX = clamp(dog.x + dir * reach, this.edge(), this.width - this.edge());
    } else if (state === "alert" && this.pointer.active) {
      dog.targetX = clamp(this.pointer.x, this.edge(), this.width - this.edge());
      dog.heading = dog.targetX < dog.x ? -1 : 1;
    }
  }

  private setCharge(dog: Dog) {
    dog.state = "charge";
    dog.stateTime = 0;
    dog.stateDuration = Infinity;
    dog.charging = false;
    dog.targetX = this.dock.x - dog.length * 0.16;
  }

  private nudgeBall(dog: Dog) {
    if (this.ball.y < this.groundY - this.ball.radius * 2.2) return;
    dog.heading = this.ball.x < dog.x ? -1 : 1;
    this.ball.vx += dog.heading * this.rng.range(90, 180);
    this.ball.vy = -this.rng.range(130, 250);
    this.ball.chasePending = false;
    this.ball.spin += dog.heading * 2;
    this.events.push({ kind: "nudge", x: this.ball.x, y: this.ball.y, id: dog.id });
    this.setState(dog, "alert", 1.1);
  }

  private stepBall(dt: number) {
    const ball = this.ball;
    if (!ball.active) return;
    const floor = this.groundY - ball.radius;
    ball.vy += 900 * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.spin += ball.vx * dt * 0.08;

    if (ball.x < ball.radius) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx) * 0.6;
    } else if (ball.x > this.width - ball.radius) {
      ball.x = this.width - ball.radius;
      ball.vx = -Math.abs(ball.vx) * 0.6;
    }

    if (ball.y >= floor) {
      ball.y = floor;
      if (Math.abs(ball.vy) > 36) {
        ball.vy = -ball.vy * 0.52;
        ball.vx *= 0.86;
      } else {
        ball.vy = 0;
        ball.vx *= Math.exp(-dt * 0.8);
        if (Math.abs(ball.vx) < 2.5) ball.vx = 0;
      }
    }
  }
}
