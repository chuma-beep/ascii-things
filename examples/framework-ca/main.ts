import { createRng, createSimulation, type RuntimeWorld, type SceneStats } from "../../src/core";
import { CellGrid } from "../../src/rendering";

type LifeAction = "reset" | "randomize";

interface LifeStats extends SceneStats {
  generation: number;
  alive: number;
}

class LifeWorld implements RuntimeWorld {
  readonly rng = createRng(42);
  cols = 80;
  rows = 48;
  generation = 0;
  cells = new Uint8Array(this.cols * this.rows);
  private cellWidth = 1;
  private cellHeight = 1;
  private accumulator = 0;

  constructor() {
    this.randomize();
  }

  resize(_width: number, _height: number, cellWidth: number, cellHeight: number) {
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    const cols = Math.max(24, Math.ceil(_width / cellWidth));
    const rows = Math.max(16, Math.ceil(_height / cellHeight));
    if (cols !== this.cols || rows !== this.rows) {
      this.cols = cols;
      this.rows = rows;
      this.cells = new Uint8Array(cols * rows);
      this.randomize();
    }
  }

  step(dt: number) {
    this.accumulator += dt;
    if (this.accumulator < 0.08) return;
    this.accumulator = 0;
    this.evolve();
  }

  toggle(x: number, y: number) {
    const col = Math.floor(x / this.cellWidth);
    const row = Math.floor(y / this.cellHeight);
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return;
    const index = row * this.cols + col;
    this.cells[index] = this.cells[index] ? 0 : 1;
  }

  randomize() {
    for (let i = 0; i < this.cells.length; i += 1) {
      this.cells[i] = this.rng.next() > 0.68 ? 1 : 0;
    }
    this.generation = 0;
  }

  reset() {
    this.cells.fill(0);
    this.generation = 0;
  }

  get alive() {
    let count = 0;
    for (const cell of this.cells) count += cell;
    return count;
  }

  private evolve() {
    const next = new Uint8Array(this.cells.length);
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        let neighbours = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dy === 0) continue;
            const r = (row + dy + this.rows) % this.rows;
            const c = (col + dx + this.cols) % this.cols;
            neighbours += this.cells[r * this.cols + c];
          }
        }
        const index = row * this.cols + col;
        const alive = this.cells[index] === 1;
        next[index] = alive
          ? neighbours === 2 || neighbours === 3
            ? 1
            : 0
          : neighbours === 3
            ? 1
            : 0;
      }
    }
    this.cells = next;
    this.generation += 1;
  }
}

class LifeRenderer extends CellGrid {
  render(world: LifeWorld) {
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = "#070809";
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = "#ff9a4d";
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        if (!world.cells[row * this.cols + col]) continue;
        ctx.fillRect(
          col * this.cw,
          row * this.ch,
          Math.max(1, this.cw - 1),
          Math.max(1, this.ch - 1),
        );
      }
    }
  }
}

const canvas = document.querySelector<HTMLCanvasElement>("#life");
const gen = document.querySelector<HTMLElement>("#gen");
const alive = document.querySelector<HTMLElement>("#alive");
const pause = document.querySelector<HTMLButtonElement>("#pause");

if (!canvas) throw new Error("Missing #life canvas");

const world = new LifeWorld();
const renderer = new LifeRenderer(canvas, { columns: 80, maxCells: 24_000 });
let paused = false;
const simulation = createSimulation<LifeWorld, LifeRenderer, LifeStats, LifeAction>({
  canvas,
  world,
  renderer,
  label: "Conway's Game of Life",
  onPointerDown: (x, y) => world.toggle(x, y),
  onAction: (action) => {
    if (action === "reset") world.reset();
    if (action === "randomize") world.randomize();
  },
  getStats: (base, current) => ({
    ...base,
    generation: current.generation,
    alive: current.alive,
  }),
});

document.querySelector("#reset")?.addEventListener("click", () => {
  simulation.trigger("reset", 0, 0);
});
document.querySelector("#randomize")?.addEventListener("click", () => {
  simulation.trigger("randomize", 0, 0);
});
pause?.addEventListener("click", () => {
  paused = !paused;
  simulation.setOptions({ paused });
  pause.textContent = paused ? "RESUME" : "PAUSE";
});

window.setInterval(() => {
  const stats = simulation.getStats();
  if (gen) gen.textContent = String(stats.generation);
  if (alive) alive.textContent = String(stats.alive);
}, 250);

// Expose the handle for the example console.
Object.assign(window, { life: simulation });
