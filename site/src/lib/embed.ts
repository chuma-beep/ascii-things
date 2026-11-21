import { PALETTE_META, PALETTE_NAMES, type PaletteName } from "ascii-things";
import { LAGOON_VARIANTS } from "ascii-things/lagoon";

/**
 * The `/embed/` contract. This module is DOM-free so both the static Astro
 * pages and the browser scripts can use the same validation and URL builder.
 */

export const EMBED_SCENE_IDS = [
  "lagoon",
  "sharks",
  "robots",
  "jellyfish",
  "dog",
  "starlings",
  "fireflies",
  "ants",
  "koi",
  "city",
  "servers",
] as const;

export type EmbedSceneId = (typeof EMBED_SCENE_IDS)[number];

export interface EmbedVariant {
  id: string;
  label: string;
}

export interface EmbedSceneMeta {
  id: EmbedSceneId;
  /** Short human name used by the builder. */
  name: string;
  /** Default accessible name for the scene canvas. */
  label: string;
  /** Custom-element tag that owns the canvas. */
  tag: string;
  /** Attribute that receives the variant, or `null` when the scene has none. */
  variantAttribute: "variant" | "glyphs" | null;
  /** Variant selected when the URL omits `variant`. */
  defaultVariant?: string;
  variants: readonly EmbedVariant[];
  /** Lagoon uses a fixed authoring stage and ignores `columns`. */
  supportsColumns: boolean;
}

const GLYPH_VARIANTS: readonly EmbedVariant[] = [
  { id: "ascii", label: "ASCII" },
  { id: "kanji", label: "Kanji" },
];

const LAGOON_VARIANTS_EMBED: readonly EmbedVariant[] = LAGOON_VARIANTS.map((variant) => ({
  id: variant.id,
  label: variant.label,
}));

export const EMBED_SCENES: readonly EmbedSceneMeta[] = [
  {
    id: "lagoon",
    name: "Lagoon",
    label: "A live ASCII lagoon",
    tag: "ascii-lagoon",
    variantAttribute: "variant",
    defaultVariant: "reef",
    variants: LAGOON_VARIANTS_EMBED,
    supportsColumns: false,
  },
  {
    id: "sharks",
    name: "Shark tank",
    label: "A live ASCII shark tank",
    tag: "ascii-sharks",
    variantAttribute: "glyphs",
    defaultVariant: "ascii",
    variants: GLYPH_VARIANTS,
    supportsColumns: true,
  },
  {
    id: "robots",
    name: "Robot floor",
    label: "A live ASCII robot factory floor",
    tag: "ascii-robots",
    variantAttribute: null,
    variants: [],
    supportsColumns: true,
  },
  {
    id: "jellyfish",
    name: "Jellyfish bloom",
    label: "A live ASCII jellyfish bloom",
    tag: "ascii-jellyfish",
    variantAttribute: "glyphs",
    defaultVariant: "ascii",
    variants: GLYPH_VARIANTS,
    supportsColumns: true,
  },
  {
    id: "dog",
    name: "Robot dog",
    label: "A live ASCII robot dog test yard",
    tag: "ascii-dog",
    variantAttribute: null,
    variants: [],
    supportsColumns: true,
  },
  {
    id: "starlings",
    name: "Starlings",
    label: "A live ASCII murmuration of starlings",
    tag: "ascii-starlings",
    variantAttribute: null,
    variants: [],
    supportsColumns: true,
  },
  {
    id: "fireflies",
    name: "Fireflies",
    label: "A live ASCII firefly meadow",
    tag: "ascii-fireflies",
    variantAttribute: null,
    variants: [],
    supportsColumns: true,
  },
  {
    id: "ants",
    name: "Ants",
    label: "A live ASCII ant foraging trail",
    tag: "ascii-ants",
    variantAttribute: null,
    variants: [],
    supportsColumns: true,
  },
  {
    id: "koi",
    name: "Koi",
    label: "A live ASCII koi pond",
    tag: "ascii-koi",
    variantAttribute: "glyphs",
    defaultVariant: "ascii",
    variants: GLYPH_VARIANTS,
    supportsColumns: true,
  },
  {
    id: "city",
    name: "City",
    label: "A live ASCII city grid at night",
    tag: "ascii-city",
    variantAttribute: null,
    variants: [],
    supportsColumns: true,
  },
  {
    id: "servers",
    name: "Servers",
    label: "A live ASCII server rack",
    tag: "ascii-servers",
    variantAttribute: null,
    variants: [],
    supportsColumns: true,
  },
];

export const EMBED_SCENE_BY_ID = Object.fromEntries(
  EMBED_SCENES.map((scene) => [scene.id, scene]),
) as Record<EmbedSceneId, EmbedSceneMeta>;

export const EMBED_PALETTES: readonly { id: PaletteName; label: string }[] = PALETTE_NAMES.map(
  (id) => ({ id, label: PALETTE_META[id].label }),
);

export const EMBED_DEFAULTS = {
  scene: "dog",
  palette: "abyss",
  columns: 110,
  speed: 1,
  paused: false,
  interactive: true,
  calm: false,
  seed: 7,
} as const satisfies {
  scene: EmbedSceneId;
  palette: PaletteName;
  columns: number;
  speed: number;
  paused: boolean;
  interactive: boolean;
  calm: boolean;
  seed: number;
};

export interface EmbedConfig {
  scene: EmbedSceneId;
  /** Lagoon animal/mood, or `ascii`/`kanji` for the glyph scenes. */
  variant?: string;
  palette: PaletteName;
  columns: number;
  speed: number;
  paused: boolean;
  interactive: boolean;
  calm: boolean;
  seed: number;
  /** Optional custom accessible name. The scene default applies when absent. */
  label?: string;
}

const MAX_LABEL_LENGTH = 160;
const COLUMN_MIN = 24;
const COLUMN_MAX = 240;
const SPEED_MIN = 0;
const SPEED_MAX = 4;
const SEED_MAX = 999_999;

export function isEmbedSceneId(value: unknown): value is EmbedSceneId {
  return typeof value === "string" && (EMBED_SCENE_IDS as readonly string[]).includes(value);
}

export function isPaletteName(value: unknown): value is PaletteName {
  return typeof value === "string" && (PALETTE_NAMES as readonly string[]).includes(value);
}

export function resolveEmbedVariant(
  scene: EmbedSceneId,
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  return EMBED_SCENE_BY_ID[scene].variants.some((variant) => variant.id === value)
    ? value
    : undefined;
}

export function embedLabel(config: Pick<EmbedConfig, "scene" | "label">): string {
  return config.label || EMBED_SCENE_BY_ID[config.scene].label;
}

function clampNumber(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
  integer = false,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const next = integer ? Math.round(value) : value;
  return Math.min(max, Math.max(min, next));
}

function round(value: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function cleanLabel(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const next = value.trim().slice(0, MAX_LABEL_LENGTH);
  return next.length > 0 ? next : undefined;
}

function readNumber(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function readBoolean(params: URLSearchParams, key: string, fallback: boolean): boolean {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return fallback;
  const value = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(value)) return true;
  if (["0", "false", "no", "off"].includes(value)) return false;
  return fallback;
}

/** Accepts untrusted input and returns a complete, clamped configuration. */
export function normalizeEmbedConfig(input: Partial<EmbedConfig> = {}): EmbedConfig {
  const scene = isEmbedSceneId(input.scene) ? input.scene : EMBED_DEFAULTS.scene;
  return {
    scene,
    variant: resolveEmbedVariant(scene, input.variant),
    palette: isPaletteName(input.palette) ? input.palette : EMBED_DEFAULTS.palette,
    columns: clampNumber(input.columns, COLUMN_MIN, COLUMN_MAX, EMBED_DEFAULTS.columns, true),
    speed: round(clampNumber(input.speed, SPEED_MIN, SPEED_MAX, EMBED_DEFAULTS.speed)),
    paused: input.paused ?? EMBED_DEFAULTS.paused,
    interactive: input.interactive ?? EMBED_DEFAULTS.interactive,
    calm: input.calm ?? EMBED_DEFAULTS.calm,
    seed: clampNumber(input.seed, 0, SEED_MAX, EMBED_DEFAULTS.seed, true),
    label: cleanLabel(input.label),
  };
}

export function parseEmbedParams(input: string | URLSearchParams): EmbedConfig {
  const params =
    typeof input === "string"
      ? new URLSearchParams(input.startsWith("?") ? input.slice(1) : input)
      : input;
  const scene = isEmbedSceneId(params.get("scene"))
    ? (params.get("scene") as EmbedSceneId)
    : EMBED_DEFAULTS.scene;
  const meta = EMBED_SCENE_BY_ID[scene];
  const variantAlias = meta.variantAttribute === "glyphs" ? params.get("glyphs") : null;

  return normalizeEmbedConfig({
    scene,
    variant: params.get("variant") ?? variantAlias ?? undefined,
    palette: params.get("palette") ?? undefined,
    columns: readNumber(params, "columns"),
    speed: readNumber(params, "speed"),
    paused: readBoolean(params, "paused", EMBED_DEFAULTS.paused),
    interactive: readBoolean(params, "interactive", EMBED_DEFAULTS.interactive),
    calm: readBoolean(params, "calm", EMBED_DEFAULTS.calm),
    seed: readNumber(params, "seed"),
    label: params.get("label") ?? undefined,
  });
}

/** Serializes only values that differ from the documented defaults. */
export function embedSearchParams(input: Partial<EmbedConfig>): URLSearchParams {
  const config = normalizeEmbedConfig(input);
  const meta = EMBED_SCENE_BY_ID[config.scene];
  const params = new URLSearchParams();

  params.set("scene", config.scene);

  if (config.variant && config.variant !== meta.defaultVariant) {
    params.set("variant", config.variant);
  }
  if (config.palette !== EMBED_DEFAULTS.palette) params.set("palette", config.palette);
  if (meta.supportsColumns && config.columns !== EMBED_DEFAULTS.columns) {
    params.set("columns", String(config.columns));
  }
  if (config.speed !== EMBED_DEFAULTS.speed) params.set("speed", String(config.speed));
  if (config.paused) params.set("paused", "1");
  if (!config.interactive) params.set("interactive", "0");
  if (config.calm) params.set("calm", "1");
  if (config.seed !== EMBED_DEFAULTS.seed) params.set("seed", String(config.seed));
  if (config.label) params.set("label", config.label);

  return params;
}

export function embedPath(input: Partial<EmbedConfig>): string {
  const search = embedSearchParams(input).toString();
  return search ? `/embed/?${search}` : "/embed/";
}

export function embedUrl(input: Partial<EmbedConfig>, origin?: string): string {
  const base =
    origin ?? (typeof window === "undefined" ? "https://ascii-things.dev" : window.location.origin);
  return new URL(embedPath(input), base).toString();
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** The copy-paste `<iframe>` for a configuration. */
export function iframeSnippet(input: Partial<EmbedConfig>, origin?: string): string {
  const config = normalizeEmbedConfig(input);
  const url = embedUrl(config, origin);
  const title = embedLabel(config);
  return `<iframe
  src="${escapeAttribute(url)}"
  title="${escapeAttribute(title)}"
  loading="lazy"
  style="display:block;width:100%;height:520px;border:0"
></iframe>`;
}
