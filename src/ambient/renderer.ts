import { rgba } from "../core/color";
import { CellGrid } from "../core/grid";
import { resolvePalette, type Palette, type PaletteChoice } from "../palette";
import type { AmbientKind } from "./options";
import type { AmbientWorld } from "./world";

export interface AmbientRendererOptions {
  palette?: PaletteChoice;
  columns?: number;
  maxCells?: number;
  calm?: boolean;
}

export class AmbientRenderer extends CellGrid {
  readonly kind: AmbientKind;
  private palette: Palette;
  private calm: boolean;

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

  private glyph(x: number, y: number, char: string, color: string, alpha = 1) {
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

  private drawKoi(world: AmbientWorld) {
    this.backdrop((g) => {
      g.globalAlpha = 0.18;
      g.strokeStyle = this.palette.fish[2];
      g.lineWidth = 1;
      for (let y = this.height * 0.22; y < this.height; y += this.ch * 4) {
        g.beginPath();
        g.moveTo(0, y);
        for (let x = 0; x <= this.width; x += this.cw * 2) {
          g.lineTo(x, y + Math.sin(x * 0.014 + y) * this.ch);
        }
        g.stroke();
      }
      g.globalAlpha = 1;
    });

    for (const pad of world.lilyPads) {
      for (let i = -1; i <= 1; i++) {
        this.glyph(pad.x + i * this.cw, pad.y, i === 0 ? "@" : ":", this.palette.fish[1], 0.45);
      }
    }
    for (const ripple of world.ripples) {
      const r = ripple.radius;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        this.glyph(
          ripple.x + Math.cos(a) * r,
          ripple.y + Math.sin(a) * r * 0.52,
          "o",
          this.palette.fish[3] ?? this.palette.fish[0],
          0.5,
        );
      }
    }
    for (const crumb of world.crumbs) {
      this.glyph(crumb.x, crumb.y, "*", rgba(this.palette.heatHot, 0.8), 0.8);
    }
    for (const fish of world.koi) {
      const dir = fish.vx >= 0 ? ">" : "<";
      const color = fish.phase % 2 < 1 ? rgba(this.palette.heatHot, 0.9) : this.palette.fish[0];
      this.glyph(fish.x, fish.y, dir, color, 0.9);
      this.glyph(fish.x - Math.sign(fish.vx) * this.cw, fish.y, "~", color, 0.5);
    }
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
