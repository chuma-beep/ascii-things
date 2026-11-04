export type RGB = [number, number, number];
export type PaletteName =
  | "abyss"
  | "neon"
  | "mono"
  | "paper"
  | "amber"
  | "blueprint"
  | "newsprint"
  | "terminal";
/** A named palette, a full custom palette, or the host's colour scheme. */
export type PaletteChoice = PaletteName | "auto" | Palette;

/** Named palettes in display order. */
export const PALETTE_NAMES = [
  "abyss",
  "neon",
  "mono",
  "paper",
  "amber",
  "blueprint",
  "newsprint",
  "terminal",
] as const satisfies readonly PaletteName[];

export interface PaletteMeta {
  label: string;
  description: string;
}

/** Short labels and descriptions for palette pickers. */
export const PALETTE_META: Record<PaletteName, PaletteMeta> = {
  abyss: { label: "Abyss", description: "Deep black water, cold white fish." },
  neon: { label: "Neon", description: "Night-club cyan, magenta, and acid green." },
  mono: { label: "Mono", description: "A neutral greyscale terminal." },
  paper: { label: "Paper", description: "Warm stock with dark ink." },
  amber: { label: "Amber CRT", description: "Phosphor amber on smoked glass." },
  blueprint: { label: "Blueprint", description: "Cyan drafting lines on navy." },
  newsprint: { label: "Newsprint", description: "Warm off-white with black ink." },
  terminal: { label: "Terminal green", description: "Classic green phosphorus." },
};

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
  amber: {
    name: "amber",
    dark: true,
    background: "#0a0603",
    grid: "rgba(255,176,80,0.075)",
    fish: fish(255, 190, 110),
    wake: [255, 150, 40],
    heat: [255, 90, 20],
    heatHot: [255, 210, 120],
    accents: ["#ffb347", "#ff8c42", "#ffd166", "#d97706", "#f59e0b"],
    eye: "#ffe0a3",
    mark: [100, 55, 20],
    textOnBody: "#1a0d00",
    textOnBodyAlt: "#2b1600",
    edge: [255, 180, 90],
  },
  blueprint: {
    name: "blueprint",
    dark: true,
    background: "#04121f",
    grid: "rgba(80,180,255,0.08)",
    fish: fish(150, 210, 255),
    wake: [80, 190, 255],
    heat: [40, 120, 255],
    heatHot: [120, 220, 255],
    accents: ["#4cc9f0", "#4895ef", "#4361ee", "#3a0ca3", "#72efdd"],
    eye: "#caf0f8",
    mark: [20, 50, 80],
    textOnBody: "#02101c",
    textOnBodyAlt: "#042033",
    edge: [120, 200, 255],
  },
  newsprint: {
    name: "newsprint",
    dark: false,
    background: "#f4f1ea",
    grid: "rgba(20,20,20,0.08)",
    fish: fish(30, 30, 30),
    wake: [60, 60, 60],
    heat: [160, 40, 30],
    heatHot: [200, 90, 40],
    accents: ["#1a1a1a", "#4a4a4a", "#8a1c1c", "#2b4c7e", "#b08d57"],
    eye: "#111111",
    mark: [80, 76, 70],
    textOnBody: "#faf7f0",
    textOnBodyAlt: "#ffffff",
    edge: [70, 66, 60],
  },
  terminal: {
    name: "terminal",
    dark: true,
    background: "#020803",
    grid: "rgba(80,255,140,0.06)",
    fish: fish(130, 255, 160),
    wake: [80, 255, 120],
    heat: [255, 80, 80],
    heatHot: [255, 220, 80],
    accents: ["#39ff14", "#7cfc00", "#00ff7f", "#32cd32", "#adff2f"],
    eye: "#d8ffd8",
    mark: [20, 60, 30],
    textOnBody: "#021006",
    textOnBodyAlt: "#04180a",
    edge: [100, 255, 140],
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
