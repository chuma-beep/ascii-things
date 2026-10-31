import { AsciiRenderer, FLAG_EDGE, FLAG_EYE, FLAG_FIN, FLAG_MARK, FLAG_RIDGE } from "../renderer";

// The hide is kanji. Keep the set to characters with enough horizontal and
// vertical ink to cover a cell, even at a small card size.
const BODY_KANJI = ["海", "波", "泳", "流", "潮", "渦", "深", "魚", "水", "月", "光", "鱗"];
const FIN_KANJI = ["鰭", "尾", "波", "流", "泳", "月"];
const RIDGE_KANJI = ["背", "鱗", "海", "光"];
const MARK_KANJI = ["影", "深", "墨", "黒"];
const EDGE_HEAVY = ":;";
const EDGE_LIGHT = ".',`";

/**
 * A kanji-dominant shark renderer. It reuses the original World, motion,
 * rasterisation, palette, and reduced-motion behaviour. The original
 * light-body/dark-ink treatment is inverted on dark palettes so the hide reads
 * as a bright, continuous kanji mass instead of a scatter of dark cells.
 */
export class KanjiSharkRenderer extends AsciiRenderer {
  protected minCell = 6;

  protected drawSharks(_t: number) {
    const { ctx, cols, rows, cw, ch, sharkFlag, sharkShade, sharkKey, sharkDepth, sharkKind } =
      this;
    const n = cols * rows;
    const palette = this.palette;
    const dark = palette.dark;
    ctx.font = `700 ${Math.round(ch * 0.96)}px ${this.fontFamily}`;

    for (let i = 0; i < n; i++) {
      const flag = sharkFlag[i];
      if (!flag) continue;
      const col = i % cols;
      const row = (i / cols) | 0;
      const x = col * cw;
      const y = row * ch;
      const key = sharkKey[i];
      const shade = sharkShade[i];
      const dim = 0.7 + 0.3 * sharkDepth[i];
      const [tr, tg, tb] = this.sharkTint(sharkKind[i]);

      if (flag === FLAG_EDGE) {
        // The silhouette stays punctuation: no kanji, no full cell block.
        const set = shade >= 0.5 ? EDGE_HEAVY : EDGE_LIGHT;
        const base = dark ? 118 + shade * 92 : 170 - shade * 92;
        const [er, eg, eb] = palette.edge;
        const k = base / 170;
        ctx.fillStyle = `rgba(${Math.min(255, Math.round(er * k))},${Math.min(255, Math.round(eg * k))},${Math.min(255, Math.round(eb * k))},${(0.62 + shade * 0.32).toFixed(2)})`;
        ctx.fillText(set[(key >>> 8) % set.length], x + cw / 2, y + ch / 2 + 1);
        continue;
      }

      let glyph: string;
      let bodyLevel: number;
      if (flag === FLAG_RIDGE) {
        glyph = RIDGE_KANJI[(key >>> 8) % RIDGE_KANJI.length];
        bodyLevel = dark ? 120 : 190;
      } else if (flag === FLAG_EYE) {
        glyph = "o";
        bodyLevel = dark ? 18 : 210;
      } else if (flag === FLAG_MARK) {
        glyph = MARK_KANJI[(key >>> 8) % MARK_KANJI.length];
        bodyLevel = dark ? 32 : 236;
      } else if (flag === FLAG_FIN) {
        glyph = FIN_KANJI[(key >>> 8) % FIN_KANJI.length];
        bodyLevel = dark ? 68 + shade * 82 : 138 + (1 - shade) * 58;
      } else {
        glyph = BODY_KANJI[(key >>> 8) % BODY_KANJI.length];
        bodyLevel = dark ? 66 + shade * 90 : 132 + (1 - shade) * 78;
      }

      // Keep the depth cue: far sharks recede toward the water.
      if (dark) bodyLevel *= dim;
      else bodyLevel = 255 - (255 - bodyLevel) * dim;

      const fill = `rgb(${Math.min(255, Math.round(bodyLevel * tr))},${Math.min(255, Math.round(bodyLevel * tg))},${Math.min(255, Math.round(bodyLevel * tb + 4))})`;
      ctx.fillStyle = fill;
      // A full cell (rather than the original 1px inset) makes a continuous
      // body at the cell sizes used in cards and demos.
      ctx.fillRect(x, y, cw, ch);

      let ink: string;
      if (flag === FLAG_EYE) {
        ink = palette.eye;
      } else {
        const [er, eg, eb] = palette.edge;
        const inkK = dark ? 0.88 + shade * 0.15 : 0.3 + (1 - shade) * 0.16;
        ink = `rgb(${Math.min(255, Math.round(er * inkK * tr))},${Math.min(255, Math.round(eg * inkK * tg))},${Math.min(255, Math.round(eb * inkK * tb))})`;
      }

      ctx.fillStyle = ink;
      ctx.fillText(glyph, x + cw / 2, y + ch / 2 + 1);
      if (flag !== FLAG_EYE) {
        // Heavy strokes keep the hide legible and cover the cell; this is ink
        // on the glyph, not a rectangular slab.
        ctx.strokeStyle = ink;
        ctx.lineWidth = Math.max(0.35, cw * 0.04);
        ctx.lineJoin = "round";
        ctx.strokeText(glyph, x + cw / 2, y + ch / 2 + 1);
      }
    }
  }
}
