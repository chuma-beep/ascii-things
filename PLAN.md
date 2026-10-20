# ascii-things → a proper UI library

**Plan for approval · 20 Oct 2026**

Baseline: `main` at `272be46`, package `ascii-things@0.4.0`, four scenes (sharks, robots, jellyfish, robot dog), 18 tests passing, MIT, published source on GitHub, not yet on npm.

---

## 1. Goal

Turn `ascii-things` from **four working demos with good internals** into a **small, dependable UI library** that someone can install, theme, document, test, and ship without reading the source.

Definition of done:

- `npm install ascii-things` works in Vite + React, Next.js App Router, Astro, and plain HTML.
- Four documented components with one consistent API.
- A real docs site with live, controllable examples and copy-paste code.
- CI that blocks regressions in types, tests, bundle size, accessibility, and visuals.
- A published `0.5.0` with provenance, changelog, and release notes.
- A clear path to `1.0.0` with a frozen public API.

**Not** a general textmode engine, a design system, or a 20-scene catalog. Four excellent scenes, polished.

---

## 2. Principles

1. **Scenes, not a framework.** The product is living ASCII art. Keep the runtime invisible.
2. **One API shape.** Every scene should feel like the same component with different content.
3. **Zero runtime dependencies.** React stays an optional peer.
4. **Progressive enhancement.** Works as a custom element; nicer in React.
5. **Calm by default.** Respect reduced motion, pause off-screen, cap quality.
6. **Small surface.** No plugin API, no scene authoring SDK, no theme editor in v1.
7. **Measured, not asserted.** Bundle, frame time, and cell counts are tested.

---

## 3. Current state

### What exists

| Area | State |
|---|---|
| Scenes | Sharks, robots, jellyfish, robot dog |
| Runtime | Fixed timestep, resize, DPR cap, visibility pause, reduced motion, pointer input |
| Theming | Four palettes: abyss, neon, mono, paper |
| Determinism | Seeded RNG per scene |
| Adapters | Vanilla `create*`, React wrappers, `<ascii-*>` custom elements |
| Packaging | ESM, subpath exports, d.ts, MIT, optional React peer |
| Tests | 18 unit/behavior tests |
| Docs | README only |
| Quality gates | Typecheck, tests, build — no lint, CI, visual, or perf tests |
| Release | Manual; npm name available; npm auth not configured |

### Known structural debt

- The shark scene lives at `src/` root while the other three live in `src/<scene>/`. Internal inconsistency.
- Four engines duplicate the loop, resize, pointer, visibility, and reduced-motion logic.
- Four React wrappers and four custom-element classes duplicate adapter logic.
- Public API is implicit (`export *`), not an explicit contract.
- Canvas components collapse if the parent has no height; default sizing is a DX trap.
- No release/versioning process, changelog, or CI.

---

## 4. Target public API

### React

```tsx
import { AsciiSharks, AsciiRobots, AsciiJellyfish, AsciiDog } from "ascii-things/react";

<AsciiSharks
  palette="abyss"
  seed={42}
  columns={124}
  calm={false}
  label="A live ASCII shark tank"
  aspectRatio="16 / 9"
/>

<AsciiDog palette="paper" count={2} interactive />
```

### Vanilla

```ts
import { createSharks } from "ascii-things/sharks";

const scene = createSharks(canvas, { palette: "abyss", seed: 42 });
scene.pause();
scene.resume();
scene.setOptions({ palette: "paper", speed: 0.8 });
console.log(scene.getStats());
scene.destroy();
```

### Custom element

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/ascii-things/dist/element.js"></script>
<ascii-jellyfish palette="neon" seed="7" count="6"></ascii-jellyfish>
```

### Shared props / options

| Option | Type | Default | Notes |
|---|---|---|---|
| `palette` | palette name / object / `"auto"` | `"abyss"` | `auto` follows `prefers-color-scheme` |
| `seed` | `number` | random | Same seed = same scene |
| `speed` | `number` | `1` | `0` freezes |
| `columns` | `number` | scene default | Art-direction target |
| `maxCells` | `number` | `16000` | Quality cap |
| `maxDpr` | `number` | `2` | Backing-store cap |
| `calm` | `boolean` | `false` | Disables flicker/sparkle |
| `interactive` | `boolean` | `true` | Pointer input |
| `paused` | `boolean` | `false` | Application-level pause |
| `label` | `string` | — | Makes the canvas `role="img"` |
| `aspectRatio` | `string` | `"16 / 9"` | Prevents collapsed canvases |
| `onEvent` | `(event) => void` | — | Scene-specific events |
| `onReady` | `(handle) => void` | — | Access the imperative handle |

### Shared handle

```ts
interface SceneHandle {
  pause(): void;
  resume(): void;
  resize(): void;
  setOptions(options: Partial<SceneOptions>): void;
  getStats(): SceneStats;
  destroy(): void;
}
```

Scene-specific extras:

- `SharksHandle`: `splash(x, y)`
- `RobotsHandle`: `dispatch(x, y)`
- `JellyfishHandle`: `shockwave(x, y)`
- `DogHandle`: `throwBall(x, y)`

These make interactions scriptable and testable without synthesizing pointer events.

### React DOM contract

Each component renders a single `<canvas>` (or a wrapper only if an overlay is added later). It accepts `className`, `style`, `id`, `width`, `height`, `aria-*`, and `data-*`. Default style:

```css
display: block;
width: 100%;
aspect-ratio: 16 / 9;
height: auto;
```

Pass `height="100%"` to fill a fixed-height parent instead.

---

## 5. Architecture

### Target tree

```
src/
  core/
    runtime.ts        # fixed loop, resize, DPR, visibility, reduced motion
    grid.ts           # cell metrics, glyph batching, text export
    palette.ts
    rng.ts
    types.ts          # SceneOptions, SceneHandle, SceneStats, SceneEvent
  scenes/
    sharks/           # world, renderer, species, shapes, options, engine
    robots/
    jellyfish/
    dog/
  adapters/
    react.tsx         # shared factory + four named components
    element.ts        # shared shell + four custom elements
  sharks.ts           # public subpath entry (re-export)
  robots.ts
  jellyfish.ts
  dog.ts
  react.ts
  element.ts
  index.ts
```

### What moves

- `src/world.ts`, `src/renderer.ts`, `src/engine.ts`, `src/species.ts`, `src/math.ts` → `src/scenes/sharks/`.
- Shared helpers (`palette`, `rng`, `math`, grid painting) → `src/core/`.
- Four engine implementations → one `SceneRuntime` plus scene hooks.
- Four React wrappers → one `createAsciiComponent` factory; four named exports.
- Four custom-element classes → one `defineAsciiScene` factory; four tags.

### Runtime contract

```ts
interface SceneDefinition<O, H> {
  id: string;
  defaults: O;
  create(ctx: SceneContext, options: O): SceneInstance<H>;
}

interface SceneInstance<H> {
  step(dt: number): void;
  render(dt: number): void;
  resize?(w: number, h: number, cw: number, ch: number): void;
  setOptions?(partial: Partial<O>): void;
  getStats?(): SceneStats;
  handle?: H;
  destroy?(): void;
}
```

The runtime owns the canvas, loop, DPR, observers, pointer binding, reduced motion, and cleanup. Scenes own only state, simulation, and drawing.

### Rule

`core/` never imports `scenes/`. Deleting a scene must not affect the others. A scene may import core, never another scene.

---

## 6. Packaging

### Exports

```json
{
  ".": "./dist/index.js",
  "./sharks": "./dist/sharks.js",
  "./robots": "./dist/robots.js",
  "./jellyfish": "./dist/jellyfish.js",
  "./dog": "./dist/dog.js",
  "./react": "./dist/react.js",
  "./element": "./dist/element.js",
  "./package.json": "./package.json"
}
```

Add `types` conditions, `publishConfig.access: "public"`, and `engines.node >= 18`.

### Module format

**Recommendation: ESM-only for 1.0.** Vite, Next 13+, Astro, SvelteKit, and modern Node all consume ESM. Dual CJS adds a dual-package hazard and doubles build/test surface for little gain. Revisit only if a real user needs CJS.

### Bundle budget

- Shared core + one scene: **≤ 20 kB gzip**
- All four scenes + adapters: **≤ 60 kB gzip**
- No runtime dependencies.

Measured with `size-limit` in CI. Adjust the exact numbers after the first clean build, but set the budget before docs work.

### Tree-shaking

`sideEffects` remains only `./dist/element.js`. Subpath imports are the documented path. Root `index` re-exports all scenes for convenience but docs steer users to `/sharks`, `/dog`, etc.

---

## 7. Documentation site

### Stack

**Recommendation: Astro + Starlight + React islands**, deployed to GitHub Pages.

Why: static, fast, excellent docs defaults, native Markdown/MDX, React components can run as islands with `client:only="react"`, and custom-element demos work in plain HTML blocks. VitePress is the fallback if we want to stay Vite-only, but React demos would need iframes.

### Pages

- `/` — landing page with one full-bleed live scene and a one-line install
- `/guide/installation`
- `/guide/quickstart`
- `/guide/theming`
- `/guide/accessibility`
- `/guide/performance`
- `/guide/ssr`
- `/scenes/sharks`
- `/scenes/robots`
- `/scenes/jellyfish`
- `/scenes/dog`
- `/playground` — palette, seed, count, speed, columns, calm, pause; copy React/HTML/JS
- `/api` — shared props + per-scene options + handles + events
- `/changelog`
- `/examples` — Vite React, Next App Router, plain HTML, Astro

Each scene page: live demo, behavior notes, controls, props table, events, performance, accessibility, copy-paste.

### Docs quality bar

- Every code sample is tested or generated from a tested example.
- No dead links; CI link checker.
- Mobile layout works.
- Docs themselves respect reduced motion.
- Search enabled.
- Version selector deferred until 1.0.

---

## 8. Theming, accessibility, performance

### Theming

- Keep the four palettes.
- Add `palette="auto"` resolving `prefers-color-scheme`.
- Support custom palette objects (already possible) and document every token.
- Add `fontFamily` option; default to inherited monospace.
- Do **not** add CSS variables for canvas colors; palettes are JS objects. Document why.
- Add one high-contrast palette candidate only if accessibility testing shows a need.

### Accessibility

- Decorative by default: `aria-hidden="true"`.
- `label` switches to `role="img"` + `aria-label`.
- Reduced motion: settle, then one still frame.
- `calm` disables flicker and sparkle.
- Interactive scenes remain usable without pointer input via handle methods; document that the canvas is ambient art, not a game.
- Add an axe check on the docs site and a reduced-motion visual test.
- Document that canvas content is not screen-reader-readable; provide `label` and, where useful, a text summary in the host page.

### Performance

- Keep `maxCells` and `maxDpr`.
- Add adaptive quality: if p95 frame time stays above 22 ms, reduce columns/fish density in steps; restore slowly. Opt out with `quality="fixed"`.
- Add `paused` and keep IntersectionObserver auto-pause.
- Test at 1440×900 and 3840×2160; mobile 390×844 at DPR 3.
- Target 60 fps desktop, ≥ 30 fps mid-range mobile.

---

## 9. Quality gates

### Lint and format

Use **Biome** for lint + format (one tool, fast, no plugin zoo). Add `npm run lint` and `npm run format:check`.

### Tests

1. **Unit/behavior** — keep and extend the 18 existing tests.
2. **Type tests** — `tsd` or `vitest` type assertions for public exports.
3. **Visual regression** — Playwright, fixed seed/time, 4 scenes × 2 palettes at 960×540; `toHaveScreenshot` with a small tolerance.
4. **Accessibility** — axe on the docs page; explicit reduced-motion and aria checks.
5. **Performance smoke** — 300 frames at 1440×900; assert p95 under a generous threshold (CI variance).
6. **Package** — `publint`, `attw`, `npm pack --dry-run`, `size-limit`.

### CI

`.github/workflows/ci.yml` on push/PR:

- Node 20 and 22
- `npm ci`
- lint, typecheck, test, build
- publint, attw, size-limit
- upload visual diffs on failure

Separate `visual.yml` if the screenshot job is slow.

### Release workflow

- **Changesets** for versioning and `CHANGELOG.md`.
- `release.yml` on tag: build, test, `npm publish --provenance --access public`, GitHub release.
- Requires `NPM_TOKEN` secret and `npm login` locally for the first publish.

---

## 10. Release plan

| Version | Contents |
|---|---|
| `0.5.0` | Shared runtime, explicit API, docs site, examples, CI, visual tests, published to npm |
| `0.6.0` | API polish from real usage, `palette="auto"`, adaptive quality, handle methods |
| `1.0.0` | Frozen API, migration guide, docs audit, accessibility sign-off, stable release |

No new scenes before `1.0.0`. After 1.0, add at most two scenes (murmuration, koi) only if usage justifies them.

---

## 11. Work plan

### Phase 0 — Hygiene (1–2 days)

- Add Biome, CI skeleton, Changesets, `.nvmrc`.
- Add `publint`, `attw`, `size-limit`.
- Add `CONTRIBUTING.md`, `SECURITY.md`, issue/PR templates.
- Add `examples/` skeleton.
- Verify npm name and auth requirements.

**Deliverable:** green CI on the current code, no behavior changes.

### Phase 1 — Core consolidation (3–4 days)

- Move sharks into `src/scenes/sharks/`.
- Extract `core/runtime.ts`, `core/grid.ts`, `core/types.ts`.
- Migrate four engines to the shared runtime.
- Extract shared React/custom-element factories.
- Preserve all public imports and behavior; all 18 tests stay green.

**Deliverable:** one runtime, four thin scenes, no duplicate lifecycle code.

### Phase 2 — API polish (2–3 days)

- Add shared `SceneOptions`, `SceneHandle`, `SceneStats`.
- Add `aspectRatio`, `paused`, `onReady`, `className`/`style`/`id` pass-through.
- Add scene handle methods (`splash`, `dispatch`, `shockwave`, `throwBall`).
- Add `palette="auto"` and `fontFamily`.
- Add adaptive quality (opt-out).
- Document breaking changes from 0.4.0.

**Deliverable:** one predictable API across all four components.

### Phase 3 — Docs and examples (4–6 days)

- Scaffold Astro + Starlight.
- Build landing page, four scene pages, playground, API reference.
- Add Vite React, Next, plain HTML, Astro examples.
- Add live controls and copy-paste snippets.
- Deploy to GitHub Pages.

**Deliverable:** a docs site good enough to link from npm and the README.

### Phase 4 — Quality gates (2–3 days)

- Visual regression baselines.
- Axe and reduced-motion tests.
- Perf smoke test.
- Size budgets and package checks.
- Release workflow with provenance.

**Deliverable:** CI that would catch a broken palette, a collapsed canvas, or a 2× bundle.

### Phase 5 — Release 0.5.0 (1 day)

- Changeset, changelog, version bump.
- `npm publish --provenance`.
- GitHub release, README update, social preview.

**Deliverable:** installable package with docs.

### Phase 6 — Harden to 1.0 (3–5 days, after feedback)

- Fix API friction from real usage.
- Complete accessibility and SSR audits.
- Freeze API, write migration guide, tag 1.0.

**Estimated total:** 3–4 weeks for `0.5.0`; 4–5 weeks for `1.0`.

---

## 12. Acceptance criteria

- [ ] `npm install ascii-things` works in Vite React, Next App Router, Astro, and plain HTML.
- [ ] All four scenes share one documented props/options contract.
- [ ] Components have a usable default aspect ratio and never collapse silently.
- [ ] Docs site builds, deploys, and every example runs.
- [ ] CI runs lint, typecheck, unit, visual, a11y, perf, package, and size checks.
- [ ] `publint` and `attw` pass.
- [ ] One scene entry is ≤ 20 kB gzip; all four ≤ 60 kB.
- [ ] 60 fps at 1440×900; 4K stays within `maxCells`.
- [ ] Reduced motion and `calm` verified.
- [ ] SSR/hydration verified in Next and Astro.
- [ ] `0.5.0` published with provenance and changelog.
- [ ] Repo has contributing, security, and issue templates.

---

## 13. Risks

| Risk | Mitigation |
|---|---|
| Scope creep into a general engine | Freeze at four scenes; reject plugin/API requests before 1.0 |
| Shared-runtime refactor changes behavior | Characterize current behavior with tests and visual snapshots before moving code |
| Canvas accessibility is inherently limited | Decorative by default, `label`, handle methods, docs honesty |
| Visual tests are flaky across fonts/OS | Pin Chromium, fixed seed/time, small tolerance, Linux-only baselines |
| npm publishing/provenance setup | Do a dry run with `npm pack`; configure `NPM_TOKEN` before release day |
| Docs become stale | Generate API tables from types where possible; test snippets |
| Bundle budget slips | `size-limit` in CI from Phase 0 |
| Users expect a design system | Positioning: “living ASCII scenes”, not a general UI kit |

---

## 14. Decisions to approve

1. **Docs stack:** Astro + Starlight + React islands (recommended) vs VitePress.
2. **Module format:** ESM-only for 1.0 (recommended) vs ESM + CJS.
3. **Default sizing:** `aspect-ratio: 16 / 9` with `height="100%"` opt-in (recommended) vs current “parent must size it”.
4. **Scope:** freeze at four scenes until 1.0 (recommended) vs add murmuration/koi now.
5. **Release:** publish `0.5.0` after Phases 0–4 (recommended) vs stay unpublished until 1.0.
6. **Shared runtime refactor:** do it before docs (recommended) vs document the current duplication first.

If these defaults are approved, execution starts with Phase 0 and Phase 1.

---

## 15. First week, concretely

**Day 1**
- Add Biome, CI skeleton, Changesets, size-limit, publint, attw.
- Confirm npm auth path.

**Day 2–3**
- Move sharks into `src/scenes/sharks/`.
- Extract `core/runtime.ts` and `core/grid.ts`.
- Keep all tests and imports green.

**Day 4–5**
- Migrate robots to the shared runtime.
- Extract the React and custom-element factories.
- Add `aspectRatio` and `paused`.

**End of week**
- Four scenes on one runtime.
- One API shape.
- CI green.
- A short demo video/GIF for the docs hero.

---

## Approval

Reply with **“approved”** to accept the six recommended defaults, or list the decisions you want changed. No implementation starts until then.
