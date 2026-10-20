---
title: SSR and hydration
description: Server-render the canvas markup without touching window, then let the engine start after hydration.
---

The scene engines are browser-only: they use `window`, `ResizeObserver`, `IntersectionObserver`,
and `requestAnimationFrame`. The React wrappers are written so that those APIs are only touched
inside `useEffect` or in the engine constructor, which runs after mount.

That means the components are safe to render on the server. They emit a canvas with no pixels,
then hydrate and start the loop.

## What renders on the server

```html
<canvas
  class="ascii-things ascii-dog"
  aria-label="A live ASCII robot dog test yard"
  role="img"
  style="display:block;width:100%;height:100%"
></canvas>
```

No world is created, no seed is consumed, and no browser API is read. The canvas is empty
until hydration. Keep the box sized so it does not collapse or shift.

```tsx
<div style={{ height: 420 }}>
  <AsciiDog palette="abyss" seed={7} label="A live ASCII robot dog test yard" />
</div>
```

## Next.js App Router

Import the wrappers from a client component:

```tsx
"use client";

import { AsciiDog } from "ascii-things/react";

export function Yard() {
  return (
    <div style={{ height: 420 }}>
      <AsciiDog palette="abyss" seed={7} label="A live ASCII robot dog test yard" />
    </div>
  );
}
```

The wrappers already include the `"use client"` directive. You still need a client boundary in
your app because the component is rendered inside your page tree.

If your page is a Server Component, render the client wrapper:

```tsx
// app/page.tsx
import { Yard } from "./yard";

export default function Page() {
  return (
    <main>
      <h1>Robot yard</h1>
      <Yard />
    </main>
  );
}
```

Importing `ascii-things/ui.css` in a root layout is fine. It is plain CSS.

### Avoiding a hydration flash

The wrapper has no intrinsic height. If the parent height depends on JavaScript, the canvas
may start at zero and resize after hydration. Use CSS (`height`, `min-height`, `aspect-ratio`)
so the box is correct in the server-rendered HTML.

```tsx
<div style={{ aspectRatio: "16 / 9", width: "100%" }}>
  <AsciiJellyfish palette="neon" seed={3} />
</div>
```

### Dynamic import without SSR

If you want to skip server rendering entirely:

```tsx
import dynamic from "next/dynamic";

const AsciiDog = dynamic(
  () => import("ascii-things/react").then((module) => module.AsciiDog),
  { ssr: false },
);
```

This is rarely necessary. It trades a server-rendered empty canvas for a client-only mount.

## Astro

Astro can render the React wrapper as an island:

```astro
---
import { AsciiDog } from "ascii-things/react";
---

<div style="height: 420px">
  <AsciiDog client:visible palette="abyss" seed={7} label="A live ASCII robot dog yard" />
</div>
```

- `client:load` hydrates immediately.
- `client:visible` hydrates when the scene approaches the viewport. Good for below-the-fold
  scenes and card grids.
- `client:only="react"` skips SSR and renders only in the browser. Use it if you need to avoid
  any server-rendered canvas markup.

The docs site uses `client:visible` for scene demos and `client:visible` for the dog hero
recipe. The components' DOM chrome is server-rendered; the engine starts after hydration.

### Custom elements in Astro

For a no-React demo, use the element script:

```astro
<ascii-dog palette="abyss" seed="7" style="display:block;height:420px"></ascii-dog>

<script>
  import "ascii-things/element";
</script>
```

The tags are inert until the module runs.

## Vite and other SPAs

No special handling is needed. Import the wrapper in a client component, give the parent a
height, and let Vite bundle the subpath. The package is ESM-only.

## Remix, SvelteKit, and Nuxt

Use the vanilla factory in a client-only lifecycle hook, or wrap the React components in the
framework's client boundary. The only rule is: do not construct an engine during server
rendering. `create*` needs a real canvas in a real document.

## Hydration checklist

- [ ] Parent has a stable height or aspect ratio in server HTML.
- [ ] Seed is fixed if you want the same composition in screenshots.
- [ ] `ui.css` is imported once from a layout, not per scene.
- [ ] No engine construction at module scope.
- [ ] Reduced motion verified with the media query active during hydration.
- [ ] Strict Mode double-mount tested in development; engines clean up on unmount.
