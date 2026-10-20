import { angleDiff, clamp, hash3 } from "../math";
import { paintGrid } from "../renderer";
import { resolvePalette, type Palette, type PaletteName, type RGB } from "../palette";
import type { Robot, RobotKind, RobotWorld } from "./world";

export interface RobotRendererOptions {
  palette?: PaletteName | Palette;
  columns?: number;
  maxCells?: number;
  calm?: boolean;
}

const KIND_SCAN_HALF: Record<RobotKind, number> = { scout: 0.4, hauler: 0.3, sentinel: 0.58 };

const rgba = ([r, g, b]: RGB, a: number) => `rgba(${r},${g},${b},${a})`;

/**
 * Draws the robot floor: grid, bays, crates, scan cones, and tracked rovers.
 * The glyph grid matches the shark scene so the two can sit side by side.
 */
export class RobotRenderer {
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
  private columns = 124;
  private maxCells = 16000;
  private calm = false;
  private palette: Palette = resolvePalette();

  constructor(
    private canvas: HTMLCanvasElement,
    options: RobotRendererOptions = {},
  ) {
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

  setOptions(options: RobotRendererOptions) {
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

    const targetColumns = Math.max(24, this.columns);
    let cw = clamp(Math.round(width / targetColumns), 8, 13);
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
    paintGrid(g, W, H, cw, ch, dpr, this.palette.grid);

    // Faint lane markings, like a factory floor.
    g.strokeStyle = rgba(this.palette.edge, 0.16);
    g.lineWidth = 1;
    g.setLineDash([cw * 2, cw * 2]);
    g.beginPath();
    g.moveTo(0, H * 0.66);
    g.lineTo(W, H * 0.66);
    g.stroke();
    g.beginPath();
    g.moveTo(0, H * 0.34);
    g.lineTo(W, H * 0.34);
    g.stroke();
    g.setLineDash([]);
  }

  render(world: RobotWorld, _dt: number) {
    const { ctx, dpr, cols } = this;
    if (cols === 0) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.bg, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `600 ${Math.round(this.ch * 0.74)}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    this.drawDocks(world);
    this.drawCrates(world);
    this.drawScans(world);
    for (const robot of [...world.robots].sort((a, b) => a.y - b.y)) {
      this.drawRobot(robot, world.time);
    }
    this.drawSparks(world);
  }

  private drawDocks(world: RobotWorld) {
    for (let i = 0; i < world.docks.length; i++) {
      const dock = world.docks[i];
      const x0 = dock.x - dock.w / 2;
      const y0 = dock.y - dock.h / 2;
      this.ctx.fillStyle = rgba(this.palette.wake, 0.05);
      this.ctx.fillRect(x0, y0, dock.w, dock.h);
      this.forEachCell(x0, y0, dock.w, dock.h, (col, row, edge) => {
        const cx = (col + 0.5) * this.cw;
        const cy = (row + 0.5) * this.ch;
        const active = dock.owner != null;
        let glyph = "=";
        if (edge) {
          const left = (col + 0.5) * this.cw < x0 + this.cw;
          const right = (col + 0.5) * this.cw > x0 + dock.w - this.cw;
          const top = (row + 0.5) * this.ch < y0 + this.ch;
          const bottom = (row + 0.5) * this.ch > y0 + dock.h - this.ch;
          glyph = (left || right) && (top || bottom) ? "+" : left || right ? "|" : "-";
        } else if (active) {
          glyph = Math.floor(world.time * 3 + col) % 4 === 0 && !this.calm ? "*" : "+";
        }
        this.ctx.fillStyle = rgba(this.palette.wake, edge ? 0.42 : active ? 0.62 : 0.26);
        this.ctx.fillText(glyph, cx, cy);
      });
      this.ctx.font = `600 ${Math.round(this.ch * 0.44)}px ${this.fontFamily}`;
      this.ctx.fillStyle = rgba(this.palette.edge, 0.4);
      this.ctx.fillText(`BAY ${i + 1}`, dock.x, y0 - this.ch * 0.9);
      this.ctx.font = `600 ${Math.round(this.ch * 0.74)}px ${this.fontFamily}`;
    }
  }

  private drawCrates(world: RobotWorld) {
    for (const crate of world.crates) {
      const x0 = crate.x - crate.w / 2;
      const y0 = crate.y - crate.h / 2;
      this.ctx.fillStyle = rgba(this.palette.mark, 0.24);
      this.ctx.fillRect(x0, y0, crate.w, crate.h);
      this.forEachCell(x0, y0, crate.w, crate.h, (col, row, edge) => {
        const h = hash3(col, row, 17);
        this.ctx.fillStyle = edge ? rgba(this.palette.edge, 0.48) : this.palette.fish[2];
        this.ctx.fillText(
          edge ? "+" : h > 0.8 ? "=" : h > 0.42 ? "#" : "%",
          (col + 0.5) * this.cw,
          (row + 0.5) * this.ch,
        );
      });
    }
  }

  private drawScans(world: RobotWorld) {
    const { ctx } = this;
    for (const r of world.robots) {
      if (r.state !== "scan" && r.state !== "job") continue;
      const half = KIND_SCAN_HALF[r.kind] + (r.state === "job" ? 0.1 : 0);
      const range = r.length * (r.state === "scan" ? 2.9 : 1.8);
      const sweep = r.heading + Math.sin(r.scan) * half;
      const x0 = r.x - range;
      const y0 = r.y - range;
      this.forEachCell(x0, y0, range * 2, range * 2, (col, row) => {
        const cx = (col + 0.5) * this.cw;
        const cy = (row + 0.5) * this.ch;
        const dx = cx - r.x;
        const dy = cy - r.y;
        const d = Math.hypot(dx, dy);
        if (d > range || d < r.length * 0.45) return;
        const ang = Math.atan2(dy, dx);
        if (Math.abs(angleDiff(sweep, ang)) > half) return;
        if (hash3(col, row, 31) < 0.4) return;
        const a = (1 - d / range) * 0.42;
        ctx.fillStyle = rgba(this.palette.wake, a);
        ctx.fillText(hash3(col, row, 43) > 0.7 ? "+" : "·", cx, cy);
      });
    }
  }

  private drawRobot(r: Robot, time: number) {
    const { ctx, cw, ch } = this;
    const L = r.length;
    const W = L * 0.64;
    const cos = Math.cos(r.heading);
    const sin = Math.sin(r.heading);
    const reach = Math.hypot(L, W) / 2 + Math.max(cw, ch);
    const edgePad = Math.min(cw, ch) * 0.38;

    this.forEachCell(r.x - reach, r.y - reach, reach * 2, reach * 2, (col, row) => {
      const cx = (col + 0.5) * cw;
      const cy = (row + 0.5) * ch;
      const dx = cx - r.x;
      const dy = cy - r.y;
      const lx = dx * cos + dy * sin;
      const ly = -dx * sin + dy * cos;
      const body = Math.abs(lx) <= L / 2 && Math.abs(ly) <= W / 2;
      const tread = Math.abs(lx) <= L * 0.52 && Math.abs(ly) <= W * 0.62 && Math.abs(ly) > W * 0.34;
      if (!body && !tread) return;

      const edge = Math.abs(lx) > L / 2 - edgePad || Math.abs(ly) > W / 2 - edgePad;
      const sensor = lx > L * 0.26 && lx < L * 0.46 && Math.abs(ly) < W * 0.24;
      const cargo =
        r.kind === "hauler" && lx < -L * 0.1 && lx > -L * 0.45 && Math.abs(ly) < W * 0.3;
      const seam = Math.abs(ly) < Math.min(W * 0.08, ch * 0.35);
      let fill = this.palette.fish[4];
      let ink = this.palette.textOnBody;
      let glyph = edge ? "#" : seam ? "%" : "@";

      if (tread) {
        fill = this.palette.fish[2];
        ink = this.palette.textOnBody;
        glyph = edge ? "#" : Math.floor(r.tread + lx * 0.2) % 2 === 0 ? "=" : "-";
      }
      if (sensor) {
        fill = this.palette.fish[3];
        ink = rgba(this.palette.wake, 0.95);
        glyph = "o";
      }
      if (cargo) {
        fill = this.palette.fish[3];
        ink = this.palette.textOnBodyAlt;
        glyph = "%";
      }

      ctx.fillStyle = fill;
      ctx.fillRect(cx - cw / 2, cy - ch / 2, cw, ch);
      ctx.fillStyle = ink;
      ctx.fillText(glyph, cx, cy);
    });

    // Direction chevron at the snout, so a still frame reads as "moving".
    const dir = Math.abs(cos) > Math.abs(sin) ? (cos > 0 ? ">" : "<") : sin > 0 ? "v" : "^";
    ctx.fillStyle = rgba(this.palette.wake, r.state === "charge" ? 0.55 : 0.95);
    ctx.fillText(dir, r.x + cos * L * 0.62, r.y + sin * L * 0.62);

    // Rear antenna and status beacon.
    const ax = r.x - cos * L * 0.4 - sin * W * 0.55;
    const ay = r.y - sin * L * 0.4 + cos * W * 0.55;
    const low = r.battery <= 26;
    const blinkOn = this.calm || Math.sin(time * 8 + r.blink) > 0;
    ctx.fillStyle =
      r.state === "charge"
        ? rgba(this.palette.wake, 0.95)
        : low
          ? rgba(this.palette.heat, blinkOn ? 0.95 : 0.25)
          : rgba(this.palette.wake, 0.75);
    ctx.fillText(r.state === "charge" ? "+" : "o", ax, ay);
    ctx.fillStyle = rgba(this.palette.edge, 0.45);
    ctx.fillText("'", ax - Math.sin(r.heading) * ch, ay + Math.cos(r.heading) * ch);

    // Battery bar, kept in screen space so it reads like a status light.
    const bars = 5;
    const filled = Math.ceil((r.battery / 100) * bars);
    const bx = r.x - (bars * cw) / 2;
    const by = r.y - W * 0.5 - ch * 1.15;
    ctx.fillStyle = low
      ? rgba(this.palette.heat, blinkOn ? 0.85 : 0.3)
      : r.battery < 55
        ? rgba(this.palette.heatHot, 0.7)
        : rgba(this.palette.wake, 0.45);
    for (let i = 0; i < bars; i++) {
      ctx.fillText(i < filled ? "=" : "-", bx + (i + 0.5) * cw, by);
    }
  }

  private drawSparks(world: RobotWorld) {
    if (this.calm) return;
    for (const dock of world.docks) {
      if (dock.owner == null) continue;
      const robot = world.robots.find((r) => r.id === dock.owner);
      if (!robot || robot.state !== "charge") continue;
      for (let i = 0; i < 4; i++) {
        const a = world.time * 2.4 + i * 1.7;
        const x = dock.x + Math.cos(a) * dock.w * 0.32;
        const y = dock.y + Math.sin(a) * dock.h * 0.28;
        this.ctx.fillStyle = rgba(this.palette.wake, 0.35 + 0.3 * Math.sin(a * 1.7));
        this.ctx.fillText(i % 2 === 0 ? "*" : "+", x, y);
      }
    }
  }

  private forEachCell(
    x: number,
    y: number,
    w: number,
    h: number,
    fn: (col: number, row: number, edge: boolean, lastCol: number, lastRow: number) => void,
  ) {
    const c0 = Math.max(0, Math.floor(x / this.cw));
    const r0 = Math.max(0, Math.floor(y / this.ch));
    const c1 = Math.min(this.cols - 1, Math.floor((x + w) / this.cw));
    const r1 = Math.min(this.rows - 1, Math.floor((y + h) / this.ch));
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        fn(col, row, col === c0 || col === c1 || row === r0 || row === r1, c1, r1);
      }
    }
  }
}
