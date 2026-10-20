---
title: Troubleshooting
description: Fix a blank canvas, a scene that restarts, missing controls, and CDN issues.
---

## The canvas is blank or zero height

The scene has no intrinsic height. A wrapper fills its parent, so a parent with no height
collapses the canvas.

```tsx
// Broken: the parent height is auto
<div>
  <AsciiDog />
</div>

// Fixed
<div style={{ height: 420 }}>
  <AsciiDog />
</div>

// Also fixed
<div style={{ aspectRatio: "16 / 9" }}>
  <AsciiDog />
</div>
```

Inspect the element in DevTools. If the canvas box is `0 × 0`, fix the layout before
suspecting the engine.

For custom elements, the host has `min-height: 240px` but still needs a width and, usually, an
explicit height.

## The scene restarts on every render

Structural props rebuild the world. In React, a roster or seed that changes identity on every
render will remount the scene.

```tsx
// Bad: a new array every render
<AsciiSharks sharks={[{ kind: "mako" }]} />

// Good: a stable array
const SHARKS = [{ kind: "mako" }] as const;
<AsciiSharks sharks={SHARKS} />;
```

The structural props are listed in [React usage](/guide/react/).

## Nothing moves under reduced motion

That is expected. The engine settles the world, draws a still frame, and stops. Check your OS
motion preference. The scene should still be visible, just still.

If you want motion for a decorative element regardless, that would ignore a user preference;
prefer `calm` instead.

## Pointer clicks do nothing

Three common causes:

1. `interactive={false}` (or `interactive` absent on a custom element only when explicitly
   `"false"` / `"0"`).
2. The scene is paused.
3. Reduced motion is active; pointer-down actions are disabled.

Clicks are enhancements. Provide a DOM control if the action matters.

## The palette does not change

In React, palette updates live. In custom elements, every attribute change remounts the
engine, so the scene jumps to a new world. In vanilla code, call:

```ts
scene.setOptions({ palette: "neon" });
```

A custom palette object must include every token. A partial object will render with missing
colors. Start from a built-in palette and override fields:

```ts
import { PALETTES } from "ascii-things/sharks";

const mine = { ...PALETTES.abyss, name: "mine", accents: ["#00ffaa"] };
```

## `pause()` is not on the React component

The wrappers do not forward a ref or expose an imperative handle in `0.4.0`. Use the vanilla
factory:

```ts
const scene = createDog(canvas, options);
scene.pause();
scene.resume();
scene.getStats();
scene.destroy();
```

## The custom element cannot be found

The element script must run before or after the tag appears; either order works because
custom elements upgrade. Check:

- The script loaded with the correct MIME type (`text/javascript`).
- The path points to `dist/element.js`, not the package root.
- You are not rendering on the server and expecting the element to upgrade without a client
  script.

If the script 404s on a CDN, the package may not be published yet. Build locally and serve
`dist/element.js`.

## FPS is low on a large display

Lower the work:

```tsx
<AsciiRobots
  palette="abyss"
  seed={7}
  columns={100}
  maxCells={9000}
  maxDpr={1.5}
  calm
/>
```

Also check how many scenes are running at once. Put `interactive={false}` and `calm` on small
cards, and let off-screen pausing do its job.

## The scene is visible but text looks wrong

The renderer inherits the canvas font. If the host sets a display font on `canvas`, the glyph
grid may look uneven. Set a monospace family on the scene:

```css
.ascii-things {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
```

The engine redraws a reduced-motion still frame after the font loads.

## The docs demo looks different from my app

The docs demos use fixed seeds, `columns={110}`, and the UI layer's dark theme. Your app may
use a different parent size, font, palette, or device pixel ratio. Same seed and size produce
the same scene; everything else is art direction.

## Still stuck?

Open an issue with:

- The framework and version.
- The exact props or attributes.
- The canvas's computed width and height.
- `scene.getStats()` output, if you can access the engine.
- Whether reduced motion is enabled.
