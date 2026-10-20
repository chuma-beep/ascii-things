export type RGB = [number, number, number];
export type PaletteName = "abyss" | "neon" | "mono" | "paper";
/** A named palette, a full custom palette, or the host's colour scheme. */
export type PaletteChoice = PaletteName | "auto" | Palette;

/**
 * Semantic colours for a scene. The shark body still gets its species tint;
 * the palette controls the water, the school, the wake, and the ink.
 */
export interface Palette {
  name: string;
  /** Dark water or light paper. Controls how shark shading is inverted. */
  dark: boolean;
  background: string;
  grid: string;
  /** Five fish brightness levels, dimmest first. Complete CSS colours. */
  fish: [string, string, string, string, string];
  wake: RGB;
  heat: RGB;
  heatHot: RGB;
  accents: string[];
  eye: string;
  mark: RGB;
  /** Glyph colour on a solid body cell. */
  textOnBody: string;
  textOnBodyAlt: string;
  /** Base ink for anti-aliased silhouette edges. */
  edge: RGB;
}

const fish = (r: number, g: number, b: number): [string, string, string, string, string] =>
  [0.28, 0.42, 0.58, 0.74, 0.9].map((a) => `rgba(${r},${g},${b},${a})`) as [
    string,
    string,
    string,
    string,
    string,
  ];

export const PALETTES: Record<PaletteName, Palette> = {
  abyss: {
    name: "abyss",
    dark: true,
    background: "#000000",
    grid: "rgba(255,255,255,0.055)",
    fish: fish(230, 238, 255),
    wake: [110, 230, 255],
    heat: [220, 40, 40],
    heatHot: [255, 120, 60],
    accents: ["#e0892c", "#e03a32", "#b44ae0", "#33c8cc", "#3cb54a", "#3150e8", "#d9c14a"],
    eye: "#9aa0ad",
    mark: [70, 70, 74],
    textOnBody: "#0e0f13",
    textOnBodyAlt: "#1b1d24",
    edge: [160, 160, 170],
  },
  neon: {
    name: "neon",
    dark: true,
    background: "#05070c",
    grid: "rgba(120,255,220,0.06)",
    fish: fish(170, 255, 226),
    wake: [80, 255, 180],
    heat: [255, 60, 180],
    heatHot: [255, 210, 80],
    accents: ["#39ffb0", "#28d7ff", "#ff3ea5", "#f5ff5a", "#a06bff"],
    eye: "#d8fff4",
    mark: [20, 70, 60],
    textOnBody: "#03100c",
    textOnBodyAlt: "#061b15",
    edge: [120, 255, 220],
  },
  mono: {
    name: "mono",
    dark: true,
    background: "#0a0a0a",
    grid: "rgba(255,255,255,0.04)",
    fish: fish(235, 235, 235),
    wake: [235, 235, 235],
    heat: [190, 190, 190],
    heatHot: [255, 255, 255],
    accents: ["#ffffff", "#bdbdbd", "#8a8a8a"],
    eye: "#f2f2f2",
    mark: [40, 40, 40],
    textOnBody: "#080808",
    textOnBodyAlt: "#151515",
    edge: [190, 190, 190],
  },
  paper: {
    name: "paper",
    dark: false,
    background: "#f3eee4",
    grid: "rgba(24,24,24,0.07)",
    fish: fish(34, 44, 54),
    wake: [40, 110, 130],
    heat: [190, 60, 35],
    heatHot: [220, 110, 50],
    accents: ["#b24a2e", "#2f6f73", "#a8822f", "#5b4b8a"],
    eye: "#1b1b1b",
    mark: [96, 88, 76],
    textOnBody: "#f7f2e8",
    textOnBodyAlt: "#fffdf6",
    edge: [90, 84, 74],
  },
};

export function resolvePalette(palette?: PaletteChoice): Palette {
  if (!palette) return PALETTES.abyss;
  if (palette === "auto") {
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      return PALETTES.paper;
    }
    return PALETTES.abyss;
  }
  return typeof palette === "string" ? (PALETTES[palette] ?? PALETTES.abyss) : palette;
}
