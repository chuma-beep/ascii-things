export type SurfaceVariant =
  | "field"
  | "globe"
  | "ripple"
  | "flow"
  | "tunnel"
  | "glyph-rain"
  | "torus"
  | "terrain"
  | "galaxy"
  | "voronoi"
  | "plasma"
  | "caustics"
  | "constellation"
  | "torus-3d"
  | "cube-3d"
  | "planet-3d";

const VARIANT_INDEX: Record<SurfaceVariant, number> = {
  field: 0,
  globe: 1,
  ripple: 2,
  flow: 3,
  tunnel: 4,
  "glyph-rain": 5,
  torus: 6,
  terrain: 7,
  galaxy: 8,
  voronoi: 9,
  plasma: 10,
  caustics: 11,
  constellation: 12,
  "torus-3d": 13,
  "cube-3d": 14,
  "planet-3d": 15,
};

export type AsciiSurfaceOptions = {
  /** Wordmark or short line that emerges from the glyph field. */
  text?: string;
  /** Character ramp, low brightness first. Up to 16 glyphs. */
  glyphs?: string;
  /** Glyph cell height in CSS pixels. `0` derives it from the canvas width. */
  cell?: number;
  /** Density of the ambient glyph field, 0–1. */
  density?: number;
  /** Speed multiplier for the field wave and scan. */
  speed?: number;
  /** Animated accent scan band. */
  scan?: boolean;
  /** Brighten glyphs near a fine pointer. */
  pointer?: boolean;
  foreground?: string;
  accent?: string;
  background?: string;
  fontFamily?: string;
  /** Backing-store pixel ratio cap. */
  maxDpr?: number;
  /** Visual preset. Defaults to "field". */
  variant?: SurfaceVariant;
};

export const SURFACE_DEFAULTS = {
  text: "ASCII-THINGS",
  glyphs: ".:-=+*#%@",
  cell: 0,
  density: 0.16,
  speed: 1,
  scan: true,
  pointer: true,
  foreground: "#ece8df",
  accent: "#ff7a1a",
  background: "transparent",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  maxDpr: 2,
  variant: "field",
} satisfies Required<AsciiSurfaceOptions>;

const VERTEX_SHADER = `attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `precision mediump float;

uniform vec2 u_resolution;
uniform vec2 u_cell;
uniform float u_time;
uniform float u_density;
uniform float u_glyphCount;
uniform float u_scan;
uniform float u_scanX;
uniform float u_scanRadius;
uniform vec4 u_foreground;
uniform vec4 u_accent;
uniform vec2 u_pointer;
uniform float u_pointerStrength;
uniform sampler2D u_atlas;
uniform sampler2D u_mask;
uniform float u_variant;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}


float sdTorus3(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float objectSDF(vec3 p) {
  float ca = cos(u_time * 0.35);
  float sa = sin(u_time * 0.35);
  p.xz = mat2(ca, -sa, sa, ca) * p.xz;
  float cb = cos(u_time * 0.22);
  float sb = sin(u_time * 0.22);
  p.xy = mat2(cb, -sb, sb, cb) * p.xy;
  if (u_variant > 14.5) {
    return length(p) - 0.72;
  }
  if (u_variant > 13.5) {
    return sdRoundBox(p, vec3(0.52), 0.06);
  }
  return sdTorus3(p, vec2(0.62, 0.22));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 grid = floor(frag / u_cell);
  vec2 local = fract(frag / u_cell);
  vec2 cellUv = (grid + 0.5) * u_cell / u_resolution;
  float pointer = (1.0 - smoothstep(0.0, 150.0, distance(frag, u_pointer))) * u_pointerStrength;

  float mask = 0.0;
  float level = 0.0;
  float weight = 1.0;

  if (u_variant < 0.5) {
    // The original wordmark field: a drifting glyph surface with an
    // emergent text mask and a slow scan band.
    mask = texture2D(u_mask, cellUv).r;
    float wave = 0.5 + 0.5 * sin(cellUv.x * 13.0 + cellUv.y * 9.0 + u_time * 0.9);
    float speck = step(hash(grid), 0.55);
    float base = u_density * (0.5 + 0.8 * wave) * speck;
    float word = mask * (0.46 + 0.54 * wave);
    level = min(1.0, max(word, base) + pointer * 0.2);
    weight = step(0.08, mask);
  } else if (u_variant < 1.5) {
    // Globe: a rotating sphere with latitude/longitude lines, stylised
    // continents, and a single soft key light.
    vec2 p = (frag - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y) * 2.0;
    float r2 = dot(p, p);
    if (r2 > 0.86 * 0.86) {
      float star = step(0.992, hash(grid)) * (0.35 + 0.65 * (0.5 + 0.5 * sin(u_time * 1.5 + hash(grid) * 6.283)));
      level = star * 0.45;
    } else {
      float z = sqrt(max(0.0, 1.0 - r2));
      vec3 n = normalize(vec3(p.x, p.y, z));
      float a = u_time * 0.22;
      float x = n.x * cos(a) - n.z * sin(a);
      float zz = n.x * sin(a) + n.z * cos(a);
      float lat = asin(clamp(n.y, -1.0, 1.0));
      float lon = atan(x, zz);
      float latLine = 1.0 - smoothstep(0.018, 0.075, abs(fract(lat / 3.14159265 * 8.0) - 0.5));
      float lonLine = 1.0 - smoothstep(0.018, 0.075, abs(fract(lon / 3.14159265 * 12.0) - 0.5));
      float land = sin(lon * 2.0 + sin(lat * 3.0) * 1.4) + sin(lat * 4.0 + lon * 1.3) + 0.5 * sin(lon * 5.0 - lat * 2.0);
      land = smoothstep(0.35, 0.75, land);
      vec3 lightDir = normalize(vec3(-0.45, 0.65, 0.8));
      float lit = 0.4 + 0.6 * clamp(dot(n, lightDir), 0.0, 1.0);
      float lines = max(latLine, lonLine);
      level = max(lines * 0.55, land * 0.95) * lit;
      weight = 1.0;
    }
  } else if (u_variant < 2.5) {
    // Ripple pond: a wide concentric wave with a stronger ring where the
    // pointer disturbed the surface.
    vec2 p = (frag - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y) * 2.0;
    float d = length(p);
    float ring = 0.5 + 0.5 * sin(d * 18.0 - u_time * 3.0);
    float ripple = smoothstep(0.72, 0.95, ring) * smoothstep(1.05, 0.2, d);
    vec2 pp = (u_pointer - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y) * 2.0;
    float pd = length(p - pp);
    float pRing = 0.5 + 0.5 * sin(pd * 20.0 - u_time * 4.0);
    float pRipple = smoothstep(0.75, 0.95, pRing) * smoothstep(0.65, 0.0, pd) * u_pointerStrength;
    level = max(ripple * 0.75, pRipple);
    weight = 1.0;
  } else if (u_variant < 3.5) {
    // Flow field: two crossed travelling waves make a soft vector field.
    vec2 p = frag / u_resolution;
    float n = sin(p.x * 8.0 + sin(p.y * 6.0 + u_time * 0.7) * 2.0) + sin(p.y * 10.0 + cos(p.x * 7.0 - u_time * 0.5) * 2.0);
    n = 0.5 + 0.5 * sin(n * 2.0 + u_time);
    float line = smoothstep(0.72, 0.94, n);
    level = line * 0.8;
    weight = 1.0;
  } else if (u_variant < 4.5) {
    // Tunnel: concentric rings and spokes rushing toward a vanishing point.
    vec2 p = (frag - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
    float r = length(p);
    float a = atan(p.y, p.x);
    float depth = 0.36 / max(r, 0.001);
    float rings = 0.5 + 0.5 * sin(depth * 7.0 - u_time * 3.0);
    float spokes = 0.5 + 0.5 * sin(a * 12.0 + depth * 0.6);
    float v = max(rings, spokes);
    level = smoothstep(0.62, 0.94, v) * smoothstep(0.0, 0.22, r) * smoothstep(1.0, 0.15, r);
    weight = 1.0;
  } else if (u_variant < 5.5) {
    // Glyph rain: one falling head per column, with a fading tail.
    float column = grid.x;
    float speed = 0.5 + hash(vec2(column, 0.0)) * 1.4;
    float head = fract(u_time * 0.16 * speed + hash(vec2(column, 1.0)));
    float rowNorm = 1.0 - grid.y / max(1.0, u_resolution.y / u_cell.y);
    float trail = smoothstep(0.0, 0.55, head - rowNorm);
    float flicker = 0.65 + 0.35 * sin(u_time * 4.0 + column);
    level = trail * flicker;
    weight = 1.0;
  } else if (u_variant < 6.5) {
    // Torus: a ring with a woven surface, drawn as a single flat primitive.
    vec2 p = (frag - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y) * 2.0;
    float r = length(p);
    float a = atan(p.y, p.x);
    float ring = 1.0 - smoothstep(0.045, 0.11, abs(r - 0.58));
    float weave = 0.5 + 0.5 * sin(a * 16.0 + u_time * 1.6 + r * 9.0);
    level = max(ring * 0.8, weave * 0.35) * (0.6 + 0.4 * sin(u_time * 1.4 + a * 3.0));
    weight = 1.0;
  } else if (u_variant < 7.5) {
    // Terrain: layered ridges over a dark valley.
    vec2 p = (frag - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y) * 2.0;
    float horizon = -0.15;
    float ridge =
      0.08 * sin(p.x * 3.0 + u_time * 0.15) +
      0.04 * sin(p.x * 7.0 - u_time * 0.25) +
      0.02 * sin(p.x * 13.0 + u_time * 0.4);
    float line = 1.0 - smoothstep(0.0, 0.035, abs(p.y - horizon - ridge));
    float under = step(p.y, horizon + ridge) * (0.16 + 0.1 * sin(p.x * 9.0 + p.y * 18.0 + u_time * 0.7));
    level = max(line, under);
    weight = 1.0;
  } else if (u_variant < 8.5) {
    // Galaxy: spiral arms around a bright core.
    vec2 p = (frag - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y) * 2.0;
    float r = length(p);
    float a = atan(p.y, p.x);
    float arms = 0.5 + 0.5 * sin(a * 3.0 + log(r + 0.08) * 7.0 - u_time * 0.8);
    float core = 1.0 - smoothstep(0.0, 0.36, r);
    float stars = step(0.986, hash(grid));
    level = max(arms * smoothstep(1.0, 0.12, r) * 0.65, core * 0.85) + stars * 0.25;
    weight = 1.0;
  } else if (u_variant < 9.5) {
    // Voronoi: bright edges between jittered cell centres.
    vec2 p = (frag - 0.5 * u_resolution) / u_cell;
    vec2 cell = floor(p);
    vec2 f = fract(p);
    float d1 = 8.0;
    float d2 = 8.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = vec2(hash(cell + g), hash(cell + g + 17.0));
        vec2 r = g + o - f;
        float d = dot(r, r);
        if (d < d1) {
          d2 = d1;
          d1 = d;
        } else if (d < d2) {
          d2 = d;
        }
      }
    }
    float edge = 1.0 - smoothstep(0.0, 0.08, sqrt(d2) - sqrt(d1));
    level = edge * 0.85;
    weight = 1.0;
  } else if (u_variant < 10.5) {
    // Plasma: interfering waves in a molten field.
    vec2 p = frag / u_resolution;
    float v = sin(p.x * 8.0 + u_time) + sin(p.y * 10.0 - u_time * 0.8) + sin((p.x + p.y) * 12.0 + u_time * 0.6);
    level = smoothstep(0.15, 0.95, 0.5 + 0.5 * sin(v * 1.8));
    weight = 1.0;
  } else if (u_variant < 11.5) {
    // Caustics: bright ridges crossing like a pool floor.
    vec2 p = frag / min(u_resolution.x, u_resolution.y);
    float v = sin(p.x * 10.0 + sin(p.y * 7.0 + u_time * 0.7) * 2.0)
      + sin(p.y * 12.0 + cos(p.x * 6.0 - u_time * 0.5) * 2.0);
    level = smoothstep(0.75, 1.1, v);
    weight = 1.0;
  } else if (u_variant < 12.5) {
    // Constellation: layered stars and a sparse linked star map.
    vec2 p = (frag - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y) * 2.0;
    float band = exp(-pow((p.y + p.x * 0.35 - 0.05) * 2.8, 2.0));
    vec2 starGrid = floor(frag / (u_cell * 3.0));
    vec2 starLocal = fract(frag / (u_cell * 3.0)) - 0.5;
    vec2 starJitter = vec2(hash(starGrid), hash(starGrid + 17.0)) - 0.5;
    float starDistance = length(starLocal - starJitter * 0.6);
    float starCore = 1.0 - smoothstep(0.0, 0.38, starDistance);
    float starBright = step(0.82, hash(starGrid + 5.0));
    float starTwinkle = 0.55 + 0.45 * sin(u_time * (1.2 + hash(starGrid) * 2.0) + hash(starGrid) * 6.283);
    float star = starBright * starCore * starTwinkle;
    float dust = step(0.982, hash(grid)) * (0.4 + 0.6 * sin(u_time * 1.7 + hash(grid) * 6.283));
    float link = 0.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 g = starGrid + vec2(float(x), float(y));
        if (hash(g + 5.0) > 0.82) {
          vec2 a = (starGrid + 0.5 + (vec2(hash(starGrid), hash(starGrid + 17.0)) - 0.5) * 0.6) * 3.0 * u_cell;
          vec2 b = (g + 0.5 + (vec2(hash(g), hash(g + 17.0)) - 0.5) * 0.6) * 3.0 * u_cell;
          vec2 ab = b - a;
          float len2 = max(dot(ab, ab), 0.001);
          float h = clamp(dot(frag - a, ab) / len2, 0.0, 1.0);
          float dist = length(frag - (a + ab * h));
          link = max(link, (1.0 - smoothstep(0.0, 1.4, dist)) * (1.0 - h) * 0.35);
        }
      }
    }
    level = max(max(star, dust * 0.55), max(link * 0.55, band * 0.1));
    weight = 1.0;
  } else {
    // Solid 3D object: raymarched torus or cube with real depth.
    vec2 p = (frag - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y) * 2.0;
    vec3 ro = vec3(0.0, 0.0, 2.8);
    vec3 rd = normalize(vec3(p * 0.9, -2.4));
    float t = 0.0;
    float hit = 0.0;
    vec3 pos = ro;
    for (int i = 0; i < 64; i++) {
      pos = ro + rd * t;
      float d = objectSDF(pos);
      if (d < 0.002) { hit = 1.0; break; }
      t += d;
      if (t > 6.0) break;
    }
    float starField = step(0.995, hash(grid)) * (0.3 + 0.5 * sin(u_time * 1.5 + hash(grid) * 6.283));
    if (hit > 0.5) {
      float e = 0.008;
      vec3 n = normalize(vec3(
        objectSDF(pos + vec3(e, 0.0, 0.0)) - objectSDF(pos - vec3(e, 0.0, 0.0)),
        objectSDF(pos + vec3(0.0, e, 0.0)) - objectSDF(pos - vec3(0.0, e, 0.0)),
        objectSDF(pos + vec3(0.0, 0.0, e)) - objectSDF(pos - vec3(0.0, 0.0, e))
      ));
      vec3 lightDir = normalize(vec3(-0.45, 0.75, 0.65));
      float diffuse = max(dot(n, lightDir), 0.0);
      float rim = pow(1.0 - max(dot(n, normalize(-rd)), 0.0), 2.5);
      if (u_variant > 14.5) {
        float lat = asin(clamp(n.y, -1.0, 1.0));
        float lon = atan(n.z, n.x);
        float land = sin(lon * 2.0 + sin(lat * 3.0) * 1.5)
          + sin(lat * 4.0 + lon * 1.3)
          + 0.5 * sin(lon * 5.0 - lat * 2.0);
        float mask = smoothstep(0.35, 0.75, land);
        float grid = max(
          1.0 - smoothstep(0.02, 0.08, abs(fract(lat * 4.0) - 0.5)),
          1.0 - smoothstep(0.02, 0.08, abs(fract(lon * 6.0) - 0.5))
        );
        level = max(level * (0.68 + 0.32 * mask), grid * (0.25 + 0.25 * diffuse));
      } else {
        level = 0.32 + 0.58 * diffuse + 0.38 * rim;
      }
    } else {
      level = starField;
    }
    weight = 1.0;
  }

  level = max(level, pointer * 0.18);
  if (level < 0.012) discard;

  float index = min(floor(clamp(level, 0.0, 0.999) * u_glyphCount), u_glyphCount - 1.0);
  float localX = clamp(local.x, 0.015, 0.985);
  vec2 glyphUv = vec2((index + localX) / u_glyphCount, local.y);
  float glyph = texture2D(u_atlas, glyphUv).a;
  if (glyph < 0.04) discard;

  float scan = u_scan * (1.0 - smoothstep(0.0, u_scanRadius, abs(frag.x - u_scanX)));
  float accentMix = max(scan, pointer * 0.55);
  float alpha = glyph * mix(0.38, 1.0, max(weight, pointer * 0.75)) * mix(u_foreground.a, u_accent.a, accentMix);
  vec3 color = mix(u_foreground.rgb, u_accent.rgb, accentMix);
  gl_FragColor = vec4(color, alpha);
}`;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function applyDefined(target: Required<AsciiSurfaceOptions>, options: AsciiSurfaceOptions): void {
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) {
      (target as Record<string, unknown>)[key] = value;
    }
  }
}

/** Keep a ramp compact, unique, and at least two glyphs long. */
export function resolveGlyphs(glyphs?: string): string {
  const chars = Array.from(glyphs ?? "").filter((char) => char.trim().length > 0);
  const unique = [...new Set(chars)].slice(0, 16);
  return unique.length >= 2 ? unique.join("") : SURFACE_DEFAULTS.glyphs;
}

/** Map a 0–1 brightness level to a glyph index. */
export function glyphIndex(level: number, count: number): number {
  if (count <= 1) return 0;
  return clamp(Math.floor(clamp(level, 0, 0.999) * count), 0, count - 1);
}

/** Resolve a CSS colour to normalized RGBA. */
export function parseColor(value: string): [number, number, number, number] {
  const input = value.trim().toLowerCase();
  if (input === "transparent") return [0, 0, 0, 0];

  if (input.startsWith("#")) {
    const hex = input.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const parts = hex.split("").map((part) => Number.parseInt(part + part, 16));
      if (parts.every(Number.isFinite)) {
        return [
          (parts[0] ?? 0) / 255,
          (parts[1] ?? 0) / 255,
          (parts[2] ?? 0) / 255,
          (parts[3] ?? 255) / 255,
        ];
      }
    }
    if (hex.length === 6 || hex.length === 8) {
      const parts = [
        Number.parseInt(hex.slice(0, 2), 16),
        Number.parseInt(hex.slice(2, 4), 16),
        Number.parseInt(hex.slice(4, 6), 16),
        hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) : 255,
      ];
      if (parts.every(Number.isFinite)) {
        return [
          (parts[0] ?? 0) / 255,
          (parts[1] ?? 0) / 255,
          (parts[2] ?? 0) / 255,
          (parts[3] ?? 255) / 255,
        ];
      }
    }
  }

  const match = input.match(/^rgba?\(([^)]+)\)$/);
  if (match?.[1]) {
    const parts = match[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map((part) => Number.parseFloat(part));
    if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
      return [
        clamp(parts[0] ?? 0, 0, 255) / 255,
        clamp(parts[1] ?? 0, 0, 255) / 255,
        clamp(parts[2] ?? 0, 0, 255) / 255,
        clamp(parts[3] ?? 1, 0, 1),
      ];
    }
  }

  return [1, 1, 1, 1];
}

/** Derive a monospace cell from the requested height or canvas width. */
export function surfaceCell(cell: number, width: number): { width: number; height: number } {
  const height = cell > 0 ? clamp(cell, 6, 48) : clamp(width > 0 ? width / 90 : 12, 8, 18);
  return { width: height * 0.62, height };
}

function normalizeOptions(options: AsciiSurfaceOptions): Required<AsciiSurfaceOptions> {
  const merged = { ...SURFACE_DEFAULTS };
  applyDefined(merged, options);
  merged.glyphs = resolveGlyphs(merged.glyphs);
  merged.density = clamp(merged.density, 0, 1);
  merged.speed = clamp(merged.speed, 0, 6);
  merged.maxDpr = clamp(merged.maxDpr, 1, 3);
  return merged;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function supportsWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl", { alpha: true, antialias: false });
    if (!gl) return false;
    const program = createProgram(gl);
    if (!program) return false;
    gl.deleteProgram(program);
    return true;
  } catch {
    return false;
  }
}

/**
 * A WebGL ASCII surface: a living glyph field with an optional wordmark,
 * accent scan, and pointer response. Falls back to a 2D glyph field when
 * WebGL is unavailable.
 *
 * The class owns resize, visibility, reduced-motion, context-loss, and
 * animation lifecycle. Call `destroy()` when the canvas is removed.
 */
export class AsciiSurfaceEngine {
  readonly canvas: HTMLCanvasElement;
  options: Required<AsciiSurfaceOptions>;

  private mode: "webgl" | "2d" | "none" = "none";
  private gl: WebGLRenderingContext | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private atlasTexture: WebGLTexture | null = null;
  private maskTexture: WebGLTexture | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private atlas: HTMLCanvasElement | null = null;
  private maskCanvas: HTMLCanvasElement | null = null;
  private maskData: Uint8ClampedArray | null = null;
  private glyphCount = 1;
  private width = 1;
  private height = 1;
  private dpr = 1;
  private cell = { width: 8, height: 13 };
  private ready = false;
  private paused = false;
  private reduced = false;
  private visible = true;
  private onScreen = true;
  private running = false;
  private destroyed = false;
  private raf = 0;
  private last = 0;
  private elapsed = 0;
  private pointer = { x: -1e4, y: -1e4, strength: 0 };
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private motionQuery: MediaQueryList | null = null;
  private onMotionChange: (() => void) | null = null;
  private onVisibilityChange: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, options: AsciiSurfaceOptions = {}) {
    this.canvas = canvas;
    this.options = normalizeOptions(options);
    this.motionQuery =
      typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    this.reduced = this.motionQuery?.matches ?? false;
    this.canvas.style.backgroundColor = this.options.background;

    if (supportsWebGL()) {
      this.mode = "webgl";
      this.gl = this.createGL();
      if (!this.gl) this.mode = "none";
    }
    if (this.mode !== "webgl") {
      this.ctx = canvas.getContext("2d");
      this.mode = this.ctx ? "2d" : "none";
    }

    this.resize();
    if (this.mode === "webgl") {
      this.initGL();
    }
    this.ready = this.mode !== "none";
    if (this.ready) this.draw(0);
    this.observe();
    if (!this.reduced) this.start();
  }

  /** Renderer selected at runtime. Useful for diagnostics and tests. */
  get renderer(): "webgl" | "2d" | "none" {
    return this.mode;
  }

  private createGL(): WebGLRenderingContext | null {
    try {
      return this.canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: "low-power",
      });
    } catch {
      return null;
    }
  }

  private initGL(): void {
    const gl = this.gl;
    if (!gl) return;
    this.program = createProgram(gl);
    if (!this.program) {
      this.mode = "none";
      this.gl = null;
      return;
    }

    this.buffer = gl.createBuffer();
    this.uniforms = {};
    for (const name of [
      "u_resolution",
      "u_cell",
      "u_time",
      "u_density",
      "u_glyphCount",
      "u_scan",
      "u_scanX",
      "u_scanRadius",
      "u_foreground",
      "u_accent",
      "u_pointer",
      "u_pointerStrength",
      "u_variant",
      "u_atlas",
      "u_mask",
    ]) {
      this.uniforms[name] = gl.getUniformLocation(this.program, name);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const bindProgram = gl.useProgram.bind(gl);
    bindProgram(this.program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);

    this.uploadAtlas();
    this.uploadMask();
    this.ready = true;
  }

  private uploadAtlas(): void {
    const gl = this.gl;
    if (!gl || !this.atlas) return;
    this.atlasTexture = this.uploadTexture(this.atlasTexture, this.atlas);
  }

  private uploadMask(): void {
    const gl = this.gl;
    if (!gl || !this.maskCanvas) return;
    this.maskTexture = this.uploadTexture(this.maskTexture, this.maskCanvas);
  }

  private uploadTexture(
    texture: WebGLTexture | null,
    source: HTMLCanvasElement,
  ): WebGLTexture | null {
    const gl = this.gl;
    if (!gl) return null;
    const next = texture ?? gl.createTexture();
    if (!next) return null;
    gl.bindTexture(gl.TEXTURE_2D, next);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return next;
  }

  private observe(): void {
    if (typeof window === "undefined") return;

    if (typeof IntersectionObserver !== "undefined") {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          this.onScreen = entries.some((entry) => entry.isIntersecting);
          if (!this.onScreen) this.stop();
          else if (!this.reduced) this.start();
        },
        { rootMargin: "240px 0px" },
      );
      this.intersectionObserver.observe(this.canvas);
    }

    this.onVisibilityChange = () => {
      this.visible = !document.hidden;
      if (!this.visible) this.stop();
      else if (!this.reduced) this.start();
    };
    document.addEventListener("visibilitychange", this.onVisibilityChange);

    if (this.motionQuery) {
      this.onMotionChange = () => {
        this.reduced = this.motionQuery?.matches ?? false;
        if (this.reduced) {
          this.stop();
          this.draw(0);
        } else if (this.visible && this.onScreen) {
          this.start();
        }
      };
      this.motionQuery.addEventListener("change", this.onMotionChange);
    }

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvas);
    } else {
      window.addEventListener("resize", this.resize);
    }

    document.fonts?.ready.then(() => this.resize()).catch(() => undefined);

    this.canvas.addEventListener("webglcontextlost", this.onContextLost);
    this.canvas.addEventListener("webglcontextrestored", this.onContextRestored);
    this.canvas.addEventListener("pointermove", this.onPointerMove, { passive: true });
    this.canvas.addEventListener("pointerleave", this.onPointerLeave);
  }

  private onContextLost = (event: Event): void => {
    event.preventDefault();
    this.stop();
    this.gl = null;
    this.program = null;
    this.buffer = null;
    this.atlasTexture = null;
    this.maskTexture = null;
    this.mode = "none";
  };

  private onContextRestored = (): void => {
    const gl = this.createGL();
    if (!gl) return;
    this.gl = gl;
    this.mode = "webgl";
    this.initGL();
    this.resize();
    this.ready = true;
    this.draw(0);
    if (!this.reduced) this.start();
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.options.pointer || event.pointerType === "touch") return;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.pointer.x = event.clientX - rect.left;
    this.pointer.y = event.clientY - rect.top;
    this.pointer.strength = 1;
    if (!this.running && !this.reduced && !this.paused && this.visible && this.onScreen) {
      this.start();
    }
  };

  private onPointerLeave = (): void => {
    this.pointer.strength = 0;
  };

  resize = (): void => {
    if (this.destroyed) return;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(
      this.options.maxDpr,
      Math.max(1, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1),
    );
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.cell = surfaceCell(this.options.cell, width);
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    if (this.ctx) this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.buildAtlas();
    this.buildMask();
    if (this.gl) {
      this.uploadAtlas();
      this.uploadMask();
    }
    if (this.ready && !this.running) this.draw(0);
  };

  private buildAtlas(): void {
    const chars = Array.from(this.options.glyphs);
    const tile = 64;
    const offscreen = document.createElement("canvas");
    offscreen.width = Math.max(1, chars.length * tile);
    offscreen.height = tile;
    const ctx = offscreen.getContext("2d");
    if (!ctx) {
      this.atlas = null;
      this.glyphCount = 1;
      return;
    }
    ctx.clearRect(0, 0, offscreen.width, offscreen.height);
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${Math.round(tile * 0.72)}px ${this.options.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    chars.forEach((char, index) => {
      ctx.fillText(char, index * tile + tile / 2, tile / 2);
    });
    this.atlas = offscreen;
    this.glyphCount = Math.max(1, chars.length);
  }

  private buildMask(): void {
    const offscreen = document.createElement("canvas");
    offscreen.width = this.width;
    offscreen.height = this.height;
    const ctx = offscreen.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      this.maskData = null;
      this.maskCanvas = null;
      return;
    }
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.width, this.height);
    const text = this.options.text.trim();
    if (text) {
      let size = this.height * 0.58;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      do {
        ctx.font = `700 ${size}px ${this.options.fontFamily}`;
        if (ctx.measureText(text).width <= this.width * 0.84) break;
        size *= 0.92;
      } while (size > 4);
      ctx.fillStyle = "#fff";
      ctx.fillText(text, this.width / 2, this.height * 0.5);
    }
    try {
      const data = ctx.getImageData(0, 0, this.width, this.height).data;
      this.maskData = data;
      this.maskCanvas = offscreen;
    } catch {
      this.maskData = null;
      this.maskCanvas = null;
    }
  }

  private brightness(x: number, y: number): number {
    if (!this.maskData) return 0;
    const px = clamp(Math.round(x), 0, this.width - 1);
    const py = clamp(Math.round(y), 0, this.height - 1);
    return (this.maskData[(py * this.width + px) * 4] ?? 0) / 255;
  }

  draw(time = 0): void {
    if (this.destroyed) return;
    if (this.mode === "webgl" && this.gl) this.drawWebGL(time);
    else if (this.mode === "2d" && this.ctx) this.draw2D(time);
  }

  private drawWebGL(time: number): void {
    const gl = this.gl;
    if (!gl || !this.program || !this.atlasTexture || !this.maskTexture) return;
    const { speed, scan, density, foreground, accent, pointer } = this.options;
    const variantIndex = VARIANT_INDEX[this.options.variant] ?? 0;
    const seconds = (time / 1000) * speed;
    const cellWidth = this.cell.width * this.dpr;
    const cellHeight = this.cell.height * this.dpr;
    const scanX =
      time === 0
        ? this.width * 0.18 * this.dpr
        : (((time * 0.055 * speed) % (this.width + 260)) - 130) * this.dpr;
    const pointerOn = pointer && this.pointer.strength > 0;
    const pointerX = pointerOn ? this.pointer.x * this.dpr : -1e4;
    const pointerY = pointerOn ? (this.height - this.pointer.y) * this.dpr : -1e4;
    const [fr, fg, fb, fa] = parseColor(foreground);
    const [ar, ag, ab, aa] = parseColor(accent);

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const bindProgram = gl.useProgram.bind(gl);
    bindProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    const position = gl.getAttribLocation(this.program, "a_position");
    if (position >= 0) {
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    }

    gl.uniform2f(this.uniforms.u_resolution, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.uniforms.u_cell, cellWidth, cellHeight);
    gl.uniform1f(this.uniforms.u_time, seconds);
    gl.uniform1f(this.uniforms.u_density, density);
    gl.uniform1f(this.uniforms.u_glyphCount, this.glyphCount);
    gl.uniform1f(this.uniforms.u_scan, scan ? 1 : 0);
    gl.uniform1f(this.uniforms.u_scanX, scanX);
    gl.uniform1f(this.uniforms.u_scanRadius, 68 * this.dpr);
    gl.uniform4f(this.uniforms.u_foreground, fr, fg, fb, fa);
    gl.uniform4f(this.uniforms.u_accent, ar, ag, ab, aa);
    gl.uniform2f(this.uniforms.u_pointer, pointerX, pointerY);
    gl.uniform1f(this.uniforms.u_pointerStrength, pointerOn ? 1 : 0);
    gl.uniform1f(this.uniforms.u_variant, variantIndex);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
    gl.uniform1i(this.uniforms.u_atlas, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
    gl.uniform1i(this.uniforms.u_mask, 1);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private draw2D(time: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const { background, foreground, accent, density, speed, scan, pointer, glyphs } = this.options;
    const chars = Array.from(glyphs);
    ctx.clearRect(0, 0, this.width, this.height);
    if (background !== "transparent") {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    const step = this.cell;
    const seconds = (time / 1000) * speed;
    const scanX =
      time === 0 ? this.width * 0.18 : ((time * 0.055 * speed) % (this.width + 260)) - 130;
    const pointerOn = pointer && this.pointer.strength > 0;
    ctx.font = `700 ${Math.max(6, step.height * 0.9)}px ${this.options.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let row = 0;
    for (let y = step.height / 2; y < this.height; y += step.height) {
      let column = 0;
      for (let x = step.width / 2; x < this.width; x += step.width) {
        const mask = this.brightness(x, y);
        const wave = 0.5 + 0.5 * Math.sin(x * 0.013 + y * 0.009 + seconds * 0.9);
        const speck = Math.sin(column * 127.1 + row * 311.7) * 43758.5453;
        const base = density * (0.5 + 0.8 * wave) * (speck - Math.floor(speck) < 0.55 ? 1 : 0);
        const pointerNear = pointerOn
          ? Math.max(0, 1 - Math.hypot(x - this.pointer.x, y - this.pointer.y) / 150)
          : 0;
        let level = Math.max(mask * (0.46 + 0.54 * wave), base);
        level = Math.min(1, level + pointerNear * 0.2);
        if (level >= 0.012) {
          const char = chars[glyphIndex(level, chars.length)] ?? chars[0];
          const nearScan = scan && Math.abs(x - scanX) < 68;
          const weight = mask > 0.08 || pointerNear > 0.1;
          ctx.globalAlpha = nearScan || weight ? 1 : 0.38;
          ctx.fillStyle = nearScan || pointerNear > 0.25 ? accent : foreground;
          ctx.fillText(char ?? "", x, y);
        }
        column += 1;
      }
      row += 1;
    }
    ctx.globalAlpha = 1;
  }

  start = (): void => {
    if (
      this.destroyed ||
      this.reduced ||
      this.paused ||
      this.running ||
      !this.visible ||
      !this.onScreen ||
      this.mode === "none"
    )
      return;
    this.running = true;
    this.last = 0;
    const tick = (now: number): void => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(tick);
      if (now - this.last < 1000 / 30) return;
      const delta = this.last ? Math.min(80, now - this.last) : 16;
      this.last = now;
      this.elapsed += delta;
      this.draw(this.elapsed);
    };
    this.raf = requestAnimationFrame(tick);
  };

  stop = (): void => {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  };

  /** Keep the current frame still. Resuming restarts the loop when visible. */
  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.stop();
    else if (this.visible && this.onScreen) this.start();
  }

  setOptions(options: AsciiSurfaceOptions): void {
    const next = { ...this.options };
    applyDefined(next, options);
    this.options = normalizeOptions(next);
    this.canvas.style.backgroundColor = this.options.background;
    this.resize();
    if (!this.running) this.draw(0);
  }

  destroy(): void {
    this.destroyed = true;
    this.stop();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    if (this.motionQuery && this.onMotionChange) {
      this.motionQuery.removeEventListener("change", this.onMotionChange);
    }
    if (this.onVisibilityChange) {
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
    }
    if (typeof window !== "undefined" && !this.resizeObserver) {
      window.removeEventListener("resize", this.resize);
    }
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onContextRestored);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);

    const gl = this.gl;
    if (gl) {
      if (this.atlasTexture) gl.deleteTexture(this.atlasTexture);
      if (this.maskTexture) gl.deleteTexture(this.maskTexture);
      if (this.buffer) gl.deleteBuffer(this.buffer);
      if (this.program) gl.deleteProgram(this.program);
    }
    this.gl = null;
    this.ctx = null;
    this.program = null;
    this.buffer = null;
    this.atlasTexture = null;
    this.maskTexture = null;
  }
}
