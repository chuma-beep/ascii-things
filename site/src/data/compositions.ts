export type CompositionSurfaceId = "paper" | "abyss" | "immersive";

export interface CompositionScene {
  id: string;
  name: string;
  tag: string;
  image: string;
  doc: string;
  note: string;
  attributes: Record<string, string>;
  /** Render one live element and mirror it into the other surfaces. */
  shared?: boolean;
}

export interface CompositionSurface {
  id: CompositionSurfaceId;
  name: string;
  kicker: string;
  title: string;
  body: string;
  meta: string;
  palette: "paper" | "abyss";
  accent: string;
  prompt: string;
}

export const COMPOSITION_SCENES: CompositionScene[] = [
  {
    id: "koi",
    name: "Koi pond",
    tag: "ascii-koi",
    image: "koi",
    doc: "/scenes/koi/",
    note: "Slow water, four fish, one held breath.",
    attributes: {
      seed: "4",
      count: "4",
      columns: "72",
      "max-cells": "4600",
      calm: "",
      interactive: "false",
    },
  },
  {
    id: "dog",
    name: "Robot dog",
    tag: "ascii-dog",
    image: "dog",
    doc: "/scenes/dog/",
    note: "A good boy at the edge of the interface.",
    attributes: {
      seed: "7",
      count: "1",
      dogs: "1.35",
      spread: "0.68,0.68",
      columns: "72",
      "max-cells": "5200",
      calm: "",
      interactive: "false",
    },
  },
  {
    id: "starlings",
    name: "Starlings",
    tag: "ascii-starlings",
    image: "starlings",
    doc: "/scenes/starlings/",
    note: "A murmuration that behaves like weather.",
    attributes: {
      seed: "5",
      count: "220",
      columns: "72",
      "max-cells": "5200",
      calm: "",
      interactive: "false",
    },
  },
  {
    id: "city",
    name: "City grid",
    tag: "ascii-city",
    image: "city",
    doc: "/scenes/city/",
    note: "Traffic, windows, and the late shift.",
    attributes: {
      seed: "9",
      count: "42",
      columns: "72",
      "max-cells": "5200",
      calm: "",
      interactive: "false",
    },
  },
  {
    id: "sharks",
    name: "Shark tank",
    tag: "ascii-sharks",
    image: "sharks",
    doc: "/scenes/sharks/",
    note: "A room with a current running through it.",
    attributes: {
      seed: "11",
      density: "1.15",
      columns: "72",
      "max-cells": "5200",
      calm: "",
      interactive: "false",
    },
  },
  {
    id: "jellyfish",
    name: "Jellyfish bloom",
    tag: "ascii-jellyfish",
    image: "jellyfish",
    doc: "/scenes/jellyfish/",
    note: "Suspended motion for a quieter surface.",
    attributes: {
      seed: "3",
      count: "3",
      columns: "72",
      "max-cells": "5200",
      calm: "",
      interactive: "false",
    },
  },
  {
    id: "lagoon",
    name: "Day lagoon",
    tag: "ascii-lagoon-day",
    image: "lagoon",
    doc: "/scenes/lagoon/",
    note: "The sunlit day lagoon, full-canvas and calm.",
    attributes: {
      interactive: "false",
    },
    shared: true,
  },
];

export const COMPOSITION_SURFACES: CompositionSurface[] = [
  {
    id: "paper",
    name: "Paper",
    kicker: "FIELD NOTE / 01",
    title: "A quieter interface.",
    body: "One scene, one idea, a little air. The canvas is the illustration.",
    meta: "PAPER / LIVE",
    palette: "paper",
    accent: "#b84a12",
    prompt:
      "Use the existing cream editorial language: paper background, dark mono type, hairline borders, one rust-orange accent. Keep the scene contained in a framed field; do not fill the whole page.",
  },
  {
    id: "abyss",
    name: "Abyss",
    kicker: "PRODUCT / 02",
    title: "Make it move.",
    body: "The canvas carries the surface. Type stays quiet in front of it.",
    meta: "ABYSS / LIVE",
    palette: "abyss",
    accent: "#ff7a1a",
    prompt:
      "Use the existing dark product language: abyss background, warm off-white type, one orange accent, mono UI labels, and a live scene as the hero. Keep the interface secondary to the motion.",
  },
  {
    id: "immersive",
    name: "Immersive",
    kicker: "LAGOON / 03",
    title: "Let it fill the room.",
    body: "Full-bleed scene, minimal shell, one clear exit.",
    meta: "IMMERSIVE / LIVE",
    palette: "abyss",
    accent: "#ffb36b",
    prompt:
      "Use the existing immersive Lagoon language: full-bleed scene, deep teal field, soft glass labels, minimal overlay copy, and a clear exit back to Compositions. Keep the scene dominant; do not add a separate visual system.",
  },
];

export const DEFAULT_COMPOSITION_SCENE = "dog";

export const findCompositionScene = (id: string) =>
  COMPOSITION_SCENES.find((scene) => scene.id === id) ?? COMPOSITION_SCENES[0];

export const findCompositionSurface = (id: string) =>
  COMPOSITION_SURFACES.find((surface) => surface.id === id) ?? COMPOSITION_SURFACES[0];

const escapeAttribute = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

export const compositionAttributes = (scene: CompositionScene, surface: CompositionSurface) => ({
  ...scene.attributes,
  palette: surface.palette,
  label: `${scene.name} in a ${surface.name.toLowerCase()} composition`,
});

const attrsToMarkup = (attributes: Record<string, string>) =>
  Object.entries(attributes)
    .map(([name, value]) => (value === "" ? name : `${name}="${escapeAttribute(value)}"`))
    .join(" ");

export const compositionPrompt = (scene: CompositionScene, surface: CompositionSurface) => {
  const attributes = attrsToMarkup(compositionAttributes(scene, surface));
  const article = /^[aeiou]/i.test(surface.name) ? "an" : "a";

  return `Design ${article} ${surface.name.toLowerCase()} composition for ascii-things.

${surface.prompt}

Scene: ${scene.name} — ${scene.note}
Use this exact element:

<${scene.tag} ${attributes}></${scene.tag}>

Requirements:
- Reuse the existing ascii-things style and palette; do not invent a new design system.
- Keep the scene interactive unless it is purely decorative.
- Give the canvas a useful accessible label.
- Respect prefers-reduced-motion and provide a static fallback.
- Use the existing mono type scale, hairline borders, and one accent.
- Install with \`npm install ascii-things\` and import \`ascii-things/element\`.

Return a complete, runnable HTML or React starter, not a screenshot.`;
};

const sceneMarkup = (scene: CompositionScene, surface: CompositionSurface) =>
  `<${scene.tag} ${attrsToMarkup(compositionAttributes(scene, surface))}></${scene.tag}>`;

const shellStyles = `
  /* ascii-things composition starter */
  /* Requires: npm install ascii-things (use a bundler or import map) */
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; min-height: 100%; }
  body {
    min-height: 100svh;
    font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    -webkit-font-smoothing: antialiased;
  }
  a { color: inherit; text-decoration: none; }
  .scene { position: absolute; inset: 0; }
  .scene > * { display: block; width: 100%; height: 100%; }
  .label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    font-size: 8px;
    letter-spacing: .14em;
    line-height: 1.5;
    text-transform: uppercase;
  }
  .label span:last-child { opacity: .5; }
  .kicker {
    margin: 0 0 14px;
    font-size: 8px;
    letter-spacing: .16em;
    line-height: 1.5;
    text-transform: uppercase;
  }
  h1 {
    max-width: 10ch;
    margin: 0;
    font-size: clamp(2.4rem, 6vw, 5.2rem);
    font-weight: 500;
    letter-spacing: -.07em;
    line-height: .94;
  }
  p { max-width: 38ch; margin: 18px 0 0; font-size: 11px; line-height: 1.75; }
  .foot {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font-size: 8px;
    letter-spacing: .12em;
    line-height: 1.5;
    text-transform: uppercase;
  }
  .foot a { text-decoration: underline; text-underline-offset: 3px; }
`;

const buildPaperHtml = (scene: CompositionScene, surface: CompositionSurface) => `<!doctype html>
<!-- ascii-things composition starter. Requires: npm install ascii-things; use a bundler or import map. -->
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${scene.name} — ${surface.name} composition</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      ${shellStyles}
      :root {
        --paper: #f3eee4;
        --paper-deep: #e5dccd;
        --ink: #181512;
        --muted: rgba(24, 21, 18, .64);
        --line: rgba(24, 21, 18, .22);
        --accent: ${surface.accent};
      }
      body {
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 18px;
        padding: 24px;
        background:
          linear-gradient(rgba(24, 21, 18, .045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(24, 21, 18, .045) 1px, transparent 1px),
          var(--paper-deep);
        background-size: 32px 32px;
        color: var(--ink);
      }
      .shell {
        display: grid;
        grid-template-rows: auto auto minmax(0, 1fr) auto;
        min-height: calc(100svh - 48px);
        border: 1px solid var(--ink);
        background: var(--paper);
        box-shadow: 8px 8px 0 rgba(24, 21, 18, .08);
      }
      .top, .copy, .foot { padding: 18px 22px; }
      .top { border-bottom: 1px solid var(--line); }
      .copy { display: flex; align-items: end; justify-content: space-between; gap: 24px; }
      .copy p { color: var(--muted); }
      .kicker { color: var(--accent); }
      .frame {
        position: relative;
        min-height: 260px;
        margin: 0 22px;
        border: 1px solid var(--line);
        background: var(--paper-deep);
      }
      .frame > .scene { position: absolute; }
      .foot { border-top: 1px solid var(--line); color: var(--muted); }
      @media (max-width: 700px) {
        body { padding: 12px; }
        .shell { min-height: calc(100svh - 24px); }
        .copy { display: block; }
        .frame { min-height: 42svh; }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header class="top label">
        <span>${surface.kicker} / ${scene.name}</span>
        <span>${surface.meta}</span>
      </header>
      <section class="copy">
        <div>
          <p class="kicker">${surface.name} / ASCII-THINGS</p>
          <h1>${surface.title}</h1>
          <p>${surface.body}</p>
        </div>
      </section>
      <div class="frame">
        <div class="scene">${sceneMarkup(scene, surface)}</div>
      </div>
      <footer class="foot">
        <span>Starter / npm install ascii-things</span>
        <span><a href="${scene.doc}">Scene notes ↗</a></span>
      </footer>
    </div>
    <script type="module">
      import "ascii-things/element";
    </script>
  </body>
</html>`;

const buildOverlayHtml = (
  scene: CompositionScene,
  surface: CompositionSurface,
  immersive: boolean,
) => `<!doctype html>
<!-- ascii-things composition starter. Requires: npm install ascii-things; use a bundler or import map. -->
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${scene.name} — ${surface.name} composition</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      ${shellStyles}
      :root {
        --bg: ${immersive ? "#04222c" : "#070809"};
        --ink: #ece8df;
        --muted: rgba(236, 232, 223, .62);
        --line: rgba(236, 232, 223, .16);
        --accent: ${surface.accent};
      }
      body { overflow: hidden; background: var(--bg); color: var(--ink); }
      .scene { opacity: ${immersive ? "0.82" : "0.72"}; }
      .veil {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(4, 12, 16, .18), rgba(4, 12, 16, .82));
        pointer-events: none;
      }
      .top {
        position: absolute;
        inset: 0 0 auto;
        z-index: 2;
        padding: 24px;
        border-bottom: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(4, 12, 16, .5), transparent);
      }
      .copy {
        position: absolute;
        right: 24px;
        bottom: 62px;
        left: 24px;
        z-index: 2;
      }
      .kicker { color: var(--accent); }
      h1 { max-width: 9ch; }
      p { color: var(--muted); }
      .foot {
        position: absolute;
        right: 24px;
        bottom: 0;
        left: 24px;
        z-index: 2;
        padding: 18px 0;
        border-top: 1px solid var(--line);
        color: var(--muted);
      }
      @media (max-width: 700px) {
        .top, .copy, .foot { right: 16px; left: 16px; }
        .copy { bottom: 66px; }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="scene">${sceneMarkup(scene, surface)}</div>
      <div class="veil"></div>
      <header class="top label">
        <span>${surface.kicker} / ${scene.name}</span>
        <span>${surface.meta}</span>
      </header>
      <section class="copy">
        <p class="kicker">${surface.name} / ASCII-THINGS</p>
        <h1>${surface.title}</h1>
        <p>${surface.body}</p>
      </section>
      <footer class="foot">
        <span>Starter / npm install ascii-things</span>
        <span><a href="${scene.doc}">Scene notes ↗</a></span>
      </footer>
    </main>
    <script type="module">
      import "ascii-things/element";
    </script>
  </body>
</html>`;

export const buildCompositionHtml = (scene: CompositionScene, surface: CompositionSurface) =>
  surface.id === "paper"
    ? buildPaperHtml(scene, surface)
    : buildOverlayHtml(scene, surface, surface.id === "immersive");
