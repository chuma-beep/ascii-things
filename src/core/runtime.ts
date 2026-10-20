export const FIXED_STEP = 1 / 60;
export const MAX_STEPS = 4;

/** Options every scene runtime understands. Scene options add simulation fields. */
export interface RuntimeOptions {
  speed?: number;
  interactive?: boolean;
  maxDpr?: number;
  adaptiveQuality?: boolean;
  label?: string;
  paused?: boolean;
  fontFamily?: string;
}

/** The small surface a world must expose to the runtime. */
export interface RuntimeWorld {
  events: { length: number };
  pointer: { x: number; y: number; active: boolean };
  time: number;
  step(dt: number): void;
  resize(width: number, height: number, cellWidth: number, cellHeight: number): void;
}

/** The small surface a renderer must expose to the runtime. */
export interface RuntimeRenderer<W> {
  readonly cellWidth: number;
  readonly cellHeight: number;
  readonly cellCount: number;
  readonly columnCount: number;
  readonly rowCount: number;
  resize(width: number, height: number, dpr: number): void;
  render(world: W, dt: number): void;
  setFontFamily(family: string): void;
}

export interface BaseStats {
  fps: number;
  frameMs: number;
  cells: number;
  columns: number;
  rows: number;
}

export interface SceneRuntimeConfig<W extends RuntimeWorld, R extends RuntimeRenderer<W>>
  extends RuntimeOptions {
  canvas: HTMLCanvasElement;
  world: W;
  renderer: R;
  /**
   * "fixed" steps the world by a constant dt and scales speed by running more
   * or fewer steps. "scaled" also scales each step and the render dt, which is
   * how the shark scene has always behaved.
   */
  timing?: "fixed" | "scaled";
  /** Called for a non-touch primary pointer inside the canvas. */
  onPointerDown?: (x: number, y: number) => void;
  /** Deliver and clear queued world events. Omit when the renderer consumes them. */
  flushEvents?: () => void;
}

/**
 * Owns everything that is identical across scenes: the fixed-timestep loop,
 * DPR-aware resize, resize/intersection observers, reduced-motion handling,
 * pointer plumbing, accessibility labels, and teardown.
 */
export class SceneRuntime<W extends RuntimeWorld, R extends RuntimeRenderer<W>> {
  private raf = 0;
  private last = 0;
  private acc = 0;
  private visible = true;
  private paused = false;
  private disposed = false;
  private pointerBound = false;
  private reducedMotion: MediaQueryList;
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;
  private speed: number;
  private interactive: boolean;
  private maxDpr: number | undefined;
  private adaptiveQuality: boolean;
  private qualityScale = 1;
  private slowFrames = 0;
  private fastFrames = 0;
  private label: string | undefined;
  private fontFamily: string | undefined;
  private frameMs = 16.7;
  private timing: "fixed" | "scaled";
  private onPointerDown?: (x: number, y: number) => void;
  private flushEventsHandler?: () => void;

  constructor(private config: SceneRuntimeConfig<W, R>) {
    const { canvas, renderer } = config;
    this.speed = Math.max(0, config.speed ?? 1);
    this.interactive = config.interactive ?? true;
    this.maxDpr = config.maxDpr;
    this.adaptiveQuality = config.adaptiveQuality ?? true;
    this.label = config.label;
    this.fontFamily = config.fontFamily;
    this.paused = config.paused ?? false;
    this.timing = config.timing ?? "fixed";
    this.onPointerDown = config.onPointerDown;
    this.flushEventsHandler = config.flushEvents;

    renderer.setFontFamily(this.fontFamily ?? getComputedStyle(canvas).fontFamily);
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.schedule();
    });
    this.intersectionObserver.observe(canvas);

    this.applyLabel();
    this.reducedMotion.addEventListener("change", this.onMotionPreference);
    if (this.interactive) this.bindPointer();

    this.resize();
    // Canvas text can't trigger a webfont load; once the mono face is in, redraw.
    document.fonts
      ?.load(`600 16px ${this.fontFamily ?? getComputedStyle(canvas).fontFamily}`)
      .then(() => {
        if (!this.disposed && this.reducedMotion.matches) this.drawStill();
      });
    this.schedule();
  }

  /** Stop the clock without tearing down the scene (modals, route transitions). */
  pause() {
    this.setPaused(true);
  }

  /** Resume after pause(). */
  resume() {
    this.setPaused(false);
  }

  /** Set the clock state directly. */
  setPaused(paused: boolean) {
    this.paused = paused;
    cancelAnimationFrame(this.raf);
    if (paused) {
      this.config.world.events.length = 0;
      return;
    }
    this.last = performance.now();
    this.acc = 0;
    this.schedule();
  }

  /** Re-evaluate whether the loop should run. */
  schedule() {
    cancelAnimationFrame(this.raf);
    if (this.disposed || !this.visible || this.paused || this.reducedMotion.matches) return;
    if (this.speed <= 0) {
      this.renderer.render(this.world, FIXED_STEP);
      return;
    }
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  /** Force a size/DPR read; ResizeObserver normally does this for you. */
  resize() {
    const { canvas, renderer, world } = this.config;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const baseDpr = Math.min(window.devicePixelRatio || 1, this.maxDpr ?? 2);
    const dpr = Math.max(Math.min(1, baseDpr), baseDpr * this.qualityScale);
    renderer.resize(rect.width, rect.height, dpr);
    world.resize(rect.width, rect.height, renderer.cellWidth, renderer.cellHeight);
    if (this.reducedMotion.matches) this.drawStill();
  }

  setSpeed(speed: number) {
    this.speed = Math.max(0, speed);
  }

  setInteractive(interactive: boolean) {
    const wasInteractive = this.interactive;
    this.interactive = interactive;
    if (this.interactive !== wasInteractive) {
      if (this.interactive) this.bindPointer();
      else this.unbindPointer();
    }
  }

  setMaxDpr(maxDpr: number | undefined) {
    this.maxDpr = maxDpr;
  }

  setAdaptiveQuality(enabled: boolean) {
    this.adaptiveQuality = enabled;
    if (enabled || this.qualityScale === 1) return;
    this.qualityScale = 1;
    this.slowFrames = 0;
    this.fastFrames = 0;
    this.resize();
  }

  setLabel(label: string | undefined) {
    this.label = label;
    this.applyLabel();
  }

  setFontFamily(fontFamily: string | undefined) {
    this.fontFamily = fontFamily;
    this.renderer.setFontFamily(fontFamily ?? getComputedStyle(this.config.canvas).fontFamily);
    if (this.paused || this.reducedMotion.matches) this.renderOnce();
  }

  get prefersReducedMotion() {
    return this.reducedMotion.matches;
  }

  baseStats(): BaseStats {
    const { renderer } = this.config;
    return {
      fps: 1000 / Math.max(1, this.frameMs),
      frameMs: this.frameMs,
      cells: renderer.cellCount,
      columns: renderer.columnCount,
      rows: renderer.rowCount,
    };
  }

  /** Deliver any queued world events to the scene's handler. */
  flushEvents() {
    this.flushEventsHandler?.();
  }

  /** Draw one fixed-step frame, for paused/still states. */
  renderOnce() {
    this.config.renderer.render(this.config.world, FIXED_STEP);
  }

  /**
   * Repaint a still frame when no frame id is held. Mirrors the legacy
   * `if (!this.raf)` guard: paused or cancelled frames keep their id.
   */
  renderIfIdle() {
    if (!this.raf) this.renderOnce();
  }

  destroy() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.reducedMotion.removeEventListener("change", this.onMotionPreference);
    this.unbindPointer();
    this.config.world.events.length = 0;
  }

  private get world() {
    return this.config.world;
  }

  private get renderer() {
    return this.config.renderer;
  }

  private applyLabel() {
    const { canvas } = this.config;
    if (this.label) {
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", this.label);
      canvas.removeAttribute("aria-hidden");
    } else {
      canvas.setAttribute("aria-hidden", "true");
      canvas.removeAttribute("role");
      canvas.removeAttribute("aria-label");
    }
  }

  private bindPointer() {
    if (this.pointerBound) return;
    this.pointerBound = true;
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerdown", this.onPointerDownHandler, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onPointerLeave);
    window.addEventListener("blur", this.onPointerLeave);
  }

  private unbindPointer() {
    if (!this.pointerBound) return;
    this.pointerBound = false;
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDownHandler);
    document.documentElement.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("blur", this.onPointerLeave);
  }

  private frame = (now: number) => {
    const raw = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.frameMs += (raw * 1000 - this.frameMs) * 0.1;
    this.adaptQuality();

    const step = this.timing === "scaled" ? FIXED_STEP * this.speed : FIXED_STEP;
    this.acc += raw * this.speed;
    let steps = 0;
    while (this.acc >= FIXED_STEP && steps < MAX_STEPS) {
      this.world.step(step);
      this.acc -= FIXED_STEP;
      steps++;
    }
    if (steps === MAX_STEPS) this.acc = 0;

    this.flushEventsHandler?.();
    this.renderer.render(this.world, this.timing === "scaled" ? raw * this.speed : raw);
    this.raf = requestAnimationFrame(this.frame);
  };

  /** Give up a little backing-store resolution when frames stay slow. */
  private adaptQuality() {
    if (!this.adaptiveQuality || this.reducedMotion.matches || this.paused) return;

    if (this.frameMs > 20) {
      this.slowFrames++;
      this.fastFrames = 0;
    } else if (this.frameMs < 17.5) {
      this.fastFrames++;
      this.slowFrames = 0;
    } else {
      return;
    }

    if (this.slowFrames >= 30 && this.qualityScale > 0.5) {
      this.qualityScale = Math.max(0.5, this.qualityScale - 0.25);
      this.slowFrames = 0;
      this.resize();
    } else if (this.fastFrames >= 180 && this.qualityScale < 1) {
      this.qualityScale = Math.min(1, this.qualityScale + 0.25);
      this.fastFrames = 0;
      this.resize();
    }
  }

  /** Reduced motion: let the scene settle, then show a single frame. */
  private drawStill() {
    // Scaled scenes settle for a minimum of 240 fixed steps of wall time, but
    // each simulation step still uses the real speed (which may be below 0.25).
    const stepScale = this.timing === "scaled" ? this.speed : 1;
    const settleScale = this.timing === "scaled" ? Math.max(0.25, this.speed) : 1;
    if (this.world.time < 4) {
      const steps = Math.ceil(240 / settleScale);
      for (let i = 0; i < steps; i++) this.world.step(FIXED_STEP * stepScale);
    }
    this.flushEventsHandler?.();
    this.renderer.render(this.world, FIXED_STEP * settleScale);
  }

  private onMotionPreference = () => {
    if (this.reducedMotion.matches) {
      cancelAnimationFrame(this.raf);
      this.drawStill();
    } else {
      this.schedule();
    }
  };

  private toLocal(e: PointerEvent) {
    const rect = this.config.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    return { x, y, inside };
  }

  private onPointerMove = (e: PointerEvent) => {
    if (!this.interactive) return;
    const { x, y, inside } = this.toLocal(e);
    const p = this.world.pointer;
    p.x = x;
    p.y = y;
    p.active = inside && e.pointerType !== "touch";
  };

  private onPointerDownHandler = (e: PointerEvent) => {
    if (!this.interactive || this.reducedMotion.matches) return;
    const { x, y, inside } = this.toLocal(e);
    if (inside) this.onPointerDown?.(x, y);
  };

  private onPointerLeave = () => {
    this.world.pointer.active = false;
  };
}
