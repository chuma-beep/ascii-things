# ASCII box footer

A copyable footer background made of an ASCII box lattice. The canvas draws a continuous
grid of `+`, `-`, and `|` characters, frames it as one large box, and sends a slow orange
scan across the lattice. It is dependency-free and works with any framework.

[Open the demo](../../examples/ascii-box-footer/) at
`http://localhost:5173/examples/ascii-box-footer/`.

## Use it

Copy `ascii-box-footer.ts` into your project, then give it a canvas that fills the footer:

```html
<footer class="site-footer">
  <canvas class="footer-box" data-ascii-box-footer aria-hidden="true"></canvas>
  <div class="footer-content">...</div>
  <div class="footer-art" aria-hidden="true">ASCII-THINGS</div>
</footer>
```

```css
.site-footer {
  position: relative;
  overflow: hidden;
}

.footer-content {
  position: relative;
  z-index: 2;
}

.footer-art {
  position: relative;
  z-index: 1;
}

.footer-box {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
```

```ts
import { createAsciiBoxFooter } from "./ascii-box-footer";

const canvas = document.querySelector<HTMLCanvasElement>("[data-ascii-box-footer]");
if (canvas) {
  createAsciiBoxFooter(canvas, { size: 12 });
}
```

Make the canvas decorative with `aria-hidden="true"`. The footer wordmark and links carry
the actual content.

## Options

| Option       | Default                       | Description                              |
| ------------ | ----------------------------- | ---------------------------------------- |
| `size`       | `12`                          | Character size in CSS pixels.            |
| `boxWidth`   | `7`                           | Character columns per box.               |
| `boxHeight`  | `3`                           | Character rows per box.                  |
| `padding`    | `18`                          | Inset from the canvas edge in CSS pixels. |
| `speed`      | `1`                           | Scan speed multiplier.                   |
| `scan`       | `true`                        | Draw the moving orange scan band.        |
| `foreground` | `rgba(236, 232, 223, 0.72)`   | Lattice colour.                          |
| `accent`     | `rgba(255, 122, 26, 0.95)`    | Scan colour.                             |
| `maxDpr`     | `2`                           | Device pixel ratio cap.                  |

`createAsciiBoxFooter` returns an instance with `destroy()`. The component already handles:

- canvas sizing and device pixel ratio;
- `ResizeObserver` and `document.fonts.ready`;
- `IntersectionObserver` and `visibilitychange` pausing;
- `prefers-reduced-motion`, which renders one static frame;
- a 30fps cap.

## Notes

The lattice is recomputed from character metrics, so changing the font changes the grid.
Keep the canvas on a monospace family. The default stack is Geist Mono, then the system
monospace fallbacks.
