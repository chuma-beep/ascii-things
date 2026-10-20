---
title: Changelog
description: Release notes for ascii-things.
---

## 0.5.0

The current release. Additive to 0.4.0; no existing option or method changes shape.

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
