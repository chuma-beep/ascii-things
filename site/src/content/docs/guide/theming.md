---
title: Theming and palettes
description: Choose a built-in palette, author a custom palette, and keep canvas ink separate from UI chrome.
---

## Built-in palettes

Four palettes ship with every scene:

| Name | Mood | Background |
| --- | --- | --- |
| `abyss` | Deep water, cool ink, orange accents | Black |
| `neon` | Terminal green, cyan, hot pink | Near-black blue |
| `mono` | Quiet grayscale | Black |
| `paper` | Warm paper with dark ink | `#f3eee4` |

```tsx
<AsciiSharks palette="abyss" />
<AsciiRobots palette="paper" />
<AsciiJellyfish palette="neon" />
<AsciiDog palette="mono" />
```

`palette` accepts a built-in name or a full `Palette` object. The default is `"abyss"`.

:::note
`palette="auto"` is on the roadmap but is **not** in `0.4.0`. To follow the operating system,
read `prefers-color-scheme` in your app and pass `"paper"` or `"abyss"`.
:::

## What a palette controls

A palette is semantic, not a list of arbitrary colors:

| Token | Type | Meaning |
| --- | --- | --- |
| `name` | `string` | Identifier for your own bookkeeping |
| `dark` | `boolean` | Inverts body shading; `true` for dark backgrounds |
| `background` | `string` | Canvas background |
| `grid` | `string` | Optional grid and depth lines |
| `fish` | `[string × 5]` | Five brightness levels, dimmest first |
| `wake` | `RGB` | Motion trails and water disturbance |
| `heat` | `RGB` | Alert, heat, or danger accents |
| `heatHot` | `RGB` | Brighter heat accent |
| `accents` | `string[]` | Species tints and small marks |
| `eye` | `string` | Eye and sensor ink |
| `mark` | `RGB` | Body markings |
| `textOnBody` | `string` | Glyph color on a solid body cell |
| `textOnBodyAlt` | `string` | Alternate glyph color on body |
| `edge` | `RGB` | Anti-aliased silhouette edge |

`RGB` is `[number, number, number]`. Strings are complete CSS colors, so `rgba(...)` works.

Each scene keeps its own species tint for bodies. The palette controls the water, school,
wake, eyes, and ink around them.

## Custom palette

```ts
import type { Palette } from "ascii-things/sharks";

const blueprint: Palette = {
  name: "blueprint",
  dark: true,
  background: "#081524",
  grid: "rgba(120, 190, 255, 0.08)",
  fish: [
    "rgba(160, 210, 255, 0.28)",
    "rgba(160, 210, 255, 0.42)",
    "rgba(160, 210, 255, 0.58)",
    "rgba(160, 210, 255, 0.74)",
    "rgba(200, 230, 255, 0.9)",
  ],
  wake: [110, 190, 255],
  heat: [255, 150, 70],
  heatHot: [255, 220, 150],
  accents: ["#6fb8ff", "#a5d8ff", "#ffb26b"],
  eye: "#d8ecff",
  mark: [40, 80, 120],
  textOnBody: "#04101c",
  textOnBodyAlt: "#0a1c2e",
  edge: [120, 190, 255],
};
```

Pass it anywhere a palette is accepted:

```tsx
<AsciiJellyfish palette={blueprint} seed={3} />
```

```ts
const bloom = createJellyfish(canvas, { palette: blueprint, seed: 3 });
```

Palettes are JS objects, not CSS variables, because the renderer paints glyphs cell by cell
and needs numeric RGB for blending. Treat a custom palette as a JS constant, not a new object
on every render.

`resolvePalette()` is exported for adapter authors. It returns the matching built-in palette,
your object unchanged, or `abyss` for an unknown name.

```ts
import { PALETTES, resolvePalette } from "ascii-things/sharks";

const paper = resolvePalette("paper");
const abyss = resolvePalette();
const available = Object.keys(PALETTES);
```

## Canvas font

Scenes inherit the canvas `font-family` and pass it to the glyph renderer. Set it from CSS:

```css
.ascii-things {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
}
```

The default is the inherited monospace face. There is no `fontFamily` prop in `0.4.0`; the
roadmap includes one for convenience.

## UI chrome is separate

`ascii-things/ui.css` uses its own variables:

```css
:root {
  --ascii-accent: #ff7a1a;
  --ascii-bg: #070809;
  --ascii-panel: #0b0d0f;
  --ascii-ink: #ece8df;
  --ascii-muted: rgba(236, 232, 223, 0.56);
  --ascii-faint: rgba(236, 232, 223, 0.32);
  --ascii-line: rgba(236, 232, 223, 0.14);
  --ascii-line-soft: rgba(236, 232, 223, 0.08);
  --ascii-accent-soft: rgba(255, 122, 26, 0.14);
  --ascii-font: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --ascii-radius: 2px;
}
```

Changing these variables restyles the stage, prompt, readout, tabs, and hero. It does not
change canvas pixels. To theme the scene itself, pass a palette.

This split is deliberate:

- **Canvas palette** is data the renderer blends per cell.
- **UI variables** are ordinary CSS for DOM chrome.

Using CSS variables for canvas colors would mean reading computed styles every frame or
invalidating the glyph cache on theme changes. Keeping them separate is faster and simpler.

## Dark and light pages

The built-in `paper` palette is designed for light pages, and `abyss`, `neon`, and `mono` are
designed for dark pages. A scene does not know its host page's theme; pick the palette that
matches.

For a theme toggle:

```tsx
const [dark, setDark] = useState(true);

<AsciiDog palette={dark ? "abyss" : "paper"} seed={7} />;
```

The UI CSS variables are the opposite: set them from your app's theme, and the frame follows.

## Calm is not a palette

`calm` removes flicker, sparks, shimmer, and other high-frequency decoration. It preserves
the palette. Use it for quieter pages and for users who prefer less motion:

```tsx
<AsciiRobots palette="paper" calm />
```

Reduced motion is separate and automatic: the engine settles the world and renders one still
frame. See [Accessibility](/guide/accessibility/).
