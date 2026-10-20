import type { AsciiRobotsOptions } from "./options";
import { RobotRenderer } from "./renderer";
import { RobotWorld } from "./world";

const STEP = 1 / 60;
const MAX_STEPS = 4;

export interface RobotStats {
  fps: number;
  frameMs: number;
  cells: number;
  columns: number;
  rows: number;
  robots: number;
  charging: number;
  docks: number;
}

/**
 * Wires the robot World + RobotRenderer to a canvas: fixed-timestep loop,
 * resize, pointer input, pausing off-screen, and prefers-reduced-motion.
 *
 * Prefer `createRobots(canvas, options)` for the public API.
 */
export class RobotEngine {
  private world: RobotWorld;
  private renderer: RobotRenderer;
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
  private frameMs = 16.7;
  private options: AsciiRobotsOptions;

  constructor(
    private canvas: HTMLCanvasElement,
    options: AsciiRobotsOptions = {},
  ) {
    this.options = options;
    this.speed = Math.max(0, options.speed ?? 1);
    this.interactive = options.interactive ?? true;
    this.world = new RobotWorld({
      robots: options.robots,
      count: options.count,
      seed: options.seed,
      scale: options.scale,
    });
    this.renderer = new RobotRenderer(canvas, {
      palette: options.palette,
      columns: options.columns,
      maxCells: options.maxCells,
      calm: options.calm,
    });
    this.renderer.setFontFamily(getComputedStyle(canvas).fontFamily);
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
    document.fonts?.load(`600 16px ${getComputedStyle(canvas).fontFamily}`).then(() => {
      if (!this.disposed && this.reducedMotion.matches) this.drawStill();
    });
    this.schedule();
  }

  /** Stop the clock without tearing down the scene (modals, route transitions). */
  pause() {
    this.paused = true;
    cancelAnimationFrame(this.raf);
    this.world.events.length = 0;
  }

  /** Resume after pause(). */
  resume() {
    this.paused = false;
    this.last = performance.now();
    this.acc = 0;
    this.schedule();
  }

  /** Live-update palette, speed, fleet, quality, and label. */
  setOptions(partial: AsciiRobotsOptions) {
    const wasInteractive = this.interactive;
    this.options = { ...this.options, ...partial };

    if (partial.speed !== undefined) this.speed = Math.max(0, partial.speed);
    if (partial.interactive !== undefined) {
      this.interactive = partial.interactive;
      if (this.interactive !== wasInteractive) {
        if (this.interactive) this.bindPointer();
        else this.unbindPointer();
      }
    }
    if (partial.label !== undefined) this.applyLabel();

    this.renderer.setOptions({
      palette: partial.palette,
      calm: partial.calm,
      columns: partial.columns,
      maxCells: partial.maxCells,
    });

    const structural =
      partial.robots !== undefined ||
      partial.count !== undefined ||
      partial.seed !== undefined ||
      partial.scale !== undefined;
    if (structural) {
      this.world.setOptions({
        robots: partial.robots,
        count: partial.count,
        seed: partial.seed,
        scale: partial.scale,
      });
    }

    if (structural || partial.columns !== undefined || partial.maxCells !== undefined)
      this.resize();
    if (partial.speed !== undefined) this.schedule();
    if (!this.raf) this.renderer.render(this.world, STEP);
  }

  /** Force a size/DPR read; ResizeObserver normally does this for you. */
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, this.options.maxDpr ?? 2);
    this.renderer.resize(rect.width, rect.height, dpr);
    this.world.resize(rect.width, rect.height, this.renderer.cellWidth, this.renderer.cellHeight);
    if (this.reducedMotion.matches) this.drawStill();
  }

  getStats(): RobotStats {
    return {
      fps: 1000 / Math.max(1, this.frameMs),
      frameMs: this.frameMs,
      cells: this.renderer.cellCount,
      columns: this.renderer.columnCount,
      rows: this.renderer.rowCount,
      robots: this.world.robots.length,
      charging: this.world.robots.filter((r) => r.state === "charge").length,
      docks: this.world.docks.length,
    };
  }

  destroy() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.reducedMotion.removeEventListener("change", this.onMotionPreference);
    this.unbindPointer();
    this.world.events.length = 0;
  }

  private applyLabel() {
    if (this.options.label) {
      this.canvas.setAttribute("role", "img");
      this.canvas.setAttribute("aria-label", this.options.label);
      this.canvas.removeAttribute("aria-hidden");
    } else {
      this.canvas.setAttribute("aria-hidden", "true");
      this.canvas.removeAttribute("role");
      this.canvas.removeAttribute("aria-label");
    }
  }

  private bindPointer() {
    if (this.pointerBound) return;
    this.pointerBound = true;
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", this.onPointerLeave);
    window.addEventListener("blur", this.onPointerLeave);
  }

  private unbindPointer() {
    if (!this.pointerBound) return;
    this.pointerBound = false;
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    document.documentElement.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("blur", this.onPointerLeave);
  }

  private schedule() {
    cancelAnimationFrame(this.raf);
    if (this.disposed || !this.visible || this.paused || this.reducedMotion.matches) return;
    if (this.speed <= 0) {
      this.renderer.render(this.world, STEP);
      return;
    }
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    const raw = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.frameMs += (raw * 1000 - this.frameMs) * 0.1;

    this.acc += raw * this.speed;
    let steps = 0;
    while (this.acc >= STEP && steps < MAX_STEPS) {
      this.world.step(STEP);
      this.acc -= STEP;
      steps++;
    }
    if (steps === MAX_STEPS) this.acc = 0;

    this.flushEvents();
    this.renderer.render(this.world, raw);
    this.raf = requestAnimationFrame(this.frame);
  };

  private flushEvents() {
    const onEvent = this.options.onEvent;
    if (onEvent) for (const event of this.world.events) onEvent(event);
    this.world.events.length = 0;
  }

  /** Reduced motion: let the floor settle, then show a single frame. */
  private drawStill() {
    if (this.world.time < 4) {
      const steps = 240;
      for (let i = 0; i < steps; i++) this.world.step(STEP);
    }
    this.flushEvents();
    this.renderer.render(this.world, STEP);
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
    const rect = this.canvas.getBoundingClientRect();
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

  private onPointerDown = (e: PointerEvent) => {
    if (!this.interactive) return;
    const { x, y, inside } = this.toLocal(e);
    if (inside && !this.reducedMotion.matches) this.world.dispatch(x, y);
  };

  private onPointerLeave = () => {
    this.world.pointer.active = false;
  };
}

/** Create a living ASCII robot floor on a canvas. */
export function createRobots(canvas: HTMLCanvasElement, options: AsciiRobotsOptions = {}) {
  return new RobotEngine(canvas, options);
}
