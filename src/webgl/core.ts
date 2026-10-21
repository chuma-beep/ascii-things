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

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 grid = floor(frag / u_cell);
  vec2 local = fract(frag / u_cell);
  vec2 cellUv = (grid + 0.5) * u_cell / u_resolution;

  float mask = texture2D(u_mask, cellUv).r;
  float wave = 0.5 + 0.5 * sin(cellUv.x * 13.0 + cellUv.y * 9.0 + u_time * 0.9);
  float speck = step(hash(grid), 0.55);
  float base = u_density * (0.5 + 0.8 * wave) * speck;
  float pointer = 1.0 - smoothstep(0.0, 150.0, distance(frag, u_pointer));
  pointer *= u_pointerStrength;

  float word = mask * (0.46 + 0.54 * wave);
  float level = max(word, base);
  level = min(1.0, level + pointer * 0.2);
  if (level < 0.012) discard;

  float index = floor(clamp(level, 0.0, 0.999) * u_glyphCount);
  index = min(index, u_glyphCount - 1.0);
  float localX = clamp(local.x, 0.015, 0.985);
  vec2 glyphUv = vec2((index + localX) / u_glyphCount, local.y);
  float glyph = texture2D(u_atlas, glyphUv).a;
  if (glyph < 0.04) discard;

  float scan = u_scan * (1.0 - smoothstep(0.0, u_scanRadius, abs(frag.x - u_scanX)));
  float weight = step(0.08, mask);
  float alpha = glyph * mix(0.38, 1.0, max(weight, pointer * 0.75));
  alpha *= mix(u_foreground.a, u_accent.a, max(scan, pointer * 0.55));
  vec3 color = mix(u_foreground.rgb, u_accent.rgb, max(scan, pointer * 0.55));
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
