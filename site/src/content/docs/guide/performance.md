---
title: Performance
description: Cell caps, DPR limits, off-screen pausing, and how to keep multiple canvases calm.
---

Each scene is a fixed-timestep simulation rendered as glyphs on one canvas. There is no WebGL,
no image pipeline, and no frame-by-frame string building exposed to the host. The cost is
mostly the number of cells and the device pixel ratio.

## Defaults

| Option | Default | Effect |
| --- | --- | --- |
| `columns` | `124` sharks, `150` robots, `140` jellyfish, `150` dog | Target column count |
| `maxCells` | `16000` | Caps the grid; cell size grows instead of exploding the count |
| `maxDpr` | `2` | Caps backing-store resolution |
| `adaptiveQuality` | `true` | Lowers DPR when frames stay slow |
| `simulation` | fixed 60 Hz | Up to 4 steps per frame |
| `calm` | `false` | Removes flicker and sparkle work |

The renderer keeps cells roughly 8–13 px and raises the cell size when `maxCells` would be
exceeded. That is why a 4K canvas stays within the cell budget instead of rendering a
million glyphs.

## Tune for the surface

Start with the default. If the scene is a small card, cut the grid and the cells:

```tsx
<AsciiSharks
  palette="abyss"
  seed={42}
  columns={72}
  maxCells={4200}
  interactive={false}
  calm
/>
```

For a full-bleed hero on a large display, keep more detail but cap the backing store:

```tsx
<AsciiDog
  palette="abyss"
  seed={7}
  columns={150}
  maxCells={16000}
  maxDpr={2}
/>
```

Rules of thumb:

- **Small card:** `columns` 60–80, `maxCells` 4,000–6,000, `interactive={false}`, `calm`.
- **Section feature:** `columns` 100–120, `maxCells` 8,000–12,000.
- **Hero:** defaults, or `maxCells` 16,000. Do not stack several heroes in one viewport.
- **4K:** keep `maxDpr` at 2 or lower. The cell cap will do the rest.

`columns` is an art-direction target, not a hard pixel width. The renderer adjusts cell size
to fill the box while trying to stay near it.

## Pause off-screen and in modals

The runtime uses `IntersectionObserver` and stops scheduling while the canvas is outside the
viewport. It also stops when the document is hidden because `requestAnimationFrame` does.

Use the engine when you know the surface is dormant:

```ts
scene.pause();
scene.resume();
scene.destroy();
```

`pause()` cancels the loop and clears queued events. `resume()` restarts the clock.
`destroy()` disconnects observers, removes pointer listeners, and clears the world.

React wrappers handle teardown on unmount. Use `onReady` to keep the handle for manual
control:

```tsx
<AsciiDog onReady={(scene) => scene.pause()} />
```

## Freeze instead of pause

`speed: 0` renders the current frame without running the simulation. That is useful for a
still backdrop that should still resize:

```tsx
<AsciiJellyfish palette="neon" seed={3} speed={0} />
```

`pause()` is better when you need to stop the loop entirely, for example while a modal is
open.

## Reduced motion

Under `prefers-reduced-motion: reduce`, the runtime:

1. Lets the world settle for up to four seconds of simulated time.
2. Delivers any final events.
3. Renders one still frame.
4. Skips the animation loop entirely.
5. Ignores pointer-down actions.

This is cheaper than a running scene and is the correct default. No host code is required.

## Measure instead of guessing

`getStats()` returns frame timing and grid size:

```ts
const stats = scene.getStats();
console.log(stats.fps, stats.frameMs, stats.cells, stats.columns, stats.rows);
```

| Stat | Meaning |
| --- | --- |
| `fps` | Derived from the smoothed frame time |
| `frameMs` | Smoothed frame duration |
| `cells` | Painted grid cells |
| `columns` / `rows` | Current grid dimensions |

Scene-specific stats add population counts. See the [API reference](/api/).

Poll at a low rate (500–1000 ms) for a readout. Do not call `getStats()` in a render loop.

## Fonts

Canvas text cannot trigger a webfont load. The runtime asks `document.fonts` to load the
canvas font and redraws the still frame when it resolves. If you use a webfont, preload it or
accept one redraw after load. The scene is not blank in the meantime; it uses the fallback.

## Adaptive quality

Adaptive quality is on by default. When smoothed frame time stays above 20 ms, the runtime
reduces the backing-store scale in 25% steps down to half resolution, then restores it after
a sustained recovery. It never drops below 1× DPR, and it respects `maxDpr`.

Turn it off when you need deterministic pixels or already manage quality yourself:

```tsx
<AsciiDog adaptiveQuality={false} maxDpr={1} />
```

The other quality controls are `maxCells`, `maxDpr`, `columns`, `calm`, `interactive`, and
pause/resume. You can still lower `columns` or `maxCells` through `setOptions()` for a
coarser, host-owned policy.

## Layout stability

Give the canvas a stable box before hydration. A fixed-height parent or an aspect-ratio
wrapper prevents layout shift and gives `ResizeObserver` a real size on first paint.

```tsx
<div style={{ aspectRatio: "16 / 9", width: "100%" }}>
  <AsciiDog palette="abyss" seed={7} />
</div>
```

Avoid `height: auto` on the canvas itself. The scene has no intrinsic aspect ratio in this
release.

## Multiple scenes

Every canvas owns a loop. A few small cards are fine; multiple full-screen heroes are not.
Prefer one active scene per viewport. The landing page uses reduced `columns` and `maxCells`
for its preview cards, and pauses them when they leave the viewport automatically.
