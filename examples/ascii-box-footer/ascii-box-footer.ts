/**
 * ASCII box footer — a copyable canvas background made of a box lattice.
 *
 * Drop a canvas into a footer, call createAsciiBoxFooter(canvas), and the
 * component owns sizing, device pixel ratio, reduced motion, and visibility.
 * No dependencies, no framework.
 */

const FONT_STACK = '"Geist Mono", ui-monospace, "SFMono-Regular", Menlo, monospace';

const DEFAULTS = {
  size: 12,
  boxWidth: 7,
  boxHeight: 3,
  padding: 18,
  speed: 1,
  scan: true,
  foreground: "rgba(236, 232, 223, 0.72)",
  accent: "rgba(255, 122, 26, 0.95)",
  maxDpr: 2,
};

export interface AsciiBoxFooterOptions {
  /** Character size in CSS pixels. */
  size?: number;
  /** Character columns per box. */
  boxWidth?: number;
  /** Character rows per box. */
  boxHeight?: number;
  /** Inset from the canvas edge in CSS pixels. */
  padding?: number;
  /** Scan speed multiplier. */
  speed?: number;
  /** Draw the moving orange scan band. */
  scan?: boolean;
  /** Lattice colour. */
  foreground?: string;
  /** Scan colour. */
  accent?: string;
  /** Device pixel ratio cap. */
  maxDpr?: number;
}

interface Glyph {
  char: string;
  x: number;
  y: number;
  alpha: number;
}

export class AsciiBoxFooter {
  readonly canvas: HTMLCanvasElement;
  private readonly options: Required<AsciiBoxFooterOptions>;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly motionQuery: MediaQueryList;
  private readonly resizeObserver: ResizeObserver | null;
  private readonly intersectionObserver: IntersectionObserver | null;
  private staticLayer: HTMLCanvasElement | null = null;
  private glyphs: Glyph[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;
  private frameId = 0;
  private running = false;
  private onScreen = false;
  private visible = !document.hidden;
  private lastFrame = 0;
  private reduced = false;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, options: AsciiBoxFooterOptions = {}) {
    this.canvas = canvas;
    this.options = { ...DEFAULTS, ...options };
    this.ctx = canvas.getContext("2d");
    this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reduced = this.motionQuery.matches;
    this.canvas.dataset.renderer = "ascii-box";

    this.onMotionChange = this.onMotionChange.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    this.onIntersect = this.onIntersect.bind(this);
    this.render = this.render.bind(this);

    this.motionQuery.addEventListener("change", this.onMotionChange);
    document.addEventListener("visibilitychange", this.onVisibilityChange);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);

    this.intersectionObserver = new IntersectionObserver(this.onIntersect, {
      rootMargin: "220px",
    });
    this.intersectionObserver.observe(canvas);

    this.resize();
    this.start();

    // Web fonts change the monospace metrics; redraw once they are ready.
    document.fonts?.ready.then(() => {
      if (!this.disposed) this.resize(true);
    });
  }

  destroy() {
    this.disposed = true;
    this.stop();
    this.motionQuery.removeEventListener("change", this.onMotionChange);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.staticLayer = null;
    this.glyphs = [];
  }

  private onMotionChange(event: MediaQueryListEvent) {
    this.reduced = event.matches;
    this.draw(this.reduced ? 0 : performance.now());
    if (this.reduced) this.stop();
    else this.start();
  }

  private onVisibilityChange() {
    this.visible = !document.hidden;
    if (this.visible) this.start();
    else this.stop();
  }

  private onIntersect(entries: IntersectionObserverEntry[]) {
    this.onScreen = entries.some((entry) => entry.isIntersecting);
    if (this.onScreen) this.start();
    else this.stop();
  }

  private start() {
    if (!this.ctx || this.reduced || this.running || !this.visible || !this.onScreen) return;
    this.running = true;
    this.frameId = window.requestAnimationFrame(this.render);
  }

  private stop() {
    this.running = false;
    window.cancelAnimationFrame(this.frameId);
  }

  private render(now: number) {
    if (!this.running) return;
    this.frameId = window.requestAnimationFrame(this.render);
    if (now - this.lastFrame < 1000 / 30) return;
    this.lastFrame = now;
    this.draw(now);
  }

  private resize(force = false) {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (width < 1 || height < 1) return;
    if (!force && width === this.width && height === this.height && this.staticLayer) return;

    this.width = width;
    this.height = height;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.options.maxDpr);

    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.buildStaticLayer();
    this.draw(this.reduced ? 0 : performance.now());
  }

  private buildStaticLayer() {
    const { size, boxWidth, boxHeight, padding } = this.options;
    const charWidth = size * 0.6;
    const charHeight = size * 1.08;
    const frameWidth = Math.max(charWidth, this.width - padding * 2);
    const frameHeight = Math.max(charHeight, this.height - padding * 2);
    const columns = Math.max(1, Math.floor(frameWidth / charWidth));
    const rows = Math.max(1, Math.floor(frameHeight / charHeight));
    const stepX = frameWidth / columns;
    const stepY = frameHeight / rows;

    const layer = document.createElement("canvas");
    layer.width = this.canvas.width;
    layer.height = this.canvas.height;
    const ctx = layer.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.font = `${size}px ${FONT_STACK}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = this.options.foreground;

    this.glyphs = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const onVertical = col % boxWidth === 0;
        const onHorizontal = row % boxHeight === 0;
        const x = padding + col * stepX;
        const y = padding + row * stepY;

        if (!onVertical && !onHorizontal) {
          // A little dust inside the boxes, deterministic so it does not crawl.
          if ((col * 7 + row * 11) % 29 === 0) {
            this.pushGlyph(ctx, "·", x, y, 0.16 + (y / this.height) * 0.12);
          }
          continue;
        }

        const char = onVertical && onHorizontal ? "+" : onVertical ? "|" : "-";
        const edge = col === 0 || row === 0 || col === columns - 1 || row === rows - 1;
        const depth = 0.16 + (y / this.height) * 0.3;
        this.pushGlyph(ctx, char, x, y, edge ? Math.max(0.58, depth) : depth);
      }
    }

    // A brighter outer frame makes the footer read as one deliberate ASCII box.
    this.drawFrame(ctx, padding, stepX, stepY, frameWidth, frameHeight);

    this.staticLayer = layer;
  }

  private pushGlyph(
    ctx: CanvasRenderingContext2D,
    char: string,
    x: number,
    y: number,
    alpha: number,
  ) {
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.fillText(char, x, y);
    this.glyphs.push({ char, x, y, alpha });
  }

  private drawFrame(
    ctx: CanvasRenderingContext2D,
    padding: number,
    stepX: number,
    stepY: number,
    width: number,
    height: number,
  ) {
    const right = padding + width;
    const bottom = padding + height;
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = this.options.foreground;

    for (let x = padding; x <= right + 0.5; x += stepX) {
      ctx.fillText(x <= padding + 0.5 || x >= right - 0.5 ? "+" : "-", x, padding);
      ctx.fillText(x <= padding + 0.5 || x >= right - 0.5 ? "+" : "-", x, bottom);
    }
    for (let y = padding; y <= bottom + 0.5; y += stepY) {
      ctx.fillText("|", padding, y);
      ctx.fillText("|", right, y);
    }

    // Accent corner ticks: four small orange crosses.
    ctx.fillStyle = this.options.accent;
    ctx.globalAlpha = 0.9;
    ctx.fillText("+", padding, padding);
    ctx.fillText("+", right, padding);
    ctx.fillText("+", padding, bottom);
    ctx.fillText("+", right, bottom);
  }

  private draw(time: number) {
    const ctx = this.ctx;
    if (!ctx || !this.staticLayer) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.staticLayer, 0, 0);

    if (!this.options.scan) return;

    const seconds = time * 0.001 * this.options.speed;
    const span = this.width + 280;
    const scanX = this.reduced ? this.width * 0.22 : ((seconds * 46) % span) - 140;
    const falloff = 120;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.font = `${this.options.size}px ${FONT_STACK}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = this.options.accent;

    for (const glyph of this.glyphs) {
      const distance = Math.abs(glyph.x - scanX);
      if (distance > falloff) continue;
      const glow = 1 - distance / falloff;
      ctx.globalAlpha = Math.min(1, glyph.alpha + glow * 0.7);
      ctx.fillText(glyph.char, glyph.x, glyph.y);
    }

    ctx.globalAlpha = 1;
  }
}

export function createAsciiBoxFooter(
  canvas: HTMLCanvasElement,
  options: AsciiBoxFooterOptions = {},
): AsciiBoxFooter {
  return new AsciiBoxFooter(canvas, options);
}
