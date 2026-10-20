import { clamp, hash3 } from "../math";
import { paintGrid } from "../renderer";
import { resolvePalette, type Palette, type PaletteName, type RGB } from "../palette";
import type { Ball, Dog, DogWorld } from "./world";

export interface DogRendererOptions {
  palette?: PaletteName | Palette;
  columns?: number;
  maxCells?: number;
  calm?: boolean;
}

const rgba = ([r, g, b]: RGB, a: number) => `rgba(${r},${g},${b},${a})`;

const distToSegment = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len > 0 ? clamp(((px - ax) * dx + (py - ay) * dy) / len, 0, 1) : 0;
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
};

/**
 * Draws a robot dog test range: grid, ground marks, cones, a charging pad,
 * a ball, and procedural quadruped silhouettes with a trotting gait.
 */
export class DogRenderer {
  private ctx: CanvasRenderingContext2D;
  private bg: HTMLCanvasElement;
  private dpr = 1;
  private width = 0;
  private height = 0;
  private cw = 12;
  private ch = 18;
  private cols = 0;
  private rows = 0;
  private fontFamily = "ui-monospace, Menlo, monospace";
  private columns = 150;
  private maxCells = 16000;
  private calm = false;
  private palette: Palette = resolvePalette();

  constructor(private canvas: HTMLCanvasElement, options: DogRendererOptions = {}) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2D canvas unavailable");
    this.ctx = ctx;
    this.bg = document.createElement("canvas");
    this.palette = resolvePalette(options.palette);
    this.columns = options.columns ?? 150;
    this.maxCells = options.maxCells ?? 16000;
    this.calm = options.calm ?? false;
  }

  get cellWidth() {
    return this.cw;
  }

  get cellHeight() {
    return this.ch;
  }

  get cellCount() {
    return this.cols * this.rows;
  }

  get columnCount() {
    return this.cols;
  }

  get rowCount() {
    return this.rows;
  }

  setFontFamily(family: string) {
    if (family) this.fontFamily = family;
  }

  setOptions(options: DogRendererOptions) {
    if (options.palette !== undefined) {
      this.palette = resolvePalette(options.palette);
      if (this.width > 0) this.paintBackground();
    }
    if (options.columns !== undefined) this.columns = Math.max(24, options.columns);
    if (options.maxCells !== undefined) this.maxCells = Math.max(0, options.maxCells);
    if (options.calm !== undefined) this.calm = options.calm;
  }

  resize(width: number, height: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    let cw = clamp(Math.round(width / Math.max(24, this.columns)), 8, 13);
    let ch = Math.round(cw * 1.45);
    let cols = Math.ceil(width / cw);
    let rows = Math.ceil(height / ch);
    while (this.maxCells > 0 && cols * rows > this.maxCells && cw < 64) {
      cw++;
      ch = Math.round(cw * 1.45);
      cols = Math.ceil(width / cw);
      rows = Math.ceil(height / ch);
    }
    this.cw = cw;
    this.ch = ch;
    this.cols = cols;
    this.rows = rows;

    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.bg.width = this.canvas.width;
    this.bg.height = this.canvas.height;
    this.paintBackground();
  }

  private paintBackground() {
    const g = this.bg.getContext("2d");
    if (!g) return;
    const { width: W, height: H, dpr, cw, ch } = this;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = this.palette.background;
    g.fillRect(0, 0, W, H);

    const wash = g.createLinearGradient(0, 0, 0, H);
    wash.addColorStop(0, rgba(this.palette.wake, 0.04));
    wash.addColorStop(0.68, "rgba(0,0,0,0)");
    wash.addColorStop(1, rgba(this.palette.edge, 0.045));
    g.fillStyle = wash;
    g.fillRect(0, 0, W, H);

    g.globalAlpha = 0.55;
    paintGrid(g, W, H, cw, ch, dpr, this.palette.grid);
    g.globalAlpha = 1;

    // A faded target pad anchors the empty middle of the yard.
    const ground = H * 0.73;
    const rx = Math.min(W * 0.18, 260);
    const ry = Math.min(H * 0.07, 58);
    g.strokeStyle = rgba(this.palette.edge, 0.13);
    g.lineWidth = 1;
    g.setLineDash([cw * 0.7, cw * 0.7]);
    g.beginPath();
    g.ellipse(W * 0.5, ground, rx, ry, 0, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.ellipse(W * 0.5, ground, rx * 0.62, ry * 0.62, 0, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    g.beginPath();
    g.moveTo(W * 0.5 - rx * 1.08, ground);
    g.lineTo(W * 0.5 + rx * 1.08, ground);
    g.moveTo(W * 0.5, ground - ry * 1.35);
    g.lineTo(W * 0.5, ground + ry * 0.4);
    g.stroke();
    g.font = `700 ${Math.round(ch * 1.05)}px ${this.fontFamily}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = rgba(this.palette.edge, 0.14);
    g.fillText("TEST 04", W * 0.5, ground - ry * 1.75);

    // Faint range signage, large enough to read at a glance but not compete.
    g.font = `700 ${Math.round(ch * 1.65)}px ${this.fontFamily}`;
    g.textAlign = "left";
    g.textBaseline = "top";
    g.fillStyle = rgba(this.palette.edge, 0.12);
    g.fillText("RANGE 04", cw * 1.5, ch * 1.5);

    g.font = `600 ${Math.round(ch * 0.62)}px ${this.fontFamily}`;
    g.fillStyle = rgba(this.palette.edge, 0.2);
    g.fillText("ROBOTIC QUADRUPED TEST YARD", cw * 1.6, ch * 3.5);

    // Vertical panel seams in the back wall.
    g.strokeStyle = rgba(this.palette.edge, 0.055);
    g.lineWidth = 1;
    for (let x = cw * 8; x < W; x += cw * 12) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, H * 0.57);
      g.stroke();
    }
  }

  render(world: DogWorld, _dt: number) {
    const { ctx, dpr, cols } = this;
    if (cols === 0) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.bg, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `600 ${Math.round(this.ch * 0.74)}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    this.drawGround(world);
    this.drawCones(world);
    this.drawDock(world);
    this.drawBall(world.ball);
    for (const dog of [...world.dogs].sort((a, b) => a.length - b.length)) {
      this.drawDog(dog, world.time);
    }
    if (world.dock.owner != null) this.drawCable(world);
    this.drawSparks(world);
  }

  private drawGround(world: DogWorld) {
    const { ctx, width: W, ch, cw } = this;
    const y = world.groundY;
    ctx.fillStyle = rgba(this.palette.edge, 0.16);
    ctx.fillRect(0, y, W, 1);
    ctx.fillStyle = rgba(this.palette.edge, 0.06);
    for (let i = 1; i <= 4; i++) ctx.fillRect(0, y + ch * 0.55 * i, W, 1);

    ctx.font = `600 ${Math.round(ch * 0.55)}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const step = cw * 5;
    for (let x = step; x < W; x += step) {
      ctx.fillStyle = rgba(this.palette.edge, 0.28);
      ctx.fillText("|", x, y - ch * 0.22);
      ctx.fillStyle = rgba(this.palette.edge, 0.2);
      ctx.fillText(`${Math.round(x / step) * 5}`, x, y + ch * 0.55);
    }

    // Caution hatching under the dock.
    const dock = world.dock;
    ctx.save();
    ctx.beginPath();
    ctx.rect(dock.x - dock.w / 2, y - ch * 1.2, dock.w, ch * 1.2);
    ctx.clip();
    ctx.strokeStyle = rgba(this.palette.heatHot, 0.16);
    ctx.lineWidth = 1;
    for (let x = dock.x - dock.w; x < dock.x + dock.w; x += cw * 2.6) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + ch * 1.2, y - ch * 1.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawCones(world: DogWorld) {
    const { ctx, ch } = this;
    for (const cone of world.cones) {
      this.forEachCell(cone.x - cone.w, world.groundY - cone.h - ch, cone.w * 2, cone.h + ch, (col, row) => {
        const cx = (col + 0.5) * this.cw;
        const cy = (row + 0.5) * this.ch;
        const v = (world.groundY - cy) / cone.h;
        if (v < 0 || v > 1) return;
        const half = (1 - v) * cone.w * 0.5;
        const u = Math.abs(cx - cone.x);
        if (u > half) return;
        const edge = u > half - this.cw * 0.55;
        ctx.fillStyle = edge
          ? rgba(this.palette.heatHot, 0.75)
          : rgba(this.palette.heatHot, 0.22 + v * 0.12);
        ctx.fillText(edge ? (cx < cone.x ? "/" : "\\") : "%", cx, cy);
      });
      ctx.fillStyle = rgba(this.palette.heatHot, 0.6);
      ctx.fillRect(cone.x - cone.w * 0.55, world.groundY - 2, cone.w * 1.1, 2);
    }
  }

  private drawDock(world: DogWorld) {
    const { ctx, ch } = this;
    const dock = world.dock;
    const y0 = dock.y - dock.h;
    ctx.fillStyle = rgba(this.palette.wake, dock.owner != null ? 0.09 : 0.04);
    ctx.fillRect(dock.x - dock.w / 2, y0, dock.w, dock.h);
    this.forEachCell(dock.x - dock.w / 2, y0, dock.w, dock.h, (col, row, edge) => {
      const cx = (col + 0.5) * this.cw;
      const cy = (row + 0.5) * this.ch;
      ctx.fillStyle = rgba(this.palette.wake, edge ? 0.55 : 0.22);
      ctx.fillText(edge ? "+" : "=", cx, cy);
    });
    ctx.font = `600 ${Math.round(ch * 0.46)}px ${this.fontFamily}`;
    ctx.fillStyle = rgba(this.palette.edge, 0.42);
    ctx.fillText("DOCK", dock.x, y0 - ch * 0.7);
  }

  private drawCable(world: DogWorld) {
    const dog = world.dogs.find((d) => d.id === world.dock.owner);
    if (!dog || !dog.charging) return;
    const from = { x: world.dock.x, y: world.groundY - world.dock.h * 0.5 };
    const to = { x: dog.x, y: dog.y - dog.length * 0.25 };
    const mx = (from.x + to.x) / 2;
    const my = Math.max(from.y, to.y) + dog.length * 0.15;
    this.bone(from, { x: mx, y: my }, dog.length * 0.018, rgba(this.palette.wake, 0.8), "~");
    this.bone({ x: mx, y: my }, to, dog.length * 0.018, rgba(this.palette.wake, 0.8), "~");
  }

  private drawBall(ball: Ball) {
    if (!ball.active) return;
    const { ctx } = this;
    const shadow = this.palette.dark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.12)";
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y + ball.radius * 0.88, ball.radius * 0.9, ball.radius * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 1; i <= 3; i++) {
      const x = ball.x - ball.vx * 0.018 * i;
      const y = ball.y - ball.vy * 0.018 * i + i * 2;
      ctx.fillStyle = rgba(this.palette.heatHot, 0.12 / i);
      ctx.fillText("·", x, y);
    }

    this.forEachCell(ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2, (col, row) => {
      const cx = (col + 0.5) * this.cw;
      const cy = (row + 0.5) * this.ch;
      const d = Math.hypot(cx - ball.x, cy - ball.y);
      if (d > ball.radius) return;
      const edge = d > ball.radius - this.cw * 0.7;
      const stripe = Math.sin(Math.atan2(cy - ball.y, cx - ball.x) * 2 + ball.spin) > 0.45;
      ctx.fillStyle = edge
        ? rgba(this.palette.edge, 0.8)
        : stripe
          ? rgba(this.palette.heatHot, 0.88)
          : rgba(this.palette.heatHot, 0.5);
      ctx.fillText(edge ? "*" : stripe ? "@" : "o", cx, cy);
    });
  }

  private drawDog(dog: Dog, time: number) {
    const L = dog.length;
    const H = L * 0.43;
    const leg = L * 0.43;
    const sit = dog.poseSit;
    const sniff = dog.poseSniff;
    const tilt = -sit * 0.2;
    const cos = Math.cos(tilt);
    const sin = Math.sin(tilt);
    const bodyY = dog.y - leg * (1 - sit * 0.34) - H / 2;
    const dir = dog.heading;
    const toWorld = (lx: number, ly: number) => ({
      x: dog.x + dir * (lx * cos - ly * sin),
      y: bodyY + lx * sin + ly * cos,
    });

    this.drawShadow(dog, L);

    // Tail first, then legs, so the body overlaps their roots.
    const tailBase = toWorld(-L * 0.48, -H * 0.18);
    const wag = Math.sin(dog.tail) * (dog.state === "chase" ? 0.55 : 0.32);
    const tailMid = {
      x: tailBase.x - dir * L * 0.14,
      y: tailBase.y - L * 0.16 + wag * L * 0.05,
    };
    const tailTip = {
      x: tailBase.x - dir * L * 0.25,
      y: tailBase.y - L * 0.27 + wag * L * 0.14,
    };
    this.bone(tailBase, tailMid, L * 0.022, this.palette.fish[2], "~");
    this.bone(tailMid, tailTip, L * 0.018, this.palette.fish[2], "~");
    this.ctx.fillStyle = rgba(this.palette.wake, 0.85);
    this.ctx.fillText("*", tailTip.x, tailTip.y);

    const moving = dog.state === "walk" || dog.state === "trot" || dog.state === "chase";
    const stride = moving ? L * 0.18 : 0;
    const lift = moving ? L * 0.13 : 0;
    const legs = [
      { x: L * 0.3, off: Math.PI, front: true, near: true },
      { x: L * 0.34, off: 0, front: true, near: false },
      { x: -L * 0.32, off: 0, front: false, near: true },
      { x: -L * 0.36, off: Math.PI, front: false, near: false },
    ];

    for (const spec of legs) {
      const hip = toWorld(spec.x, H * 0.4);
      const phase = dog.gait + spec.off;
      let footX: number;
      let footY: number;
      if (sit > 0.35) {
        footX = dog.x + dir * (spec.front ? L * 0.36 : -L * 0.08);
        footY = dog.y;
      } else {
        footX = dog.x + dir * (spec.x + Math.sin(phase) * stride);
        footY = dog.y - Math.max(0, Math.sin(phase)) * lift;
      }
      const knee = {
        x: (hip.x + footX) / 2 + dir * (spec.front ? L * 0.035 : -L * 0.05) * (1 - sit * 0.8),
        y: (hip.y + footY) / 2 - L * 0.06 - sit * (spec.front ? 0 : H * 0.32),
      };
      if (sit > 0.35 && !spec.front) {
        knee.x = dog.x - dir * L * 0.28;
        knee.y = dog.y - H * 0.42;
      }
      this.bone(hip, knee, L * 0.055, spec.near ? this.palette.fish[3] : this.palette.fish[2], "@");
      this.bone(knee, { x: footX, y: footY }, L * 0.045, spec.near ? this.palette.fish[3] : this.palette.fish[2], "@");
      this.ctx.fillStyle = spec.near ? rgba(this.palette.edge, 0.85) : rgba(this.palette.edge, 0.55);
      this.ctx.fillText("#", footX, footY - this.ch * 0.25);
      this.ctx.fillStyle = rgba(this.palette.wake, 0.7);
      this.ctx.fillText("o", knee.x, knee.y);
    }

    this.drawBody(dog, toWorld, tilt, dir, bodyY, H, sit);

    // Neck and head, lifted clear of the shoulders so the silhouette reads
    // as a quadruped rather than a table.
    const head = toWorld(L * 0.58, -H * 0.92 + sniff * H * 0.35);
    const neckBase = toWorld(L * 0.38, -H * 0.42);
    this.bone(neckBase, head, L * 0.115, this.palette.fish[3], "#");
    // Collar: a bright band where the neck meets the head.
    this.bone(
      toWorld(L * 0.46, -H * 0.68),
      toWorld(L * 0.46, -H * 0.38),
      L * 0.035,
      this.palette.fish[4],
      "=",
    );
    this.drawHead(dog, head, L, H, sniff, time);

    this.drawStatus(dog, bodyY - H * 0.75, L);
  }

  private drawBody(
    dog: Dog,
    toWorld: (lx: number, ly: number) => { x: number; y: number },
    tilt: number,
    dir: 1 | -1,
    bodyY: number,
    H: number,
    sit: number,
  ) {
    const { ctx } = this;
    const L = dog.length;
    const cos = Math.cos(tilt);
    const sin = Math.sin(tilt);
    const reach = L * 0.6;
    this.forEachCell(dog.x - reach, bodyY - reach, reach * 2, reach * 2, (col, row) => {
      const cx = (col + 0.5) * this.cw;
      const cy = (row + 0.5) * this.ch;
      const dx = dir * (cx - dog.x);
      const dy = cy - bodyY;
      const lx = dx * cos + dy * sin;
      const ly = -dx * sin + dy * cos;
      // Deeper chest at the front, tucked waist at the rear.
      const chest = clamp(lx / L + 0.5, 0, 1);
      const bottom = H * (0.5 + 0.14 * chest);
      if (Math.abs(lx) > L * 0.5 || ly < -H * 0.5 || ly > bottom) return;
      const corner = Math.min(L * 0.09, H * 0.16);
      if (
        (Math.abs(lx) > L * 0.5 - corner && Math.abs(ly) > H * 0.5 - corner) &&
        (Math.abs(lx) - (L * 0.5 - corner)) / corner + (Math.abs(ly) - (H * 0.5 - corner)) / corner > 1
      ) {
        return;
      }
      const edge =
        Math.abs(lx) > L * 0.5 - L * 0.055 ||
        ly < -H * 0.5 + H * 0.08 ||
        ly > bottom - H * 0.08;
      const seam = Math.abs(lx) < L * 0.015 || Math.abs(Math.abs(lx) - L * 0.23) < L * 0.008;
      const spine = ly < -H * 0.28 && Math.abs(lx) < L * 0.3;
      let glyph = edge ? "#" : seam ? "%" : spine ? "=" : "@";
      if (!edge && !seam && !spine && hash3(col, row, dog.id) > 0.9) glyph = ":";
      // Bright outline over a translucent panel: a robot blueprint, not a
      // solid white slab.
      ctx.fillStyle = edge ? this.palette.fish[4] : rgba(this.palette.edge, 0.16);
      ctx.fillRect(cx - this.cw / 2, cy - this.ch / 2, this.cw, this.ch);
      ctx.fillStyle = edge
        ? this.palette.textOnBody
        : seam || spine
          ? rgba(this.palette.wake, 0.62)
          : rgba(this.palette.edge, 0.58);
      ctx.fillText(glyph, cx, cy);
    });

    // Shoulder and hip rings, drawn over the panels.
    const ring = (lx: number) => {
      const p = toWorld(lx, H * 0.04);
      ctx.fillStyle = rgba(this.palette.wake, 0.75);
      ctx.fillText("O", p.x, p.y);
    };
    ring(L * 0.28);
    ring(-L * 0.3);

    if (sit > 0.4) {
      const hip = toWorld(-L * 0.3, H * 0.3);
      ctx.fillStyle = rgba(this.palette.edge, 0.5);
      ctx.fillText("=", hip.x, hip.y + H * 0.3);
    }
  }

  private drawHead(dog: Dog, head: { x: number; y: number }, L: number, H: number, sniff: number, time: number) {
    const { ctx } = this;
    const dir = dog.heading;
    const hw = L * 0.24;
    const hh = L * 0.2;
    this.panel(head.x, head.y, hw, hh, this.palette.fish[3], "#", "@");

    // A muzzle that projects from the head, with a nose at the tip.
    const snoutX = head.x + dir * hw * 0.82;
    const snoutY = head.y + hh * 0.3;
    this.panel(snoutX, snoutY, hw * 0.7, hh * 0.44, this.palette.fish[2], "#", "=");
    ctx.fillStyle = rgba(this.palette.wake, 0.95);
    ctx.fillText("*", snoutX + dir * hw * 0.3, snoutY - hh * 0.02);

    const earX = head.x - dir * hw * 0.25;
    const earY = head.y - hh * 0.62;
    const earLift = dog.state === "alert" ? hh * 0.28 : 0;
    this.panel(earX, earY - earLift * 0.5, hw * 0.2, hh * 0.5 + earLift, this.palette.fish[2], "#", "^");

    const eyeX = head.x + dir * hw * 0.38;
    const eyeY = head.y - hh * 0.12 + sniff * hh * 0.18;
    const blink = !this.calm && dog.blink > 4.45;
    ctx.fillStyle = rgba(this.palette.wake, 0.95);
    ctx.fillText(blink ? "-" : "o", eyeX, eyeY);

    const antennaX = earX;
    const antennaY = earY - earLift - hh * 0.35;
    ctx.fillStyle = rgba(this.palette.edge, 0.7);
    ctx.fillText("|", antennaX, antennaY - hh * 0.2);
    const glow = this.calm ? 0.55 : 0.55 + 0.35 * Math.sin(time * 3.2 + dog.id);
    ctx.fillStyle = rgba(this.palette.wake, glow);
    ctx.fillText("*", antennaX, antennaY - hh * 0.48);
  }

  private drawStatus(dog: Dog, topY: number, L: number) {
    const { ctx, cw, ch } = this;
    const bars = 5;
    const filled = Math.ceil((dog.battery / 100) * bars);
    const x = dog.x - (bars * cw) / 2;
    const y = Math.min(topY, dog.y - L * 1.15);
    const low = dog.battery < 26;
    ctx.fillStyle = low
      ? rgba(this.palette.heat, 0.8)
      : dog.state === "charge"
        ? rgba(this.palette.wake, 0.8)
        : rgba(this.palette.edge, 0.42);
    for (let i = 0; i < bars; i++) ctx.fillText(i < filled ? "=" : "-", x + (i + 0.5) * cw, y);
    ctx.font = `600 ${Math.round(ch * 0.42)}px ${this.fontFamily}`;
    ctx.fillStyle = rgba(this.palette.edge, 0.38);
    ctx.fillText(`DOG ${String(dog.id).padStart(2, "0")}`, dog.x, y - ch * 0.55);
    ctx.font = `600 ${Math.round(ch * 0.74)}px ${this.fontFamily}`;
  }

  private drawShadow(dog: Dog, L: number) {
    const { ctx } = this;
    const rx = L * 0.58;
    const ry = L * 0.075;
    ctx.fillStyle = this.palette.dark ? "rgba(0,0,0,0.38)" : "rgba(0,0,0,0.12)";
    this.forEachCell(dog.x - rx, dog.y - ry, rx * 2, ry * 2, (col, row) => {
      const cx = (col + 0.5) * this.cw;
      const cy = (row + 0.5) * this.ch;
      const d = ((cx - dog.x) / rx) ** 2 + ((cy - dog.y) / ry) ** 2;
      if (d <= 1) ctx.fillRect(cx - this.cw / 2, cy - this.ch / 2, this.cw, this.ch);
    });
  }

  private drawSparks(world: DogWorld) {
    if (this.calm || world.dock.owner == null) return;
    const dog = world.dogs.find((d) => d.id === world.dock.owner);
    if (!dog || !dog.charging) return;
    const { ctx } = this;
    for (let i = 0; i < 5; i++) {
      const a = world.time * 2.1 + i * 1.7;
      const x = world.dock.x + Math.cos(a) * world.dock.w * 0.34;
      const y = world.groundY - world.dock.h - Math.abs(Math.sin(a)) * world.dock.h * 0.6;
      ctx.fillStyle = rgba(this.palette.wake, 0.22 + 0.3 * Math.abs(Math.sin(a * 1.4)));
      ctx.fillText(i % 2 ? "+" : "*", x, y);
    }
  }

  private panel(
    cx: number,
    cy: number,
    w: number,
    h: number,
    fill: string,
    edgeGlyph: string,
    bodyGlyph: string,
  ) {
    const { ctx } = this;
    this.forEachCell(cx - w / 2, cy - h / 2, w, h, (col, row) => {
      const x = (col + 0.5) * this.cw;
      const y = (row + 0.5) * this.ch;
      const edge = Math.abs(x - cx) > w / 2 - this.cw * 0.55 || Math.abs(y - cy) > h / 2 - this.ch * 0.55;
      ctx.fillStyle = fill;
      ctx.fillRect(x - this.cw / 2, y - this.ch / 2, this.cw, this.ch);
      ctx.fillStyle = this.palette.textOnBody;
      ctx.fillText(edge ? edgeGlyph : bodyGlyph, x, y);
    });
  }

  private bone(
    a: { x: number; y: number },
    b: { x: number; y: number },
    thickness: number,
    fill: string,
    glyph: string,
  ) {
    const { ctx } = this;
    const minX = Math.min(a.x, b.x) - thickness;
    const maxX = Math.max(a.x, b.x) + thickness;
    const minY = Math.min(a.y, b.y) - thickness;
    const maxY = Math.max(a.y, b.y) + thickness;
    this.forEachCell(minX, minY, maxX - minX, maxY - minY, (col, row) => {
      const x = (col + 0.5) * this.cw;
      const y = (row + 0.5) * this.ch;
      if (distToSegment(x, y, a.x, a.y, b.x, b.y) > thickness) return;
      ctx.fillStyle = fill;
      ctx.fillRect(x - this.cw / 2, y - this.ch / 2, this.cw, this.ch);
      ctx.fillStyle = this.palette.textOnBody;
      ctx.fillText(glyph, x, y);
    });
  }

  private forEachCell(
    x: number,
    y: number,
    w: number,
    h: number,
    fn: (col: number, row: number, edge: boolean) => void,
  ) {
    const c0 = Math.max(0, Math.floor(x / this.cw));
    const r0 = Math.max(0, Math.floor(y / this.ch));
    const c1 = Math.min(this.cols - 1, Math.floor((x + w) / this.cw));
    const r1 = Math.min(this.rows - 1, Math.floor((y + h) / this.ch));
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        fn(col, row, col === c0 || col === c1 || row === r0 || row === r1);
      }
    }
  }
}
