# Quality gates

The package gate stays fast and dependency-light: `npm run check:all` runs Biome, the
TypeScript check, the Vitest unit suite, the tsup build, publint, attw, and size-limit.

`npm run test:e2e` adds browser gates through Playwright. It starts Vite on port 5200
(reusing an already-running dev server locally) and covers:

- **Landing smoke** — expected title, hero canvas, and no console or page errors.
- **Accessibility** — axe scans `/` and `/examples/ui/`, plus the dither, WebGL surface,
  shadcn/ui, and Material UI example pages; `critical` violations fail the gate, while
  `serious` violations are attached to the HTML report as annotations. Known exceptions:
  small `color-contrast` failures (8 nodes on `/`, 17 on the UI example) in 8 px muted
  metadata. These are reported but not gated because fixing them changes the visual
  design; revisit them with a designer rather than lowering the gate.
- **Reduced motion** — with `prefers-reduced-motion: reduce`, two hero-canvas captures
  400 ms apart must be byte-identical, and the 390 px landing page must not overflow.
- **Performance smoke** — normal motion at 1440×900 and 390×844 must report
  `fps >= 45`, `frameMs <= 24`, and `cells > 0`; the UI example canvas must be painted.
- **Visual baselines** — deterministic reduced-motion captures of the landing hero,
  scene gallery, UI example hero, and mobile landing hero.

`npm run check:quality` runs `check:all` followed by the Playwright suite.

## Updating snapshots

Baselines are stored under `tests/e2e/__screenshots__/<spec>/` using the
`{arg}-chromium-{platform}` template, because font rasterization differs by OS.
Regenerate the baselines for the platform you are on and review the PNG diffs:

```bash
npm run test:e2e:update
```

Run in Docker/CI's Ubuntu image when changing the Linux baselines. The suite replaces
Google Fonts with an empty stylesheet so snapshots never depend on network access; CSS
falls back to the platform monospace face.

Reports are written to `playwright-report/`; traces and failure screenshots go to
`test-results/` (both ignored by git). On CI failures, the workflow uploads both.

## Release secrets

`.github/workflows/release.yml` uses `changesets/action` on pushes to `main`. It opens
a version PR when changesets exist and publishes with `changeset publish` after that PR
merges. Configure a repository secret named `NPM_TOKEN` (an npm automation token) and
keep the workflow's `id-token: write` permission for provenance. `GITHUB_TOKEN` is the
built-in Actions token; no hardcoded credentials are needed.
