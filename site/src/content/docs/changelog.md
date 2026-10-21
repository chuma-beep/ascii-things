---
title: Changelog
description: Release notes for ascii-things.
---

## Unreleased

Everything below ships with 1.0.

- `ascii-things/image` converts a local image to ASCII text or a canvas, with the
  `AsciiImage` React wrapper and an `<ascii-image>` custom element.
- Six ambient scenes — starlings, fireflies, ants, koi, city, and servers — join the
  original four with the shared scene API.
- `ascii-things/dither` renders ordered-dither fields with `DitherField`, `AsciiDither`,
  and `<ascii-dither>`.
- `ascii-things/webgl` renders a shader-backed ASCII glyph field with `AsciiSurfaceEngine`,
  `AsciiSurface`, and `<ascii-surface>`, and falls back to a 2D glyph field without WebGL.
- New guides for image-to-ASCII, dither fields, WebGL surfaces, and design-system recipes,
  plus runnable shadcn/ui and Material UI examples.

## 1.0.0-rc.0

The previous release candidate. No runtime behavior changes since 0.5.0.

**API freeze**

- Frozen public runtime, type, and subpath export surface.
- Added `MIGRATION.md` with the 0.5 → 1.0 upgrade guide.
- Added runtime export snapshots, type-surface contract tests, and server-render smoke tests.

## 0.5.0

The prior release. Additive to 0.4.0; no existing option or method changes shape.

**Shared API**

- Shared `SceneOptions`, `SceneStats`, `SceneHandle`, and `SceneAction` types.
- `paused` and `fontFamily` on every scene.
- React `id`, `aspectRatio`, and `onReady(scene)`.
- Custom-element `paused`, `font-family`, `aspect-ratio`, and the bubbling `ascii-ready`
  event carrying the live handle.
- `palette="auto"` follows the host colour scheme, resolving to `paper` or `abyss` at
  creation.
- Adaptive quality lowers the backing-store scale under sustained slow frames;
  `adaptiveQuality={false}` opts out.
- Uniform `trigger(action, x, y)` plus named actions: `splash`, `dispatch`, `shockwave`, and
  `throwBall`.

**Packaging**

- ESM-only, zero runtime dependencies, React as an optional peer.
- Explicit subpath exports and type declarations.
- MIT license, with credit to the original `ascii-sharks` project.

## 0.4.0

Four living scenes with one adapter shape, packaged as ESM with declarations and subpath
exports.

**Scenes**

- Shark tank, robot factory floor, jellyfish bloom, and robot dog.
- Seeded worlds, four palettes, `calm`, `interactive`, DPR and cell caps.
- Fixed-timestep runtime with off-screen pausing and reduced-motion handling.

**Adapters**

- Vanilla `create*` factories and engine classes.
- React wrappers from `ascii-things/react`.
- `<ascii-*>` custom elements from `ascii-things/element`.
- Optional first-party UI from `ascii-things/ui` and `ascii-things/ui.css`.

**Packaging**

- ESM-only, zero runtime dependencies, React as an optional peer.
- Explicit subpath exports and type declarations.
- MIT license, with credit to the original `ascii-sharks` project.

## Versioning

The package follows semver. Until `1.0.0`, minor releases may include breaking changes; they
will be listed here and in the changeset. The public surface is the documented exports,
options, methods, events, and custom-element attributes.

## Reporting

Open an issue at
[github.com/chuma-beep/ascii-things](https://github.com/chuma-beep/ascii-things/issues).
Include the version, framework, and `getStats()` output when reporting a rendering or
performance problem.
