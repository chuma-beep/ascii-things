import { rgba } from "../core/color";
import { CellGrid } from "../core/grid";
import { resolvePalette, type Palette, type PaletteChoice } from "../palette";
import type { AmbientKind } from "./options";
import type { AmbientWorld, Koi } from "./world";

export interface AmbientRendererOptions {
  palette?: PaletteChoice;
  columns?: number;
  maxCells?: number;
  calm?: boolean;
}

/**
 * Koi are drawn procedurally: a tapered, slightly curved body rasterised into
 * character cells, with translucent vector fins and a flowing tail. This keeps
 * the ASCII grid but drops the rectangular sprite look.
 */
export class AmbientRenderer extends CellGrid {
  readonly kind: AmbientKind;
  protected palette: Palette;
  protected calm: boolean;

  constructor(canvas: HTMLCanvasElement, kind: AmbientKind, options: AmbientRendererOptions = {}) {
    super(canvas, { columns: options.columns, maxCells: options.maxCells });
    this.kind = kind;
    this.palette = resolvePalette(options.palette);
    this.calm = options.calm ?? false;
  }

  setOptions(options: AmbientRendererOptions) {
    if (options.palette !== undefined) this.palette = resolvePalette(options.palette);
    if (options.calm !== undefined) this.calm = options.calm;
    if (options.columns !== undefined || options.maxCells !== undefined) {
      this.setGridOptions({ columns: options.columns, maxCells: options.maxCells });
    }
  }

  render(world: AmbientWorld, _dt: number) {
    const { ctx, dpr, width, height, ch } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(this.bg, 0, 0, width, height);
    ctx.font = `600 ${Math.round(ch * 0.76)}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    this.paintScene(world);
    ctx.globalAlpha = 1;
  }

  private paintScene(world: AmbientWorld) {
    switch (this.kind) {
      case "starlings":
        this.drawStarlings(world);
        break;
      case "fireflies":
        this.drawFireflies(world);
        break;
      case "ants":
        this.drawAnts(world);
        break;
      case "koi":
        this.drawKoi(world);
        break;
      case "city":
        this.drawCity(world);
        break;
      default:
        this.drawServers(world);
    }
  }

  protected glyph(x: number, y: number, char: string, color: string, alpha = 1) {
    const { ctx, cw, ch } = this;
    const gx = Math.round(x / cw) * cw + cw / 2;
    const gy = Math.round(y / ch) * ch + ch / 2;
    if (gx < 0 || gy < 0 || gx > this.width + cw || gy > this.height + ch) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillText(char, gx, gy);
  }

  private backdrop(paint: (g: CanvasRenderingContext2D) => void) {
    this.paintBackdrop(this.palette.background, (g) => {
      const gradient = g.createLinearGradient(0, 0, 0, this.height);
      switch (this.kind) {
        case "starlings":
          gradient.addColorStop(0, "#050708");
          gradient.addColorStop(0.62, "#0a1117");
          gradient.addColorStop(1, "#0d1820");
          break;
        case "fireflies":
          gradient.addColorStop(0, "#07100c");
          gradient.addColorStop(0.7, "#0b1710");
          gradient.addColorStop(1, "#141c11");
          break;
        case "ants":
          gradient.addColorStop(0, "#0d0b09");
          gradient.addColorStop(1, "#1b130d");
          break;
        case "koi":
          gradient.addColorStop(0, "#061114");
          gradient.addColorStop(0.65, "#0a1c20");
          gradient.addColorStop(1, "#10282a");
          break;
        case "city":
          gradient.addColorStop(0, "#05070d");
          gradient.addColorStop(0.65, "#09101c");
          gradient.addColorStop(1, "#111727");
          break;
        default:
          gradient.addColorStop(0, "#05070b");
          gradient.addColorStop(1, "#0a1019");
      }
      g.fillStyle = gradient;
      g.fillRect(0, 0, this.width, this.height);
      paint(g);
    });
  }

  private drawStarlings(world: AmbientWorld) {
    this.backdrop((g) => {
      for (let i = 0; i < 90; i++) {
        const x = (((Math.sin(i * 12.9898) * 43758.5453) % 1) + 1) % 1;
        const y = (((Math.sin(i * 78.233) * 12345.6789) % 1) + 1) % 1;
        g.globalAlpha = 0.18 + ((i * 17) % 10) / 34;
        g.fillStyle = this.palette.fish[2];
        g.fillText(i % 7 === 0 ? "+" : "·", x * this.width, y * this.height * 0.72);
      }
      g.globalAlpha = 1;
      g.strokeStyle = rgba(this.palette.edge, 0.18);
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, this.height * 0.72);
      for (let x = 0; x <= this.width; x += this.cw * 2) {
        const y = this.height * 0.72 + Math.sin(x * 0.012) * this.ch * 2.4;
        g.lineTo(x, y);
      }
      g.stroke();
    });

    const birdColor = this.palette.fish[0];
    const darkBird = this.palette.fish[2];
    for (const bird of world.birds) {
      const char =
        Math.abs(bird.vx) > Math.abs(bird.vy) ? (bird.vx > 0 ? ">" : "<") : bird.vy > 0 ? "v" : "^";
      this.glyph(
        bird.x,
        bird.y,
        char,
        bird.phase % 3 < 1 ? darkBird : birdColor,
        0.55 + (bird.phase % 1) * 0.4,
      );
    }

    const p = world.predator;
    const dir = Math.sin(p.phase) > 0 ? ">" : "<";
    for (let i = -2; i <= 2; i++) {
      this.glyph(
        p.x + i * this.cw,
        p.y + Math.abs(i) * this.ch * 0.4,
        dir,
        rgba(this.palette.heatHot, 0.22),
        0.7,
      );
    }
  }

  private drawFireflies(world: AmbientWorld) {
    this.backdrop((g) => {
      g.fillStyle = "rgba(8, 20, 12, 0.85)";
      g.fillRect(0, this.height * 0.68, this.width, this.height * 0.32);
      for (let x = 0; x < this.width; x += this.cw * 1.6) {
        const h = (Math.sin(x * 0.031) * 0.5 + 0.5) * this.height * 0.18 + this.height * 0.05;
        g.globalAlpha = 0.28;
        g.strokeStyle = this.palette.fish[1];
        g.beginPath();
        g.moveTo(x, this.height);
        g.quadraticCurveTo(x + this.cw, this.height - h * 0.5, x + this.cw * 0.4, this.height - h);
        g.stroke();
      }
      g.globalAlpha = 1;
    });

    for (const fly of world.fireflies) {
      const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(fly.phase));
      const glow = Math.min(1, blink + fly.flare);
      if (glow > 0.55) {
        const radius = this.cw * (1.2 + glow);
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + fly.phase;
          this.glyph(
            fly.x + Math.cos(a) * radius,
            fly.y + Math.sin(a) * radius * 0.6,
            "+",
            rgba(this.palette.heatHot, 0.18),
            0.35,
          );
        }
      }
      this.glyph(
        fly.x,
        fly.y,
        glow > 0.7 ? "*" : glow > 0.4 ? "+" : "·",
        rgba(this.palette.heatHot, glow),
        0.5 + glow * 0.5,
      );
    }
  }

  private drawAnts(world: AmbientWorld) {
    this.backdrop((g) => {
      for (let i = 0; i < 80; i++) {
        const x = (((Math.sin(i * 4.117) * 9999) % 1) + 1) % 1;
        const y = (((Math.sin(i * 9.731) * 7777) % 1) + 1) % 1;
        g.globalAlpha = 0.14;
        g.fillStyle = this.palette.fish[2];
        g.fillText(i % 3 === 0 ? "·" : ":", x * this.width, y * this.height);
      }
      g.globalAlpha = 1;
    });

    for (const [key, strength] of world.trail) {
      const x = key % 100000;
      const y = Math.floor(key / 100000);
      if (strength < 0.08) continue;
      this.glyph(
        x * this.cw,
        y * this.ch,
        "·",
        rgba(this.palette.heatHot, Math.min(0.5, strength * 0.35)),
        0.7,
      );
    }

    const nestX = Math.round(world.nest.x / this.cw) * this.cw;
    const nestY = Math.round(world.nest.y / this.ch) * this.ch;
    for (let i = -2; i <= 2; i++) {
      this.glyph(
        nestX + i * this.cw,
        nestY + Math.abs(i) * this.ch * 0.5,
        i === 0 ? "#" : "=",
        rgba(this.palette.heat, 0.55),
        0.8,
      );
    }

    for (const crumb of world.crumbs) {
      this.glyph(
        crumb.x,
        crumb.y,
        crumb.amount > 1 ? "*" : "+",
        rgba(this.palette.heatHot, 0.85),
        0.9,
      );
    }
    for (const ant of world.ants) {
      this.glyph(
        ant.x,
        ant.y,
        ant.carrying ? "@" : "a",
        ant.carrying ? rgba(this.palette.heatHot, 0.9) : rgba(this.palette.heat, 0.7),
        0.85,
      );
    }
  }

  protected koiProfile(u: number) {
    let profile = Math.sin(Math.PI * (0.04 + u * 0.92)) ** 0.7;
    if (u < 0.22) profile *= 0.45 + 0.55 * (u / 0.22);
    if (u > 0.82) {
      profile *= Math.sqrt(Math.max(0, 1 - ((u - 0.82) / 0.18) ** 2)) * 0.6 + 0.4;
    }
    return profile;
  }

  protected koiBodyPath(
    fish: Koi,
    cos: number,
    sin: number,
    bodyLength: number,
    halfWidth: number,
  ) {
    const path = new Path2D();
    const steps = 28;
    const left: Array<[number, number]> = [];
    const right: Array<[number, number]> = [];
    for (let i = 0; i <= steps; i++) {
      const u = 0.02 + (i / steps) * 0.96;
      const along = (u - 0.5) * bodyLength;
      const bend = Math.sin(u * Math.PI * 1.55 + fish.phase) * bodyLength * 0.05;
      const x = fish.x + cos * along - sin * bend;
      const y = fish.y + sin * along + cos * bend;
      const width = this.koiProfile(u) * halfWidth;
      left.push([x - sin * width, y + cos * width]);
      right.push([x + sin * width, y - cos * width]);
    }
    path.moveTo(left[0][0], left[0][1]);
    for (let i = 1; i < left.length; i++) path.lineTo(left[i][0], left[i][1]);
    for (let i = right.length - 1; i >= 0; i--) path.lineTo(right[i][0], right[i][1]);
    path.closePath();
    return path;
  }

  /**
   * Paint the body fill and scale texture. Split out so the kanji renderer can
   * replace only the texture while reusing the tail, fins, eyes, and motion.
   */
  protected paintKoiBody(
    fish: Koi,
    bodyPath: Path2D,
    bodyLength: number,
    halfWidth: number,
    cos: number,
    sin: number,
  ) {
    const { ctx, cw, ch } = this;
    const orange = rgba(this.palette.heatHot, 1);
    const warm = this.palette.dark ? "rgba(255, 246, 230, 0.95)" : "rgba(38, 42, 50, 0.92)";
    // Body: a smooth tapered shape. A translucent calico patch layer and a
    // sparse glyph scale pattern keep it in the same visual family as the
    // cell-rendered sharks without turning the fish into a block of cells.
    const bodyGradient = ctx.createLinearGradient(
      fish.x - cos * bodyLength * 0.5,
      fish.y - sin * bodyLength * 0.5,
      fish.x + cos * bodyLength * 0.5,
      fish.y + sin * bodyLength * 0.5,
    );
    bodyGradient.addColorStop(
      0,
      this.palette.dark ? "rgba(205, 195, 180, 0.55)" : "rgba(70, 60, 52, 0.5)",
    );
    bodyGradient.addColorStop(0.55, warm);
    bodyGradient.addColorStop(
      1,
      this.palette.dark ? "rgba(255, 250, 240, 0.98)" : "rgba(24, 28, 34, 0.96)",
    );
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = bodyGradient;
    ctx.fill(bodyPath);
    ctx.clip(bodyPath);

    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.rotate(fish.heading);
    ctx.fillStyle = orange;
    const patches = [
      { u: 0.78, across: 0, rx: bodyLength * 0.12, ry: halfWidth * 0.9 },
      { u: 0.56, across: halfWidth * 0.3, rx: bodyLength * 0.14, ry: halfWidth * 0.65 },
      { u: 0.3, across: -halfWidth * 0.2, rx: bodyLength * 0.1, ry: halfWidth * 0.55 },
    ];
    for (const patch of patches) {
      ctx.beginPath();
      ctx.ellipse(
        (patch.u - 0.5) * bodyLength,
        patch.across,
        patch.rx,
        patch.ry,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();

    // Sparse scale marks. The clip keeps them inside the silhouette.
    const texture = this.palette.dark ? "rgba(68, 48, 38, 0.18)" : "rgba(255, 255, 255, 0.18)";
    ctx.font = `400 ${Math.round(ch * 0.42)}px ${this.fontFamily}`;
    const reach = bodyLength * 0.5 + halfWidth * 2;
    const startX = Math.round((fish.x - reach) / cw) * cw;
    const startY = Math.round((fish.y - reach) / ch) * ch;
    for (let gy = startY; gy <= fish.y + reach; gy += ch) {
      for (let gx = startX; gx <= fish.x + reach; gx += cw) {
        if ((Math.floor(gx / cw) + Math.floor(gy / ch)) % 3 !== 0) continue;
        if (!ctx.isPointInPath(bodyPath, gx + cw * 0.5, gy + ch * 0.5)) continue;
        this.glyph(gx + cw * 0.5, gy + ch * 0.5, "'", texture, 0.6);
      }
    }
    ctx.restore();
  }

  protected drawKoiFish(fish: Koi) {
    const { ctx, cw, ch } = this;
    const cos = Math.cos(fish.heading);
    const sin = Math.sin(fish.heading);
    const perpX = -sin;
    const perpY = cos;
    const bodyCells = Math.round(14 + fish.size * 5);
    const bodyLength = bodyCells * cw;
    const halfWidth = (1.8 + fish.size * 0.8) * cw;
    const warm = this.palette.dark ? "rgba(255, 246, 230, 0.95)" : "rgba(38, 42, 50, 0.92)";
    const rim = this.palette.dark ? "rgba(255, 248, 234, 0.9)" : "rgba(255, 246, 230, 0.8)";
    const eye = this.palette.dark ? "rgba(8, 12, 14, 0.96)" : "rgba(12, 14, 18, 0.96)";
    const bodyPath = this.koiBodyPath(fish, cos, sin, bodyLength, halfWidth);
    const tailBend = Math.sin(0.02 * Math.PI * 1.55 + fish.phase) * bodyLength * 0.05;
    const tailX = fish.x - cos * bodyLength * 0.5 + perpX * tailBend;
    const tailY = fish.y - sin * bodyLength * 0.5 + perpY * tailBend;

    // Soft shadow under the fish.
    ctx.save();
    ctx.translate(cw * 0.25, ch * 0.3);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fill(bodyPath);
    ctx.restore();

    // Tail: two translucent lobes with a warm rim.
    const tailLen = bodyLength * 0.26;
    const tailSpread = halfWidth * 1.15;
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = warm;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.quadraticCurveTo(
      tailX - cos * tailLen * 0.35 + perpX * tailSpread,
      tailY - sin * tailLen * 0.35 + perpY * tailSpread,
      tailX - cos * tailLen + perpX * tailSpread * 1.15,
      tailY - sin * tailLen + perpY * tailSpread * 1.15,
    );
    ctx.quadraticCurveTo(
      tailX - cos * tailLen * 0.62 + perpX * tailSpread * 0.15,
      tailY - sin * tailLen * 0.62 + perpY * tailSpread * 0.15,
      tailX - cos * tailLen - perpX * tailSpread * 1.15,
      tailY - sin * tailLen - perpY * tailSpread * 1.15,
    );
    ctx.quadraticCurveTo(
      tailX - cos * tailLen * 0.35 - perpX * tailSpread,
      tailY - sin * tailLen * 0.35 - perpY * tailSpread,
      tailX,
      tailY,
    );
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = rgba(this.palette.heatHot, 0.9);
    ctx.lineWidth = Math.max(1, cw * 0.06);
    ctx.stroke();
    ctx.restore();

    // Pectoral fins.
    const shoulderBend = Math.sin(0.68 * Math.PI * 1.55 + fish.phase) * bodyLength * 0.05;
    const finX = fish.x + cos * (0.68 - 0.5) * bodyLength + perpX * shoulderBend;
    const finY = fish.y + sin * (0.68 - 0.5) * bodyLength + perpY * shoulderBend;
    const finBack = bodyLength * 0.12;
    const finSpread = halfWidth * 1.2;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = warm;
      ctx.beginPath();
      ctx.moveTo(finX, finY);
      ctx.quadraticCurveTo(
        finX + perpX * finSpread * side - cos * finBack * 0.3,
        finY + perpY * finSpread * side - sin * finBack * 0.3,
        finX + perpX * finSpread * side - cos * finBack,
        finY + perpY * finSpread * side - sin * finBack,
      );
      ctx.quadraticCurveTo(
        finX + perpX * halfWidth * 0.2 - cos * finBack * 0.4,
        finY + perpY * halfWidth * 0.2 - sin * finBack * 0.4,
        finX,
        finY,
      );
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = rgba(this.palette.heatHot, 0.8);
      ctx.lineWidth = Math.max(1, cw * 0.05);
      ctx.stroke();
      ctx.restore();
    }

    this.paintKoiBody(fish, bodyPath, bodyLength, halfWidth, cos, sin);

    // Rim and a thin spine highlight.
    ctx.save();
    ctx.strokeStyle = rim;
    ctx.lineWidth = Math.max(1, cw * 0.12);
    ctx.globalAlpha = 0.8;
    ctx.stroke(bodyPath);
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = rgba(this.palette.heatHot, 0.9);
    ctx.lineWidth = Math.max(1, cw * 0.05);
    ctx.stroke(bodyPath);
    ctx.restore();

    ctx.save();
    ctx.clip(bodyPath);
    ctx.strokeStyle = this.palette.dark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = Math.max(1, cw * 0.08);
    ctx.beginPath();
    for (let i = 0; i <= 18; i++) {
      const u = 0.1 + (i / 18) * 0.8;
      const along = (u - 0.5) * bodyLength;
      const bend = Math.sin(u * Math.PI * 1.55 + fish.phase) * bodyLength * 0.05;
      const x = fish.x + cos * along - sin * (bend - halfWidth * 0.25);
      const y = fish.y + sin * along + cos * (bend - halfWidth * 0.25);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Eyes, set wide on the head.
    const eyeAlong = (0.82 - 0.5) * bodyLength;
    const eyeAcross = halfWidth * 0.45;
    for (const side of [-1, 1]) {
      const ex = fish.x + cos * eyeAlong + perpX * eyeAcross * side;
      const ey = fish.y + sin * eyeAlong + perpY * eyeAcross * side;
      ctx.save();
      ctx.globalAlpha = 0.96;
      ctx.fillStyle = eye;
      ctx.beginPath();
      ctx.arc(ex, ey, Math.max(1.8, cw * 0.28), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = rgba(this.palette.heatHot, 0.9);
      ctx.lineWidth = Math.max(1, cw * 0.06);
      ctx.stroke();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(ex - cw * 0.06, ey - ch * 0.06, Math.max(0.7, cw * 0.09), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawKoi(world: AmbientWorld) {
    this.backdrop((g) => {
      const glow = g.createRadialGradient(
        this.width * 0.5,
        this.height * 0.18,
        0,
        this.width * 0.5,
        this.height * 0.18,
        Math.max(this.width, this.height) * 0.9,
      );
      glow.addColorStop(0, rgba(this.palette.heatHot, 0.09));
      glow.addColorStop(0.55, rgba(this.palette.heatHot, 0.03));
      glow.addColorStop(1, rgba(this.palette.heatHot, 0));
      g.fillStyle = glow;
      g.fillRect(0, 0, this.width, this.height);

      g.strokeStyle = this.palette.fish[2];
      g.lineWidth = 1;
      g.globalAlpha = 0.24;
      for (let y = this.height * 0.22; y < this.height; y += this.ch * 4) {
        g.beginPath();
        g.moveTo(0, y);
        for (let x = 0; x <= this.width; x += this.cw * 2) {
          g.lineTo(x, y + Math.sin(x * 0.014 + y) * this.ch);
        }
        g.stroke();
      }
      g.globalAlpha = 0.1;
      g.strokeStyle = this.palette.fish[1];
      for (let y = this.height * 0.34; y < this.height; y += this.ch * 7) {
        g.beginPath();
        g.moveTo(0, y);
        for (let x = 0; x <= this.width; x += this.cw * 3) {
          g.lineTo(x, y + Math.sin(x * 0.009 + y * 0.6) * this.ch * 1.6);
        }
        g.stroke();
      }
      g.globalAlpha = 1;
    });

    for (const pad of world.lilyPads) {
      const radius = Math.max(1, Math.round(1.2 + pad.size * 1.6));
      for (let i = -radius; i <= radius; i++) {
        const center = i === 0;
        this.glyph(
          pad.x + i * this.cw,
          pad.y,
          center ? (pad.size > 1.15 ? "*" : "@") : "=",
          center && pad.size > 1.15 ? rgba(this.palette.heatHot, 0.65) : this.palette.fish[2],
          center ? 0.5 : 0.3,
        );
      }
      this.glyph(pad.x, pad.y - this.ch, "-", this.palette.fish[1], 0.22);
      this.glyph(pad.x, pad.y + this.ch, "-", this.palette.fish[1], 0.22);
    }

    for (const ripple of world.ripples) {
      const r = ripple.radius;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        this.glyph(
          ripple.x + Math.cos(a) * r,
          ripple.y + Math.sin(a) * r * 0.52,
          i % 3 === 0 ? "o" : "·",
          this.palette.fish[3] ?? this.palette.fish[0],
          0.55,
        );
      }
    }
    for (const crumb of world.crumbs) {
      this.glyph(crumb.x, crumb.y, "*", rgba(this.palette.heatHot, 0.8), 0.8);
      this.glyph(crumb.x - this.cw, crumb.y, "·", rgba(this.palette.heatHot, 0.35), 0.6);
    }

    // Wakes go down before any body glyphs so they read as water, not fins.
    for (const fish of world.koi) {
      const cos = Math.cos(fish.heading);
      const sin = Math.sin(fish.heading);
      const half = Math.round(10 + fish.size * 6) / 2;
      for (let i = 1; i <= 3; i++) {
        this.glyph(
          fish.x - cos * (half + 1.4 + i * 0.95) * this.cw,
          fish.y - sin * (half + 1.4 + i * 0.95) * this.cw,
          "·",
          this.palette.fish[2],
          0.2 / i,
        );
      }
    }

    const baseFont = this.ctx.font;
    this.ctx.font = `700 ${Math.round(this.ch * 0.84)}px ${this.fontFamily}`;
    for (const fish of world.koi) this.drawKoiFish(fish);
    this.ctx.font = baseFont;
  }

  private drawCity(world: AmbientWorld) {
    this.backdrop((g) => {
      g.fillStyle = "rgba(255, 122, 26, 0.04)";
      g.fillRect(0, this.height * 0.55, this.width, this.height * 0.45);
      for (let i = 0; i < 40; i++) {
        const x = (((Math.sin(i * 3.77) * 8888) % 1) + 1) % 1;
        const y = (((Math.sin(i * 7.19) * 4444) % 1) + 1) % 1;
        g.globalAlpha = 0.16;
        g.fillStyle = this.palette.fish[2];
        g.fillText("·", x * this.width, y * this.height * 0.45);
      }
      g.globalAlpha = 1;
    });

    for (const b of world.buildings) {
      const rows = Math.max(1, Math.floor(b.height / (this.ch * 2)));
      const cols = Math.max(1, Math.floor(b.width / (this.cw * 2)));
      const edge = rgba(this.palette.edge, 0.58);
      const roof = rgba(this.palette.heat, 0.5);

      for (let c = 0; c <= cols; c++) {
        const x = b.x + c * this.cw * 2;
        this.glyph(x, b.y, "-", roof, 0.7);
        this.glyph(x, b.y + b.height, "-", edge, 0.55);
      }
      for (let r = 0; r <= rows; r++) {
        const y = b.y + r * this.ch * 2;
        this.glyph(b.x, y, "|", edge, 0.55);
        this.glyph(b.x + b.width, y, "|", edge, 0.55);
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const lit = (b.seed + r * 7 + c * 11) % 9 < 3 + (world.pulse > 0 ? 3 : 0);
          this.glyph(
            b.x + c * this.cw * 2,
            b.y + r * this.ch * 2,
            lit ? "+" : ".",
            lit ? rgba(this.palette.heatHot, 0.55) : rgba(this.palette.edge, 0.22),
            lit ? 0.8 : 0.5,
          );
        }
      }
    }

    for (const car of world.cars) {
      this.glyph(
        car.x,
        car.y,
        car.direction > 0 ? ">" : "<",
        this.palette.fish[car.color % this.palette.fish.length],
        0.9,
      );
      this.glyph(car.x - car.direction * this.cw, car.y, "-", rgba(this.palette.heat, 0.35), 0.5);
    }

    for (let x = this.cw; x < this.width; x += this.cw * 9) {
      this.glyph(
        x,
        this.height * 0.92,
        "o",
        world.pulse > 0
          ? rgba(this.palette.heatHot, 0.9)
          : (this.palette.fish[4] ?? this.palette.fish[0]),
        0.6,
      );
    }
  }

  private drawServers(world: AmbientWorld) {
    this.backdrop((g) => {
      g.globalAlpha = 0.2;
      g.strokeStyle = this.palette.grid;
      g.lineWidth = 1;
      for (let x = 0; x < this.width; x += this.cw * 4) {
        g.beginPath();
        g.moveTo(x, this.height * 0.82);
        g.lineTo(this.width * 0.5, this.height * 0.88);
        g.stroke();
      }
      g.globalAlpha = 1;
    });

    for (const rack of world.servers) {
      const { ctx } = this;
      ctx.globalAlpha = 0.48;
      ctx.strokeStyle = rgba(this.palette.edge, 0.5);
      ctx.strokeRect(rack.x, rack.y, rack.width, rack.height);
      ctx.globalAlpha = 1;
      for (let i = 0; i < rack.leds.length; i++) {
        const on = (Math.sin(world.time * (1.4 + i * 0.3) + rack.phase + i) + 1) / 2 > 0.35;
        const x = rack.x + this.cw * (1 + (i % 3) * 1.6);
        const y = rack.y + this.ch * (1 + Math.floor(i / 3) * 2);
        this.glyph(
          x,
          y,
          on ? "+" : ".",
          on ? rgba(this.palette.heatHot, 0.9) : rgba(this.palette.edge, 0.25),
          on ? 0.9 : 0.4,
        );
      }
      this.glyph(
        rack.x + rack.width * 0.5,
        rack.y + rack.height - this.ch,
        "@",
        this.palette.fish[1],
        0.4,
      );
    }

    for (const packet of world.packets) {
      const dx = packet.toX - packet.fromX;
      const dy = packet.toY - packet.fromY;
      const char = Math.abs(dx) > Math.abs(dy) ? "-" : "|";
      this.glyph(packet.x, packet.y, char, rgba(this.palette.heatHot, 0.7), 0.8);
    }
    if (world.alert > 0) {
      this.glyph(
        this.width * 0.5,
        this.height * 0.12,
        "!",
        rgba(this.palette.heatHot, Math.min(1, world.alert)),
        0.8,
      );
    }
  }
}
