# Roadmap notes

## Shipped design components

These are now part of the package and the 1.0 surface.

- **Dither components** — `ascii-things/dither` ships ordered-dither fields through `DitherField`, `AsciiDither`, and `<ascii-dither>`.
- **ASCII WebGL components** — `ascii-things/webgl` ships the shader-backed `AsciiSurfaceEngine`, `AsciiSurface`, and `<ascii-surface>` with a 2D glyph-field fallback.
- **ASCII box footer** — `examples/ascii-box-footer/` ships a dependency-free canvas lattice used by the Vite landing page and available as a shadcn registry item.
- **Integration** — documented in the design-system recipes and used in the runnable shadcn/ui and Material UI examples.

## Shipped registry components

The Component docs now publish copyable shadcn registry items. Each item installs with
`npx shadcn@latest add https://ascii-things-docs.pages.dev/r/<name>.json`; the registry JSON is
generated from the same source files in `registry/`.

- `ascii-box-footer`
- `koi-card`
- `dither-card`
- `surface-card`
- `scene-console` — `AsciiStage`, `AsciiSceneTabs`, `AsciiPrompt`, and `AsciiReadout`
- `scene-toolbar` — `AsciiPanel`, `AsciiToolbar`, `AsciiToggle`, `AsciiButton`, `AsciiDivider`, and `AsciiStatus`

## Current focus

- Package is `ascii-things@1.0.0-rc.0`; `main` is pushed and the tree is clean.
- The 1.0 public surface, migration guide, changelog, docs build, package checks, and browser gates are green.
- The production docs footer keeps its dither treatment; the ASCII box lattice is available as a component, demo, and registry item, and the footer-lab variants `00–10` stay in place for reference.
- The only open release gate is approval of the version, changelog, and release notes. Keep 1.0 unpublished until that approval is explicit.
