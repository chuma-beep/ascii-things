import { createRng } from "../rng";
import type { AmbientEvent, AmbientKind, AmbientWorldOptions } from "./options";

const TAU = Math.PI * 2;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export interface Bird {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
}

export interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  rate: number;
  flare: number;
}

export interface Ant {
  x: number;
  y: number;
  angle: number;
  speed: number;
  carrying: boolean;
  phase: number;
}

export interface Crumb {
  x: number;
  y: number;
  amount: number;
}

export interface Koi {
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  speed: number;
  size: number;
  phase: number;
}

export interface Ripple {
  x: number;
  y: number;
  radius: number;
  age: number;
  life: number;
}

export interface Car {
  x: number;
  y: number;
  direction: 1 | -1;
  speed: number;
  color: number;
}

export interface Building {
  x: number;
  y: number;
  width: number;
  height: number;
  seed: number;
}

export interface ServerRack {
  x: number;
  y: number;
  width: number;
  height: number;
  leds: number[];
  phase: number;
}

export interface Packet {
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  speed: number;
}

export interface LilyPad {
  x: number;
  y: number;
  r: number;
  size: number;
  phase: number;
}

const DEFAULTS: Record<AmbientKind, number> = {
  starlings: 110,
  fireflies: 70,
  ants: 44,
  koi: 7,
  city: 18,
  servers: 8,
};

export class AmbientWorld {
  readonly kind: AmbientKind;
  readonly events: AmbientEvent[] = [];
  readonly pointer = { x: 0, y: 0, active: false };
  time = 0;
  width = 1;
  height = 1;
  cellWidth = 10;
  cellHeight = 18;
  birds: Bird[] = [];
  predator = { x: 0, y: 0, phase: 0 };
  fireflies: Firefly[] = [];
  ants: Ant[] = [];
  crumbs: Crumb[] = [];
  trail = new Map<number, number>();
  nest = { x: 0, y: 0 };
  koi: Koi[] = [];
  ripples: Ripple[] = [];
  lilyPads: LilyPad[] = [];
  cars: Car[] = [];
  buildings: Building[] = [];
  servers: ServerRack[] = [];
  packets: Packet[] = [];
  pulse = 0;
  alert = 0;
  delivered = 0;
  count: number;
  scale: number;
  private seed: number;
  private rng = createRng();
  private initialized = false;

  get food(): Crumb[] {
    return this.crumbs;
  }

  get pellets(): Crumb[] {
    return this.crumbs;
  }

  get pads(): LilyPad[] {
    return this.lilyPads;
  }

  constructor(kind: AmbientKind, options: AmbientWorldOptions = {}) {
    this.kind = kind;
    this.seed = options.seed ?? 1;
    this.count = Math.max(1, Math.round(options.count ?? DEFAULTS[kind]));
    this.scale = clamp(options.scale ?? 1, 0.5, 2);
  }

  resize(width: number, height: number, cellWidth: number, cellHeight: number) {
    const changed =
      Math.abs(width - this.width) > 1 ||
      Math.abs(height - this.height) > 1 ||
      Math.abs(cellWidth - this.cellWidth) > 0.5 ||
      Math.abs(cellHeight - this.cellHeight) > 0.5;
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.cellWidth = Math.max(1, cellWidth);
    this.cellHeight = Math.max(1, cellHeight);
    if (!this.initialized || changed) {
      this.initialized = true;
      this.reset();
    }
  }

  setOptions(options: AmbientWorldOptions) {
    let structural = false;
    if (options.seed !== undefined && options.seed !== this.seed) {
      this.seed = options.seed;
      structural = true;
    }
    if (options.count !== undefined) {
      const count = Math.max(1, Math.round(options.count));
      if (count !== this.count) {
        this.count = count;
        structural = true;
      }
    }
    if (options.scale !== undefined) {
      const scale = clamp(options.scale, 0.5, 2);
      if (scale !== this.scale) {
        this.scale = scale;
        structural = true;
      }
    }
    if (structural) this.reset();
  }

  act(action: string, x: number, y: number) {
    const px = clamp(x, 0, this.width);
    const py = clamp(y, 0, this.height);
    this.pointer.x = px;
    this.pointer.y = py;
    this.pointer.active = true;
    switch (action) {
      case "scatter": {
        const radius = Math.max(120, Math.min(this.width, this.height) * 0.34);
        for (const bird of this.birds) {
          const dx = bird.x - px;
          const dy = bird.y - py;
          const distance = Math.hypot(dx, dy);
          if (distance > radius || distance < 0.001) continue;
          const force = (1 - distance / radius) * 260;
          bird.vx += (dx / distance) * force;
          bird.vy += (dy / distance) * force;
        }
        this.events.push({ kind: "scatter", x: px, y: py });
        break;
      }
      case "flare":
        for (const fly of this.fireflies) {
          if (Math.hypot(fly.x - px, fly.y - py) < 190) fly.flare = 1.6;
        }
        this.events.push({ kind: "flare", x: px, y: py });
        break;
      case "crumb":
        this.crumb(px, py);
        break;
      case "feed":
        this.feed(px, py);
        break;
      case "rush":
        this.pulse = 3.5;
        this.events.push({ kind: "rush", x: px, y: py });
        break;
      case "ping":
        this.ping(px, py);
        break;
      default:
        break;
    }
  }

  crumb(x: number, y: number): AmbientEvent {
    const event: AmbientEvent = {
      kind: "crumb",
      x: clamp(x, 8, this.width - 8),
      y: clamp(y, 8, this.height - 8),
    };
    this.crumbs.push({
      x: event.x,
      y: event.y,
      amount: 2 + Math.floor(this.rng.range(0, 3)),
    });
    if (this.crumbs.length > 6) this.crumbs.shift();
    this.events.push(event);
    return event;
  }

  feed(x: number, y: number): Ripple {
    const ripple: Ripple = {
      x: clamp(x, 8, this.width - 8),
      y: clamp(y, 8, this.height - 8),
      radius: 2,
      age: 0,
      life: 2.8,
    };
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * TAU;
      const radius = 10 + this.rng.range(0, 22);
      this.crumbs.push({
        x: clamp(ripple.x + Math.cos(angle) * radius, 8, this.width - 8),
        y: clamp(ripple.y + Math.sin(angle) * radius, 8, this.height - 8),
        amount: 1,
      });
    }
    this.ripples.push(ripple);
    this.events.push({ kind: "feed", x: ripple.x, y: ripple.y });
    return ripple;
  }

  step(dt: number) {
    this.time += dt;
    switch (this.kind) {
      case "starlings":
        this.stepStarlings(dt);
        break;
      case "fireflies":
        this.stepFireflies(dt);
        break;
      case "ants":
        this.stepAnts(dt);
        break;
      case "koi":
        this.stepKoi(dt);
        break;
      case "city":
        this.stepCity(dt);
        break;
      case "servers":
        this.stepServers(dt);
        break;
    }
    if (this.events.length > 24) this.events.splice(0, this.events.length - 24);
  }

  private reset() {
    this.rng = createRng(this.seed);
    this.time = 0;
    this.birds = [];
    this.fireflies = [];
    this.ants = [];
    this.crumbs = [];
    this.trail.clear();
    this.koi = [];
    this.ripples = [];
    this.lilyPads = [];
    this.cars = [];
    this.buildings = [];
    this.servers = [];
    this.packets = [];
    this.pulse = 0;
    this.alert = 0;

    switch (this.kind) {
      case "starlings":
        this.resetStarlings();
        break;
      case "fireflies":
        this.resetFireflies();
        break;
      case "ants":
        this.resetAnts();
        break;
      case "koi":
        this.resetKoi();
        break;
      case "city":
        this.resetCity();
        break;
      case "servers":
        this.resetServers();
        break;
    }
  }

  private resetStarlings() {
    const cx = this.width * 0.5;
    const cy = this.height * 0.42;
    for (let i = 0; i < this.count; i++) {
      const angle = this.rng.range(0, TAU);
      const radius = this.rng.range(0, Math.min(this.width, this.height) * 0.28);
      this.birds.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius * 0.7,
        vx: this.rng.range(-32, 32),
        vy: this.rng.range(-18, 18),
        phase: this.rng.range(0, TAU),
      });
    }
    this.predator = { x: this.width * 0.2, y: this.height * 0.3, phase: 0 };
  }

  private resetFireflies() {
    for (let i = 0; i < this.count; i++) {
      this.fireflies.push({
        x: this.rng.range(0, this.width),
        y: this.rng.range(this.height * 0.28, this.height * 0.92),
        vx: this.rng.range(-8, 8),
        vy: this.rng.range(-5, 5),
        phase: this.rng.range(0, TAU),
        rate: this.rng.range(0.7, 2.4),
        flare: 0,
      });
    }
  }

  private resetAnts() {
    this.nest = { x: this.width * 0.5, y: this.height * 0.82 };
    for (let i = 0; i < this.count; i++) {
      const angle = this.rng.range(0, TAU);
      const distance = this.rng.range(0, 34);
      this.ants.push({
        x: this.nest.x + Math.cos(angle) * distance,
        y: this.nest.y + Math.sin(angle) * distance * 0.55,
        angle,
        speed: this.rng.range(22, 38),
        carrying: false,
        phase: this.rng.range(0, TAU),
      });
    }
    for (let i = 0; i < 4; i++) {
      this.crumbs.push({
        x: this.rng.range(this.width * 0.12, this.width * 0.88),
        y: this.rng.range(this.height * 0.26, this.height * 0.68),
        amount: 2 + i,
      });
    }
  }

  private resetKoi() {
    for (let i = 0; i < this.count; i++) {
      const vx = this.rng.range(-18, 18);
      const vy = this.rng.range(-8, 8);
      this.koi.push({
        x: this.rng.range(this.width * 0.12, this.width * 0.88),
        y: this.rng.range(this.height * 0.24, this.height * 0.82),
        vx,
        vy,
        size: this.rng.range(0.75, 1.3),
        phase: this.rng.range(0, TAU),
        heading: Math.atan2(vy, vx),
        speed: Math.hypot(vx, vy),
      });
    }
    for (let i = 0; i < 6; i++) {
      const size = this.rng.range(0.7, 1.4);
      this.lilyPads.push({
        x: this.rng.range(this.width * 0.08, this.width * 0.92),
        y: this.rng.range(this.height * 0.18, this.height * 0.86),
        size,
        r: size,
        phase: this.rng.range(0, TAU),
      });
    }
  }

  private resetCity() {
    const rows = 3;
    const rowHeight = this.height / (rows + 1);
    for (let row = 0; row < rows; row++) {
      let x = this.width * 0.04;
      const y = rowHeight * (row + 0.55);
      while (x < this.width * 0.94) {
        const width = this.rng.range(this.width * 0.055, this.width * 0.14);
        const height = this.rng.range(this.height * 0.12, this.height * 0.34);
        this.buildings.push({ x, y: y - height, width, height, seed: this.rng.int(0, 9999) });
        x += width + this.rng.range(this.width * 0.018, this.width * 0.05);
      }
    }
    for (let i = 0; i < this.count; i++) {
      const lane = i % 3;
      this.cars.push({
        x: this.rng.range(0, this.width),
        y: rowHeight * (lane + 1.08),
        direction: i % 2 === 0 ? 1 : -1,
        speed: this.rng.range(24, 58),
        color: this.rng.int(0, 3),
      });
    }
  }

  private resetServers() {
    const columns = 4;
    const rows = 2;
    const rackWidth = this.width / (columns + 1);
    const rackHeight = this.height / (rows + 2);
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const x = rackWidth * (column + 0.55);
        const y = rackHeight * (row + 0.55);
        const leds = Array.from({ length: 7 }, () => this.rng.range(0, TAU));
        this.servers.push({
          x,
          y,
          width: rackWidth * 0.72,
          height: rackHeight * 0.9,
          leds,
          phase: this.rng.range(0, TAU),
        });
      }
    }
  }

  private stepStarlings(dt: number) {
    this.predator.phase += dt;
    this.predator.x = this.width * (0.5 + 0.43 * Math.sin(this.time * 0.11));
    this.predator.y = this.height * (0.34 + 0.13 * Math.sin(this.time * 0.17 + 1.4));
    const cx = this.width * 0.5;
    const cy = this.height * 0.4;
    const neighbor = Math.max(90, Math.min(this.width, this.height) * 0.12);
    for (const bird of this.birds) {
      let ax = (cx - bird.x) * 0.08;
      let ay = (cy - bird.y) * 0.06;
      let alignX = 0;
      let alignY = 0;
      let closeX = 0;
      let closeY = 0;
      let neighbors = 0;
      for (const other of this.birds) {
        if (other === bird) continue;
        const dx = other.x - bird.x;
        const dy = other.y - bird.y;
        const distance = Math.hypot(dx, dy);
        if (distance > neighbor || distance < 0.001) continue;
        neighbors++;
        alignX += other.vx;
        alignY += other.vy;
        if (distance < neighbor * 0.42) {
          closeX -= (dx / distance) * (1 - distance / (neighbor * 0.42)) * 160;
          closeY -= (dy / distance) * (1 - distance / (neighbor * 0.42)) * 160;
        }
      }
      if (neighbors > 0) {
        ax += (alignX / neighbors - bird.vx) * 0.9;
        ay += (alignY / neighbors - bird.vy) * 0.9;
      }
      const px = bird.x - this.predator.x;
      const py = bird.y - this.predator.y;
      const predatorDistance = Math.hypot(px, py);
      if (predatorDistance < this.width * 0.19 && predatorDistance > 0.001) {
        const force = (1 - predatorDistance / (this.width * 0.19)) * 420;
        ax += (px / predatorDistance) * force;
        ay += (py / predatorDistance) * force;
      }
      bird.vx += (ax + closeX + Math.sin(this.time * 0.8 + bird.phase) * 4) * dt;
      bird.vy += (ay + closeY + Math.cos(this.time * 0.7 + bird.phase) * 3) * dt;
      bird.vx *= 0.985;
      bird.vy *= 0.985;
      const speed = Math.hypot(bird.vx, bird.vy);
      const maxSpeed = 105;
      if (speed > maxSpeed) {
        bird.vx = (bird.vx / speed) * maxSpeed;
        bird.vy = (bird.vy / speed) * maxSpeed;
      }
      bird.x += bird.vx * dt;
      bird.y += bird.vy * dt;
      if (bird.x < -20) bird.x = this.width + 20;
      if (bird.x > this.width + 20) bird.x = -20;
      if (bird.y < -20) bird.y = this.height + 20;
      if (bird.y > this.height + 20) bird.y = -20;
      bird.phase += dt;
    }
  }

  private stepFireflies(dt: number) {
    for (const fly of this.fireflies) {
      fly.vx += Math.sin(this.time * 0.45 + fly.phase) * 6 * dt;
      fly.vy += Math.cos(this.time * 0.38 + fly.phase * 1.3) * 4 * dt;
      fly.vx *= 0.99;
      fly.vy *= 0.99;
      fly.x += fly.vx * dt;
      fly.y += fly.vy * dt;
      if (fly.x < 0) fly.x = this.width;
      if (fly.x > this.width) fly.x = 0;
      if (fly.y < this.height * 0.2) fly.y = this.height * 0.2;
      if (fly.y > this.height * 0.94) fly.y = this.height * 0.94;
      fly.phase += dt * fly.rate;
      fly.flare = Math.max(0, fly.flare - dt * 0.65);
    }
  }

  private stepAnts(dt: number) {
    for (const [key, strength] of this.trail) {
      const next = strength - dt * 0.035;
      if (next <= 0.02) this.trail.delete(key);
      else this.trail.set(key, next);
    }
    for (const ant of this.ants) {
      let targetX = ant.x + Math.cos(ant.angle) * 40;
      let targetY = ant.y + Math.sin(ant.angle) * 40;
      if (ant.carrying) {
        targetX = this.nest.x;
        targetY = this.nest.y;
      } else if (this.crumbs.length > 0) {
        let nearest: Crumb | null = null;
        let nearestDistance = Infinity;
        for (const crumb of this.crumbs) {
          const distance = Math.hypot(crumb.x - ant.x, crumb.y - ant.y);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = crumb;
          }
        }
        if (nearest) {
          targetX = nearest.x;
          targetY = nearest.y;
          if (nearestDistance < 10) {
            nearest.amount--;
            ant.carrying = true;
            this.events.push({ kind: "crumb", x: nearest.x, y: nearest.y });
            if (nearest.amount <= 0) this.crumbs.splice(this.crumbs.indexOf(nearest), 1);
          }
        }
      }
      if (ant.carrying && Math.hypot(this.nest.x - ant.x, this.nest.y - ant.y) < 14) {
        ant.carrying = false;
        this.delivered += 1;
        this.events.push({ kind: "crumb", x: this.nest.x, y: this.nest.y });
      }
      const desired = Math.atan2(targetY - ant.y, targetX - ant.x);
      const delta = Math.atan2(Math.sin(desired - ant.angle), Math.cos(desired - ant.angle));
      ant.angle += delta * dt * 2.6 + Math.sin(this.time * 1.7 + ant.phase) * dt * 0.7;
      ant.x += Math.cos(ant.angle) * ant.speed * dt;
      ant.y += Math.sin(ant.angle) * ant.speed * dt * 0.72;
      ant.x = clamp(ant.x, 8, this.width - 8);
      ant.y = clamp(ant.y, 8, this.height - 8);
      const cell =
        Math.floor(ant.x / this.cellWidth) + Math.floor(ant.y / this.cellHeight) * 100000;
      this.trail.set(cell, Math.min(1.2, (this.trail.get(cell) ?? 0) + dt * 0.7));
    }
  }

  private stepKoi(dt: number) {
    for (const ripple of this.ripples) {
      ripple.age += dt;
      ripple.radius += dt * 34;
    }
    this.ripples = this.ripples.filter((ripple) => ripple.age < ripple.life);
    for (const fish of this.koi) {
      let targetX = fish.x + Math.cos(fish.phase) * 60;
      let targetY = fish.y + Math.sin(fish.phase * 0.8) * 40;
      if (this.crumbs.length > 0) {
        let nearest: Crumb | null = null;
        let nearestDistance = Infinity;
        for (const crumb of this.crumbs) {
          const distance = Math.hypot(crumb.x - fish.x, crumb.y - fish.y);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = crumb;
          }
        }
        if (nearest) {
          targetX = nearest.x;
          targetY = nearest.y;
          if (nearestDistance < 12) {
            nearest.amount--;
            this.ripples.push({ x: nearest.x, y: nearest.y, radius: 2, age: 0, life: 1.8 });
            this.events.push({ kind: "nibble", x: nearest.x, y: nearest.y });
            if (nearest.amount <= 0) this.crumbs.splice(this.crumbs.indexOf(nearest), 1);
          }
        }
      }
      const desiredX = targetX - fish.x;
      const desiredY = targetY - fish.y;
      const distance = Math.max(1, Math.hypot(desiredX, desiredY));
      fish.vx += (desiredX / distance) * 15 * dt;
      fish.vy += (desiredY / distance) * 10 * dt;
      fish.vx *= 0.985;
      fish.vy *= 0.985;
      const speed = Math.hypot(fish.vx, fish.vy);
      if (speed > 34) {
        fish.vx = (fish.vx / speed) * 34;
        fish.vy = (fish.vy / speed) * 34;
      }
      fish.x += fish.vx * dt;
      fish.y += fish.vy * dt;
      if (fish.x < 18 || fish.x > this.width - 18) fish.vx *= -1;
      if (fish.y < 18 || fish.y > this.height - 18) fish.vy *= -1;
      fish.x = clamp(fish.x, 18, this.width - 18);
      fish.y = clamp(fish.y, 18, this.height - 18);
      fish.heading = Math.atan2(fish.vy, fish.vx);
      fish.speed = Math.hypot(fish.vx, fish.vy);
      fish.phase += dt * 0.8;
    }
  }

  private stepCity(dt: number) {
    this.pulse = Math.max(0, this.pulse - dt);
    const boost = this.pulse > 0 ? 1 + this.pulse * 0.35 : 1;
    for (const car of this.cars) {
      car.x += car.direction * car.speed * boost * dt;
      if (car.x < -20) car.x = this.width + 20;
      if (car.x > this.width + 20) car.x = -20;
    }
  }

  private stepServers(dt: number) {
    this.alert = Math.max(0, this.alert - dt);
    for (const packet of this.packets) {
      packet.progress += dt * packet.speed;
    }
    const done = this.packets.filter((packet) => packet.progress >= 1);
    if (done.length > 0) {
      for (const packet of done) this.events.push({ kind: "ping", x: packet.toX, y: packet.toY });
      this.packets = this.packets.filter((packet) => packet.progress < 1);
    }
  }

  private ping(x: number, y: number) {
    if (this.servers.length === 0) return;
    let nearest = this.servers[0];
    let distance = Infinity;
    for (const server of this.servers) {
      const next = Math.hypot(server.x - x, server.y - y);
      if (next < distance) {
        distance = next;
        nearest = server;
      }
    }
    this.packets.push({
      x: nearest.x,
      y: nearest.y,
      fromX: nearest.x,
      fromY: nearest.y,
      toX: x,
      toY: y,
      progress: 0,
      speed: 0.6,
    });
    this.alert = 1.4;
    this.events.push({ kind: "ping", x, y });
  }
}
