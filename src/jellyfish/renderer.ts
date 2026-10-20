import { rgba } from "../core/color";
import { CellGrid, paintGrid } from "../core/grid";
import { clamp, hash3, TAU } from "../math";
import { resolvePalette, type Palette, type PaletteChoice, type RGB } from "../palette";
import { KIND_CONFIG, type Jellyfish, type JellyfishKind, type JellyfishWorld } from "./world";

export interface JellyfishRendererOptions {
  palette?: PaletteChoice;
  columns?: number;
  maxCells?: number;
  calm?: boolean;
}

/**
 * Draws a bloom of jellyfish: a deep-water backdrop, drifting plankton,
 * pulsing bioluminescent rings, translucent bells, and trailing tentacles.
 * The glyph grid matches the other ascii-things scenes.
 */
export class JellyfishRenderer extends CellGrid {
  private calm = false;
  private palette: Palette = resolvePalette();

  constructor(canvas: HTMLCanvasElement, options: JellyfishRendererOptions = {}) {
    super(canvas, { columns: options.columns ?? 140, maxCells: options.maxCells });
    this.palette = resolvePalette(options.palette);
    this.calm = options.calm ?? false;
  }

  setOptions(options: JellyfishRendererOptions) {
    if (options.palette !== undefined) {
      this.palette = resolvePalette(options.palette);
      if (this.width > 0) this.paintBackground();
    }
    this.setGridOptions({ columns: options.columns, maxCells: options.maxCells });
    if (options.calm !== undefined) this.calm = options.calm;
  }

  resize(width: number, height: number, dpr: number) {
    super.resize(width, height, dpr);
    this.paintBackground();
  }

  private paintBackground() {
    this.paintBackdrop(
      this.palette.background,
      (g, { width: W, height: H, dpr, cellWidth: cw, cellHeight: ch }) => {
        // A depth gradient: lighter water at the surface, colder below.
        const grad = g.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, rgba(this.palette.wake, this.palette.dark ? 0.055 : 0.025));
        grad.addColorStop(0.55, rgba(this.palette.wake, 0));
        grad.addColorStop(1, rgba(this.palette.heat, this.palette.dark ? 0.026 : 0.012));
        g.fillStyle = grad;
        g.fillRect(0, 0, W, H);

        // Sparse light shafts falling through the water.
        for (let i = 0; i < 5; i++) {
          const x = W * (0.1 + i * 0.21) + Math.sin(i * 2.3) * W * 0.03;
          const top = W * 0.035;
          const bottom = W * 0.08;
          g.beginPath();
          g.moveTo(x, 0);
          g.lineTo(x + top, 0);
          g.lineTo(x + bottom + H * 0.28, H);
          g.lineTo(x + H * 0.22, H);
          g.closePath();
          g.fillStyle = rgba(this.palette.wake, this.palette.dark ? 0.02 : 0.012);
          g.fill();
        }

        g.globalAlpha = 0.42;
        paintGrid(g, W, H, cw, ch, dpr, this.palette.grid);
        g.globalAlpha = 1;
      },
    );
  }

  render(world: JellyfishWorld, _dt: number) {
    const { ctx, dpr, cols } = this;
    if (cols === 0) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.bg, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `600 ${Math.round(this.ch * 0.76)}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    this.drawPlankton(world);
    this.drawRings(world);
    for (const jelly of [...world.jellies].sort((a, b) => a.depth - b.depth)) {
      this.drawJelly(jelly, world.time);
    }
  }

  private tint(kind: JellyfishKind | "shock"): RGB {
    switch (kind) {
      case "lion":
        return this.palette.heatHot;
      case "atolla":
        return this.palette.heat;
      case "crystal":
        return this.palette.edge;
      case "shock":
        return this.palette.heatHot;
      default:
        return this.palette.wake;
    }
  }

  private drawPlankton(world: JellyfishWorld) {
    const { ctx, cw, ch } = this;
    for (const p of world.plankton) {
      const twinkle = this.calm ? 0.72 : 0.58 + 0.42 * Math.sin(world.time * 1.45 + p.phase);
      const alpha = (0.08 + 0.24 * p.depth) * twinkle;
      const px = Math.round(p.x / cw) * cw + cw / 2;
      const py = Math.round(p.y / ch) * ch + ch / 2;
      ctx.fillStyle = rgba(this.palette.edge, alpha);
      ctx.fillText(p.depth > 0.68 ? "'" : p.depth > 0.34 ? "·" : ".", px, py);
    }
  }

  private drawRings(world: JellyfishWorld) {
    const { ctx, cw, ch } = this;
    for (const ring of world.rings) {
      const t = clamp(ring.age / ring.life, 0, 1);
      const fade = (1 - t) * (this.calm ? 0.34 : 0.64);
      const tint = this.tint(ring.kind);
      const steps = ring.kind === "shock" ? 42 : 28;
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * TAU;
        const px = ring.x + Math.cos(a) * ring.radius;
        const py = ring.y + Math.sin(a) * ring.radius * 0.78;
        const snappedX = Math.round(px / cw) * cw + cw / 2;
        const snappedY = Math.round(py / ch) * ch + ch / 2;
        ctx.fillStyle = rgba(tint, fade * (i % 4 === 0 ? 1 : 0.65));
        ctx.fillText(i % 3 === 0 ? "+" : i % 7 === 0 ? "*" : "·", snappedX, snappedY);
      }
    }
  }

  private drawJelly(jelly: Jellyfish, time: number) {
    const cfg = KIND_CONFIG[jelly.kind];
    const bob = Math.sin(time * 0.85 + jelly.id * 1.7) * jelly.radius * 0.055;
    const x = jelly.x;
    const y = jelly.y + bob;
    const bw = jelly.radius * cfg.bellWidth * 1.34 * (1 - 0.16 * jelly.contract);
    const bh = jelly.radius * 1.02 * (1 + 0.11 * jelly.contract);
    const tint = this.tint(jelly.kind);
    const depth = 0.32 + jelly.depth * 0.68;

    this.ctx.fillStyle = rgba(tint, this.palette.dark ? 0.05 : 0.06);
    this.ctx.beginPath();
    this.ctx.ellipse(x, y - bh * 0.08, bw * 0.62, bh * 0.72, 0, 0, TAU);
    this.ctx.fill();
    this.drawTentacles(jelly, x, y, bw, bh, time, tint, depth);
    this.drawOralArms(jelly, x, y, bw, bh, time, tint, depth);
    this.drawBell(jelly, x, y, bw, bh, depth, tint);
    this.drawAnatomy(jelly, x, y, bw, bh, depth, tint);
  }

  /** Four gonads and a mouth, drawn over the bell so the anatomy reads cleanly. */
  private drawAnatomy(
    jelly: Jellyfish,
    x: number,
    y: number,
    bw: number,
    bh: number,
    depth: number,
    tint: RGB,
  ) {
    const alpha = 0.52 + 0.3 * depth;
    const glyph = (px: number, py: number, ch: string, a = alpha) => {
      const sx = Math.round(px / this.cw) * this.cw + this.cw / 2;
      const sy = Math.round(py / this.ch) * this.ch + this.ch / 2;
      this.ctx.fillStyle = rgba(tint, clamp(a, 0.05, 0.9));
      this.ctx.fillText(ch, sx, sy);
    };

    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const cx = x + sx * bw * 0.17;
        const cy = y + sy * bh * 0.1;
        glyph(cx, cy, "o", alpha);
      }
    }
  }

  private drawBell(
    jelly: Jellyfish,
    x: number,
    y: number,
    bw: number,
    bh: number,
    depth: number,
    tint: RGB,
  ) {
    const { ctx, cw, ch } = this;
    this.forEachCell(x - bw * 0.58, y - bh * 1.16, bw * 1.16, bh * 1.62, (col, row, _edge) => {
      const cx = (col + 0.5) * cw;
      const cy = (row + 0.5) * ch;
      const u = (cx - x) / (bw * 0.5);
      const v = (cy - y) / bh;
      if (v < -1 || v > 0.36) return;

      const q = u * u + (v / 0.94) ** 2;
      // A flat, scalloped rim: the bell reads as a dome, not a bowl.
      const bottom = 0.27 - 0.02 * u * u;
      if (q > 1 || v > bottom) return;

      const contrast = this.palette.dark ? 1 : 1.28;
      const hem = 0.05 + 0.025 * (0.5 + 0.5 * Math.cos(u * Math.PI * 5 + jelly.id));
      const edge = q > 0.82 || v > bottom - hem;
      const rim = q > 0.52 && q < 0.62 && v > 0.06;
      const canal = Math.abs(Math.sin(Math.atan2(v, u) * 2)) < 0.09 && q > 0.14 && q < 0.76;
      const grain = hash3(col, row, jelly.id);

      let glyph = grain > 0.78 ? "+" : grain > 0.42 ? ":" : "-";
      let alpha = (0.24 + 0.28 * depth) * (0.8 + grain * 0.5);

      if (edge) {
        glyph = v > bottom - hem ? (grain > 0.32 ? "+" : "*") : this.edgeGlyph(u, v);
        alpha = 0.6 + 0.3 * depth;
      } else if (rim) {
        glyph = grain > 0.55 ? "+" : ":";
        alpha = (0.3 + 0.28 * depth) * 0.95;
      } else if (canal) {
        glyph = v < -0.18 ? "|" : ":";
        alpha = (0.3 + 0.26 * depth) * 0.95;
      } else if (grain > 0.92) {
        glyph = "+";
        alpha *= 1.25;
      }

      ctx.fillStyle = rgba(tint, (0.045 + 0.075 * depth) * contrast);
      ctx.fillRect(cx - cw / 2, cy - ch / 2, cw, ch);
      ctx.fillStyle = rgba(tint, clamp(alpha * contrast, 0.08, 0.94));
      ctx.fillText(glyph, cx, cy);
    });
  }

  private drawTentacles(
    jelly: Jellyfish,
    x: number,
    y: number,
    bw: number,
    bh: number,
    time: number,
    tint: RGB,
    depth: number,
  ) {
    const { ctx, cw, ch } = this;
    const cfg = KIND_CONFIG[jelly.kind];
    const count = cfg.tentacles;

    for (let i = 0; i < count; i++) {
      const long = jelly.kind === "atolla" && i === 0;
      const baseU = ((i + 0.5) / count - 0.5) * (long ? 0.2 : 1.5);
      const bx = x + baseU * bw * 0.5;
      const by = y + bh * 0.16;
      const length =
        jelly.radius *
        (long ? cfg.tentacleLength * 1.5 : cfg.tentacleLength) *
        1.1 *
        (0.5 + hash3(i, 7, jelly.id) * 0.95);
      const segments = Math.max(8, Math.round(length / (ch * 0.86)));
      const phase = time * 1.25 + i * 0.83 + jelly.tentaclePhase;

      for (let s = 0; s <= segments; s++) {
        const f = s / segments;
        const rawX =
          bx +
          Math.sin(f * 4.6 + phase) * bw * 0.34 * f +
          Math.sin(f * 9.2 + phase * 0.6) * bw * 0.045 +
          jelly.tilt * bw * 0.48 * f -
          jelly.vx * 0.9 * f;
        const rawY = by + length * f + Math.sin(f * 2.4 + phase * 0.7) * ch * 0.4 * f;
        const px = Math.round(rawX / cw) * cw + cw / 2;
        const py = Math.round(rawY / ch) * ch + ch / 2;
        const alpha = (0.18 + 0.28 * depth) * (1 - f * 0.74);
        const glyph = f > 0.82 ? "·" : s % 7 === 0 ? "'" : s % 3 === 0 ? ":" : "|";
        ctx.fillStyle = rgba(tint, clamp(alpha, 0.02, 0.42));
        ctx.fillText(glyph, px, py);
      }
    }
  }

  private drawOralArms(
    jelly: Jellyfish,
    x: number,
    y: number,
    bw: number,
    bh: number,
    time: number,
    tint: RGB,
    depth: number,
  ) {
    const { ctx, cw, ch } = this;
    const count = jelly.kind === "box" ? 4 : jelly.kind === "lion" ? 6 : 5;
    for (let i = 0; i < count; i++) {
      const baseU = ((i + 0.5) / count - 0.5) * 0.86;
      const bx = x + baseU * bw * 0.5;
      const by = y + bh * 0.2;
      const length = jelly.radius * (0.9 + hash3(i, 19, jelly.id) * 0.42);
      const segments = Math.max(7, Math.round(length / (ch * 0.78)));
      const phase = time * 1.05 + i * 1.13 + jelly.tentaclePhase;

      for (let s = 0; s <= segments; s++) {
        const f = s / segments;
        const sway =
          Math.sin(f * 5.6 + phase) * bw * 0.075 * f +
          jelly.tilt * bw * 0.26 * f -
          jelly.vx * 0.22 * f;
        const rawX = bx + sway;
        const rawY = by + length * f;
        const px = Math.round(rawX / cw) * cw + cw / 2;
        const py = Math.round(rawY / ch) * ch + ch / 2;
        const alpha = (0.46 + 0.34 * depth) * (1 - f * 0.48);
        const glyph = f < 0.2 ? "'" : f < 0.62 ? "~" : ":";
        ctx.fillStyle = rgba(tint, clamp(alpha, 0.05, 0.8));
        ctx.fillText(glyph, px, py);
        ctx.fillText(f < 0.55 ? ":" : "·", px + cw * 0.42, py);
      }
    }
  }

  private edgeGlyph(u: number, v: number) {
    const angle = Math.atan2(v, u);
    const index = Math.floor(((angle + Math.PI) / TAU) * 6) % 6;
    return ["'", "'", "-", "|", "+", "|"][index];
  }
}
