---
title: Installation
description: Install ascii-things, pick the right subpath, and load the optional UI stylesheet.
---

## Requirements

- A modern browser with canvas, `ResizeObserver`, and `IntersectionObserver`.
- **React 18 or newer** only if you use `ascii-things/react` or `ascii-things/ui`.
- **Vue 3.3 or newer** only if you use `ascii-things/vue` or the Vue surface entries.
- **Node 22 or newer** for building from source. The docs site uses the same version.
- No runtime dependencies. React, React DOM, and Vue are optional peers.

:::note
`ascii-things@1.0.0` is published on npm. The CDN examples below load the published
build.
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

For Vue, install Vue in the host app. The package does not bundle a second copy:

```sh
npm install vue
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
| `ascii-things/lagoon` | `createLagoon`, `LagoonEngine`, `LAGOON_VARIANTS`, lagoon types |
| `ascii-things/starlings` | `createStarlings`, ambient types |
| `ascii-things/fireflies` | `createFireflies`, ambient types |
| `ascii-things/ants` | `createAnts`, ambient types |
| `ascii-things/koi` | `createKoi`, ambient types |
| `ascii-things/city` | `createCity`, ambient types |
| `ascii-things/servers` | `createServers`, ambient types |
| `ascii-things/core` | `createSimulation`, `SceneRuntime`, core types |
| `ascii-things/core/react` | `useSimulation` |
| `ascii-things/core/vue` | `useAsciiScene` |
| `ascii-things/rendering` | `CellGrid`, `paintGrid`, palettes, and math helpers |
| `ascii-things/image` | `imageToAscii`, `pixelsToAscii`, `renderAsciiImage`, charsets |
| `ascii-things/image/react` | React image wrapper |
| `ascii-things/image/vue` | Vue image wrapper |
| `ascii-things/image/element` | `<ascii-image>` custom element |
| `ascii-things/dither` | `DitherField`, `ditherThreshold`, `shouldDither`, matrices |
| `ascii-things/dither/react` | React dither wrapper |
| `ascii-things/dither/vue` | Vue dither wrapper |
| `ascii-things/dither/element` | `<ascii-dither>` custom element |
| `ascii-things/webgl` | `AsciiSurfaceEngine`, surface helpers |
| `ascii-things/webgl/react` | React WebGL surface wrapper |
| `ascii-things/webgl/vue` | Vue WebGL surface wrapper |
| `ascii-things/webgl/element` | `<ascii-surface>` custom element |
| `ascii-things/react` | React wrappers for every scene |
| `ascii-things/vue` | Vue wrappers for every scene |
| `ascii-things/element` | Registers every `<ascii-*>` scene element |
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

## Vue

```vue
<script setup lang="ts">
import { AsciiDog } from "ascii-things/vue";
</script>

<template>
  <div style="height: 420px">
    <AsciiDog palette="paper" :seed="7" label="A live ASCII robot dog test yard" />
  </div>
</template>
```

The Vue wrappers fill their parent, use the same live/structural option split as React, and
expose a `ready` event plus an `onReady` prop. Use `ascii-things/core/vue` for the
`useAsciiScene` composable. See [Vue usage](/guide/vue/) for the full contract.

## Plain HTML / element bundle

After installing, import the element bundle from your bundler or an import map:

```html
<script type="module">
  import "ascii-things/element";
</script>

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
