# shadcn/ui example

Three composable cards built on shadcn primitives and ascii-things:

- `components/koi-card.tsx` — a live koi pond with a re-seed control.
- `components/dither-card.tsx` — an ordered-dither wordmark.
- `components/surface-card.tsx` — a shader-backed ASCII glyph surface.

Each card is a standalone file. Copy one into a project that has shadcn set up, or install it
from the registry:

```sh
npx shadcn@latest add https://ascii-things-docs.pages.dev/r/koi-card.json
npx shadcn@latest add https://ascii-things-docs.pages.dev/r/dither-card.json
npx shadcn@latest add https://ascii-things-docs.pages.dev/r/surface-card.json
```

The registry item installs `ascii-things` and the shadcn `card`, `badge`, and `button`
primitives it needs. The full component reference is at
[`/components/`](https://ascii-things-docs.pages.dev/components/).

## Run it

From the repository root:

```sh
npm install
npm run dev
```

Open `http://localhost:5173/examples/shadcn/`.

The page uses Vite + Tailwind v4 and copied shadcn source. It does not depend on the docs site.
