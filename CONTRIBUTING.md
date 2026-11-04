# Contributing

Thanks for helping improve ascii-things. The project is intentionally small: a zero-dependency
canvas renderer, optional framework adapters, and a documentation site.

## Before you start

- Node 22 is required.
- Install dependencies with `npm install`.
- The site is a separate package: `npm --prefix site install` once, then use `npm --prefix site run dev`.
- Open an issue for a new scene engine or a public API change before writing a large patch.

## Local checks

```sh
npm run check      # Biome lint and format
npm run typecheck
npm test
npm run build
npm run size
npm run check:all  # the full maintainer gate
```

The docs site build runs the package build and registry generation first:

```sh
npm --prefix site run build
```

Playwright gates are available with `npm run test:e2e` after `npx playwright install chromium`.
Visual tests live in `tests/e2e/visual.spec.ts`; update baselines only when the visual change is
intentional and reviewed.

## Package rules

- Keep the runtime dependency list empty. React, React DOM, and Vue are optional peers.
- New scenes export a `create*` factory, a `SceneHandle`, and a typed options interface.
- Every scene must respect `seed`, `columns`, `speed`, `palette`, `calm`, `paused`,
  `interactive`, `maxDpr`, `maxCells`, `adaptiveQuality`, and `label` from `SceneOptions`.
- Add React, Vue, and custom-element adapters when the scene ships in the main package.
- Update `src/api.test.ts`, the public surface table in `MIGRATION.md`, and the docs when the
  exported API changes.
- Prefer a named palette or a semantic palette field over hard-coded colours. New palettes belong
  in `src/palette.ts` with metadata and tests.

## Documentation

- Put guides in `site/src/content/docs/guide/`.
- Keep recipes copy-pasteable and short.
- Add a link to the sidebar in `site/astro.config.mjs` when you add a new guide page.
- The playground consumes `site/src/lib/presets.ts`; keep the URL schema backward-compatible.

## Commit style

Use a short imperative subject, for example:

```text
Add amber and blueprint palettes
Fix dither comparison on transparent backgrounds
```

Do not commit generated `dist/` output. Do not force-push `main`.

## Reporting security issues

Do not open a public issue for a security problem. Email the maintainer listed on the npm package
or open a private security advisory on GitHub.
