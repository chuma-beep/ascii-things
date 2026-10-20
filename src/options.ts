import type { PaletteChoice } from "./palette";
import type { SharkSpec, WorldEvent } from "./world";

export interface AsciiSharksOptions {
  /** Roster of sharks. Defaults to four classic sharks at different depths. */
  sharks?: SharkSpec[];
  /** Reproducible world. Same seed + same size = same scene. */
  seed?: number;
  /** Art-direction target for the number of columns. Default 124. */
  columns?: number;
  /** Fish population multiplier. Default 1. */
  density?: number;
  /** Simulation and animation time scale. 0 freezes. Default 1. */
  speed?: number;
  /** Pointer flee + click splash. Default true. */
  interactive?: boolean;
  /** Backing-store pixel-ratio cap. Default 2. */
  maxDpr?: number;
  /** Adaptive quality cap. Default 16,000 cells. */
  maxCells?: number;
  /** Reduce backing-store resolution when frames run slow. Default true. */
  adaptiveQuality?: boolean;
  /** Disable the 2.4 Hz shimmer and fish glints. */
  calm?: boolean;
  /** Colour theme, or a full custom palette. Default "abyss". */
  palette?: PaletteChoice;
  /** Shark length multiplier. Default 1. */
  sharkScale?: number;
  /** Start with the clock stopped. Default false. */
  paused?: boolean;
  /** Font family used for the ASCII canvas. Defaults to the canvas CSS font. */
  fontFamily?: string;
  /** If set, the canvas becomes role="img" with this label. */
  label?: string;
  /** Called for eat / splash events. */
  onEvent?: (event: WorldEvent) => void;
}
