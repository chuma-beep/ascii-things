---
title: API reference
description: Every shared option, scene extra, engine method, event, and statistic in ascii-things 0.4.0.
---

This reference describes the shipped **0.4.0** API. Roadmap items are marked in the guides but
are not listed here as available options.

## Package exports

| Entry | Exports |
| --- | --- |
| `ascii-things` | All four scenes (convenience re-exports) |
| `ascii-things/sharks` | `createSharks`, `OceanEngine`, shark types, palette helpers |
| `ascii-things/robots` | `createRobots`, `RobotEngine`, robot types |
| `ascii-things/jellyfish` | `createJellyfish`, `JellyfishEngine`, jellyfish types |
| `ascii-things/dog` | `createDog`, `DogEngine`, dog types |
| `ascii-things/react` | `AsciiSharks`, `AsciiRobots`, `AsciiJellyfish`, `AsciiDog`, `AsciiOcean` |
| `ascii-things/element` | Registers the four custom elements |
| `ascii-things/ui` | `AsciiStage`, `AsciiPrompt`, `AsciiReadout`, `AsciiSceneTabs`, `AsciiDogHero` |
| `ascii-things/ui.css` | UI stylesheet |

`PALETTES`, `resolvePalette`, `Palette`, `PaletteName`, and `RGB` are exported from the scene
entries and from the root entry.

## Shared options

Every `create*` factory and React wrapper accepts these.

| Option | Type | Default | |
| --- | --- | --- | --- |
| `palette` | `PaletteName \| Palette` | `"abyss"` | Built-in name or full palette object |
| `seed` | `number` | random | Same seed + size = same world |
| `speed` | `number` | `1` | Time scale; `0` freezes |
| `columns` | `number` | per scene | Art-direction target |
| `maxCells` | `number` | `16000` | Grid cap |
| `maxDpr` | `number` | `2` | Backing-store pixel-ratio cap |
| `calm` | `boolean` | `false` | Disables flicker and sparkle |
| `interactive` | `boolean` | `true` | Pointer input |
| `label` | `string` | — | Makes the canvas `role="img"` |
| `paused` | `boolean` | `false` | Start with the scene clock stopped |
| `fontFamily` | `string` | canvas CSS | Override the canvas font stack |
| `onEvent` | `(event) => void` | — | Scene-specific events |

`PaletteName` is `"abyss" | "neon" | "mono" | "paper"`. See
[Theming](/guide/theming/) for the `Palette` shape.

## Scene extras

### Sharks

```ts
interface AsciiSharksOptions {
  sharks?: SharkSpec[];
  density?: number;
  sharkScale?: number;
  // plus shared options
}

type SharkSpec = { kind: SharkKind; size: number };
type SharkKind =
  | "classic" | "hammerhead" | "zebra" | "tiger"
  | "greathammer" | "mako" | "thresher" | "nurse";
```

| Option | Default | |
| --- | --- | --- |
| `sharks` | four classics | Roster |
| `density` | `1` | Fish population multiplier |
| `sharkScale` | `1` | Shark length multiplier |
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
| `destroy()` | `void` | Remove observers, listeners, and state |

`DogEngine` adds:

| Method | Returns | |
| --- | --- | --- |
| `throwBall(x, y)` | `void` | Throw from canvas-local pixels; ignored under reduced motion |

`setOptions` accepts a partial option object. Structural fields (`seed`, roster, `density`,
`count`, `scale`, `spread`) rebuild the world. Palette, speed, columns, max cells, calm,
interactive, max DPR, label, and event handlers update without rebuilding.

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

`aria-*`, `data-*`, and `ref` are not forwarded in `0.4.0`. Use the vanilla engine or
`AsciiStage` when you need to own the canvas element.

## Custom elements

See [Custom elements](/guide/custom-elements/) for the full attribute grammar.

| Tag | Entry | Shared + extra attributes |
| --- | --- | --- |
| `<ascii-sharks>` | `ascii-things/element` | shared, `sharks`, `density`, `shark-scale` |
| `<ascii-robots>` | `ascii-things/element` | shared, `robots`, `count`, `scale` |
| `<ascii-jellyfish>` | `ascii-things/element` | shared, `jellies`, `count`, `scale` |
| `<ascii-dog>` | `ascii-things/element` | shared, `dogs`, `count`, `scale`, `spread` |

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
