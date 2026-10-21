# Roadmap notes

## Shipped design components

These are now part of the package and the 1.0 surface.

- **Dither components** — `ascii-things/dither` ships ordered-dither fields through `DitherField`, `AsciiDither`, and `<ascii-dither>`.
- **ASCII WebGL components** — `ascii-things/webgl` ships the shader-backed `AsciiSurfaceEngine`, `AsciiSurface`, and `<ascii-surface>` with a 2D glyph-field fallback.
- **Integration** — documented in the design-system recipes and used in the runnable shadcn/ui and Material UI examples.

## Current focus

- Footer treatment is locked to the dither field (`10`); variants `00–09` stay in `footer-lab` for future components.
- The selectable footer kit and the Apple/Google/Tesla-style brand cards are complete.
- Keep 1.0 unpublished until explicit approval.
