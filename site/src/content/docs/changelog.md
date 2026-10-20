---
title: Changelog
description: What shipped in ascii-things 0.4.0 and what is planned next.
---

## 0.4.0

The current release. Four living scenes with one adapter shape, packaged as ESM with
declarations and subpath exports.

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

## Unreleased / planned

The next milestones are tracked in `PLAN.md`. They are **not** part of 0.4.0:

- `palette="auto"`, `aspectRatio`, `paused`, and `onReady` React props.
- Scene handle methods for scripted interaction across all four scenes.
- Adaptive frame-time quality.
- A published `0.5.0` with provenance, visual regression tests, and accessibility checks.

This docs site was added as part of the Phase 3 work. It documents the shipped API so it does
not promise features before they exist.

## Versioning

The package follows semver. Until `1.0.0`, minor releases may include breaking changes; they
will be listed here and in the changeset. The public surface is the documented exports,
options, methods, events, and custom-element attributes.

## Reporting

Open an issue at
[github.com/chuma-beep/ascii-things](https://github.com/chuma-beep/ascii-things/issues).
Include the version, framework, and `getStats()` output when reporting a rendering or
performance problem.
