# ascii-things docs site

The landing page and documentation for [`ascii-things`](../README.md), built with
**Astro + Starlight + React islands**. Static output plus one Cloudflare Pages
Function for the image studio's remote URL proxy.

## Requirements

- **Node 22.22 or newer** (Astro 7 requires it). The library itself supports Node 18+.
- npm 10 or newer.

The site is a separate project with its own `package.json`. It consumes the library through
`"ascii-things": "file:.."`, so the library's `dist/` must exist. The `prebuild` script builds
it from the repository root.

## Develop

```sh
cd site
npm install
npm run dev
```

The dev server prints a local URL (usually `http://localhost:4321`). The landing page is at
`/`; the documentation starts at `/guide/`. A `predev` hook builds the library, so a fresh
checkout works with one install.

`npm run build` runs `npm --prefix .. run build` first, then `astro build`. Output is
`site/dist`.

```sh
npm run build
npm run preview
```

## Routes

| Route | Content |
| --- | --- |
| `/` | Marketing landing page, adapted from the Vite landing |
| `/guide/` | Docs home, live dog demo, cards |
| `/guide/installation/` | Install, exports, framework setup |
| `/guide/quickstart/` | Shortest working examples |
| `/guide/react/` | React props, remount rules, sizing, SSR |
| `/guide/custom-elements/` | Plain HTML and `<ascii-*>` |
| `/guide/ui-components/` | AsciiStage, AsciiPrompt, AsciiReadout, AsciiSceneTabs, AsciiDogHero |
| `/guide/theming/` | Palettes, custom tokens, UI variables |
| `/guide/performance/` | Cell caps, DPR, pause/resume |
| `/guide/accessibility/` | Decorative default, labels, reduced motion |
| `/guide/ssr/` | Next.js, Astro, hydration |
| `/guide/troubleshooting/` | Blank canvas and other common problems |
| `/guide/deployment/` | Cloudflare Pages, Vercel alternative, image proxy |
| `/image/` | Image-to-ASCII studio: crop, tone, edge, batch, TXT/PNG/SVG/ZIP |
| `/scenes/` | Four-scene overview |
| `/scenes/sharks/` | Shark tank |
| `/scenes/robots/` | Robot floor |
| `/scenes/jellyfish/` | Jellyfish bloom |
| `/scenes/dog/` | Robot dog |
| `/playground/` | Live React playground |
| `/api/` | Options, engines, events, stats |
| `/examples/` | Vite, Next, Astro, HTML, UI |
| `/changelog/` | Release notes |

Starlight's docs collection lives in `src/content/docs/`. Its routes are `/guide/...`,
`/scenes/...`, `/api/`, `/playground/`, `/examples/`, and `/changelog/`. The landing page is a
plain Astro page at `src/pages/index.astro`, so it keeps the original full-bleed design
instead of a generic Starlight splash.

## Deploy to Cloudflare Pages

Use the repository root as the project root so both packages install.

| Setting | Value |
| --- | --- |
| Framework preset | Astro (or None) |
| Root directory | repository root |
| Build command | `npm ci && npm --prefix site ci && npm --prefix site run build` |
| Build output directory | `site/dist` |
| Node version | `22` (`NODE_VERSION=22`) |
| Environment variables | `NPM_CONFIG_PRODUCTION=false` |

The site has one Pages Function at `functions/api/image-proxy.ts` for remote
image URLs in `/image/`. Local uploads never reach it. Build from the repository
root so the function is included, then deploy with the root `wrangler.toml`:

```sh
npm --prefix site run build
npx wrangler pages deploy site/dist --project-name ascii-things-docs --branch main
```

`public/_headers` adds security headers and immutable caching for `/_astro/*`.
If you attach a custom domain, update `site` in `astro.config.mjs`.

### Vercel

Vercel works with the same build command and output directory. It is **not configured** in this
repository; see `/guide/deployment/` for the settings.

## Structure

```text
site/
  astro.config.mjs        Starlight, React, aliases
  src/
    content.config.ts     Starlight docs collection
    content/docs/         Markdown and MDX pages
    pages/index.astro     Landing page
    pages/image/          Image-to-ASCII studio
    components/           React islands + Astro demos
    lib/image/            Crop, edge, SVG, ZIP, and studio helpers
    scripts/landing.ts    Landing page engine wiring
    styles/               landing.css, docs.css, and image.css
  public/                 favicon, favicon motion script, _headers
functions/api/            Image proxy Pages Function
wrangler.toml             Root Pages config (site/dist + functions)
```

## Notes

- `src/styles/landing.css` is adapted from the root Vite landing stylesheet. The root landing
  remains the source for the `npm run dev` experience; this copy keeps the static site
  self-contained.
- Scene demos use fixed seeds (`7`, `11`, `12`, `3`) so docs stay reproducible.
- Interactivity is provided by `@astrojs/react` islands. The custom-element demo uses no React.
- `/image/` reads uploaded files locally. Only remote URLs use `/api/image-proxy`.
- The image studio imports the library through `ascii-things/image`; `prebuild` keeps that local build current.

## Verification

```sh
cd site
npm install
npm run build
```

Then, from the repository root:

```sh
npm run check:all
```
