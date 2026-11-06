import { PALETTE_NAMES, type PaletteName } from "ascii-things";

export const PRESET_VERSION = 1;

export const SCENE_IDS = [
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

export type SceneId = (typeof SCENE_IDS)[number];

export const SURFACE_VARIANTS = [
  "field",
  "globe",
  "ripple",
  "flow",
  "tunnel",
  "glyph-rain",
  "torus",
  "terrain",
  "galaxy",
  "voronoi",
  "plasma",
  "caustics",
  "constellation",
  "torus-3d",
  "cube-3d",
  "planet-3d",
  "helix-3d",
  "moon",
  "koi",
] as const;

export type SurfaceVariantId = (typeof SURFACE_VARIANTS)[number];

export type PresetKind = "scene" | "surface" | "image" | "dither";
export type PresetGlyphs = "ascii" | "kanji";

/**
 * A compact, URL-safe art-direction preset. It deliberately excludes
 * callbacks, DOM objects, and engine internals so it can be shared around.
 */
export interface SharePreset {
  v: typeof PRESET_VERSION;
  kind: PresetKind;
  scene?: SceneId;
  variant?: SurfaceVariantId;
  palette?: PaletteName;
  glyphs?: PresetGlyphs;
  seed?: number;
  columns?: number;
  density?: number;
  speed?: number;
  scale?: number;
  cell?: number;
  calm?: boolean;
  paused?: boolean;
  interactive?: boolean;
  fg?: string;
  bg?: string;
  accent?: string;
  text?: string;
  ramp?: string;
  dither?: string;
  invert?: boolean;
  contrast?: number;
  brightness?: number;
  gamma?: number;
  autoLevels?: boolean;
  color?: boolean;
  transparent?: boolean;
  edge?: boolean;
  edgeStrength?: number;
}

export interface SceneShareState {
  scene: SceneId;
  palette: PaletteName;
  glyphs: PresetGlyphs;
  seed: number;
  columns: number;
  density: number;
  speed: number;
  calm: boolean;
  paused: boolean;
  interactive: boolean;
}

export interface SurfaceShareState {
  variant: SurfaceVariantId;
  glyphs?: string;
  seed?: number;
  density?: number;
  speed?: number;
  cell?: number;
  calm?: boolean;
  paused?: boolean;
  interactive?: boolean;
  fg?: string;
  bg?: string;
  accent?: string;
  text?: string;
  ramp?: string;
}

export interface ImageShareState {
  columns: number;
  ramp: string;
  dither: string;
  invert: boolean;
  contrast: number;
  brightness: number;
  gamma: number;
  autoLevels: boolean;
  color: boolean;
  transparent: boolean;
  edge: boolean;
  edgeStrength: number;
  fg: string;
  bg: string;
}

export function isSceneId(value: unknown): value is SceneId {
  return typeof value === "string" && (SCENE_IDS as readonly string[]).includes(value);
}

export function isSurfaceVariant(value: unknown): value is SurfaceVariantId {
  return typeof value === "string" && (SURFACE_VARIANTS as readonly string[]).includes(value);
}

export function isPaletteName(value: unknown): value is PaletteName {
  return typeof value === "string" && (PALETTE_NAMES as readonly string[]).includes(value);
}

export function isPresetGlyphs(value: unknown): value is PresetGlyphs {
  return value === "ascii" || value === "kanji";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function numberIn(value: unknown, min: number, max: number, integer = false): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const next = integer ? Math.round(value) : value;
  return Math.min(max, Math.max(min, next));
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function textValue(value: unknown, max = 96): string | undefined {
  if (typeof value !== "string") return undefined;
  const next = value.trim().slice(0, max);
  return next.length > 0 ? next : undefined;
}

function colorValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return /^#[0-9a-f]{3}([0-9a-f]{3})?([0-9a-f]{2})?$/i.test(value) ? value : undefined;
}

const IMAGE_DITHERS = ["none", "floyd-steinberg", "bayer"] as const;

function ditherValue(value: unknown): string | undefined {
  return typeof value === "string" && (IMAGE_DITHERS as readonly string[]).includes(value)
    ? value
    : undefined;
}

/**
 * Accepts untrusted input and returns a complete preset. Invalid fields are
 * dropped; numeric fields are clamped to the same ranges as the playground.
 */
export function normalizePreset(input: unknown): SharePreset | null {
  if (!isRecord(input)) return null;

  const kind: PresetKind =
    input.kind === "surface"
      ? "surface"
      : input.kind === "image"
        ? "image"
        : input.kind === "dither"
          ? "dither"
          : "scene";
  const preset: SharePreset = { v: PRESET_VERSION, kind };

  if (kind === "scene") {
    preset.scene = isSceneId(input.scene) ? input.scene : "dog";
  } else if (kind === "surface") {
    preset.variant = isSurfaceVariant(input.variant) ? input.variant : "globe";
  }

  if (isPaletteName(input.palette)) preset.palette = input.palette;
  if (isPresetGlyphs(input.glyphs)) preset.glyphs = input.glyphs;
  preset.seed = numberIn(input.seed, 0, 999_999, true);
  preset.columns = numberIn(input.columns, 24, 240, true);
  preset.density = numberIn(input.density, 0.1, 3);
  preset.speed = numberIn(input.speed, 0, 4);
  preset.scale = numberIn(input.scale, 0.25, 3);
  preset.cell = numberIn(input.cell, 2, 32, true);
  preset.calm = booleanValue(input.calm);
  preset.paused = booleanValue(input.paused);
  preset.interactive = booleanValue(input.interactive);
  preset.fg = colorValue(input.fg);
  preset.bg = colorValue(input.bg);
  preset.accent = colorValue(input.accent);
  preset.text = textValue(input.text);
  preset.ramp = textValue(input.ramp, 128);
  preset.dither = ditherValue(input.dither);
  preset.invert = booleanValue(input.invert);
  preset.contrast = numberIn(input.contrast, 0.1, 4);
  preset.brightness = numberIn(input.brightness, -1, 1);
  preset.gamma = numberIn(input.gamma, 0.2, 3);
  preset.autoLevels = booleanValue(input.autoLevels);
  preset.color = booleanValue(input.color);
  preset.transparent = booleanValue(input.transparent);
  preset.edge = booleanValue(input.edge);
  preset.edgeStrength = numberIn(input.edgeStrength, 0.5, 4);

  return preset;
}

export function createScenePreset(state: SceneShareState): SharePreset {
  return (
    normalizePreset({ v: PRESET_VERSION, kind: "scene", ...state }) ?? {
      v: PRESET_VERSION,
      kind: "scene",
      scene: state.scene,
    }
  );
}

export function createSurfacePreset(state: SurfaceShareState): SharePreset {
  return (
    normalizePreset({ v: PRESET_VERSION, kind: "surface", ...state }) ?? {
      v: PRESET_VERSION,
      kind: "surface",
      variant: state.variant,
    }
  );
}

export function createImagePreset(state: ImageShareState): SharePreset {
  return (
    normalizePreset({ v: PRESET_VERSION, kind: "image", ...state }) ?? {
      v: PRESET_VERSION,
      kind: "image",
    }
  );
}

export function encodePreset(preset: SharePreset): string {
  const normalized = normalizePreset(preset) ?? preset;
  const bytes = new TextEncoder().encode(JSON.stringify(normalized));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodePreset(value: string): SharePreset | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return normalizePreset(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export function presetKey(preset: SharePreset): string {
  return JSON.stringify(preset);
}

/** A relative link that is safe to render on the server and hydrate on the client. */
export function presetPath(preset: SharePreset, path = "/playground/"): string {
  return `${path}?p=${encodePreset(preset)}`;
}

export function presetUrl(preset: SharePreset, path = "/playground/"): string {
  const relative = presetPath(preset, path);
  if (typeof window === "undefined") return relative;
  return new URL(relative, window.location.origin).toString();
}

export function presetLink(preset: SharePreset, path = "/playground/"): string {
  return presetUrl(preset, path);
}

/** Reads `?p=` first, then the legacy playground query keys. */
export function readPresetFromUrl(href?: string): SharePreset | null {
  const value = href ?? (typeof window === "undefined" ? undefined : window.location.href);
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value, "https://ascii-things.dev");
  } catch {
    return null;
  }

  const encoded = url.searchParams.get("p");
  if (encoded) {
    const decoded = decodePreset(encoded);
    if (decoded) return decoded;
  }

  const scene = url.searchParams.get("scene");
  if (!isSceneId(scene)) return null;

  const palette = url.searchParams.get("palette");
  const glyphs = url.searchParams.get("glyphs");
  const seed = url.searchParams.get("seed");
  const columns = url.searchParams.get("columns");
  const speed = url.searchParams.get("speed");
  const calm = url.searchParams.get("calm");
  const interactive = url.searchParams.get("interactive");

  return normalizePreset({
    kind: "scene",
    scene,
    palette: palette ?? undefined,
    glyphs: glyphs ?? undefined,
    seed: seed === null ? undefined : Number(seed),
    columns: columns === null ? undefined : Number(columns),
    speed: speed === null ? undefined : Number(speed),
    calm: calm === null ? undefined : calm === "1" || calm === "true",
    interactive:
      interactive === null ? undefined : !(interactive === "0" || interactive === "false"),
  });
}

export function replacePresetInUrl(
  preset: SharePreset,
  mode: "push" | "replace" = "replace",
): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("p", encodePreset(preset));
  for (const key of [
    "scene",
    "palette",
    "glyphs",
    "seed",
    "columns",
    "speed",
    "calm",
    "interactive",
  ]) {
    url.searchParams.delete(key);
  }
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") window.history.pushState(null, "", next);
  else window.history.replaceState(null, "", next);
}
