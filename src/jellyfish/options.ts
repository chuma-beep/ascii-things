import type { Palette, PaletteName } from "../palette";
import type { JellyfishSpec, JellyfishWorldEvent } from "./world";

export interface AsciiJellyfishOptions {
  /** Roster of jellyfish. Defaults to a mixed bloom. */
  jellies?: JellyfishSpec[];
  /** Bloom size when `jellies` is not given. Default scales with the canvas. */
  count?: number;
  /** Reproducible bloom. Same seed + same size = same scene. */
  seed?: number;
  /** Art-direction target for the number of columns. Default 140. */
  columns?: number;
  /** Simulation and animation time scale. 0 freezes. Default 1. */
  speed?: number;
  /** Pointer current + click shockwave. Default true. */
  interactive?: boolean;
  /** Backing-store pixel-ratio cap. Default 2. */
  maxDpr?: number;
  /** Adaptive quality cap. Default 16,000 cells. */
  maxCells?: number;
  /** Disable shimmer and plankton twinkle. */
  calm?: boolean;
  /** Colour theme, or a full custom palette. Default "abyss". */
  palette?: PaletteName | Palette;
  /** Jellyfish size multiplier. Default 1. */
  scale?: number;
  /** Start with the clock stopped. Default false. */
  paused?: boolean;
  /** Font family used for the ASCII canvas. Defaults to the canvas CSS font. */
  fontFamily?: string;
  /** If set, the canvas becomes role="img" with this label. */
  label?: string;
  /** Called when a jellyfish pulses or the pointer sends a shockwave. */
  onEvent?: (event: JellyfishWorldEvent) => void;
}
