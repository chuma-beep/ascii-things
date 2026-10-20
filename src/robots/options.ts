import type { Palette, PaletteName } from "../palette";
import type { RobotSpec, RobotWorldEvent } from "./world";

export interface AsciiRobotsOptions {
  /** Roster of robots. Defaults to a mix of scouts, haulers, and sentinels. */
  robots?: RobotSpec[];
  /** Fleet size when `robots` is not given. Default scales with the canvas. */
  count?: number;
  /** Reproducible floor. Same seed + same size = same scene. */
  seed?: number;
  /** Art-direction target for the number of columns. Default 150. */
  columns?: number;
  /** Simulation and animation time scale. 0 freezes. Default 1. */
  speed?: number;
  /** Pointer avoidance + click to dispatch a robot. Default true. */
  interactive?: boolean;
  /** Backing-store pixel-ratio cap. Default 2. */
  maxDpr?: number;
  /** Adaptive quality cap. Default 16,000 cells. */
  maxCells?: number;
  /** Disable blinking, sparks, and scan shimmer. */
  calm?: boolean;
  /** Colour theme, or a full custom palette. Default "abyss". */
  palette?: PaletteName | Palette;
  /** Robot size multiplier. Default 1. */
  scale?: number;
  /** If set, the canvas becomes role="img" with this label. */
  label?: string;
  /** Called when a robot docks, undocks, gets a job, or runs low. */
  onEvent?: (event: RobotWorldEvent) => void;
}
