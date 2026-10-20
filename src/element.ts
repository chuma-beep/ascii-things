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

  private mount() {
    this.engine?.destroy();
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `
        <style>
          :host { display: block; position: relative; width: 100%; height: 100%; min-height: 240px; }
          canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; font-family: inherit; }
        </style>
        <canvas></canvas>
      `;
    }
    this.canvas ??= this.shadowRoot!.querySelector("canvas");
    if (!this.canvas) return;
    this.engine = this.createEngine(this.canvas);
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
    "calm",
    "interactive",
    "sharks",
    "shark-scale",
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
      columns: this.num("columns"),
      maxCells: this.num("max-cells"),
      maxDpr: this.num("max-dpr"),
      sharkScale: this.num("shark-scale"),
      calm: this.bool("calm", false),
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
      columns: this.num("columns"),
      maxCells: this.num("max-cells"),
      maxDpr: this.num("max-dpr"),
      calm: this.bool("calm", false),
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
    "calm",
    "interactive",
    "jellies",
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
      columns: this.num("columns"),
      maxCells: this.num("max-cells"),
      maxDpr: this.num("max-dpr"),
      calm: this.bool("calm", false),
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
      columns: this.num("columns"),
      maxCells: this.num("max-cells"),
      maxDpr: this.num("max-dpr"),
      calm: this.bool("calm", false),
      interactive: this.bool("interactive", true),
      palette: (this.getAttribute("palette") as AsciiDogOptions["palette"]) ?? undefined,
      label: this.getAttribute("label") ?? undefined,
    };
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
