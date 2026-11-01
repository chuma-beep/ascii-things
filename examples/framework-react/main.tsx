import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createRng,
  createSimulation,
  type RuntimeRenderer,
  type RuntimeWorld,
  type SceneHandle,
  type SceneOptions,
  type SceneStats,
} from "../../src/core";
import { useSimulation } from "../../src/core/react";

type OrbitAction = "burst";

interface OrbitOptions extends SceneOptions {
  seed?: number;
}

interface OrbitStats extends SceneStats {
  bodies: number;
  spin: number;
}

interface Body {
  rx: number;
  ry: number;
  angle: number;
  speed: number;
  glyph: string;
  size: number;
}

class OrbitWorld implements RuntimeWorld {
  readonly bodies: Body[];
  private boost = 0;

  constructor(seed = 7) {
    const rng = createRng(seed);
    const glyphs = ["*", "o", "+", "·", "°"];
    this.bodies = Array.from({ length: 9 }, (_, index) => ({
      rx: 0.12 + rng.next() * 0.33,
      ry: 0.08 + rng.next() * 0.3,
      angle: rng.next() * Math.PI * 2,
      speed: 0.1 + rng.next() * 0.28 + index * 0.012,
      glyph: glyphs[index % glyphs.length],
      size: 10 + Math.floor(rng.next() * 8),
    }));
  }

  step(dt: number) {
    this.boost = Math.max(0, this.boost - dt);
    const speed = this.boost > 0 ? 2.8 : 1;
    for (const body of this.bodies) body.angle += body.speed * speed * dt;
  }

  resize() {}

  burst() {
    this.boost = 1.4;
  }

  get spin() {
    return this.bodies.reduce((sum, body) => sum + body.angle, 0);
  }
}

class OrbitRenderer implements RuntimeRenderer<OrbitWorld> {
  cellWidth = 1;
  cellHeight = 1;
  cellCount = 0;
  columnCount = 0;
  rowCount = 0;

  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private fontFamily = "ui-monospace, monospace";

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");
    this.ctx = ctx;
  }

  resize(width: number, height: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
  }

  setFontFamily(family: string) {
    this.fontFamily = family;
  }

  render(world: OrbitWorld) {
    const { ctx, width, height, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#050607";
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    ctx.fillStyle = "#ff7a1a";
    ctx.font = `16px ${this.fontFamily}`;
    ctx.fillText("+", cx - 5, cy + 5);

    for (const body of world.bodies) {
      const x = cx + Math.cos(body.angle) * body.ry * Math.min(width, height) * 1.4;
      const y = cy + Math.sin(body.angle * 1.2) * body.ry * Math.min(width, height);
      ctx.fillStyle = body.size > 14 ? "#ff9a4d" : "#9fdfd0";
      ctx.font = `${body.size}px ${this.fontFamily}`;
      ctx.fillText(body.glyph, x, y);
    }
  }
}

function createOrbit(
  canvas: HTMLCanvasElement,
  options: OrbitOptions,
): SceneHandle<OrbitStats, OrbitAction> {
  const world = new OrbitWorld(options.seed);
  const renderer = new OrbitRenderer(canvas);
  return createSimulation<OrbitWorld, OrbitRenderer, OrbitStats, OrbitAction>({
    canvas,
    world,
    renderer,
    label: "A free-positioned ASCII orbital simulation",
    onPointerDown: () => world.burst(),
    onAction: (action) => {
      if (action === "burst") world.burst();
    },
    getStats: (base, current) => ({
      ...base,
      bodies: current.bodies.length,
      spin: current.spin,
    }),
  });
}

const OPTIONS: OrbitOptions = { seed: 7 };

function OrbitExample() {
  const [paused, setPaused] = useState(false);
  const { canvasRef, scene, stats } = useSimulation({
    create: createOrbit,
    options: OPTIONS,
    remountKey: "orbit/7",
  });

  return (
    <>
      <div className="stage">
        <canvas ref={canvasRef} />
      </div>
      <div className="stats" aria-live="polite">
        <span>
          BODIES <strong>{stats?.bodies ?? 0}</strong>
        </span>
        <span>
          ORBIT <strong>{stats ? stats.spin.toFixed(1) : "0.0"}</strong>
        </span>
      </div>
      <button type="button" onClick={() => scene?.trigger("burst", 0, 0)} disabled={!scene}>
        BURST
      </button>
      <button
        type="button"
        onClick={() => {
          const next = !paused;
          setPaused(next);
          scene?.setOptions({ paused: next });
        }}
        disabled={!scene}
      >
        {paused ? "RESUME" : "PAUSE"}
      </button>
    </>
  );
}

createRoot(document.querySelector("#root")!).render(<OrbitExample />);
