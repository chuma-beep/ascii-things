import { rgba } from "../core/color";
import { hash3 } from "../math";
import { AmbientRenderer } from "../ambient/renderer";
import type { Koi } from "../ambient/world";

// The kanji are the fish. These sets are chosen for strong horizontal and
// vertical strokes so a 6px cell still reads as ink rather than a blob.
const BODY_KANJI = ["魚", "水", "川", "月", "光", "心", "雨", "糸", "海", "波", "流", "泳"];
const PATCH_KANJI = ["錦", "鯉", "朱", "火", "日", "光"];
const FIN_KANJI = ["鰭", "尾", "泳", "波", "流"];
const TAIL_KANJI = ["尾", "鰭", "泳", "流", "波"];
const EYE_KANJI = "目";

/**
 * A genuinely kanji-built koi. The original body, tail, and fin paths are used
 * only as geometric masks; every visible mark is a kanji cell, including the
 * calico patches, fins, tail, and eyes. There is no vector body fill beneath
 * the texture.
 */
export class KanjiKoiRenderer extends AmbientRenderer {
  protected minCell = 8;

  protected drawKoiFish(fish: Koi) {
    const { ctx, cw, ch } = this;
    const cos = Math.cos(fish.heading);
    const sin = Math.sin(fish.heading);
    const perpX = -sin;
    const perpY = cos;
    const bodyCells = Math.round(14 + fish.size * 5);
    const bodyLength = bodyCells * cw;
    const halfWidth = (1.8 + fish.size * 0.8) * cw;

    const bodyPath = this.koiBodyPath(fish, cos, sin, bodyLength, halfWidth);
    const tailPath = this.koiTailPath(fish, cos, sin, perpX, perpY, bodyLength, halfWidth);
    const finPaths = [-1, 1].map((side) =>
      this.koiFinPath(fish, side, cos, sin, perpX, perpY, bodyLength, halfWidth),
    );

    const warm = this.palette.dark ? "rgba(255, 246, 230, 0.96)" : "rgba(38, 42, 50, 0.94)";
    const orange = rgba(this.palette.heatHot, 0.92);
    const finInk = rgba(this.palette.heatHot, 0.68);
    const tailInk = rgba(this.palette.heatHot, 0.78);
    const eyeInk = this.palette.dark ? "rgba(8, 12, 14, 0.95)" : "rgba(255, 248, 238, 0.95)";

    const patches = [
      { u: 0.78, across: 0, rx: bodyLength * 0.12, ry: halfWidth * 0.9 },
      { u: 0.56, across: halfWidth * 0.3, rx: bodyLength * 0.14, ry: halfWidth * 0.65 },
      { u: 0.3, across: -halfWidth * 0.2, rx: bodyLength * 0.1, ry: halfWidth * 0.55 },
    ];

    const eyeAlong = 0.3 * bodyLength;
    const eyeAcross = halfWidth * 0.25;
    const eyePoints: Array<[number, number]> = [];
    for (const side of [-1, 1]) {
      const ex = fish.x + cos * eyeAlong + perpX * eyeAcross * side;
      const ey = fish.y + sin * eyeAlong + perpY * eyeAcross * side;
      const pc = Math.round(ex / cw) * cw + cw / 2;
      const pr = Math.round(ey / ch) * ch + ch / 2;
      eyePoints.push([pc, pr]);
    }

    // Clip each path and draw a grid through it. We deliberately avoid
    // isPointInPath: calling it while/after a canvas clip can invalidate the
    // clip in some browsers, which made the reduced-motion still frame blank.
    const bodyHalfAlong = bodyLength * 0.55;
    const bodyHalfAcross = halfWidth * 1.35;
    const bodyBoxX = Math.abs(cos) * bodyHalfAlong + Math.abs(sin) * bodyHalfAcross;
    const bodyBoxY = Math.abs(sin) * bodyHalfAlong + Math.abs(cos) * bodyHalfAcross;
    const fishHalfAlong = bodyLength * 0.82;
    const fishHalfAcross = halfWidth * 1.8;
    const fishBoxX = Math.abs(cos) * fishHalfAlong + Math.abs(sin) * fishHalfAcross;
    const fishBoxY = Math.abs(sin) * fishHalfAlong + Math.abs(cos) * fishHalfAcross;

    const drawPass = (path: Path2D, mode: "body" | "tail" | "fin") => {
      const isBody = mode === "body";
      const stepX = isBody ? cw * 0.5 : cw;
      const stepY = isBody ? ch * 0.5 : ch;
      const boxX = isBody ? bodyBoxX : fishBoxX;
      const boxY = isBody ? bodyBoxY : fishBoxY;
      const startX = Math.floor((fish.x - boxX) / stepX) * stepX;
      const startY = Math.floor((fish.y - boxY) / stepY) * stepY;
      const endX = fish.x + boxX;
      const endY = fish.y + boxY;

      ctx.save();
      ctx.clip(path);
      ctx.font = this.kanjiFont(Math.round(ch * (isBody ? 0.82 : 0.86)));
      let sampleRow = 0;
      for (let gy = startY; gy <= endY; gy += stepY) {
        let sampleCol = 0;
        for (let gx = startX; gx <= endX; gx += stepX) {
          const px = gx + stepX / 2;
          const py = gy + stepY / 2;
          const dx = px - fish.x;
          const dy = py - fish.y;
          const along = dx * cos + dy * sin;
          const across = -dx * sin + dy * cos;
          const key = hash3(sampleCol, sampleRow, Math.round(fish.size * 100));

          let glyph: string;
          let color: string;
          let alpha = 0.94;
          if (mode === "tail") {
            glyph = TAIL_KANJI[Math.floor(key * TAIL_KANJI.length) % TAIL_KANJI.length];
            color = tailInk;
            alpha = 0.76;
          } else if (mode === "fin") {
            glyph = FIN_KANJI[Math.floor(key * FIN_KANJI.length) % FIN_KANJI.length];
            color = finInk;
            alpha = 0.68;
          } else {
            const inPatch = patches.some((patch) => {
              const cx = (patch.u - 0.5) * bodyLength;
              const cy = patch.across;
              return ((along - cx) / patch.rx) ** 2 + ((across - cy) / patch.ry) ** 2 <= 1;
            });
            if (inPatch) {
              glyph = PATCH_KANJI[Math.floor(key * PATCH_KANJI.length) % PATCH_KANJI.length];
              color = orange;
            } else {
              glyph = BODY_KANJI[Math.floor(key * BODY_KANJI.length) % BODY_KANJI.length];
              color = warm;
            }
            const flank = 1 - Math.min(1, Math.abs(across) / halfWidth) * 0.28;
            alpha = (0.78 + key * 0.2) * flank;
          }

          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.fillText(glyph, px, py);
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(0.45, cw * 0.055);
          ctx.lineJoin = "round";
          ctx.strokeText(glyph, px, py);
          sampleCol++;
        }
        sampleRow++;
      }
      ctx.restore();
    };

    drawPass(bodyPath, "body");
    drawPass(tailPath, "tail");
    for (const fin of finPaths) drawPass(fin, "fin");

    ctx.globalAlpha = 1;
    // Clip the eyes to the body so a snapped cell can never leave a floating
    // glyph outside the head.
    ctx.save();
    ctx.clip(bodyPath);
    ctx.font = this.kanjiFont(Math.round(ch * 1.24));
    ctx.fillStyle = eyeInk;
    ctx.strokeStyle = eyeInk;
    ctx.lineWidth = Math.max(0.3, cw * 0.04);
    for (const [px, py] of eyePoints) {
      ctx.fillText(EYE_KANJI, px, py);
      ctx.strokeText(EYE_KANJI, px, py);
    }
    ctx.restore();
  }

  /**
   * Select a CJK-capable fallback explicitly. Canvas text does not always
   * resolve the inherited Latin stack to a CJK face on the first still frame
   * under prefers-reduced-motion.
   */
  private kanjiFont(size: number) {
    return `700 ${size}px ${this.fontFamily}, "Noto Sans CJK JP", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Yu Mincho", "Noto Serif CJK JP", serif`;
  }

  private koiTailPath(
    fish: Koi,
    cos: number,
    sin: number,
    perpX: number,
    perpY: number,
    bodyLength: number,
    halfWidth: number,
  ) {
    const tailBend = Math.sin(0.02 * Math.PI * 1.55 + fish.phase) * bodyLength * 0.05;
    const tailX = fish.x - cos * bodyLength * 0.5 + perpX * tailBend;
    const tailY = fish.y - sin * bodyLength * 0.5 + perpY * tailBend;
    const tailLen = bodyLength * 0.26;
    const tailSpread = halfWidth * 1.15;
    const path = new Path2D();
    path.moveTo(tailX, tailY);
    path.quadraticCurveTo(
      tailX - cos * tailLen * 0.35 + perpX * tailSpread,
      tailY - sin * tailLen * 0.35 + perpY * tailSpread,
      tailX - cos * tailLen + perpX * tailSpread * 1.15,
      tailY - sin * tailLen + perpY * tailSpread * 1.15,
    );
    path.quadraticCurveTo(
      tailX - cos * tailLen * 0.62 + perpX * tailSpread * 0.15,
      tailY - sin * tailLen * 0.62 + perpY * tailSpread * 0.15,
      tailX - cos * tailLen - perpX * tailSpread * 1.15,
      tailY - sin * tailLen - perpY * tailSpread * 1.15,
    );
    path.quadraticCurveTo(
      tailX - cos * tailLen * 0.35 - perpX * tailSpread,
      tailY - sin * tailLen * 0.35 - perpY * tailSpread,
      tailX,
      tailY,
    );
    path.closePath();
    return path;
  }

  private koiFinPath(
    fish: Koi,
    side: number,
    cos: number,
    sin: number,
    perpX: number,
    perpY: number,
    bodyLength: number,
    halfWidth: number,
  ) {
    const shoulderBend = Math.sin(0.68 * Math.PI * 1.55 + fish.phase) * bodyLength * 0.05;
    const finX = fish.x + cos * (0.68 - 0.5) * bodyLength + perpX * shoulderBend;
    const finY = fish.y + sin * (0.68 - 0.5) * bodyLength + perpY * shoulderBend;
    const finBack = bodyLength * 0.12;
    const finSpread = halfWidth * 1.2;
    const path = new Path2D();
    path.moveTo(finX, finY);
    path.quadraticCurveTo(
      finX + perpX * finSpread * side - cos * finBack * 0.3,
      finY + perpY * finSpread * side - sin * finBack * 0.3,
      finX + perpX * finSpread * side - cos * finBack,
      finY + perpY * finSpread * side - sin * finBack,
    );
    path.quadraticCurveTo(
      finX + perpX * halfWidth * 0.2 - cos * finBack * 0.4,
      finY + perpY * halfWidth * 0.2 - sin * finBack * 0.4,
      finX,
      finY,
    );
    path.closePath();
    return path;
  }
}
