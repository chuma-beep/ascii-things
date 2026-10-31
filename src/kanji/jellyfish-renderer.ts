import { rgba } from "../core/color";
import { clamp, hash3 } from "../math";
import type { RGB } from "../palette";
import { KIND_CONFIG, type Jellyfish } from "../jellyfish/world";
import { JellyfishRenderer } from "../jellyfish/renderer";

const BELL_KANJI = ["海", "水", "月", "光", "波", "泳", "流", "影", "鈴", "傘"];
const TENTACLE_KANJI = ["水", "流", "波", "泳", "光", "月", "影"];
const ORAL_KANJI = ["水", "流", "波", "光", "月", "影"];

/**
 * A kanji-dominant jellyfish renderer. The bell interior and the trailing
 * tentacles are kanji; ASCII is kept only for the scalloped rim, the radial
 * canals, the tentacle tips, and the gonads, where it carries the silhouette.
 */
export class KanjiJellyfishRenderer extends JellyfishRenderer {
  protected minCell = 6;

  protected drawBell(
    jelly: Jellyfish,
    x: number,
    y: number,
    bw: number,
    bh: number,
    depth: number,
    tint: RGB,
  ) {
    const { ctx, cw, ch } = this;
    ctx.font = `500 ${Math.round(ch * 0.9)}px ${this.fontFamily}`;

    this.forEachCell(x - bw * 0.58, y - bh * 1.16, bw * 1.16, bh * 1.62, (col, row, _edge) => {
      const cx = (col + 0.5) * cw;
      const cy = (row + 0.5) * ch;
      const u = (cx - x) / (bw * 0.5);
      const v = (cy - y) / bh;
      if (v < -1 || v > 0.36) return;

      const q = u * u + (v / 0.94) ** 2;
      const bottom = 0.27 - 0.02 * u * u;
      if (q > 1 || v > bottom) return;

      const contrast = this.palette.dark ? 1 : 1.28;
      const hem = 0.05 + 0.025 * (0.5 + 0.5 * Math.cos(u * Math.PI * 5 + jelly.id));
      const edge = q > 0.82 || v > bottom - hem;
      const rim = q > 0.52 && q < 0.62 && v > 0.06;
      const canal = Math.abs(Math.sin(Math.atan2(v, u) * 2)) < 0.09 && q > 0.14 && q < 0.76;
      const grain = hash3(col, row, jelly.id);

      let glyph: string;
      let alpha = (0.24 + 0.28 * depth) * (0.8 + grain * 0.5);

      if (edge) {
        glyph = v > bottom - hem ? (grain > 0.32 ? "+" : "*") : this.edgeGlyph(u, v);
        alpha = 0.72 + 0.24 * depth;
      } else if (rim) {
        glyph = grain > 0.45 ? "+" : ":";
        alpha = (0.42 + 0.3 * depth) * 0.98;
      } else if (canal) {
        glyph = v < -0.18 ? "|" : ":";
        alpha = (0.3 + 0.26 * depth) * 0.95;
      } else {
        glyph = BELL_KANJI[(col * 3 + row + jelly.id) % BELL_KANJI.length];
        if (grain > 0.9) alpha *= 1.15;
      }

      ctx.fillStyle = rgba(tint, (0.045 + 0.075 * depth) * contrast);
      ctx.fillRect(cx - cw / 2, cy - ch / 2, cw, ch);
      const ink = rgba(tint, clamp(alpha * contrast, 0.08, 0.96));
      ctx.fillStyle = ink;
      ctx.fillText(glyph, cx, cy);
      if (edge || rim) {
        ctx.strokeStyle = ink;
        ctx.lineWidth = Math.max(0.4, cw * 0.07);
        ctx.lineJoin = "round";
        ctx.strokeText(glyph, cx, cy);
      }
    });
  }

  protected drawTentacles(
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
    ctx.font = `500 ${Math.round(ch * 0.92)}px ${this.fontFamily}`;

    for (let i = 0; i < count; i++) {
      const long = jelly.kind === "atolla" && i === 0;
      const baseU = ((i + 0.5) / count - 0.5) * (long ? 0.2 : 1.5);
      const bx = x + baseU * bw * 0.5;
      const by = y + bh * 0.16;
      const length =
        jelly.radius *
        (long ? cfg.tentacleLength * 1.5 : cfg.tentacleLength) *
        1.3 *
        (0.5 + hash3(i, 7, jelly.id) * 0.95);
      const segments = Math.max(8, Math.round(length / (ch * 0.86)));
      // Kanji tentacles read best when they drift rather than whip.
      const phase = time * 0.55 + i * 0.83 + jelly.tentaclePhase;

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
        const bead = hash3(s, i * 13, jelly.id + 41);
        const glyph =
          f > 0.86
            ? "·"
            : s % 4 === 0
              ? s % 8 === 0
                ? "'"
                : "|"
              : TENTACLE_KANJI[(s + i * 3 + jelly.id) % TENTACLE_KANJI.length];
        ctx.fillStyle = rgba(tint, clamp(alpha, 0.02, 0.42));
        ctx.fillText(glyph, px, py);
        if (bead > 0.92) {
          ctx.fillStyle = rgba(tint, clamp(alpha * 0.55, 0.02, 0.2));
          ctx.fillText("·", px + cw * 0.4, py);
        }
      }
    }
  }

  protected drawOralArms(
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
    ctx.font = `500 ${Math.round(ch * 0.88)}px ${this.fontFamily}`;
    const count = jelly.kind === "box" ? 4 : jelly.kind === "lion" ? 6 : 5;

    for (let i = 0; i < count; i++) {
      const baseU = ((i + 0.5) / count - 0.5) * 0.86;
      const bx = x + baseU * bw * 0.5;
      const by = y + bh * 0.2;
      const length = jelly.radius * (1.05 + hash3(i, 19, jelly.id) * 0.46);
      const segments = Math.max(7, Math.round(length / (ch * 0.78)));
      const phase = time * 0.45 + i * 1.13 + jelly.tentaclePhase;

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
        const glyph =
          s % 3 === 0
            ? f < 0.2
              ? "'"
              : f < 0.62
                ? "~"
                : ":"
            : ORAL_KANJI[(s + i * 5 + jelly.id) % ORAL_KANJI.length];
        ctx.fillStyle = rgba(tint, clamp(alpha, 0.05, 0.8));
        ctx.fillText(glyph, px, py);
        ctx.fillStyle = rgba(tint, clamp(alpha * 0.6, 0.05, 0.5));
        ctx.fillText(f < 0.55 ? ":" : "·", px + cw * 0.42, py);
      }
    }
  }
}
