import type { Palette, PaletteName } from "../palette";
import type { DogSpec, DogWorldEvent } from "./world";

export interface AsciiDogOptions {
  /** Roster of robot dogs. Defaults to one dog. */
  dogs?: DogSpec[];
  /** Number of dogs when `dogs` is not given. Default 1, max 3. */
  count?: number;
  /** Reproducible yard. Same seed + same size = same scene. */
  seed?: number;
  /** Art-direction target for the number of columns. Default 150. */
  columns?: number;
  /** Simulation and animation time scale. 0 freezes. Default 1. */
  speed?: number;
  /** Click to throw a ball. Default true. */
  interactive?: boolean;
  /** Backing-store pixel-ratio cap. Default 2. */
  maxDpr?: number;
  /** Adaptive quality cap. Default 16,000 cells. */
  maxCells?: number;
  /** Disable blinking, sparks, and antenna shimmer. */
  calm?: boolean;
  /** Colour theme, or a full custom palette. Default "abyss". */
  palette?: PaletteName | Palette;
  /** Dog size multiplier. Default 1. */
  scale?: number;
  /** Normalized start band across the width, e.g. [0.68, 0.68]. */
  spread?: [number, number];
  /** Start with the clock stopped. Default false. */
  paused?: boolean;
  /** Font family used for the ASCII canvas. Defaults to the canvas CSS font. */
  fontFamily?: string;
  /** If set, the canvas becomes role="img" with this label. */
  label?: string;
  /** Called when the ball is thrown, nudged, the dog sits, or charges. */
  onEvent?: (event: DogWorldEvent) => void;
}
