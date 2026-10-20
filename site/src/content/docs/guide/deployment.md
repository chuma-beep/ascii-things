---
title: Deployment
description: Deploy the static docs site to Cloudflare Pages, with Vercel as an alternative.
---

The docs site is a static Astro build. The output directory is `site/dist` and contains no
server functions. Any static host works; this page documents Cloudflare Pages and describes
Vercel as an alternative.

## Cloudflare Pages

Use the repository root as the project root so both the library and the site are installed.

| Setting | Value |
| --- | --- |
| Framework preset | Astro (or None) |
| Root directory | repository root |
| Build command | `npm ci && npm --prefix site ci && npm --prefix site run build` |
| Build output directory | `site/dist` |
| Node version | `22` (`NODE_VERSION=22`) |

Why the root: `site/package.json` depends on the library with `file:..`, and the site's
`prebuild` script runs the library build. The root install gives the library its `tsup` and
TypeScript toolchain; the site install gives Astro and Starlight.

The site's `package.json` also has a `prebuild` hook:

```json
{
  "scripts": {
    "prebuild": "npm --prefix .. run build",
    "build": "astro build"
  }
}
```

So `npm --prefix site run build` builds the library first, then the docs.

### Environment variables

| Variable | Value | Purpose |
| --- | --- | --- |
| `NODE_VERSION` | `22` | Astro 7 requires Node 22.22 or newer |
| `NPM_CONFIG_PRODUCTION` | `false` | Ensure dev dependencies are installed for the build |

No secrets are required. The site is fully static.

### Wrangler CLI

If you prefer deploying from a terminal, the `site/wrangler.toml` file points at `./dist`:

```sh
cd site
npm run build
npx wrangler pages deploy dist --project-name ascii-things-docs
```

`wrangler.toml` is not used by the Pages dashboard build. It is there for CLI deployments and
for projects that adopt Wrangler configuration.

### Headers

`site/public/_headers` is copied to the output and adds:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: SAMEORIGIN`
- immutable one-year caching for `/_astro/*`

## Site URL

`astro.config.mjs` sets:

```js
site: "https://ascii-things.pages.dev",
```

Update that value if you attach a custom domain. It is used for canonical URLs and the
sitemap. Starlight’s `editLink` points at the repository’s `site/` directory.

## Vercel (alternative, not configured)

The same build works on Vercel. No `vercel.json` is committed.

| Setting | Value |
| --- | --- |
| Framework preset | Astro |
| Root directory | repository root |
| Build command | `npm ci && npm --prefix site ci && npm --prefix site run build` |
| Output directory | `site/dist` |
| Node version | 22 |

Set the project’s Node version to 22 in the dashboard. Vercel serves the static output with
its own caching and headers; the `_headers` file is a Cloudflare Pages feature and is ignored
by Vercel. If you need the same security headers there, add them in `vercel.json` or the
dashboard.

## GitHub Pages, Netlify, and others

The build is static and framework-agnostic. Point the host at `site/dist`. If you deploy under
a subpath (for example `https://example.com/ascii-things/`), set Astro’s `base` and `site`
options in `astro.config.mjs` and make sure internal links use the base path.

Cloudflare Pages and Vercel serve from the domain root by default, which is what this site
assumes.

## Preview builds

The docs have no runtime backend. Preview deployments can run the same command with a
different branch. The only external request is the Google Fonts stylesheet for Geist Mono; the
site falls back to the system monospace stack if it is blocked.

## Local verification

```sh
cd site
npm ci
npm run build
npm run preview
```

`npm run build` rebuilds the library through `prebuild`, then emits `site/dist`. Open the
preview URL and check `/`, `/guide/`, a scene page, and the playground.
