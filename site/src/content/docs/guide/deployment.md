---
title: Deployment
description: Deploy the docs site and its image proxy to Cloudflare Pages, with Vercel as a static alternative.
---

The docs site is an Astro build in `site/dist`. It is static except for one
Cloudflare Pages Function at `/api/image-proxy`, which powers remote URL loading
inside the image studio. Local image uploads never reach the server.

## Cloudflare Pages

Use the repository root as the project root so both the library, the site, and
the Pages Function are available.

| Setting | Value |
| --- | --- |
| Framework preset | Astro (or None) |
| Root directory | repository root |
| Build command | `npm ci && npm --prefix site ci && npm --prefix site run build` |
| Build output directory | `site/dist` |
| Node version | `22` (`NODE_VERSION=22`) |

Why the root: `site/package.json` depends on the library with `file:..`, and the
site's `prebuild` script runs the library build. The Pages Function lives in
`functions/` at the repository root, so putting the project root anywhere else
would drop the function from the deployment.

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

No secrets are required. The image proxy has no application-level logging of
image URLs.

### Wrangler CLI

`wrangler.toml` at the repository root points at `site/dist` and discovers
`functions/`. Deploy from the repository root:

```sh
npm --prefix site run build
npx wrangler pages deploy site/dist --project-name ascii-things-docs --branch main
```

At the time of writing, the repository uses `npx wrangler` rather than a local
Wrangler dependency. The Pages dashboard build does not need Wrangler.

### Pages Function

`functions/api/image-proxy.ts` handles `GET /api/image-proxy?url=...`. It:

- allows HTTP(S) images only
- allows PNG, JPEG, WebP, GIF, and AVIF
- rejects SVG, HTML, and other non-image content
- caps the body at 10 MB and the request at a short timeout
- resolves public DNS and rejects localhost, private IPv4/IPv6, metadata hosts,
  credentials, non-standard ports, and redirects into private networks
- applies a small per-isolate rate limit; add a Cloudflare rate-limiting rule for
  a production-grade global limit

If the function is absent, the studio falls back to a direct CORS fetch for
remote URLs. Local uploads always work.

### Headers

`site/public/_headers` is copied to the output and adds:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: SAMEORIGIN`
- immutable one-year caching for `/_astro/*`

## Site URL

`astro.config.mjs` sets:

```js
site: "https://ascii-things-docs.pages.dev",
```

Update that value if you attach a custom domain. It is used for canonical URLs
and the sitemap. Starlight’s `editLink` points at the repository’s `site/`
directory.

## Vercel (alternative, not configured)

The static pages work on Vercel, but the remote URL proxy does not. Local image
uploads, crop, tone, edge, batch, and all exports remain browser-only.

| Setting | Value |
| --- | --- |
| Framework preset | Astro |
| Root directory | repository root |
| Build command | `npm ci && npm --prefix site ci && npm --prefix site run build` |
| Output directory | `site/dist` |
| Node version | 22 |

Set the project’s Node version to 22 in the dashboard. Vercel serves the static
output with its own caching and headers; the `_headers` file is a Cloudflare
Pages feature and is ignored by Vercel. To support remote URL loading on Vercel,
add an equivalent serverless endpoint that implements the same guards.

## GitHub Pages, Netlify, and others

The static build is framework-agnostic. Point the host at `site/dist`. If you
deploy under a subpath (for example `https://example.com/ascii-things/`), set
Astro’s `base` and `site` options in `astro.config.mjs` and make sure internal
links use the base path.

Without the Pages Function, the studio falls back to direct CORS fetches for
remote URLs. Local uploads are unaffected.

## Preview builds

Preview deployments can run the same command with a different branch. The
studio’s remote URL feature needs the Pages Function; preview deployments on
Cloudflare Pages get it automatically from `functions/`.

## Local verification

```sh
cd site
npm ci
npm run build
npm run preview
```

To exercise the real image proxy locally, use Wrangler from the repository root:

```sh
npx wrangler pages dev site/dist
```

Open `/image/`, then try a local upload and a remote image URL. Check `/`,
`/guide/`, a scene page, and the playground as well.
