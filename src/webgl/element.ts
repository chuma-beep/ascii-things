import { AsciiSurfaceEngine, type AsciiSurfaceOptions, type SurfaceVariant } from "./core";

const Base =
  typeof HTMLElement !== "undefined" ? HTMLElement : (class {} as unknown as typeof HTMLElement);

function numberAttr(element: HTMLElement, name: string): number | undefined {
  const raw = element.getAttribute(name);
  if (raw === null || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function booleanAttr(element: HTMLElement, name: string, fallback: boolean): boolean {
  const raw = element.getAttribute(name);
  if (raw === null) return fallback;
  return raw !== "false" && raw !== "0";
}

function optionsFrom(element: HTMLElement): AsciiSurfaceOptions {
  return {
    text: element.getAttribute("text") ?? "ASCII-THINGS",
    glyphs: element.getAttribute("glyphs") ?? undefined,
    cell: numberAttr(element, "cell"),
    density: numberAttr(element, "density"),
    speed: numberAttr(element, "speed"),
    scan: booleanAttr(element, "scan", true),
    pointer: booleanAttr(element, "pointer", true),
    foreground: element.getAttribute("foreground") ?? undefined,
    accent: element.getAttribute("accent") ?? undefined,
    background: element.getAttribute("background") ?? undefined,
    fontFamily: element.getAttribute("font-family") ?? undefined,
    maxDpr: numberAttr(element, "max-dpr"),
    variant: (element.getAttribute("variant") as SurfaceVariant | null) ?? undefined,
  };
}

/**
 * `<ascii-surface text="ASCII-THINGS"></ascii-surface>`
 *
 * The host owns the frame height. The canvas fills it.
 */
export class AsciiSurfaceElement extends Base {
  static observedAttributes = [
    "text",
    "glyphs",
    "cell",
    "density",
    "speed",
    "scan",
    "pointer",
    "foreground",
    "accent",
    "background",
    "font-family",
    "max-dpr",
    "variant",
    "label",
    "paused",
  ];

  private engine: AsciiSurfaceEngine | null = null;
  private canvas: HTMLCanvasElement | null = null;

  connectedCallback(): void {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      const canvas = document.createElement("canvas");
      canvas.setAttribute("part", "canvas");
      canvas.style.cssText = "display:block;width:100%;height:100%";
      const style = document.createElement("style");
      style.textContent = ":host{display:block;height:320px}canvas{display:block}";
      root.append(style, canvas);
      this.canvas = canvas;
    }
    this.updateLabel();
    this.attach();
  }

  disconnectedCallback(): void {
    this.engine?.destroy();
    this.engine = null;
  }

  attributeChangedCallback(): void {
    if (!this.canvas) return;
    this.updateLabel();
    this.engine?.setOptions(optionsFrom(this));
    this.engine?.setPaused(this.hasAttribute("paused"));
    if (this.engine) this.dataset.renderer = this.engine.renderer;
  }

  private updateLabel(): void {
    const label = this.getAttribute("label") ?? this.getAttribute("text") ?? "ASCII surface";
    this.setAttribute("role", "img");
    this.setAttribute("aria-label", label);
  }

  private attach(): void {
    if (!this.canvas || this.engine) return;
    this.engine = new AsciiSurfaceEngine(this.canvas, optionsFrom(this));
    this.dataset.renderer = this.engine.renderer;
    this.engine.setPaused(this.hasAttribute("paused"));
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ascii-surface")) {
  customElements.define("ascii-surface", AsciiSurfaceElement);
}
