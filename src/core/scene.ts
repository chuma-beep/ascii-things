import type { Palette, PaletteName } from "../palette";

/** Fields shared by every scene's options. */
export interface SceneOptions {
  /** Reproducible world. Same seed + same size = same scene. */
  seed?: number;
  /** Art-direction target for the number of columns. */
  columns?: number;
  /** Simulation and animation time scale. 0 freezes. */
  speed?: number;
  /** Pointer interaction. Default true. */
  interactive?: boolean;
  /** Backing-store pixel-ratio cap. Default 2. */
  maxDpr?: number;
  /** Adaptive quality cap. Default 16,000 cells. */
  maxCells?: number;
  /** Disable decorative shimmer, blinking, and sparks. */
  calm?: boolean;
  /** Colour theme, or a full custom palette. */
  palette?: PaletteName | Palette;
  /** If set, the canvas becomes role="img" with this label. */
  label?: string;
  /** Start with the clock stopped. Default false. */
  paused?: boolean;
  /** Font family used for the ASCII canvas. Defaults to the canvas CSS font. */
  fontFamily?: string;
}

/** Stats every scene reports. Scene-specific stats extend this shape. */
export interface SceneStats {
  fps: number;
  frameMs: number;
  cells: number;
  columns: number;
  rows: number;
}

/** The lifecycle surface shared by every engine. */
export interface SceneHandle<S extends SceneStats = SceneStats> {
  pause(): void;
  resume(): void;
  resize(): void;
  setOptions(options: Partial<SceneOptions>): void;
  getStats(): S;
  destroy(): void;
}

/** Called once a wrapper has created its engine. */
export type SceneReady<S extends SceneStats = SceneStats> = (scene: SceneHandle<S>) => void;
