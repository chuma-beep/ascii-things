import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AsciiDither } from "./dither/react";
import { AsciiImage } from "./image/react";
import { AsciiDog } from "./react";
import { AsciiPrompt, AsciiReadout, AsciiSceneTabs, AsciiStage } from "./ui";
import { AsciiSurface } from "./webgl/react";

describe("server rendering", () => {
  it("renders the React scene adapter without a DOM", () => {
    const html = renderToStaticMarkup(
      <AsciiDog seed={7} label="A live ASCII robot dog test yard" aspectRatio="4 / 3" />,
    );

    expect(html).toContain("<canvas");
    expect(html).toContain('class="ascii-things ascii-dog"');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="A live ASCII robot dog test yard"');
    expect(html).toContain("aspect-ratio:4 / 3");
  });

  it("renders the UI composition primitives without a DOM", () => {
    const html = renderToStaticMarkup(
      <AsciiStage label="TEST YARD" status="LIVE" footer={<span>FOOTER</span>}>
        <div>SCENE</div>
      </AsciiStage>,
    );

    expect(html).toContain("ascii-stage");
    expect(html).toContain("TEST YARD");
    expect(html).toContain("LIVE");
    expect(html).toContain("SCENE");
    expect(html).toContain("FOOTER");
  });

  it("renders prompt, readout, and tabs as static HTML", () => {
    const prompt = renderToStaticMarkup(
      <AsciiPrompt
        label="Command"
        placeholder="Throw the ball"
        status="READY"
        onSubmit={() => undefined}
      />,
    );
    const readout = renderToStaticMarkup(
      <AsciiReadout
        items={[
          { label: "CELLS", value: "1,024" },
          { label: "UNITS", value: "01" },
        ]}
      />,
    );
    const tabs = renderToStaticMarkup(
      <AsciiSceneTabs
        scenes={[
          { id: "sharks", label: "Sharks" },
          { id: "dog", label: "Dog" },
        ]}
        value="dog"
        onChange={() => {}}
      />,
    );

    expect(prompt).toContain("ascii-prompt");
    expect(prompt).toContain("Throw the ball");
    expect(prompt).toContain("READY");
    expect(readout).toContain("ascii-readout");
    expect(readout).toContain("CELLS");
    expect(readout).toContain("1,024");
    expect(tabs).toContain("ascii-tabs");
    expect(tabs).toContain("Sharks");
    expect(tabs).toContain("Dog");
  });

  it("renders the WebGL surface adapter without a DOM", () => {
    const html = renderToStaticMarkup(
      <AsciiSurface text="ASCII-THINGS" label="A living ASCII field" />,
    );

    expect(html).toContain("<canvas");
    expect(html).toContain('class="ascii-things ascii-surface"');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="A living ASCII field"');
    expect(html).toContain("height:320px");
  });

  it("renders the dither and image adapters without a DOM", () => {
    const dither = renderToStaticMarkup(<AsciiDither text="ASCII-THINGS" label="A dither field" />);
    const image = renderToStaticMarkup(<AsciiImage src="/portrait.png" alt="Portrait" />);

    expect(dither).toContain("<canvas");
    expect(dither).toContain("ascii-dither");
    expect(dither).toContain('aria-label="A dither field"');
    expect(dither).toContain("height:240px");
    expect(image).toContain("<canvas");
    expect(image).toContain("ascii-image");
    expect(image).toContain('aria-label="Portrait"');
  });
});
