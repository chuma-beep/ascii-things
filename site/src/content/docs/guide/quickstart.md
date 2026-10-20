---
title: Quickstart
description: The shortest working React, vanilla, and plain-HTML setups for ascii-things.
---

## React in one minute

```tsx
import { AsciiDog } from "ascii-things/react";

export function Hero() {
  return (
    <div style={{ height: 420 }}>
      <AsciiDog
        palette="abyss"
        seed={7}
        label="A live ASCII robot dog test yard"
      />
    </div>
  );
}
```

The component renders a single `<canvas>`. It fills the parent, so the parent needs a height.
`seed={7}` makes the yard reproducible. `label` changes the canvas from decorative to
`role="img"` with an accessible name.

Prefer another scene? Change the import and the tag:

```tsx
import { AsciiSharks } from "ascii-things/react";

<AsciiSharks palette="abyss" seed={42} label="A live ASCII shark tank" />;
```

## Vanilla in one minute

```html
<div style="height: 420px">
  <canvas id="yard" style="display: block; width: 100%; height: 100%"></canvas>
</div>
```

```ts
import { createDog } from "ascii-things/dog";

const canvas = document.querySelector<HTMLCanvasElement>("#yard");
if (canvas) {
  const scene = createDog(canvas, {
    palette: "abyss",
    seed: 7,
    label: "A live ASCII robot dog test yard",
  });

  // Later:
  scene.pause();
  scene.setOptions({ palette: "paper", speed: 0.8 });
  scene.destroy();
}
```

The engine owns the animation loop, resize handling, DPR cap, pointer input, off-screen
pausing, and reduced-motion behavior.

## Plain HTML in one minute

```html
<script type="module" src="/node_modules/ascii-things/dist/element.js"></script>

<ascii-dog
  palette="abyss"
  seed="7"
  count="1"
  label="A live ASCII robot dog test yard"
  style="display: block; width: 100%; height: 420px"
></ascii-dog>
```

No React, no bundler required once the element script is served. The element uses shadow DOM
and a canvas internally. See [custom elements](/guide/custom-elements/).

## Add the optional UI layer

```tsx
import { AsciiDogHero } from "ascii-things/ui";
import "ascii-things/ui.css";

export function Hero() {
  return <AsciiDogHero palette="abyss" seed={7} />;
}
```

`AsciiDogHero` composes the dog scene, a framed stage, a command prompt, and a live readout.
Use the pieces directly if you want your own layout. See [UI components](/guide/ui-components/).

## The sizing rule

The scene canvas has **no intrinsic height**. A wrapper defaults to `width: 100%; height: 100%`.
If its parent has no height, the canvas collapses to zero. Every demo on this site uses one of:

```tsx
// A fixed-height parent
<div style={{ height: 420 }}>
  <AsciiDog />
</div>

// Or an explicit height on the canvas
<AsciiDog height={420} />

// Or a CSS aspect-ratio box
<div style={{ aspectRatio: "16 / 9" }}>
  <AsciiDog />
</div>
```

:::tip
If a scene is blank, inspect the canvas box first. A zero-height parent is the most common
integration problem.
:::

## What to read next

- [React usage](/guide/react/) — props, remounts, and client components.
- [Theming](/guide/theming/) — palettes, custom tokens, and UI variables.
- [Performance](/guide/performance/) — cell caps, DPR, and off-screen pausing.
- [API reference](/api/) — complete tables.
