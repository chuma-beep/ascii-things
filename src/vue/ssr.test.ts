import { h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";
import { AsciiDither } from "./dither";
import { AsciiImage } from "./image";
import { AsciiDog } from "./index";
import { AsciiSurface } from "./webgl";

describe("Vue server rendering", () => {
  it("renders a scene wrapper without a DOM", async () => {
    const html = await renderToString(
      h(AsciiDog, { seed: 7, label: "A live ASCII robot dog test yard", aspectRatio: "4 / 3" }),
    );

    expect(html).toContain("<canvas");
    expect(html).toContain('class="ascii-things ascii-dog"');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="A live ASCII robot dog test yard"');
    expect(html).toContain("aspect-ratio:4 / 3");
  });

  it("renders the WebGL surface adapter without a DOM", async () => {
    const html = await renderToString(
      h(AsciiSurface, { text: "ASCII-THINGS", label: "A living ASCII field" }),
    );

    expect(html).toContain("<canvas");
    expect(html).toContain('class="ascii-things ascii-surface"');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="A living ASCII field"');
    expect(html).toContain("height:320px");
  });

  it("renders the dither and image adapters without a DOM", async () => {
    const dither = await renderToString(
      h(AsciiDither, { text: "ASCII-THINGS", label: "A dither field" }),
    );
    const image = await renderToString(h(AsciiImage, { src: "/portrait.png", alt: "Portrait" }));

    expect(dither).toContain("<canvas");
    expect(dither).toContain("ascii-dither");
    expect(dither).toContain('aria-label="A dither field"');
    expect(dither).toContain("height:240px");
    expect(image).toContain("<canvas");
    expect(image).toContain("ascii-image");
    expect(image).toContain('aria-label="Portrait"');
  });
});
