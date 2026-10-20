# ascii-things

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
