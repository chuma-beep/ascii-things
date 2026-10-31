import { OceanEngine } from "./engine";
import type { AsciiSharksOptions } from "./options";
import type { SharkKind, SharkSpec } from "./world";
import { RobotEngine } from "./robots/engine";
import type { AsciiRobotsOptions } from "./robots/options";
import type { RobotKind, RobotSpec } from "./robots/world";
import { JellyfishEngine } from "./jellyfish/engine";
import type { AsciiJellyfishOptions } from "./jellyfish/options";
import type { JellyfishKind, JellyfishSpec } from "./jellyfish/world";
import { DogEngine } from "./dog/engine";
import type { AsciiDogOptions } from "./dog/options";
import type { DogSpec } from "./dog/world";
import { createStarlings } from "./starlings";
import { createFireflies } from "./fireflies";
import { createAnts } from "./ants";
import { createKoi } from "./koi";
import { createCity } from "./city";
import { createServers } from "./servers";
import { createLagoon } from "./lagoon";
import type { AsciiLagoonOptions, LagoonVariant } from "./lagoon/options";
import type { AmbientEngine } from "./ambient/engine";
import type { AmbientKind, AsciiAmbientOptions } from "./ambient/options";

const SHARK_KINDS: SharkKind[] = [
  "classic",
  "hammerhead",
  "zebra",
  "tiger",
  "greathammer",
  "mako",
  "thresher",
  "nurse",
];

const ROBOT_KINDS: RobotKind[] = ["scout", "hauler", "sentinel"];
const JELLY_KINDS: JellyfishKind[] = ["moon", "lion", "box", "atolla", "crystal"];

const Base: typeof HTMLElement =
  typeof HTMLElement !== "undefined" ? HTMLElement : (class {} as unknown as typeof HTMLElement);

interface SceneEngine {
  destroy(): void;
}

/**
 * Shared custom-element shell. Each scene only supplies its engine and
 * attribute parser; the shadow DOM, remount debounce, and cleanup live here.
 */
abstract class AsciiSceneElement extends Base {
  protected canvas: HTMLCanvasElement | null = null;
  private engine: SceneEngine | null = null;
  private mountQueued = false;
  private aspectApplied = false;

  connectedCallback() {
    this.mount();
  }

  disconnectedCallback() {
    this.engine?.destroy();
    this.engine = null;
  }

  attributeChangedCallback() {
    if (!this.isConnected || this.mountQueued) return;
    this.mountQueued = true;
    queueMicrotask(() => {
      this.mountQueued = false;
      if (this.isConnected) this.mount();
    });
  }

  protected abstract createEngine(canvas: HTMLCanvasElement): SceneEngine;

  protected num(name: string) {
    const raw = this.getAttribute(name);
    if (raw == null || raw === "") return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  }

  protected bool(name: string, fallback: boolean) {
    if (!this.hasAttribute(name)) return fallback;
    const raw = this.getAttribute(name);
    return raw !== "false" && raw !== "0";
  }

  protected glyphStyle(): "ascii" | "kanji" {
    return this.getAttribute("glyphs") === "kanji" ? "kanji" : "ascii";
  }

  private mount() {
    this.engine?.destroy();
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `
        <style>
          :host { display: block; position: relative; width: 100%; height: 100%; min-height: 240px; }
          canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; object-fit: cover; font-family: inherit; }
        </style>
        <canvas></canvas>
      `;
    }
    this.canvas ??= this.shadowRoot!.querySelector("canvas");
    if (!this.canvas) return;
    this.applyAspectRatio();
    this.engine = this.createEngine(this.canvas);
    this.dispatchEvent(
      new CustomEvent("ascii-ready", {
        detail: { scene: this.engine },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private applyAspectRatio() {
    const ratio = this.getAttribute("aspect-ratio");
    if (ratio) {
      this.style.aspectRatio = ratio;
      this.style.height = "auto";
      this.aspectApplied = true;
    } else if (this.aspectApplied) {
      this.style.removeProperty("aspect-ratio");
      this.style.removeProperty("height");
      this.aspectApplied = false;
    }
  }
}

/**
 * `<ascii-sharks palette="abyss" seed="42" interactive>`
 *
 * A zero-dependency custom element for HTML, Astro, Vue, Svelte, and plain
 * sites. Shadow DOM keeps the canvas styles local; the font is inherited.
 */
export class AsciiSharksElement extends AsciiSceneElement {
  static observedAttributes = [
    "palette",
    "seed",
    "density",
    "speed",
    "columns",
    "max-cells",
    "max-dpr",
    "adaptive-quality",
    "aspect-ratio",
    "paused",
    "font-family",
    "calm",
    "interactive",
    "sharks",
    "shark-scale",
    "orbit-scale",
    "fit-sharks",
    "glyphs",
    "label",
  ];

  protected createEngine(canvas: HTMLCanvasElement) {
    return new OceanEngine(canvas, this.readOptions());
  }

  private readOptions(): AsciiSharksOptions {
    const sharksAttr = this.getAttribute("sharks");
    const sharks: SharkSpec[] | undefined = sharksAttr
      ? sharksAttr
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
          .map((entry) => {
            const [kind, size] = entry.split(":");
            return {
              kind: SHARK_KINDS.includes(kind as SharkKind) ? (kind as SharkKind) : "classic",
              size: size ? Number(size) || 1 : 1,
            };
          })
      : undefined;

    return {
      sharks,
      seed: this.num("seed"),
      density: this.num("density"),
      speed: this.num("speed"),
      fontFamily: this.getAttribute("font-family") ?? undefined,
      columns: this.num("columns"),
      maxCells: this.num("max-cells"),
      maxDpr: this.num("max-dpr"),
      adaptiveQuality: this.bool("adaptive-quality", true),
      sharkScale: this.num("shark-scale"),
      orbitScale: this.num("orbit-scale"),
      fitSharks: this.bool("fit-sharks", false),
      glyphs: this.glyphStyle(),
      calm: this.bool("calm", false),
      paused: this.bool("paused", false),
      interactive: this.bool("interactive", true),
      palette: (this.getAttribute("palette") as AsciiSharksOptions["palette"]) ?? undefined,
      label: this.getAttribute("label") ?? undefined,
    };
  }
}

/**
 * `<ascii-robots palette="abyss" count="7" seed="42" interactive>`
 *
 * A fleet of tracked robots patrolling a factory floor. Click to dispatch the
 * nearest idle robot to that point.
 */
export class AsciiRobotsElement extends AsciiSceneElement {
  static observedAttributes = [
    "palette",
    "seed",
    "count",
    "scale",
    "speed",
    "columns",
    "max-cells",
    "max-dpr",
    "adaptive-quality",
    "aspect-ratio",
    "paused",
    "font-family",
    "calm",
    "interactive",
    "robots",
    "label",
  ];

  protected createEngine(canvas: HTMLCanvasElement) {
    return new RobotEngine(canvas, this.readOptions());
  }

  private readOptions(): AsciiRobotsOptions {
    const robotsAttr = this.getAttribute("robots");
    const robots: RobotSpec[] | undefined = robotsAttr
      ? robotsAttr
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
          .map((entry) => {
            const [kind, size] = entry.split(":");
            return {
              kind: ROBOT_KINDS.includes(kind as RobotKind) ? (kind as RobotKind) : "scout",
              size: size ? Number(size) || 1 : 1,
            };
          })
      : undefined;

    return {
      robots,
      count: this.num("count"),
      seed: this.num("seed"),
      scale: this.num("scale"),
      speed: this.num("speed"),
      fontFamily: this.getAttribute("font-family") ?? undefined,
      columns: this.num("columns"),
      maxCells: this.num("max-cells"),
      maxDpr: this.num("max-dpr"),
      adaptiveQuality: this.bool("adaptive-quality", true),
      calm: this.bool("calm", false),
      paused: this.bool("paused", false),
      interactive: this.bool("interactive", true),
      palette: (this.getAttribute("palette") as AsciiRobotsOptions["palette"]) ?? undefined,
      label: this.getAttribute("label") ?? undefined,
    };
  }
}

/**
 * `<ascii-jellyfish palette="abyss" count="7" seed="42" interactive>`
 *
 * A drifting bloom of pulsing jellyfish. Move the pointer to push the water;
 * click to send a shockwave through the bloom.
 */
export class AsciiJellyfishElement extends AsciiSceneElement {
  static observedAttributes = [
    "palette",
    "seed",
    "count",
    "scale",
    "speed",
    "columns",
    "max-cells",
    "max-dpr",
    "adaptive-quality",
    "aspect-ratio",
    "paused",
    "font-family",
    "calm",
    "interactive",
    "jellies",
    "glyphs",
    "label",
  ];

  protected createEngine(canvas: HTMLCanvasElement) {
    return new JellyfishEngine(canvas, this.readOptions());
  }

  private readOptions(): AsciiJellyfishOptions {
    const jelliesAttr = this.getAttribute("jellies");
    const jellies: JellyfishSpec[] | undefined = jelliesAttr
      ? jelliesAttr
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
          .map((entry) => {
            const [kind, size] = entry.split(":");
            return {
              kind: JELLY_KINDS.includes(kind as JellyfishKind) ? (kind as JellyfishKind) : "moon",
              size: size ? Number(size) || 1 : 1,
            };
          })
      : undefined;

    return {
      jellies,
      count: this.num("count"),
      seed: this.num("seed"),
      scale: this.num("scale"),
      speed: this.num("speed"),
      fontFamily: this.getAttribute("font-family") ?? undefined,
      columns: this.num("columns"),
      maxCells: this.num("max-cells"),
      maxDpr: this.num("max-dpr"),
      adaptiveQuality: this.bool("adaptive-quality", true),
      glyphs: this.glyphStyle(),
      calm: this.bool("calm", false),
      paused: this.bool("paused", false),
      interactive: this.bool("interactive", true),
      palette: (this.getAttribute("palette") as AsciiJellyfishOptions["palette"]) ?? undefined,
      label: this.getAttribute("label") ?? undefined,
    };
  }
}

/**
 * `<ascii-dog palette="abyss" count="1" seed="42" interactive>`
 *
 * A robot dog patrolling a test yard. Click to throw the ball.
 */
export class AsciiDogElement extends AsciiSceneElement {
  static observedAttributes = [
    "palette",
    "seed",
    "count",
    "scale",
    "speed",
    "columns",
    "max-cells",
    "max-dpr",
    "adaptive-quality",
    "aspect-ratio",
    "paused",
    "font-family",
    "calm",
    "interactive",
    "dogs",
    "spread",
    "label",
  ];

  protected createEngine(canvas: HTMLCanvasElement) {
    return new DogEngine(canvas, this.readOptions());
  }

  private readOptions(): AsciiDogOptions {
    const dogsAttr = this.getAttribute("dogs");
    const dogs: DogSpec[] | undefined = dogsAttr
      ? dogsAttr
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
          .map((entry) => {
            const [a, b] = entry.split(":");
            const size = b !== undefined ? Number(b) : Number(a);
            return { size: Number.isFinite(size) && size > 0 ? size : 1 };
          })
      : undefined;

    const spreadAttr = this.getAttribute("spread");
    const spreadValues = spreadAttr?.split(",").map((part) => Number(part.trim()));
    const spread =
      spreadValues?.length === 2 && spreadValues.every((value) => Number.isFinite(value))
        ? ([spreadValues[0], spreadValues[1]] as [number, number])
        : undefined;

    return {
      dogs,
      count: this.num("count"),
      seed: this.num("seed"),
      scale: this.num("scale"),
      spread,
      speed: this.num("speed"),
      fontFamily: this.getAttribute("font-family") ?? undefined,
      columns: this.num("columns"),
      maxCells: this.num("max-cells"),
      maxDpr: this.num("max-dpr"),
      adaptiveQuality: this.bool("adaptive-quality", true),
      calm: this.bool("calm", false),
      paused: this.bool("paused", false),
      interactive: this.bool("interactive", true),
      palette: (this.getAttribute("palette") as AsciiDogOptions["palette"]) ?? undefined,
      label: this.getAttribute("label") ?? undefined,
    };
  }
}

const AMBIENT_ATTRIBUTES = [
  "palette",
  "seed",
  "count",
  "scale",
  "speed",
  "columns",
  "max-cells",
  "max-dpr",
  "adaptive-quality",
  "aspect-ratio",
  "paused",
  "font-family",
  "calm",
  "interactive",
  "glyphs",
  "label",
];

abstract class AsciiAmbientElement extends AsciiSceneElement {
  static observedAttributes = AMBIENT_ATTRIBUTES;

  protected abstract readonly kind: AmbientKind;
  protected abstract create(canvas: HTMLCanvasElement, options: AsciiAmbientOptions): AmbientEngine;

  protected createEngine(canvas: HTMLCanvasElement) {
    return this.create(canvas, this.readOptions());
  }

  private readOptions(): AsciiAmbientOptions {
    return {
      count: this.num("count"),
      seed: this.num("seed"),
      scale: this.num("scale"),
      speed: this.num("speed"),
      fontFamily: this.getAttribute("font-family") ?? undefined,
      columns: this.num("columns"),
      maxCells: this.num("max-cells"),
      maxDpr: this.num("max-dpr"),
      adaptiveQuality: this.bool("adaptive-quality", true),
      glyphs: this.glyphStyle(),
      calm: this.bool("calm", false),
      paused: this.bool("paused", false),
      interactive: this.bool("interactive", true),
      palette: (this.getAttribute("palette") as AsciiAmbientOptions["palette"]) ?? undefined,
      label: this.getAttribute("label") ?? undefined,
    };
  }
}

export class AsciiStarlingsElement extends AsciiAmbientElement {
  protected readonly kind = "starlings" as const;
  protected create = createStarlings;
}

export class AsciiFirefliesElement extends AsciiAmbientElement {
  protected readonly kind = "fireflies" as const;
  protected create = createFireflies;
}

export class AsciiAntsElement extends AsciiAmbientElement {
  protected readonly kind = "ants" as const;
  protected create = createAnts;
}

export class AsciiKoiElement extends AsciiAmbientElement {
  protected readonly kind = "koi" as const;
  protected create = createKoi;
}

export class AsciiCityElement extends AsciiAmbientElement {
  protected readonly kind = "city" as const;
  protected create = createCity;
}

export class AsciiServersElement extends AsciiAmbientElement {
  protected readonly kind = "servers" as const;
  protected create = createServers;
}

/** `<ascii-lagoon variant="turtle" …>` */
export class AsciiLagoonElement extends AsciiSceneElement {
  static observedAttributes = [
    "variant",
    "palette",
    "seed",
    "speed",
    "max-dpr",
    "aspect-ratio",
    "paused",
    "font-family",
    "calm",
    "interactive",
    "label",
  ];

  protected createEngine(canvas: HTMLCanvasElement) {
    return createLagoon(canvas, this.readOptions());
  }

  /** Fixed variant for the named <ascii-lagoon-*> aliases. */
  protected get variantOverride(): LagoonVariant | undefined {
    return undefined;
  }

  private readOptions(): AsciiLagoonOptions {
    return {
      variant:
        this.variantOverride ??
        (this.getAttribute("variant") as AsciiLagoonOptions["variant"]) ??
        undefined,
      seed: this.num("seed"),
      speed: this.num("speed"),
      fontFamily: this.getAttribute("font-family") ?? undefined,
      maxDpr: this.num("max-dpr"),
      calm: this.bool("calm", false),
      paused: this.bool("paused", false),
      interactive: this.bool("interactive", true),
      palette: (this.getAttribute("palette") as AsciiLagoonOptions["palette"]) ?? undefined,
      label: this.getAttribute("label") ?? undefined,
    };
  }
}

/** `<ascii-lagoon-day>` — day lagoon alias. */
export class AsciiLagoonDayElement extends AsciiLagoonElement {
  protected get variantOverride(): LagoonVariant {
    return "reef";
  }
}

/** `<ascii-lagoon-night>` — night reef alias. */
export class AsciiLagoonNightElement extends AsciiLagoonElement {
  protected get variantOverride(): LagoonVariant {
    return "night";
  }
}

/** `<ascii-lagoon-turtle>` — turtle close-up alias. */
export class AsciiLagoonTurtleElement extends AsciiLagoonElement {
  protected get variantOverride(): LagoonVariant {
    return "turtle";
  }
}

/** `<ascii-lagoon-manta>` — manta flyby alias. */
export class AsciiLagoonMantaElement extends AsciiLagoonElement {
  protected get variantOverride(): LagoonVariant {
    return "manta";
  }
}

/** `<ascii-lagoon-seahorse>` — seahorse alias. */
export class AsciiLagoonSeahorseElement extends AsciiLagoonElement {
  protected get variantOverride(): LagoonVariant {
    return "seahorse";
  }
}

/** `<ascii-lagoon-dolphin>` — dolphin pod alias. */
export class AsciiLagoonDolphinElement extends AsciiLagoonElement {
  protected get variantOverride(): LagoonVariant {
    return "dolphin";
  }
}

/** `<ascii-lagoon-hammerhead>` — hammerhead pass alias. */
export class AsciiLagoonHammerheadElement extends AsciiLagoonElement {
  protected get variantOverride(): LagoonVariant {
    return "hammerhead";
  }
}

/** `<ascii-lagoon-tang>` — tang school alias. */
export class AsciiLagoonTangElement extends AsciiLagoonElement {
  protected get variantOverride(): LagoonVariant {
    return "tang";
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ascii-sharks")) {
  customElements.define("ascii-sharks", AsciiSharksElement);
}
if (typeof customElements !== "undefined" && !customElements.get("ascii-robots")) {
  customElements.define("ascii-robots", AsciiRobotsElement);
}
if (typeof customElements !== "undefined" && !customElements.get("ascii-jellyfish")) {
  customElements.define("ascii-jellyfish", AsciiJellyfishElement);
}
if (typeof customElements !== "undefined" && !customElements.get("ascii-dog")) {
  customElements.define("ascii-dog", AsciiDogElement);
}
if (typeof customElements !== "undefined" && !customElements.get("ascii-starlings")) {
  customElements.define("ascii-starlings", AsciiStarlingsElement);
}
if (typeof customElements !== "undefined" && !customElements.get("ascii-fireflies")) {
  customElements.define("ascii-fireflies", AsciiFirefliesElement);
}
if (typeof customElements !== "undefined" && !customElements.get("ascii-ants")) {
  customElements.define("ascii-ants", AsciiAntsElement);
}
if (typeof customElements !== "undefined" && !customElements.get("ascii-koi")) {
  customElements.define("ascii-koi", AsciiKoiElement);
}
if (typeof customElements !== "undefined" && !customElements.get("ascii-city")) {
  customElements.define("ascii-city", AsciiCityElement);
}
if (typeof customElements !== "undefined" && !customElements.get("ascii-servers")) {
  customElements.define("ascii-servers", AsciiServersElement);
}
if (typeof customElements !== "undefined" && !customElements.get("ascii-lagoon")) {
  customElements.define("ascii-lagoon", AsciiLagoonElement);
}
if (typeof customElements !== "undefined") {
  for (const [tag, element] of [
    ["ascii-lagoon-day", AsciiLagoonDayElement],
    ["ascii-lagoon-night", AsciiLagoonNightElement],
    ["ascii-lagoon-turtle", AsciiLagoonTurtleElement],
    ["ascii-lagoon-manta", AsciiLagoonMantaElement],
    ["ascii-lagoon-seahorse", AsciiLagoonSeahorseElement],
    ["ascii-lagoon-dolphin", AsciiLagoonDolphinElement],
    ["ascii-lagoon-hammerhead", AsciiLagoonHammerheadElement],
    ["ascii-lagoon-tang", AsciiLagoonTangElement],
  ] as const) {
    if (!customElements.get(tag)) customElements.define(tag, element);
  }
}
