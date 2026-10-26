---
title: Installation
description: Install ascii-things, pick the right subpath, and load the optional UI stylesheet.
---

## Requirements

- A modern browser with canvas, `ResizeObserver`, and `IntersectionObserver`.
- **React 18 or newer** only if you use `ascii-things/react` or `ascii-things/ui`.
- **Node 22 or newer** for building from source. The docs site uses the same version.
- No runtime dependencies. React and React DOM are optional peers.

:::caution
The project is prepared for npm as `ascii-things`. The current `1.0.0-rc.0` build is not on
npm yet, so build the package from this repository or install it from GitHub. The CDN examples
below describe the published path.
:::

## Install from npm

```sh
npm install ascii-things
```

```sh
pnpm add ascii-things
# or
yarn add ascii-things
```

If you use React, install it in the host app as usual. The library does not bundle a second
copy:

```sh
npm install react react-dom
```

## Build from this repository

```sh
git clone https://github.com/chuma-beep/ascii-things.git
cd ascii-things
npm install
npm run build
```

`npm run build` writes ESM, type declarations, source maps, and `dist/ui.css`. The docs site
consumes that `dist/` through a `file:..` dependency.

To point a local app at the checkout without publishing:

```sh
npm install /absolute/path/to/ascii-things
```

## Choose an entry point

Import only the scene you need. Every scene has its own subpath, which keeps the bundle small.

| Import | What it gives you |
| --- | --- |
| `ascii-things/sharks` | `createSharks`, `OceanEngine`, shark types |
| `ascii-things/robots` | `createRobots`, `RobotEngine`, robot types |
| `ascii-things/jellyfish` | `createJellyfish`, `JellyfishEngine`, jellyfish types |
| `ascii-things/dog` | `createDog`, `DogEngine`, dog types |
| `ascii-things/react` | `AsciiSharks`, `AsciiRobots`, `AsciiJellyfish`, `AsciiDog` |
| `ascii-things/element` | Registers `<ascii-sharks>`, `<ascii-robots>`, `<ascii-jellyfish>`, `<ascii-dog>` |
| `ascii-things/ui` | `AsciiStage`, `AsciiPrompt`, `AsciiReadout`, `AsciiSceneTabs`, `AsciiDogHero` |
| `ascii-things/ui.css` | Styles for the optional UI layer |
| `ascii-things` | Convenience re-exports of the vanilla scenes |

The root `ascii-things` entry re-exports every scene. Prefer subpaths in application code so
unused scenes stay out of the bundle.

## React

```tsx
import { AsciiDog } from "ascii-things/react";

export function Yard() {
  return (
    <div style={{ height: 420 }}>
      <AsciiDog palette="paper" seed={7} label="A live ASCII robot dog test yard" />
    </div>
  );
}
```

The wrappers fill their parent. Give the parent a height, or pass `height` explicitly. See
[React usage](/guide/react/) for the sizing contract and the client-component notes.

If you use the first-party UI components, import the stylesheet once:

```tsx
import "ascii-things/ui.css";
```

## Plain HTML / CDN

Once published, the element bundle can be loaded directly:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/ascii-things@latest/dist/element.js"></script>

<ascii-dog
  palette="abyss"
  seed="7"
  count="1"
  style="display: block; width: 100%; height: 420px"
  label="A live ASCII robot dog test yard"
></ascii-dog>
```

Locally, build the package and serve `dist/element.js`:

```html
<script type="module" src="/node_modules/ascii-things/dist/element.js"></script>
```

The [custom elements guide](/guide/custom-elements/) covers every attribute, shadow DOM,
and sizing.

## Vanilla

```ts
import { createSharks } from "ascii-things/sharks";

const canvas = document.querySelector("canvas")!;
const scene = createSharks(canvas, {
  palette: "abyss",
  seed: 42,
  columns: 124,
});

scene.pause();
scene.resume();
scene.setOptions({ palette: "paper", speed: 0.8 });
console.log(scene.getStats());
scene.destroy();
```

The canvas needs a CSS size. The engine fills whatever box the canvas occupies and watches it
with `ResizeObserver`.

## Next.js

The React wrappers include the `"use client"` directive. Import them in a client component:

```tsx
"use client";

import { AsciiJellyfish } from "ascii-things/react";

export function Hero() {
  return (
    <div style={{ height: 460 }}>
      <AsciiJellyfish palette="neon" seed={3} label="A live ASCII jellyfish bloom" />
    </div>
  );
}
```

The wrapper renders a canvas on the server and starts the engine after hydration. It does not
touch `window` during render. See [SSR and hydration](/guide/ssr/).

## Astro

Use a React island, or skip React entirely with the custom element. The docs site uses both:

```astro
---
import { AsciiDog } from "ascii-things/react";
---

<div style="height: 420px">
  <AsciiDog client:visible palette="abyss" seed={7} label="A live ASCII robot dog yard" />
</div>
```

For a zero-JavaScript-framework demo, use `ascii-things/element` and an `<ascii-dog>` tag.

## TypeScript

The package ships declarations for every public entry. Import option and stats types from the
scene subpath:

```ts
import { createDog, type AsciiDogOptions, type DogStats } from "ascii-things/dog";

const canvas = document.querySelector<HTMLCanvasElement>("canvas")!;
const options: AsciiDogOptions = { palette: "paper", seed: 7 };
const dog = createDog(canvas, options);
const stats: DogStats = dog.getStats();
```

`PaletteName` and `Palette` come from any scene entry, or from the root entry.

## Next steps

- [Quickstart](/guide/quickstart/) — the shortest working examples.
- [Scenes overview](/scenes/) — what each simulation does.
- [API reference](/api/) — every option in one place.
