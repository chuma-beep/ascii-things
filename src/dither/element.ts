import { DitherField, type DitherFieldOptions, type DitherMatrixName } from "./core";

const MATRICES: DitherMatrixName[] = ["bayer2", "bayer4", "bayer8", "none"];

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

function optionsFrom(element: HTMLElement): DitherFieldOptions {
  const matrix = element.getAttribute("matrix") as DitherMatrixName | null;
  return {
    text: element.getAttribute("text") ?? "ASCII-THINGS",
    matrix: matrix && MATRICES.includes(matrix) ? matrix : undefined,
    cell: numberAttr(element, "cell"),
    density: numberAttr(element, "density"),
    wordDensity: numberAttr(element, "word-density"),
    scan: booleanAttr(element, "scan", true),
    speed: numberAttr(element, "speed"),
    foreground: element.getAttribute("foreground") ?? undefined,
    accent: element.getAttribute("accent") ?? undefined,
    background: element.getAttribute("background") ?? undefined,
    fontFamily: element.getAttribute("font-family") ?? undefined,
  };
}

/**
 * `<ascii-dither text="ASCII-THINGS"></ascii-dither>`
 *
 * The host owns the frame height. The canvas fills it.
 */
export class AsciiDitherElement extends HTMLElement {
  static observedAttributes = [
    "text",
    "matrix",
    "cell",
    "density",
    "word-density",
    "scan",
    "speed",
    "foreground",
    "accent",
    "background",
    "font-family",
    "label",
    "paused",
  ];

  private field: DitherField | null = null;
  private canvas: HTMLCanvasElement | null = null;

  connectedCallback(): void {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      const canvas = document.createElement("canvas");
      canvas.setAttribute("part", "canvas");
      canvas.style.cssText = "display:block;width:100%;height:100%";
      const style = document.createElement("style");
      style.textContent = ":host{display:block;height:240px}canvas{display:block}";
      root.append(style, canvas);
      this.canvas = canvas;
    }
    this.updateLabel();
    this.attach();
  }

  disconnectedCallback(): void {
    this.field?.destroy();
    this.field = null;
  }

  attributeChangedCallback(): void {
    if (!this.canvas) return;
    this.updateLabel();
    if (this.field) this.field.setOptions(optionsFrom(this));
    this.field?.setPaused(this.hasAttribute("paused"));
  }

  private updateLabel(): void {
    const label = this.getAttribute("label") ?? this.getAttribute("text") ?? "Dither field";
    this.setAttribute("role", "img");
    this.setAttribute("aria-label", label);
  }

  private attach(): void {
    if (!this.canvas || this.field) return;
    this.field = new DitherField(this.canvas, optionsFrom(this));
    this.field.setPaused(this.hasAttribute("paused"));
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ascii-dither")) {
  customElements.define("ascii-dither", AsciiDitherElement);
}
