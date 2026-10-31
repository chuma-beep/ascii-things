---
title: API reference
description: Every shared option, scene extra, engine method, event, and statistic in ascii-things 1.0.0-rc.0.
---

This reference tracks `main` and the current **1.0.0-rc.0** release.

## Package exports

| Entry | Exports |
| --- | --- |
| `ascii-things` | All scenes (convenience re-exports) |
| `ascii-things/sharks` | `createSharks`, `OceanEngine`, shark types, palette helpers |
| `ascii-things/robots` | `createRobots`, `RobotEngine`, robot types |
| `ascii-things/jellyfish` | `createJellyfish`, `JellyfishEngine`, jellyfish types |
| `ascii-things/dog` | `createDog`, `DogEngine`, dog types |
| `ascii-things/lagoon` | `createLagoon`, `LagoonEngine`, `LAGOON_VARIANTS`, lagoon types |
| `ascii-things/react` | Scene components: `AsciiSharks`, `AsciiRobots`, `AsciiJellyfish`, `AsciiDog`, ambient wrappers, `AsciiLagoon`, named Lagoon samples, `AsciiOcean` |
| `ascii-things/element` | Registers the scene custom elements |
| `ascii-things/ui` | `AsciiStage`, `AsciiPrompt`, `AsciiReadout`, `AsciiSceneTabs`, `AsciiDogHero` |
| `ascii-things/ui.css` | UI stylesheet |

`PALETTES`, `resolvePalette`, `Palette`, `PaletteName`, `PaletteChoice`, and `RGB` are
exported from the scene entries and from the root entry.

## Shared options

Every `create*` factory and React wrapper accepts these.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `palette` | `PaletteChoice` | `"abyss"` | Built-in name, `"auto"`, or a full palette object (0.5.0 adds `"auto"`) |
| `seed` | `number` | random | Same seed + size = same world |
| `speed` | `number` | `1` | Time scale; `0` freezes |
| `columns` | `number` | per scene | Art-direction target |
| `maxCells` | `number` | `16000` | Grid cap |
| `maxDpr` | `number` | `2` | Backing-store pixel-ratio cap |
| `adaptiveQuality` | `boolean` | `true` | Lower DPR when frames stay slow (0.5.0) |
| `calm` | `boolean` | `false` | Disables flicker and sparkle |
| `interactive` | `boolean` | `true` | Pointer input |
| `label` | `string` | — | Makes the canvas `role="img"` |
| `paused` | `boolean` | `false` | Start with the scene clock stopped |
| `fontFamily` | `string` | canvas CSS | Override the canvas font stack |
| `onEvent` | `(event) => void` | — | Scene-specific events |

`PaletteName` is `"abyss" | "neon" | "mono" | "paper"`. `PaletteChoice` adds `"auto"` and a
custom `Palette`. `"auto"` resolves to `paper` when the host prefers a light colour scheme and
`abyss` otherwise; it is resolved when the scene is created. See
[Theming](/guide/theming/) for the `Palette` shape.

## Scene extras

### Sharks

```ts
interface AsciiSharksOptions {
  sharks?: SharkSpec[];
  density?: number;
  sharkScale?: number;
  orbitScale?: number;
  fitSharks?: boolean;
  glyphs?: "ascii" | "kanji";
  // plus shared options
}

type SharkSpec = {
  kind: SharkKind;
  size: number;
  x?: number;       // normalized body-centre position
  y?: number;
  heading?: number; // radians
};
type SharkKind =
  | "classic" | "hammerhead" | "zebra" | "tiger"
  | "greathammer" | "mako" | "thresher" | "nurse";
```

| Option | Default | |
| --- | --- | --- |
| `sharks` | four classics | Roster |
| `density` | `1` | Fish population multiplier |
| `sharkScale` | `1` | Shark length multiplier |
| `orbitScale` | `1` | Patrol-orbit radius; lower values suit small cards |
| `fitSharks` | `false` | Keep initial shark spines inside the frame |
| `glyphs` | `"ascii"` | Original ASCII hide or `"kanji"` renderer |
| `columns` | `124` | Art-direction target |

### Robots

```ts
interface AsciiRobotsOptions {
  robots?: RobotSpec[];
  count?: number;
  scale?: number;
  // plus shared options
}

type RobotSpec = { kind: "scout" | "hauler" | "sentinel"; size: number };
```

| Option | Default | |
| --- | --- | --- |
| `robots` | mixed fleet | Roster |
| `count` | scales with area | Fleet size when `robots` is omitted |
| `scale` | `1` | Robot size multiplier |
| `columns` | `150` | Art-direction target |

### Jellyfish

```ts
interface AsciiJellyfishOptions {
  jellies?: JellyfishSpec[];
  count?: number;
  scale?: number;
  // plus shared options
}

type JellyfishSpec = {
  kind: "moon" | "lion" | "box" | "atolla" | "crystal";
  size: number;
};
```

| Option | Default | |
| --- | --- | --- |
| `jellies` | mixed bloom | Roster |
| `count` | scales with area | Bloom size when `jellies` is omitted |
| `scale` | `1` | Jelly size multiplier |
| `columns` | `140` | Art-direction target |

### Dog

```ts
interface AsciiDogOptions {
  dogs?: DogSpec[];
  count?: number;
  scale?: number;
  spread?: [number, number];
  // plus shared options
}

type DogSpec = { size: number };
type DogState =
  | "walk" | "trot" | "sniff" | "sit"
  | "alert" | "chase" | "charge";
```

| Option | Default | |
| --- | --- | --- |
| `dogs` | responsive | Roster |
| `count` | 1, scaled by width, max 3 | Dog count when `dogs` is omitted |
| `scale` | `1` | Dog size multiplier |
| `spread` | `[0.28, 0.72]` | Normalized start band |
| `columns` | `150` | Art-direction target |

### Lagoon

```ts
interface AsciiLagoonOptions extends SceneOptions {
  variant?: LagoonVariant;
}

type LagoonVariant =
  | "reef" | "night" | "turtle" | "manta"
  | "seahorse" | "dolphin" | "hammerhead" | "tang";
```

| Option | Default | |
| --- | --- | --- |
| `variant` | `"reef"` | Marine scene variant |
| `paused` | `false` | Start on the static composition |
| `label` | — | Accessible name |

The Lagoon painter is a full-canvas renderer, not a cell-grid renderer. It is
deterministic and passive; `seed`, `speed`, and `palette` do not affect this
renderer. The `AsciiLagoonDay`, `AsciiLagoonNight`, `AsciiLagoonTurtle`,
`AsciiLagoonManta`, `AsciiLagoonSeahorse`, `AsciiLagoonDolphin`,
`AsciiLagoonHammerhead`, and `AsciiLagoonTang` React components fix `variant`
for each sample. `LAGOON_VARIANTS` is the canonical ordered list
for UI and docs.

## Engines

Each scene has a class and a factory. The factory is the documented path.

```ts
const scene = createSharks(canvas, options);
```

| Method | Returns | |
| --- | --- | --- |
| `pause()` | `void` | Stop the loop and clear queued events |
| `resume()` | `void` | Restart the clock |
| `resize()` | `void` | Force a size/DPR read |
| `setOptions(partial)` | `void` | Update the listed options live |
| `getStats()` | scene stats | Frame timing and population |
| `trigger(action, x, y)` | `void` | Uniform action entry point for every scene |
| `destroy()` | `void` | Remove observers, listeners, and state |

### Scene actions

| Scene | Method | `trigger()` action |
| --- | --- | --- |
| Sharks | `splash(x, y)` | `"splash"` |
| Robots | `dispatch(x, y)` | `"dispatch"` |
| Jellyfish | `shockwave(x, y)` | `"shockwave"` |
| Dog | `throwBall(x, y)` | `"throwBall"` |

Coordinates are canvas-local pixels. Actions are ignored under reduced motion. The same
methods are available on React handles from `onReady` and custom-element handles from
`ascii-ready` (0.5.0).

`setOptions` accepts a partial option object. Structural fields (`seed`, roster, `density`,
`count`, `scale`, `spread`) rebuild the world. Palette, speed, columns, max cells, max DPR,
adaptive quality, calm, interactive, label, and event handlers update without rebuilding.

The scene classes are also exported (`OceanEngine`, `RobotEngine`, `JellyfishEngine`,
`DogEngine`) for advanced use, but `create*` is the stable surface.

## Stats

Every scene returns the base fields plus its own.

```ts
type BaseStats = {
  fps: number;
  frameMs: number;
  cells: number;
  columns: number;
  rows: number;
};
```

| Scene | Extra fields |
| --- | --- |
| Sharks | `fish`, `sharks` |
| Robots | `robots`, `charging`, `docks` |
| Jellyfish | `jellies`, `pulsing`, `plankton`, `rings` |
| Dog | `dogs`, `charging`, `state` (`DogState`), `ball` |
| Lagoon | `variant` |

## Events

`onEvent` receives a discriminated union. Coordinates are canvas-local pixels.

```ts
type WorldEvent = { kind: "eat" | "splash"; x: number; y: number };

type RobotWorldEvent =
  | { kind: "dock"; x: number; y: number; id: number }
  | { kind: "undock"; x: number; y: number; id: number }
  | { kind: "job"; x: number; y: number; id: number }
  | { kind: "low"; x: number; y: number; id: number };

type JellyfishWorldEvent =
  | { kind: "pulse"; x: number; y: number; id: number }
  | { kind: "shock"; x: number; y: number };

type DogWorldEvent =
  | { kind: "ball"; x: number; y: number }
  | { kind: "nudge"; x: number; y: number; id: number }
  | { kind: "charge"; x: number; y: number; id: number }
  | { kind: "low"; x: number; y: number; id: number }
  | { kind: "sit"; x: number; y: number; id: number };
```

## React

Each wrapper accepts its scene options plus:

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `id` | `string` | — | Canvas id |
| `className` | `string` | — | Extra class on the canvas |
| `style` | `CSSProperties` | — | Canvas style |
| `width` | `number \| string` | `"100%"` | Canvas width |
| `height` | `number \| string` | `"100%"` | Canvas height |
| `aspectRatio` | `number \| string` | — | Sets `aspect-ratio` and `height: auto` |
| `onReady` | `(scene: SceneHandle) => void` | — | Fires after engine mount/remount |

The canvas also gets `ascii-things` and `ascii-<scene>` classes, `display: block`, and
`aria-hidden="true"` unless `label` is set.

`id` is forwarded. `aria-*`, `data-*`, and `ref` are not yet forwarded. Use the vanilla
engine or `AsciiStage` when you need to own the canvas element.

## Custom elements

See [Custom elements](/guide/custom-elements/) for the full attribute grammar.

| Tag | Entry | Shared + extra attributes |
| --- | --- | --- |
| `<ascii-sharks>` | `ascii-things/element` | shared, `sharks`, `density`, `shark-scale`, `orbit-scale`, `fit-sharks`, `glyphs` |
| `<ascii-robots>` | `ascii-things/element` | shared, `robots`, `count`, `scale` |
| `<ascii-jellyfish>` | `ascii-things/element` | shared, `jellies`, `count`, `scale`, `glyphs` |
| `<ascii-koi>` | `ascii-things/element` | shared, `count`, `scale`, `glyphs` |
| `<ascii-dog>` | `ascii-things/element` | shared, `dogs`, `count`, `scale`, `spread` |
| `<ascii-lagoon>` | `ascii-things/element` | shared, `variant` |
| `<ascii-lagoon-day>` … `<ascii-lagoon-tang>` | `ascii-things/element` | shared; fixed variant |

Shared attributes: `palette`, `seed`, `speed`, `columns`, `max-cells`, `max-dpr`, `calm`,
`interactive`, `label`.

Every attribute change remounts the engine.

## UI components

The complete prop tables are on [UI components](/guide/ui-components/). The exported
components are:

- `AsciiStage`
- `AsciiPrompt`
- `AsciiReadout`
- `AsciiSceneTabs`
- `AsciiDogHero`

## Types

Import option, spec, event, and stats types from the matching scene subpath:

```ts
import type {
  AsciiDogOptions,
  DogEngine,
  DogSpec,
  DogState,
  DogStats,
  DogWorldEvent,
} from "ascii-things/dog";
```

`Palette`, `PaletteName`, `RGB`, `PALETTES`, and `resolvePalette` are available from any scene
entry or the root.
