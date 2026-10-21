export type DitherMatrixName = "bayer2" | "bayer4" | "bayer8" | "none";

export const DITHER_MATRICES: Record<Exclude<DitherMatrixName, "none">, readonly number[]> = {
  bayer2: [0, 2, 3, 1],
  bayer4: [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5],
  bayer8: [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60,
    28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47,
    7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
  ],
};

export interface DitherFieldOptions {
  /** Wordmark or short line rendered inside the field. */
  text?: string;
  /** Ordered dither pattern. `none` produces a uniform dot field. */
  matrix?: DitherMatrixName;
  /** Dot spacing in CSS pixels. `0` derives it from the canvas width. */
  cell?: number;
  /** Background dot density, 0–1. */
  density?: number;
  /** Density inside the text mask, 0–1. */
  wordDensity?: number;
  /** Animated accent band. */
  scan?: boolean;
  /** Speed multiplier for the wave and scan. */
  speed?: number;
  foreground?: string;
  accent?: string;
  background?: string;
  fontFamily?: string;
}

export const DITHER_DEFAULTS = {
  text: "ASCII-THINGS",
  matrix: "bayer4" as DitherMatrixName,
  cell: 0,
  density: 0.1,
  wordDensity: 0.78,
  scan: true,
  speed: 1,
  foreground: "rgba(236,232,223,0.7)",
  accent: "rgba(255,122,26,0.92)",
  background: "transparent",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
} satisfies Required<DitherFieldOptions>;

function applyDefined(target: Required<DitherFieldOptions>, options: DitherFieldOptions): void {
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) {
      (target as Record<string, unknown>)[key] = value;
    }
  }
}

function withDefaults(options: DitherFieldOptions): Required<DitherFieldOptions> {
  const merged = { ...DITHER_DEFAULTS };
  applyDefined(merged, options);
  return merged;
}

/** Return the normalized threshold for a cell in an ordered dither matrix. */
export function ditherThreshold(matrix: DitherMatrixName, x: number, y: number): number {
  if (matrix === "none") return 0.5;
  const values = DITHER_MATRICES[matrix];
  const size = Math.sqrt(values.length);
  return (values[(Math.abs(y) % size) * size + (Math.abs(x) % size)] + 0.5) / (size * size);
}

/** True when a luminance value should produce a dot. */
export function shouldDither(
  value: number,
  matrix: DitherMatrixName,
  x: number,
  y: number,
): boolean {
  return value > ditherThreshold(matrix, x, y);
}

/**
 * A self-contained canvas dither field: a text mask emerges from an ordered
 * dot field while an accent scan band moves across it.
 *
 * The class owns resize, visibility, reduced-motion, and animation lifecycle.
 * Call `destroy()` when the canvas is removed.
 */
export class DitherField {
  readonly canvas: HTMLCanvasElement;
  options: Required<DitherFieldOptions>;

  private ctx: CanvasRenderingContext2D;
  private width = 1;
  private height = 1;
  private mask: Uint8ClampedArray | null = null;
  private maskWidth = 1;
  private maskHeight = 1;
  private raf = 0;
  private running = false;
  private paused = false;
  private visible = true;
  private onScreen = true;
  private reduced = false;
  private destroyed = false;
  private last = 0;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private motionQuery: MediaQueryList | null = null;
  private onMotionChange: (() => void) | null = null;
  private onVisibilityChange: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, options: DitherFieldOptions = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("ascii-things/dither: 2D canvas context is unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    this.options = withDefaults(options);
    this.motionQuery =
      typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    this.reduced = this.motionQuery?.matches ?? false;
    this.resize();
    this.observe();
    if (!this.reduced) this.start();
  }

  private observe(): void {
    if (typeof window === "undefined") return;
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        this.onScreen = entries.some((entry) => entry.isIntersecting);
        if (!this.onScreen) this.stop();
        else if (!this.reduced) this.start();
      },
      { rootMargin: "240px 0px" },
    );
    this.intersectionObserver.observe(this.canvas);

    this.onVisibilityChange = () => {
      this.visible = !document.hidden;
      if (!this.visible) this.stop();
      else if (!this.reduced) this.start();
    };
    document.addEventListener("visibilitychange", this.onVisibilityChange);

    if (this.motionQuery) {
      this.onMotionChange = () => {
        this.reduced = this.motionQuery?.matches ?? false;
        if (this.reduced) {
          this.stop();
          this.draw(0);
        } else if (this.visible && this.onScreen) {
          this.start();
        }
      };
      this.motionQuery.addEventListener("change", this.onMotionChange);
    }

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvas);
    } else {
      window.addEventListener("resize", this.resize);
    }
    document.fonts?.ready.then(() => this.resize()).catch(() => undefined);
  }

  /** Rebuild the sampled text mask and canvas bitmap from the current size. */
  resize = (): void => {
    if (this.destroyed) return;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.buildMask();
    if (!this.running) this.draw(0);
  };

  private buildMask(): void {
    const { text, fontFamily } = this.options;
    const offscreen = document.createElement("canvas");
    offscreen.width = this.width;
    offscreen.height = this.height;
    const ctx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      this.mask = null;
      return;
    }
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.width, this.height);
    if (text) {
      let size = this.height * 0.62;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      do {
        ctx.font = `700 ${size}px ${fontFamily}`;
        if (ctx.measureText(text).width <= this.width * 0.84) break;
        size *= 0.92;
      } while (size > 4);
      ctx.fillStyle = "#fff";
      ctx.fillText(text, this.width / 2, this.height * 0.55);
    }
    try {
      const data = ctx.getImageData(0, 0, this.width, this.height).data;
      this.mask = data;
      this.maskWidth = this.width;
      this.maskHeight = this.height;
    } catch {
      this.mask = null;
    }
  }

  private brightness(x: number, y: number): number {
    if (!this.mask) return 0;
    const px = Math.max(0, Math.min(this.maskWidth - 1, Math.round(x)));
    const py = Math.max(0, Math.min(this.maskHeight - 1, Math.round(y)));
    return (this.mask[(py * this.maskWidth + px) * 4] ?? 0) / 255;
  }

  draw(time: number): void {
    const { matrix, cell, density, wordDensity, scan, speed, foreground, accent, background } =
      this.options;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    if (background !== "transparent") {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    const step = cell > 0 ? cell : Math.max(2.2, this.width / 240);
    const scanX = !scan
      ? -1e4
      : time === 0
        ? this.width * 0.18
        : ((time * 0.055 * speed) % (this.width + 260)) - 130;

    for (let y = step / 2; y < this.height; y += step) {
      for (let x = step / 2; x < this.width; x += step) {
        const isWord = this.brightness(x, y) > 0.42;
        const wave = 0.5 + 0.5 * Math.sin(x * 0.012 + y * 0.009 + time * 0.0007 * speed);
        const target = isWord ? wordDensity : density * (0.65 + 0.7 * wave);
        if (!shouldDither(target, matrix, Math.round(x / step), Math.round(y / step))) continue;

        const nearScan = Math.abs(x - scanX) < 58;
        const size = step * (nearScan ? 0.92 : isWord ? 0.62 : 0.34);
        ctx.fillStyle = nearScan ? accent : foreground;
        ctx.globalAlpha = nearScan || isWord ? 1 : 0.38;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
  }

  start = (): void => {
    if (
      this.destroyed ||
      this.reduced ||
      this.paused ||
      this.running ||
      !this.visible ||
      !this.onScreen
    )
      return;
    this.running = true;
    this.last = 0;
    const tick = (now: number): void => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(tick);
      if (now - this.last < 1000 / 30) return;
      this.last = now;
      this.draw(now);
    };
    this.raf = requestAnimationFrame(tick);
  };

  stop = (): void => {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  };

  /** Keep the current frame still. Resuming restarts the loop when visible. */
  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.stop();
    else if (this.visible && this.onScreen) this.start();
  }

  setOptions(options: DitherFieldOptions): void {
    const next = { ...this.options };
    applyDefined(next, options);
    this.options = next;
    this.buildMask();
    if (!this.running) this.draw(0);
  }

  destroy(): void {
    this.destroyed = true;
    this.stop();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    if (this.motionQuery && this.onMotionChange) {
      this.motionQuery.removeEventListener("change", this.onMotionChange);
    }
    if (this.onVisibilityChange) {
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
    }
    if (typeof window !== "undefined" && !this.resizeObserver) {
      window.removeEventListener("resize", this.resize);
    }
  }
}
