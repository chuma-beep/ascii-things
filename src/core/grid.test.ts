import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rgba } from "./color";
import { CellGrid, paintGrid, type CellMetrics } from "./grid";

interface FakeContext {
  setTransform: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  moveTo: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  strokeStyle: string;
  fillStyle: string;
  lineWidth: number;
}

function makeContext(): FakeContext {
  return {
    setTransform: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 0,
  };
}

function makeCanvas(context: FakeContext) {
  return {
    width: 0,
    height: 0,
    getContext: () => context,
  };
}

class TestGrid extends CellGrid {
  index(x: number, y: number) {
    return this.cellIndex(x, y);
  }
  cells(x: number, y: number, w: number, h: number) {
    const out: Array<[number, number, boolean, number, number]> = [];
    this.forEachCell(x, y, w, h, (col, row, edge, lastCol, lastRow) =>
      out.push([col, row, edge, lastCol, lastRow]),
    );
    return out;
  }
  paint(background: string, fn?: (g: CanvasRenderingContext2D, metrics: CellMetrics) => void) {
    this.paintBackdrop(background, fn);
  }
}

let context: FakeContext;
let bgContext: FakeContext;

beforeEach(() => {
  context = makeContext();
  bgContext = makeContext();
  vi.stubGlobal("document", {
    createElement: () => ({ width: 0, height: 0, getContext: () => bgContext }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CellGrid", () => {
  it("computes cell metrics and the backing store size", () => {
    const canvas = makeCanvas(context);
    const grid = new TestGrid(canvas as unknown as HTMLCanvasElement, {
      columns: 124,
      maxCells: 16000,
    });
    grid.resize(1240, 720, 2);
    expect(grid.cellWidth).toBe(10);
    expect(grid.cellHeight).toBe(15);
    expect(grid.columnCount).toBe(124);
    expect(grid.rowCount).toBe(48);
    expect(grid.cellCount).toBe(124 * 48);
    expect(canvas.width).toBe(2480);
    expect(canvas.height).toBe(1440);
    expect(grid.metrics).toEqual({
      width: 1240,
      height: 720,
      dpr: 2,
      cellWidth: 10,
      cellHeight: 15,
      columns: 124,
      rows: 48,
    });
  });

  it("grows cells until the maxCells budget is met", () => {
    const grid = new TestGrid(makeCanvas(context) as unknown as HTMLCanvasElement, {
      columns: 124,
      maxCells: 16000,
    });
    grid.resize(3840, 2160, 1);
    expect(grid.cellWidth).toBe(19);
    expect(grid.cellCount).toBeLessThanOrEqual(16000);
    expect(grid.cellCount).toBeGreaterThan(15000);
  });

  it("iterates clipped cells and marks the edges", () => {
    const grid = new TestGrid(makeCanvas(context) as unknown as HTMLCanvasElement, {
      columns: 124,
    });
    grid.resize(1240, 720, 1);
    const cells = grid.cells(5, 15, 35, 45);
    expect(cells).toHaveLength(20);
    expect(cells[0]).toEqual([0, 1, true, 4, 4]);
    expect(cells.some(([col, row, edge]) => col === 2 && row === 2 && !edge)).toBe(true);
    expect(grid.cells(-100, -100, 50, 50)).toHaveLength(0);
  });

  it("returns -1 for out-of-bounds cell lookups", () => {
    const grid = new TestGrid(makeCanvas(context) as unknown as HTMLCanvasElement, {
      columns: 124,
    });
    grid.resize(1240, 720, 1);
    expect(grid.index(5, 5)).toBe(0);
    expect(grid.index(1239, 719)).toBe(124 * 48 - 1);
    expect(grid.index(-1, 5)).toBe(-1);
    expect(grid.index(5, -1)).toBe(-1);
    expect(grid.index(1240, 5)).toBe(-1);
    expect(grid.index(5, 720)).toBe(-1);
  });

  it("clears the backdrop and passes live metrics to the painter", () => {
    const grid = new TestGrid(makeCanvas(context) as unknown as HTMLCanvasElement, {
      columns: 124,
    });
    grid.resize(1240, 720, 2);
    const seen: CellMetrics[] = [];
    grid.paint("#000", (_g, metrics) => seen.push(metrics));
    expect(bgContext.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    expect(bgContext.fillStyle).toBe("#000");
    expect(bgContext.fillRect).toHaveBeenCalledWith(0, 0, 1240, 720);
    expect(seen[0]).toEqual(grid.metrics);
  });
});

describe("paintGrid", () => {
  it("snaps lines to device pixels and strokes once", () => {
    const g = makeContext();
    paintGrid(g as unknown as CanvasRenderingContext2D, 100, 100, 10, 10, 2);
    expect(g.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    expect(g.moveTo).toHaveBeenCalledTimes(22);
    expect(g.lineTo).toHaveBeenCalledTimes(22);
    expect(g.moveTo).toHaveBeenCalledWith(0.5, 0);
    expect(g.stroke).toHaveBeenCalledTimes(1);
  });
});

describe("rgba", () => {
  it("formats palette triples", () => {
    expect(rgba([1, 2, 3], 0.5)).toBe("rgba(1,2,3,0.5)");
  });
});
