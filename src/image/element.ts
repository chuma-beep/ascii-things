import {
  renderAsciiImage,
  type AsciiImageCharset,
  type AsciiImageDither,
  type AsciiImageOptions,
  type AsciiImageResult,
} from "./core";

const Base =
  typeof HTMLElement !== "undefined" ? HTMLElement : (class {} as unknown as typeof HTMLElement);

const STYLE = `
  :host { display: block; width: 100%; }
  canvas { display: block; width: 100%; height: auto; background: #070809; }
`;

export class AsciiImageElement extends Base {
  static observedAttributes = [
    "src",
    "columns",
    "charset",
    "invert",
    "dither",
    "contrast",
    "brightness",
    "gamma",
    "color",
    "foreground",
    "background",
    "font-family",
    "label",
  ];

  private canvas: HTMLCanvasElement | null = null;
  private token = 0;
  private scheduled = false;

  connectedCallback() {
    this.mount();
    this.schedule();
  }

  disconnectedCallback() {
    this.token += 1;
  }

  attributeChangedCallback() {
    this.schedule();
  }

  private mount() {
    if (!this.shadowRoot) {
      const shadow = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = STYLE;
      const canvas = document.createElement("canvas");
      canvas.setAttribute("part", "canvas");
      shadow.append(style, canvas);
      this.canvas = canvas;
    } else {
      this.canvas = this.shadowRoot.querySelector("canvas");
    }
  }

  private schedule() {
    if (!this.isConnected || this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      void this.render();
    });
  }

  private readOptions(): AsciiImageOptions {
    const number = (name: string) => {
      const value = this.getAttribute(name);
      return value === null ? undefined : Number(value);
    };
    const bool = (name: string, fallback = false) => {
      const value = this.getAttribute(name);
      if (value === null) return fallback;
      return value !== "false";
    };
    return {
      columns: number("columns"),
      charset: (this.getAttribute("charset") as AsciiImageCharset | null) ?? undefined,
      invert: bool("invert"),
      dither: (this.getAttribute("dither") as AsciiImageDither | null) ?? undefined,
      contrast: number("contrast"),
      brightness: number("brightness"),
      gamma: number("gamma"),
      color: bool("color"),
      foreground: this.getAttribute("foreground") ?? undefined,
      background: this.getAttribute("background") ?? undefined,
      fontFamily: this.getAttribute("font-family") ?? undefined,
    };
  }

  private async render() {
    const canvas = this.canvas ?? this.shadowRoot?.querySelector("canvas");
    const src = this.getAttribute("src");
    if (!canvas || !src) return;
    const token = ++this.token;
    canvas.setAttribute("aria-label", this.getAttribute("label") ?? "ASCII art");
    canvas.setAttribute("role", "img");
    try {
      const result = await renderAsciiImage(canvas, src, this.readOptions());
      if (token !== this.token) return;
      this.dispatchEvent(
        new CustomEvent<{ result: AsciiImageResult }>("ascii-ready", {
          detail: { result },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error) {
      if (token !== this.token) return;
      this.dispatchEvent(
        new CustomEvent<{ error: unknown }>("ascii-error", {
          detail: { error },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ascii-image")) {
  customElements.define("ascii-image", AsciiImageElement);
}
