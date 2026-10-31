import type { GlyphStyle, SceneOptions } from "../core/scene";

export type AmbientKind = "starlings" | "fireflies" | "ants" | "koi" | "city" | "servers";

export interface AmbientEvent {
  kind: string;
  x: number;
  y: number;
}

export interface AsciiAmbientOptions extends SceneOptions {
  /** Scene population hint. Each scene clamps this to a sensible range. */
  count?: number;
  /** Scene-specific scale hint. */
  scale?: number;
  /**
   * Glyph texture for scenes that ship a kanji replica. Koi supports
   * `"kanji"`; other ambient scenes ignore this option. Default "ascii".
   */
  glyphs?: GlyphStyle;
  onEvent?: (event: AmbientEvent) => void;
}

export interface AmbientWorldOptions {
  seed?: number;
  count?: number;
  scale?: number;
}
