# Migrating to ascii-things 1.0

**Status: release candidate (`1.0.0-rc.0`).** 1.0.0 has not been published.
`0.5.0` is the baseline for this guide.

1.0 freezes the public API described here. The goal is a boring upgrade: if you
only use documented exports, moving from `0.5.0` to `1.0.0` should not require
code changes.

## Compatibility promise

- The package follows semantic versioning after `1.0.0`.
- Public JavaScript exports, type exports, package subpaths, and documented
  attributes/props are covered by the freeze.
- Breaking changes require a major release.
- Deprecations are announced in a minor release and remain available until the
  next major release.
- Modules under `src/` that are not listed in the public surface table are
  implementation details. Importing them is unsupported, even if a bundler can
  resolve them.
- Building from source requires Node 22 or newer. The browser runtime has no
  Node dependency.

## Upgrade checklist

1. Install the new version:

   ```sh
   npm install ascii-things@1
   ```

2. If you use the React UI layer, keep the stylesheet import:

   ```ts
   import "ascii-things/ui.css";
   ```

3. Remove any workarounds that assumed `onReady`, `paused`, `fontFamily`,
   `aspectRatio`, `palette="auto"`, or `trigger()` were unavailable.
4. Re-run your own tests, especially anything that snapshots canvas markup or
   asserts the old 0.4 limitations.

There are no required API migrations from `0.5.0` to `1.0.0`.

## Shared scene API

Every scene returns an engine that implements `SceneHandle`:

```ts
import { createDog } from "ascii-things/dog";

const canvas = document.querySelector("canvas")!;
const scene = createDog(canvas, {
  palette: "auto",
  seed: 7,
  paused: true,
});

scene.resume();
scene.setOptions({ calm: true });
scene.trigger("throwBall", canvas.clientWidth * 0.6, canvas.clientHeight * 0.6);

const stats = scene.getStats();
console.log(stats.fps, stats.cells);

scene.destroy();
```

```ts
interface SceneHandle<S extends SceneStats = SceneStats> {
  pause(): void;
  resume(): void;
  resize(): void;
  setOptions(options: Partial<SceneOptions>): void;
  trigger(action: SceneAction, x: number, y: number): void;
  getStats(): S;
  destroy(): void;
}
```

`SceneOptions` covers the shared controls: `seed`, `columns`, `speed`,
`interactive`, `maxDpr`, `maxCells`, `adaptiveQuality`, `calm`, `palette`,
`label`, `paused`, and `fontFamily`. Scene-specific options such as rosters,
counts, scales, and `spread` remain on each scene's options type.

## Signature actions

Each scene has one named action and also accepts the shared `trigger()` call.

| Scene | Named action | `trigger()` name |
| --- | --- | --- |
| Sharks | `splash(x, y)` | `"splash"` |
| Robots | `dispatch(x, y)` | `"dispatch"` |
| Jellyfish | `shockwave(x, y)` | `"shockwave"` |
| Robot dog | `throwBall(x, y)` | `"throwBall"` |

Coordinates are canvas-local CSS pixels. `trigger()` ignores action names that
do not belong to that scene. Pointer clicks invoke the same action when
`interactive` is enabled.

## Palettes

```ts
import type { PaletteChoice } from "ascii-things";

const palette: PaletteChoice = "auto";
```

`PaletteChoice` is a palette name, a full custom `Palette`, or `"auto"`.
`"auto"` resolves to `paper` when the host prefers a light colour scheme and
`abyss` otherwise. During SSR it resolves to `abyss`.

The automatic choice is resolved when applied, not through a live media-query
subscription. Call `setOptions({ palette: "auto" })` after a theme change if you
want the scene to re-resolve it.

## React

The React adapters are exported from `ascii-things/react`:

```tsx
import { AsciiDog } from "ascii-things/react";
import type { SceneHandle } from "ascii-things";

export function Hero() {
  return (
    <AsciiDog
      palette="auto"
      seed={7}
      aspectRatio="4 / 3"
      paused={false}
      onReady={(scene: SceneHandle) => {
        scene.trigger("throwBall", 320, 220);
      }}
    />
  );
}
```

- `onReady(scene)` provides the imperative handle after each engine mount.
- `id`, `className`, `style`, `width`, `height`, and `aspectRatio` are
  forwarded.
- Arbitrary `ref`, `aria-*`, and `data-*` forwarding is not part of the 1.0
  contract. Put those on a wrapper element instead.
- `paused` and `fontFamily` are live options; changing them updates the engine.
- The component renders a canvas during SSR but creates the engine in an
  effect. Canvas work never runs on the server.

## Custom elements

Import the registration module once on the client:

```ts
import "ascii-things/element";
```

```html
<ascii-dog
  palette="auto"
  aspect-ratio="4 / 3"
  paused
  font-family="ui-monospace, monospace"
  label="A live ASCII robot dog test yard"
></ascii-dog>
```

The `ascii-ready` event is bubbling and composed. It carries the live handle:

```ts
document.querySelector("ascii-dog")?.addEventListener("ascii-ready", (event) => {
  const scene = (event as CustomEvent).detail.scene;
  scene.trigger("throwBall", 320, 220);
});
```

The event fires during mount, so attach the listener before appending the
element if you need to catch the first mount. Attribute changes remount the
engine.

## UI layer

The optional UI layer is plain React and plain CSS:

```tsx
import {
  AsciiStage,
  AsciiPrompt,
  AsciiReadout,
  AsciiSceneTabs,
  AsciiDogHero,
} from "ascii-things/ui";
import "ascii-things/ui.css";
```

It has no Tailwind requirement and no runtime dependency beyond React. Style it
with the `--ascii-*` custom properties documented in the UI guide.

## Public surface

Runtime exports are frozen by `src/api.test.ts`. Type exports are part of the
same contract.

| Entry | Runtime exports | Key types |
| --- | --- | --- |
| `ascii-things` | `createSharks`, `createRobots`, `createJellyfish`, `createDog`, engines, renderers, worlds, palettes, helpers | `SceneOptions`, `SceneStats`, `SceneHandle`, `SceneAction`, `SceneReady`, scene option types |
| `ascii-things/sharks` | `createSharks`, `OceanEngine`, `World`, `AsciiRenderer`, palette/RNG/grid helpers | `AsciiSharksOptions`, `OceanStats`, `Palette`, `PaletteChoice` |
| `ascii-things/robots` | `createRobots`, `RobotEngine`, `RobotWorld`, `RobotRenderer` | `AsciiRobotsOptions`, `RobotStats` |
| `ascii-things/jellyfish` | `createJellyfish`, `JellyfishEngine`, `JellyfishWorld`, `JellyfishRenderer` | `AsciiJellyfishOptions`, `JellyfishStats` |
| `ascii-things/dog` | `createDog`, `DogEngine`, `DogWorld`, `DogRenderer` | `AsciiDogOptions`, `DogStats` |
| `ascii-things/react` | `AsciiSharks`, `AsciiRobots`, `AsciiJellyfish`, `AsciiDog`, `AsciiOcean` | component prop types |
| `ascii-things/element` | `AsciiSharksElement`, `AsciiRobotsElement`, `AsciiJellyfishElement`, `AsciiDogElement` | custom-element detail types |
| `ascii-things/ui` | `AsciiStage`, `AsciiPrompt`, `AsciiReadout`, `AsciiSceneTabs`, `AsciiDogHero` | UI prop types |
| `ascii-things/ui.css` | stylesheet | CSS variables |

## SSR notes

- `ascii-things/react` and `ascii-things/ui` are safe to import and render on
  the server. They emit static markup and do not touch `window`.
- Engines and custom elements require a browser environment. Register custom
  elements only in client code.
- `palette="auto"` falls back to `abyss` during SSR, so the first client render
  can differ if the host prefers light mode. Set an explicit palette if the
  server and client markup must match exactly.
- Use `onReady` or `ascii-ready` rather than reaching into a canvas after
  hydration.

## 1.0 release gates

- [x] Public runtime export snapshot for every entrypoint.
- [x] Server-render smoke tests for React and UI components.
- [x] Shared API, actions, palettes, and composition props documented.
- [ ] Final accessibility and SSR audit pass.
- [ ] `npm run check:all` and `npm run test:e2e`.
- [ ] Docs build and migration guide included in the tarball.
- [ ] Clean-install smoke test from `npm pack`.
- [ ] Version, changelog, and release notes approved.

Until those gates are complete, treat this document and the package as a
release candidate, not a published 1.0.
