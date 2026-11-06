# ascii-things

## 1.1.0

### Minor Changes

- d75abf4: Add four curated palettes: `amber`, `blueprint`, `newsprint`, and `terminal`, plus
  `PALETTE_NAMES` and `PALETTE_META` for building pickers. The new names are available from the
  root entry, `ascii-things/sharks`, and `ascii-things/rendering`.
- d75abf4: Add optional Vue 3.3+ adapters: scene components for every built-in scene, the
  `useAsciiScene` composable, and image, dither, and WebGL wrappers at
  `ascii-things/image/vue`, `ascii-things/dither/vue`, and `ascii-things/webgl/vue`.
  Vue remains an optional peer dependency, so the package still installs without it.

### Patch Changes

- 97aecd9: Add keyboard controls to interactive scene canvases: arrow keys move a virtual pointer, and Enter or Space triggers the primary pointer action.
- 97aecd9: Add a static `fallback` scene option that exposes an accessible description through
  `aria-description` and `data-ascii-fallback`, and use it as the accessible name when
  `label` is absent.
- 97aecd9: Pause scene loops when the document becomes hidden and resume them when the tab is visible again.

## 1.0.0

The first stable release. It includes the changes below.

### Minor Changes

- Add the `ascii-things/image` entry: `imageToAscii`, `pixelsToAscii`, `renderAsciiImage`, `ASCII_CHARSETS`, the `AsciiImage` React wrapper, and the `<ascii-image>` custom element.
- Add six ambient scenes — starlings, fireflies, ants, koi, city, and servers — with the shared scene API, React wrappers, and custom elements.
- Expand the first-party React UI primitives.
- Add the `ascii-things/dither` entry: `DitherField`, `ditherThreshold`, `shouldDither`, `DITHER_MATRICES`, `DITHER_DEFAULTS`, the `AsciiDither` React wrapper, and the `<ascii-dither>` custom element.
- Add the `ascii-things/webgl` entry: `AsciiSurfaceEngine`, the `AsciiSurface` React wrapper, the `<ascii-surface>` custom element, glyph/colour/cell helpers, and a 2D glyph-field fallback when WebGL is unavailable.
- Add guides for image-to-ASCII, dither fields, WebGL surfaces, and design-system recipes, plus runnable shadcn/ui and Material UI examples.
- Add a Components section with copyable shadcn registry items for an ASCII box footer, koi card, dither card, and WebGL surface card, plus a runnable footer example.
- Add scene console and scene toolbar registry items for the first-party UI primitives, with live docs previews.
- Extend the frozen subpath surface to cover the new entries, with size budgets and `publint`/`attw` coverage.

## 1.0.0-rc.0

### Major Changes

- Release candidate for 1.0.0.

  - Freeze the public runtime, type, and subpath export surface.
  - Add `MIGRATION.md` and the 0.5 → 1.0 upgrade guide.
  - Add API export snapshots, type-surface contract tests, and server-render smoke tests.
  - No runtime behavior changes since `0.5.0`.

## 0.5.0

### Minor Changes

- Release 0.5.0.

  - Add the shared `SceneHandle` API: `pause`, `resume`, `resize`, `setOptions`, `getStats`, `trigger`, and `destroy`.
  - Add `paused`, `fontFamily`, `aspectRatio`, and `onReady` composition props.
  - Add `palette="auto"` and adaptive quality with an opt-out.
  - Add uniform scene actions: `splash`, `dispatch`, `shockwave`, and `throwBall`.
  - Add `ascii-ready` for custom elements.
  - Ship the optional React UI layer and the Astro/Starlight documentation site.
