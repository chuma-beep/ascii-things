import type { PaletteChoice } from "../palette";

/** Texture family used by scenes that ship a kanji replica. */
export type GlyphStyle = "ascii" | "kanji";

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
  /** Reduce backing-store resolution when frames run slow. Default true. */
  adaptiveQuality?: boolean;
  /** Disable decorative shimmer, blinking, and sparks. */
  calm?: boolean;
  /** Colour theme, or a full custom palette. */
  palette?: PaletteChoice;
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

/** The signature interaction each scene exposes. */
export type SceneAction =
  | "splash"
  | "dispatch"
  | "shockwave"
  | "throwBall"
  | "scatter"
  | "flare"
  | "crumb"
  | "feed"
  | "rush"
  | "ping";

/** The lifecycle surface shared by every engine. */
export interface SceneHandle<S extends SceneStats = SceneStats> {
  pause(): void;
  resume(): void;
  resize(): void;
  setOptions(options: Partial<SceneOptions>): void;
  /** Trigger the scene's signature action at canvas-local coordinates. */
  trigger(action: SceneAction, x: number, y: number): void;
  getStats(): S;
  destroy(): void;
}

/** Called once a wrapper has created its engine. */
export type SceneReady<S extends SceneStats = SceneStats> = (scene: SceneHandle<S>) => void;
