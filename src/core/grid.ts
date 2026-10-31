import { clamp } from "../math";

export interface CellMetrics {
  width: number;
  height: number;
  dpr: number;
  cellWidth: number;
  cellHeight: number;
  columns: number;
  rows: number;
}

export interface CellGridOptions {
  /** Art-direction target for the number of columns. Default 124. */
  columns?: number;
  /** Adaptive quality cap. Default 16,000 cells. */
  maxCells?: number;
  /**
   * Smallest cell edge in CSS pixels. Defaults to 8 so the original ASCII
   * scenes keep their exact glyph density; denser variants can opt down to 6.
   */
  minCell?: number;
}

export const DEFAULT_COLUMNS = 124;
export const DEFAULT_MAX_CELLS = 16000;

/**
 * Shared cell geometry for every scene: canvas backing store, DPR, glyph cell
 * size, the offscreen background layer, and cell iteration.
 *
 * Scenes inherit from this and paint their own backdrop in `resize()`.
 */
export class CellGrid {
  protected ctx: CanvasRenderingContext2D;
  protected bg: HTMLCanvasElement;
  protected dpr = 1;
  protected width = 0;
  protected height = 0;
  protected cw = 12;
  protected ch = 18;
  protected cols = 0;
  protected rows = 0;
  protected fontFamily = "ui-monospace, Menlo, monospace";
  private targetColumns: number;
  private maxCells: number;
  protected minCell = 8;

  constructor(
    protected canvas: HTMLCanvasElement,
    options: CellGridOptions = {},
  ) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2D canvas unavailable");
    this.ctx = ctx;
    this.bg = document.createElement("canvas");
    this.targetColumns = options.columns ?? DEFAULT_COLUMNS;
    this.maxCells = options.maxCells ?? DEFAULT_MAX_CELLS;
    this.minCell = Math.max(4, options.minCell ?? 8);
  }

  get cellWidth() {
    return this.cw;
  }

  get cellHeight() {
    return this.ch;
  }

  get cellCount() {
    return this.cols * this.rows;
  }

  get columnCount() {
    return this.cols;
  }

  get rowCount() {
    return this.rows;
  }

  get metrics(): CellMetrics {
    return {
      width: this.width,
      height: this.height,
      dpr: this.dpr,
      cellWidth: this.cw,
      cellHeight: this.ch,
      columns: this.cols,
      rows: this.rows,
    };
  }

  setFontFamily(family: string) {
    if (family) this.fontFamily = family;
  }

  protected setGridOptions(options: CellGridOptions) {
    if (options.columns !== undefined) this.targetColumns = Math.max(24, options.columns);
    if (options.maxCells !== undefined) this.maxCells = Math.max(0, options.maxCells);
  }

  resize(width: number, height: number, dpr: number) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    // Keep glyphs at a readable size (8–13 px) at normal viewports. Only
    // when the cell budget would be exceeded do we grow the cell, which is
    // what keeps 4K from exploding to 33k cells. The kanji variants lower
    // the floor to 6px for their denser textures without touching this
    // default.
    const targetColumns = Math.max(24, this.targetColumns);
    let cw = clamp(Math.round(width / targetColumns), this.minCell, 13);
    let ch = Math.round(cw * 1.45);
    let cols = Math.ceil(width / cw);
    let rows = Math.ceil(height / ch);
    while (this.maxCells > 0 && cols * rows > this.maxCells && cw < 64) {
      cw++;
      ch = Math.round(cw * 1.45);
      cols = Math.ceil(width / cw);
      rows = Math.ceil(height / ch);
    }
    this.cw = cw;
    this.ch = ch;
    this.cols = cols;
    this.rows = rows;

    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.bg.width = this.canvas.width;
    this.bg.height = this.canvas.height;
  }

  /** Clear the offscreen layer, then let the scene paint its backdrop. */
  protected paintBackdrop(
    background: string,
    paint?: (g: CanvasRenderingContext2D, metrics: CellMetrics) => void,
  ) {
    const g = this.bg.getContext("2d");
    if (!g) return;
    const metrics = this.metrics;
    g.setTransform(metrics.dpr, 0, 0, metrics.dpr, 0, 0);
    g.fillStyle = background;
    g.fillRect(0, 0, metrics.width, metrics.height);
    paint?.(g, metrics);
  }

  protected cellIndex(x: number, y: number) {
    const c = Math.floor(x / this.cw);
    const r = Math.floor(y / this.ch);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return -1;
    return r * this.cols + c;
  }

  protected forEachCell(
    x: number,
    y: number,
    w: number,
    h: number,
    fn: (col: number, row: number, edge: boolean, lastCol: number, lastRow: number) => void,
  ) {
    const c0 = Math.max(0, Math.floor(x / this.cw));
    const r0 = Math.max(0, Math.floor(y / this.ch));
    const c1 = Math.min(this.cols - 1, Math.floor((x + w) / this.cw));
    const r1 = Math.min(this.rows - 1, Math.floor((y + h) / this.ch));
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        fn(col, row, col === c0 || col === c1 || row === r0 || row === r1, c1, r1);
      }
    }
  }
}

/**
 * Faint grid lines, snapped to device pixels. Shared with the sidebar backdrop.
 */
export function paintGrid(
  g: CanvasRenderingContext2D,
  W: number,
  H: number,
  cw: number,
  ch: number,
  dpr: number,
  color = "rgba(255,255,255,0.055)",
) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.strokeStyle = color;
  g.lineWidth = 1;
  g.beginPath();
  for (let c = 0; c <= Math.ceil(W / cw); c++) {
    const x = Math.round(c * cw * dpr) + 0.5;
    g.moveTo(x, 0);
    g.lineTo(x, H * dpr);
  }
  for (let r = 0; r <= Math.ceil(H / ch); r++) {
    const y = Math.round(r * ch * dpr) + 0.5;
    g.moveTo(0, y);
    g.lineTo(W * dpr, y);
  }
  g.stroke();
}
