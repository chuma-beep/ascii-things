# From `ascii-sharks` to a library of living ASCII scenes

Research notes · 20 Oct 2026

---

## TL;DR

> **Update (20 Oct 2026):** the repo owner confirmed the project is MIT. A
> `LICENSE` and `"license": "MIT"` are now in the repo. The audit below is kept
> as written; the license blocker is resolved. Keep clear attribution to the
> original author.
>
> **Name decision:** the package is **`ascii-things`**. The name is deliberately
> broader than sea life because the next scenes are **moving robots**, a
> **jellyfish bloom**, and a **robot dog**, not another fish. “Scenes” remains
> the unit; “things” is the umbrella.

- **What the repo is:** 1,532 lines of TypeScript, zero runtime dependencies, 29.8 kB built (12.0 kB gzip), one canvas. It is not an ASCII renderer demo — it is a small **artificial-life simulation** plus a **procedural ASCII rasterizer**.
- **What it does well:** believable collective behaviour (boids, alarm contagion, pursuit, hunger), beautiful procedural shark silhouettes, and a runtime that already handles resize, DPR, off-screen pausing, and reduced motion.
- **Why it is not a library yet:** the scene is hardcoded into the engine (`OceanEngine`, `World`, `AsciiRenderer`), there are no options, no seed, no lifecycle beyond `destroy`, the React wrapper is excluded from typechecking, and the package is `private`. (License was the other blocker; it is now MIT.)
- **Market:** ASCII tooling is crowded — textmode.js (engine), ASCIIGround (patterns), Asciitopia (patterns), ASCII Magic (634 canned pieces), Rune (video-to-ASCII). Almost all are engines, patterns, or loops. **Agent-based living scenes are the gap.**
- **Signal:** `ascii-sharks` has 261 GitHub stars with no npm package, no docs, and one scene. The generic engines have fewer. People are reacting to the *creature and the aliveness*, not to the ASCII machinery.
- **Recommendation:** build a small, opinionated family of **living ASCII scenes** — sharks first, then 2–3 scenes that prove the runtime — on a zero-dependency core, with per-scene subpath exports, React and custom-element adapters, real accessibility, and a hard performance budget. Do **not** build a general textmode engine or a 600-piece content library.
- **License:** resolved by owner confirmation; MIT has been added. Keep attribution to the original author and the “haj” origin.
- **Next step:** Phase 1–3 in §7: extract the runtime, ship `sharks`, then build a second scene as the architecture test.

---

## 1. What the repo actually is

| Property | Value |
|---|---|
| Upstream | `stackedlol/ascii-sharks` (261 stars, 16 forks, now MIT per owner) |
| Fork studied | `chuma-beep/ascii-things` (renamed from `ascii-sharks`; was up to date with upstream `main`) |
| Commits | 2 (`first commit`, `chill readme`) |
| Language | TypeScript 99%, HTML 1% |
| Source | 1,532 LOC TypeScript (1,933 lines including comments and blanks) |
| Dependencies | none at runtime; Vite + TypeScript for dev |
| Build | 29.80 kB JS, 11.99 kB gzip |
| Demo | `npm install && npm run dev`; `?sharks=thresher,hammerhead,mako,nurse` |
| Tests / lint / CI | none |

### File map

| File | LOC | Responsibility |
|---|---:|---|
| `src/world.ts` | 663 | Fish boids, shark steering, hunting, feeding, respawn, spatial hash |
| `src/renderer.ts` | 926 | Grid, shark shape data, rasterization, shading, wake, dots, fish |
| `src/engine.ts` | 135 | Canvas lifecycle: fixed timestep, resize, visibility, pointer, reduced motion |
| `src/species.ts` | 65 | Five fish species and their schooling traits |
| `src/math.ts` | 53 | Clamp, angle diff, hash, divergence-free current |
| `src/react.tsx` | 21 | Thin React wrapper (excluded from `tsconfig`) |
| `src/index.ts` | 3 | Public exports |
| `demo.ts` | 7 | Query-string shark roster |

### Architecture as it stands

```
demo.ts / react.tsx
        │
   OceanEngine ────── canvas lifecycle, rAF loop, input
        │
   ┌────┴─────┐
   World      AsciiRenderer
   │          │
 fish +     grid + shark shapes
 sharks     + wake + shading
   │          │
   └──── math.ts / species.ts
```

The dependency direction is clean and the files are small enough to hold in your head. That is a good sign for extraction.

---

## 2. Technical teardown

### 2.1 The loop

`OceanEngine` (src/engine.ts:23) owns the canvas and runs a fixed 1/60 s simulation with a max of four catch-up steps per frame. The renderer gets the *frame* `dt`, the world gets fixed steps. It also:

- caps DPR at 2;
- resizes via `ResizeObserver`;
- pauses when the canvas leaves the viewport via `IntersectionObserver`;
- listens for pointer movement/click on `window` and converts to canvas-local coordinates;
- reloads the font and redraws when the webfont arrives;
- under `prefers-reduced-motion`, settles the world for four simulated seconds and draws a single still frame;
- cleans up every listener in `destroy()`.

This is a better runtime than most hobby canvas demos ship. It is also the part that should become generic almost unchanged.

### 2.2 Fish: boids with a nervous system

Each fish (src/world.ts:268) is an agent with position, velocity, species, alarm, depth, tail phase, and a shared `millDir`. Neighbour queries use a spatial hash whose bucket size equals the perception radius, so only the 3×3 neighbouring buckets are scanned.

The behaviour is a Couzin-style zone model rather than plain Reynolds boids:

- **Separation** is elliptical in cell space (wide along x, tight along y), so every fish gets its own glyph instead of collapsing into a blob.
- **Alignment** and **cohesion** apply only to the same species; other species get a softer repulsion so schools stay distinct.
- **Blind spot:** neighbours directly behind (cos < −0.6) are ignored. A fish cannot see a shark coming from behind it.
- **Alarm contagion:** direct fear sets `alarm`; neighbours relay 86% of theirs, scaled by `min(1, dt*6)`. Alarm decays exponentially. A school can bolt from its edge even when most fish cannot see the threat.
- **Fountain flee:** fish flee away from the nearest point on the shark's front half *and* sideways to the side of the shark's path they are on. This produces the split-around-the-predator effect seen in bait balls.
- **Current:** `current()` in src/math.ts:45 is the curl of a drifting stream function. It is divergence-free, so it moves schools around without piling them into a corner. That is a small but unusually correct detail.
- **Speed envelope:** each species has cruise, min, and max speeds. Panic raises the preferred speed and the cap; `verticalDrag` keeps fish cruising level except when bolting.
- **Soft walls:** a 36 px margin pushes fish back in; fish are allowed 60 px off-screen so bodies can enter and leave naturally.

Five species (sardine, anchovy, silverside, mackerel, goby) differ in speed, school size, spacing, alignment, cohesion, jitter, milling, and vertical drag. The mix is what makes the water look like an ecosystem rather than one school.

Population is `clamp(round(W*H / 4400), 85, 340)` (src/world.ts:180). At 1440×900 that is 295 fish; at 1080p and above it hits the 340 cap.

### 2.3 Sharks: steering, spine, hunger

Each shark (src/world.ts:459) blends several desired directions:

1. **Momentum** — current heading.
2. **Wander** — a slowly drifting offset on a circle ahead of the snout.
3. **Pursuit** — if hungry and a target exists, aim at the fish's position plus 0.35 s of its velocity.
4. **Separation** — sample every fourth spine node of every other shark and push away.
5. **Headline exclusion** — an elliptical no-swim zone in the middle of the frame, so a landing-page headline stays readable.
6. **Frame recall** — once the snout leaves the frame, steer back to the centre. Bodies may dip off-screen; sharks do not leave for good.

The desired heading is rate-limited by an agility term that shrinks with length and speed, so sharks cannot pivot on the spot. Speed eases toward a cruise speed (`30 + L*0.04`) or a hunting burst. `turn` is smoothed and later used to bank the fins.

The body is a 20-node **follow-the-leader spine**: each node is placed at a fixed segment length behind the previous one, with a maximum bend of 0.16 rad per joint. The bend limit is what stops the body folding back through itself and gives the shark a natural C-curve at most.

**Hunting:** `findPrey` (src/world.ts:603) only considers fish in a forward cone (`cos > 0.2`) within `L*0.9 + 160` px. The score is:

```
distance × (1 + (1 − cos) × 0.8) × (1 + crowd × 0.07)
```

The crowd penalty is the interesting part: dense schools confuse the predator, so stragglers in sparse buckets get picked off. The shark sticks with its current target unless something scores 30% better. Hunger rises at 0.03/s and drops 0.16 per fish eaten. Feeding uses a mouth radius of `L*0.05 + 8` px at the snout.

Eaten fish respawn after 3–8 s, but only in a batch (at least 6 fish or 9 s since the last spawn). A new school swims in from a random edge, which keeps the population stable without teleporting fish into view.

### 2.4 Rendering: a grid of glyphs, not a DOM

`AsciiRenderer` draws everything into one 2D canvas. The cell size is:

```
cw = clamp(round(width / 124), 8, 13)
ch = round(cw * 1.45)
cols = ceil(width / cw)
rows = ceil(height / ch)
```

So the art targets roughly 124 columns, with a floor of 8 px and a ceiling of 13 px per cell. The canvas backing store is `width × height × min(devicePixelRatio, 2)`.

Draw order per frame:

1. **Static background** — black fill plus a 5.5%-white grid, snapped to device pixels, pre-rendered to an offscreen canvas.
2. **Dots / wake** — the cyan wake field, bucketed by colour and alpha and drawn in a counting-sorted batch.
3. **Heat** — red/orange `*` and `·` glyphs where a fish was eaten.
4. **Fish** — a single `-` per cell, bucketed into five brightness levels; near fish claim cells before far fish, and turning/alarmed fish glint.
5. **Sharks** — per-cell shaded blocks and glyphs.

The shark renderer is the most distinctive part:

- Each species is a **half-width function** `halfWidth(s)` over `s ∈ [0,1]` from snout to tail, plus fin parameters (pectoral, pelvic, caudal, dorsal, second dorsal), optional cephalofoil for hammerheads, eye/gill positions, and a tint.
- The simulation spine is combined with a travelling sine wave whose amplitude grows toward the tail, then re-parameterized by **arc length** so shape sampling is uniform along the body.
- For every cell in the shark's bounding box, `sampleShark` finds the nearest point on the spine, computes body coordinates `(s, v)`, and tests the body, fins, and head. Edges are **5× supersampled** (four corners plus centre). Coverage ≥ 0.6 and a centre hit become a solid skin cell; partial coverage becomes an **edge glyph** from `.',\`` or `:;`.
- Skin shading uses the across-body coordinate and a top-left light direction. A ramp maps bright skin to sparse glyphs (`:;t%SX8#@`) and shadow to dense ones. The first dorsal ridge is bright (`@8%`), the eye is `o`, gill slits darken every other band, and tiger bars / zebra spots are procedural markings anchored to body coordinates.
- Depth dims the palette (`0.7 + 0.3 * depth`), and smaller sharks are drawn first so the big one swims over them.
- A **wake field** is deposited under fish and shark tails, then blurred and decayed each frame. It is what makes the water feel disturbed rather than empty.
- A small fraction of shark cells re-roll to accent colours on a 2.4 Hz staggered clock, which gives the hide its shimmer.

The fish are deliberately minimal: one dash per cell, brightness from depth, turn rate, and alarm. Against the dense shark blocks they read as a school rather than as individual fish.

### 2.5 Details worth keeping

These are the things that make the scene feel alive and should survive the extraction:

1. Blind spot behind each fish.
2. Alarm relayed neighbour-to-neighbour, weaker each hop.
3. Fountain flee to the side of the predator's path.
4. Divergence-free current.
5. Elliptical personal space matched to the glyph grid.
6. Crowd penalty when choosing prey.
7. Follow-the-leader spine with a per-joint bend limit.
8. Travelling body wave + arc-length sampling.
9. 5× supersampled silhouettes with edge glyphs.
10. Painter's order + cell claiming for depth.
11. Settle-then-freeze for reduced motion (not a blank first frame).
12. Fixed timestep with a catch-up cap.
13. Font-load redraw.
14. A soft no-swim zone reserved for the headline.

---

## 3. Measured characteristics

### Build and size

- Production build: **29.80 kB** raw, **11.99 kB gzip**, 10 modules.
- TypeScript: 1,532 LOC of code.
- Zero runtime dependencies.

### Frame rate

Measured in headless Chromium on this machine, DPR 1, 2.5 s per viewport, after a 1.2 s settle:

| Viewport | Cell | Grid | Cells | FPS | p50 frame | p95 frame |
|---|---|---|---:|---:|---:|---:|
| 1280×720 | 10×15 | 128×48 | 6,144 | 60 | 16.7 ms | 16.8 ms |
| 1440×900 | 12×17 | 120×53 | 6,360 | 60 | 16.7 ms | 16.7 ms |
| 1920×1080 | 13×19 | 148×57 | 8,436 | 60 | 16.7 ms | 16.7 ms |
| 2560×1440 | 13×19 | 197×76 | 14,972 | 60 | 16.7 ms | 16.7 ms |
| 3840×2160 | 13×19 | 296×114 | 33,744 | 60 | 16.7 ms | 16.7 ms |

Headless Chromium is not a phone, and rAF can be vsync-bound even when there is headroom. Treat this as “the current design fits a 16.7 ms budget on a desktop”, not as a mobile guarantee.

The important scaling fact: **cell size stops growing at 13 px**, so above roughly 1,612 px wide the cell count grows linearly with area. A 4K canvas is 33.7k cells, 5.3× the 1440×900 count. That is the main performance risk for a library that will be dropped into full-bleed heroes.

### Population and scale formulas

- Fish: `clamp(round(W*H / 4400), 85, 340)`.
- Shark base length: `clamp(min(W,H) * 0.44, 170, 430)` px.
- Shark length: `baseLength * size`; `size` is relative, not normalized to the roster maximum.
- Perception radius: `max(cellH * 3, cellW * 5.5)`.
- Wake diffusion: 5-point blur (`(4*self + 4 neighbours) / 8`) with `exp(-dt*1.5)` decay.
- Heat decay: `exp(-dt*2.2)`.

---

## 4. Library-readiness audit

### What is strong

- Clean one-way dependency graph; no circular imports.
- Zero runtime dependencies and a tiny bundle.
- A real artificial-life model, not a looped animation.
- Procedural art: no images, sprites, or external assets.
- Runtime concerns already handled: resize, DPR, off-screen pause, reduced motion, font loading, pointer input, cleanup.
- Performance-aware drawing: pre-rendered grid, bucketed fills, cell claiming, painter's order.
- The comments explain *why*, not just *what*.

### What blocks reuse

| Area | Current state | Why it blocks a library |
|---|---|---|
| Scene API | `OceanEngine` hardcodes `World` + `AsciiRenderer` | There is no seam for a second scene |
| Options | Constructor takes only `SharkSpec[]` | No palette, density, speed, seed, cell size, interactivity |
| Lifecycle | `destroy()` only | No pause/resume, no live option updates, no stats |
| Determinism | `Math.random()` throughout | No reproducible screenshots, tests, or shareable seeds |
| Theming | Black background, fixed colours/glyphs, 124-column target | Cannot match a host site or light theme natively |
| React | `src/react.tsx` is excluded from `tsconfig`; React is not a peer dep | It is untyped, untested, and drifts |
| Packaging | `private: true`, `main: src/index.ts`, no `exports`/`types`/`files` | Not publishable; consumers must compile TS |
| Accessibility | Canvas is `aria-hidden`, reduced motion handled | Good baseline, but no label/export story |
| Tests | None | No invariants, no visual regression, no perf budget |
| License | None at audit time | Resolved: owner confirmed MIT; `LICENSE` added |

### Concrete issues, by severity

**P0 — must fix before publishing**

1. **License (resolved).** Upstream had no `LICENSE` at audit time, and `package.json` had no `license`. The repo owner has confirmed the project is MIT; this fork now ships a `LICENSE` and `"license": "MIT"`. Keep attribution to the original author and confirm the “haj” origin when convenient.
2. **Not a package.** `"private": true`, `"main": "src/index.ts"`, no `exports`, no `types`, no `files`, no build target for a library. The Vite build is an app build, not a library build.
3. **React wrapper is outside typechecking.** `tsconfig.json` excludes `src/react.tsx`, and React is not a dependency or peer dependency. It would fail `tsc` if included.
4. **Scene semantics are fused into the runtime.** `OceanEngine`, `World`, and `AsciiRenderer` assume sharks, fish, and an ocean. A second scene cannot reuse the runtime without editing it.

**P1 — should fix for a credible v0.1**

5. **No seed.** `Math.random()` is used for seeding, wandering, jitter, respawn, and accents. Add a seeded PRNG and thread it through.
6. **No public options or lifecycle.** Add `pause`, `resume`, `setOptions`, `getStats`, and a typed options object.
7. **No palette or glyph theming.** The black background, cyan wake, fish dashes, shark ramps, and accent colours are constants. Extract them into a palette + glyph set.
8. **Fixed 124-column target and fixed 1.45 cell ratio.** Expose `columns` and measure the actual font metrics rather than assuming.
9. **4K cell explosion.** 33.7k cells at 4K. Add `maxCells` / adaptive column count.
10. **Resize is not fully coherent.** `World.resize` clamps fish but does not rescale shark lengths, orbit radii, or population; `AsciiRenderer.resize` reallocates every field on every resize event, with no debounce.
11. **2.4 Hz accent shimmer.** Close to the WCAG 2.3.1 three-flashes-per-second threshold. Provide a `calm` mode and disable flicker under reduced motion.
12. **React wrapper has no default sizing.** The canvas needs CSS width/height or it silently renders nothing. Default to `display:block; width:100%; height:100%` and document that the parent needs a height.
13. **No tests, lint, CI, or size budget.**

**P2 — cleanup**

14. **Dormant ambient-dot system.** `dotKind` is initialized to 0 for every cell (src/renderer.ts:382) and never set, so the blue/green/red/pale dot colours and their alpha buckets are dead code; only the cyan wake renders. Either remove the unused infrastructure or expose ambient dots as an option.
15. **Unused `fishCount` constructor parameter** in `World` (src/world.ts:114). `OceanEngine` never passes it.
16. **Per-frame allocations** in `drawDots` (`new Int32Array`, `.slice()`). Reuse scratch buffers.
17. **Events accumulate while paused.** `world.events` is only drained by `render()`. Cap or clear on pause.
18. **No debugging surface.** Expose `world`/`renderer` in dev, or a `getStats()` with fish count, shark count, cells, and frame time.

**P3 — polish**

19. Restore the shark gallery from the original README; it is part of the appeal and was removed in the “chill readme” commit.
20. Add a demo GIF/MP4 and an OG image; the visual is the hook.
21. Consider a `capture()` / `toText()` API for stills, tests, and accessible fallbacks.

---

## 5. Landscape and positioning

State as of 20 Oct 2026.

| Project | What it is | Model | Deps | License | Stars | Strength | Gap |
|---|---|---|---|---|---:|---|---|
| **textmode.js** | Creative-coding library for real-time ASCII/textmode | Engine (WebGL2) | 0 | MIT | 174 | General grid API, performance, export | You bring the content; not drop-in |
| **ASCII Magic** | 634 animated ASCII pieces + web component + terminal | Content library | 0 | MIT | 57 | Enormous catalog, per-piece modules, `<ascii-art>` | Pieces are canned `draw(t)` loops, not simulations |
| **ASCIIGround** | Animated ASCII backgrounds | Pattern engine | 0 | MIT | 11 | Perlin/rain/noise, 2D + WebGL, config | Backgrounds, not creatures/scenes |
| **Asciitopia** | 7 animated ASCII patterns | Pattern library | 0 | MIT | 8 | Palettes, React wrapper, fire/rain/aurora/bonsai | Pattern-based, not agent-based |
| **Rune** | Video → ASCII React components | Content library | React | MIT | 25 | Video pipeline, CDN frames, CLI | Pre-baked loops; heavy content pipeline |
| **react-ascii-text** | Figlet text animation hook | Text effect | React | MIT | — | Simple text animation | Text only |
| **ascii-sharks** | One artificial-life shark scene | Scene | 0 | none | 261 | Alive, distinctive art, tiny | One scene, app-shaped code |

### The map

```
                    agent / simulation
                           ▲
                           │
                  ascii-sharks ●
                           │        ○ proposed family
                           │
        engine ◄───────────┼───────────► ready-made content
                           │
        textmode.js ●      │      ● ASCII Magic
        ASCIIGround ●      │      ● Rune
                           │      ● Asciitopia
                           ▼
                     pattern / loop
```

### The gap

The market has plenty of **ASCII renderers** and plenty of **canned ASCII content**. It has very little **living ASCII**: scenes with autonomous agents, emergent behaviour, and a different show every time you load the page.

That is exactly what `ascii-sharks` is, and it is why it has more stars than the generic libraries despite being one scene with no package. The audience is responding to the habitat, not the glyph renderer.

### What not to build

- **A general textmode engine.** textmode.js already has WebGL2, a grid API, export, a gallery, and a community. Competing there is a scope trap.
- **A 600-piece content library.** ASCII Magic has a catalog moat and a per-piece module system. You cannot out-content it at the start.
- **An image/video-to-ASCII converter.** Rune and the ASCII Magic editor own that workflow.

### What to build

A **small, curated family of living scenes** with a shared runtime:

> **Not an animation. A habitat.**

Each scene is a self-contained, drop-in ambient illustration: a shark tank, a murmuration, a koi pond, a jellyfish drift. Same runtime, same DX, different motion grammar. The value is in the behaviour and the art direction, not in the number of scenes.

---

## 6. The library

### 6.1 Thesis and name

**Thesis:** the best ASCII components are not loops; they are small ecosystems. Ship a handful of scenes that feel alive, make them trivial to drop into a page, and make the runtime invisible.

Candidate names (npm availability checked 20 Oct 2026):

| Name | npm | Fit | Note |
|---|---|---|---|
| `ascii-things` | free | Broad, descriptive | **Chosen**; sharks now, robots next |
| `ascii-fauna` | free | Evocative, animal-specific | Strong brand, narrower catalog |
| `living-ascii` | free | Category-defining | Less brandable |
| `asciiscape` | free | Scenes/landscapes | Vague |
| `glyphlife` | free | Brandable | Weaker discoverability |

`ascii-ocean` is taken (1.2.2). If you want a scoped package, `@your-scope/ascii-things` is safest, but a short unscoped name is better for adoption. **Chosen: `ascii-things`**, tagline **“Living ASCII scenes.”** The first scene is sharks; the next is moving robots.

### 6.2 Architecture

Keep the current layering, but invert the ownership: the runtime owns the canvas, the scene owns the world and the drawing.

```
@ascii-things (single package, subpath exports)
│
├── core/            runtime
│   ├── engine       fixed timestep, resize, DPR, visibility, reduced motion
│   ├── grid         cell metrics, glyph batching, text export
│   ├── rng          seeded PRNG
│   ├── palette      tokens + presets
│   └── input        pointer → scene input
│
├── motion/          reusable behaviour
│   ├── boids        separation / alignment / cohesion / flee
│   ├── steering     seek, wander, contain, pursuit
│   ├── hash         spatial hash
│   └── flow         divergence-free current
│
├── render/          reusable drawing
│   ├── glyphs       ramps, shading, coverage
│   ├── silhouette   spine + half-width + fins rasterizer
│   └── field        wake / heat diffusion
│
├── scenes/
│   ├── sharks       world + species + shapes + renderer
│   ├── murmuration  ...
│   ├── jellyfish    ...
│   └── koi          ...
│
├── react            <AsciiSharks />, <AsciiScene />
└── element          <ascii-sharks>, <ascii-scene>
```

**Design rule:** the core never imports a scene. Scenes import the core. A scene can be deleted without touching the runtime.

**v1 recommendation:** keep the shared toolkit *internal*. Ship black-box scenes with typed options. Expose the toolkit only when there is real demand; a public plugin API is a maintenance contract you cannot easily undo.

### 6.3 Public API

```ts
// vanilla
import { createSharks } from "ascii-things/sharks";

const scene = createSharks(canvas, {
  sharks: [
    { kind: "hammerhead", size: 1 },
    { kind: "mako", size: 0.8 },
  ],
  palette: "abyss",
  columns: 124,
  density: 0.9,
  seed: 42,
  speed: 1,
  interactive: true,
  maxDpr: 2,
  maxCells: 16000,
});

scene.pause();
scene.resume();
scene.setOptions({ palette: "paper", speed: 0.8 });
scene.resize();
scene.destroy();
```

```tsx
// React
import { AsciiSharks } from "ascii-things/react";

<AsciiSharks
  sharks={[{ kind: "greathammer", size: 1.1 }]}
  palette="abyss"
  className="hero-art"
/>
```

```html
<!-- HTML / Astro / Vue / Svelte -->
<script type="module" src="https://cdn.jsdelivr.net/npm/ascii-things/dist/element.js"></script>
<ascii-sharks palette="abyss" interactive></ascii-sharks>
```

**Options:**

| Option | Type | Default | Notes |
|---|---|---|---|
| `sharks` | `SharkSpec[]` | four classics | `kind`, `size`; size is relative |
| `palette` | `PaletteName \| Palette` | `"abyss"` | `abyss`, `paper`, `neon`, `mono`, `sepia` |
| `columns` | `number` | `124` | Art-direction knob; cell size derives from it |
| `density` | `number` | `1` | Scales fish population, clamped |
| `seed` | `number` | random | Deterministic world; useful for tests/stills |
| `speed` | `number` | `1` | Time scale; `0` freezes |
| `interactive` | `boolean` | `true` | Pointer flee + click splash |
| `maxDpr` | `number` | `2` | Backing-store cap |
| `maxCells` | `number` | `16000` | Adaptive quality cap |
| `calm` | `boolean` | `false` | Disables accent flicker and glints |
| `label` | `string` | — | If set, canvas becomes `role="img"` with this label |
| `onEvent` | `(e) => void` | — | `eat` / `splash`, for sound or haptics |

**Lifecycle:** `pause()`, `resume()`, `setOptions(partial)`, `resize()`, `destroy()`, `getStats()`. The runtime handles visibility and reduced motion; `pause()` is for application-level control (modals, route transitions).

### 6.4 Scene contract

```ts
export interface SceneContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  grid: GlyphGrid;
  rng: Rng;
  palette: Palette;
  reducedMotion: boolean;
}

export interface SceneInstance {
  step(dt: number): void;
  render(dt: number): void;
  resize?(width: number, height: number, cellW: number, cellH: number): void;
  setOptions?(options: Partial<SceneOptions>): void;
  destroy?(): void;
}

export interface SceneDefinition<O> {
  id: string;
  defaults: O;
  create(ctx: SceneContext, options: O): SceneInstance;
}
```

`createSharks` is a thin wrapper around `createScene(sharksDefinition, canvas, options)`. The runtime owns the loop, resize, DPR, intersection, visibility, reduced motion, pointer, and cleanup. The scene owns its state, `step`, and `render`.

This is deliberately small. It is enough for sharks, birds, jellyfish, and koi; it does not try to be a game engine.

### 6.5 Scene catalog

Effort assumes one experienced developer who knows the code. “Reuse” is the share of the existing simulation/rendering primitives that carries over.

| Scene | Simulation | Rendering | Reuse | New work | Effort | Priority |
|---|---|---|---|---|---|---|
| **Sharks** | boids + alarm + pursuit + hunger | spine silhouettes, fins, wake | 100% | packaging, options, palette | 3–5 d | **P0** |
| **Robots** | state machine + steering + sensors + dock/charge | boxy silhouettes, tracks, antennae, scan arcs, sparks | 35% | robot shapes, state machine, scan layer | 5–7 d | **P1 — implemented** (`src/robots`) |
| **Robot dog** | gait + state machine + ball physics + dock/charge | side-view quadruped, two-segment legs, yard props | 30% | leg IK/gait, poses, ball, yard | 5–7 d | **P1 — implemented** (`src/dog`) |
| **Murmuration** | boids + hawk + alarm | small bird glyphs, sky, dusk palette | 75% | bird silhouette, sky layers | 3–5 d | **P1** |
| **Jellyfish drift** | flow field + pulse | radial bell + tentacles, bioluminescence | 40% | radial rasterizer, glow | 4–6 d | **P1 — implemented** (`src/jellyfish`) |
| **Koi pond** | boids + food + ripples | spine silhouettes, lily pads, rings | 70% | ripples, food, static flora | 4–6 d | **P1** |
| **Fireflies** | wander + blink | glow field, grass silhouettes | 50% | glow, static environment | 2–3 d | P2 |
| **Ant colony** | pheromone field + trail following | path glyphs, nest, food | 30% | stigmergy field | 5–8 d | P2 |
| **Whale** | spine + plankton + depth | large silhouette, particles | 60% | scale, particle layer | 3–5 d | P2 |
| **Eel / snake** | chain + wander | spine, no fins | 80% | shape data | 2–3 d | P3 |
| **Crab / tide pool** | wander + waves | small silhouette, water line | 50% | shape, tide layer | 3–5 d | P3 |

**v1 catalog: sharks + robots + jellyfish + robot dog + murmuration + koi.** Six scenes give six distinct motion grammars (pursuit, task-driven machines, drifting, legged gait, flocking, pond life) and prove the runtime is not shark-shaped. Sharks, robots, jellyfish, and the robot dog are implemented (Oct 2026); murmuration remains the cheapest reuse test and the next planned scene.

### 6.6 Packaging and adapters

Single package, ESM-first, subpath exports:

```json
{
  "name": "ascii-things",
  "version": "0.1.0",
  "license": "MIT",
  "type": "module",
  "sideEffects": false,
  "files": ["dist"],
  "exports": {
    ".":          { "types": "./dist/index.d.ts",            "import": "./dist/index.js" },
    "./sharks":   { "types": "./dist/scenes/sharks.d.ts",    "import": "./dist/scenes/sharks.js" },
    "./react":    { "types": "./dist/react.d.ts",            "import": "./dist/react.js" },
    "./element":  { "types": "./dist/element.d.ts",          "import": "./dist/element.js" }
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "react-dom": { "optional": true }
  }
}
```

Why a single package rather than a monorepo: one install, one version, one docs site, and subpath imports still tree-shake. Split into `@ascii-things/core` + `@ascii-things/sharks` only when scenes need independent release cadence or the catalog exceeds ~10 scenes.

**Adapters:**

- **Vanilla:** `createSharks(canvas, options)`.
- **React:** thin `useEffect` wrapper; `"use client"`; no top-level `window` access; `destroy()` on unmount; `setOptions` for live palette/speed changes.
- **Custom element:** `<ascii-sharks>` with observed attributes (`palette`, `seed`, `density`, `speed`, `sharks`, `label`). Shadow DOM with `:host { display:block }`, canvas inherits `font-family`. This is the “anyone can use it” path for HTML, Astro, Vue, Svelte, Webflow, and plain sites.
- **CDN:** `https://cdn.jsdelivr.net/npm/ascii-things/dist/element.js`. Also publish `dist/ascii-things.umd.js` only if there is demand; ESM is the default in 2026.

**Build:** `tsdown` or `tsup` to ESM + `.d.ts` + sourcemaps. Validate with `publint` and `attw`. Add `size-limit` in CI. Node 18+ for build tooling; browser target ES2020.

### 6.7 Theming and accessibility

**Palette tokens** (semantic, not tint multipliers):

```ts
interface Palette {
  background: string;
  grid: string;
  fish: [string, string, string, string, string]; // 5 brightness levels
  wake: string;
  heat: string;
  shark: {
    body: string;
    fin: string;
    ridge: string;
    eye: string;
    mark: string;
    accents: string[];
  };
}
```

Presets: `abyss` (current), `paper` (light background, dark ink), `neon`, `mono`, `sepia`. The README's current light-theme advice (`filter: invert(1) hue-rotate(180deg)`) is a signal that native palettes are needed.

**Accessibility baseline:**

- Canvas is decorative by default: `aria-hidden="true"`.
- If `label` is provided: `role="img"`, `aria-label={label}`, no `aria-hidden`.
- Honor `prefers-reduced-motion`: settle the simulation for ~4 s, then render one still. Re-render on resize and font load. Do not show an empty first frame.
- `calm` mode disables the 2.4 Hz accent shimmer and fish glints. Under reduced motion, `calm` is forced on.
- Provide `toText()` for a plain-text snapshot (READMEs, tests, terminal, fallback).
- Keep a real heading/text next to the art; the canvas is decoration.
- Do not trap pointer events; `interactive` only affects the canvas, and touch scrolling must still work.

### 6.8 Performance budget

- **Target:** 60 fps at 1440×900 on a 2020 laptop; ≥ 30 fps on a mid-range phone.
- **Cell cap:** 16,000 cells. At 4K, reduce columns from 124 until the grid fits; the art gets chunkier but the cost stays flat. The current 33.7k-cell 4K grid is the outlier.
- **DPR cap:** 2.
- **Allocations:** reuse scratch buffers in `drawDots`; avoid per-frame `new` in the hot path.
- **Batching:** keep the fish/dot bucket approach; consider quantizing shark colours into a small palette and batching fills if profiling shows state changes dominate.
- **Adaptive quality:** measure a rolling frame time. If p95 > 22 ms for 60 frames, reduce columns by 10% (floor 64) and fish density by 10%; restore slowly when p95 < 14 ms. Make it opt-out (`adaptive: false`) for deterministic captures.
- **Mobile:** a 390×844 CSS canvas at DPR 2 is ~3.5k cells, so mobile is cheap; the risk is desktop 4K and high-refresh displays.
- **CI:** a perf smoke test at 1920×1080 and 3840×2160 with a generous threshold; visual snapshots at fixed seed/time.

### 6.9 Testing and CI

- **Unit:** `angleDiff`, `clamp`, seeded RNG, spatial hash, steering vectors, fish invariants (finite positions, bounds, population).
- **Simulation:** run 600 steps with a fixed seed; assert no NaN, sharks stay near the frame, fish population within bounds, no spine folding (segment length and bend limit).
- **Visual:** Playwright screenshots at `t = 0.5, 2, 5` for each scene/palette; pixel diff with a tolerance. Run on Linux Chromium only for stability.
- **Package:** `publint`, `attw`, `size-limit` (e.g. 15 kB gzip per scene), `tsc --noEmit` including the React entry.
- **A11y:** axe on the docs page; verify `aria-hidden`/`role="img"` and reduced-motion behavior.
- **CI matrix:** Node 20/22, Chromium; cache Vite.

### 6.10 Docs and launch

- **Landing page:** full-bleed live scene, one-line install, “not an animation. a habitat.”
- **Per-scene page:** live demo, controls (palette, columns, density, speed, seed, sharks), copy-paste for React/HTML/JS, props table, performance note, accessibility note.
- **How it works:** a short explainer on boids, alarm contagion, and the spine rasterizer. This is the differentiator; make it legible.
- **Gallery:** all scenes, with MP4/GIF previews.
- **Agent-friendly docs:** `llms.txt` and copy-paste prompts, since a lot of 2026 adoption happens through coding agents.
- **Launch assets:** a 10–20 s hero video, a README GIF, an OG image, and a comparison page (“vs textmode.js / ASCII Magic”) that is fair and links out.
- **Restore the shark gallery** from the original README. It is charming and it sells the art.

---

## 7. Extraction plan

### Phase 0 — legal and repo hygiene (0.5–1 day)

- Confirm authorship of `stackedlol/ascii-sharks` and the “haj” origin.
- License is resolved: `LICENSE` (MIT) and `"license": "MIT"` are in the repo. Keep attribution to the original author.
- Add `README`, `CONTRIBUTING`, `CODE_OF_CONDUCT`, issue templates.
- Add ESLint/Prettier (or Biome), Vitest, GitHub Actions.
- Remove `private`, add `exports`/`types`/`files`, set up a library build.
- Decide the name and scope.

### Phase 1 — extract the runtime (2–3 days)

- Create `core/engine.ts` from `engine.ts`, with a `SceneDefinition` seam.
- Create `core/grid.ts` from the cell metrics, background grid, text batching, and `toText()`.
- Create `core/rng.ts` (mulberry32 or xoshiro128**), replace `Math.random()` everywhere.
- Create `core/palette.ts`, move colours and glyph ramps out of the renderer.
- Add `maxCells`, `columns`, `maxDpr`, `calm`, `seed`, and `speed`.
- Add `pause`/`resume`/`setOptions`/`getStats`.
- Verify the shark scene looks identical at the same seed.

### Phase 2 — extract the shark scene (2–3 days)

- Move `World`, `species`, and shark shapes into `scenes/sharks/`.
- Split reusable motion (`boids`, `steering`, `hash`, `flow`) into `motion/`.
- Split reusable rendering (`silhouette`, `field`, `glyphs`) into `render/`.
- Keep the shark-specific shape table and behaviour in the scene.
- Add the palette mapping and remove hardcoded colours.
- Add invariants and visual snapshots.

### Phase 3 — adapters and docs (3–5 days)

- React wrapper with correct types, `"use client"`, default sizing, cleanup, and live options.
- Custom element with observed attributes and shadow DOM.
- Vanilla entry and CDN build.
- Docs site with live controls and copy-paste.
- README, GIF, OG image.
- Publish `0.1.0` (or keep private until Phase 4).

### Phase 4 — second scene: robots (5–7 days)

Build **moving robots**. This is now the requested second scene and the real architecture test: robots need a state machine (patrol, scan, pursue, dock, charge), sensor cones, and a boxy silhouette renderer, none of which the shark scene provides. If robots require editing the core, the abstraction is wrong. Murmuration can follow as the cheap boids-reuse test.

### Phase 5 — catalog (1–2 weeks per 2 scenes)

- Murmuration (cheap boids reuse, sky palette).
- Jellyfish (proves the radial renderer and flow field). **Implemented** in `src/jellyfish`.
- Robot dog (proves a side-view legged silhouette, gait, and prop physics). **Implemented** in `src/dog`.
- Koi (proves static environment + ripples + food).
- Fireflies (cheap, high charm).
- Then stop and measure adoption before adding more.

### Suggested file tree

```
src/
  core/
    engine.ts
    grid.ts
    rng.ts
    palette.ts
    input.ts
    types.ts
  motion/
    boids.ts
    steering.ts
    hash.ts
    flow.ts
  render/
    glyphs.ts
    silhouette.ts
    field.ts
  scenes/
    sharks/
      world.ts
      species.ts
      shapes.ts
      renderer.ts
      index.ts
      react.tsx
      element.ts
  index.ts
  react.ts
  element.ts
```

### Rough timeline

- **Week 1:** Phase 0–1. A publishable core and an identical shark scene.
- **Week 2:** Phase 2–3. `0.1.0` with sharks, React, custom element, docs.
- **Week 3:** Phase 4. Robots; fix whatever the second scene exposes.
- **Weeks 4–5:** Jellyfish + koi, gallery, launch.
- **Then:** measure installs, GitHub stars, issues, and time-to-first-scene; add scenes only if the pattern holds.

---

## 8. Risks and open questions

1. **License/provenance (resolved).** MIT has been added after owner confirmation. Keep attribution to the original author and the “haj” origin; if the upstream author objects, be prepared to adjust.
2. **Scope creep into an engine.** The temptation is to expose every primitive and become textmode.js. Resist. Ship scenes, not a framework.
3. **Art is the bottleneck, not code.** The shark shapes are excellent. A jellyfish or koi that looks like a blob will sink the library. Budget art-direction time per scene; prototype in the browser, not in code.
4. **Samey-ness.** Four scenes that all use boids will feel like one trick. Each needs a distinct motion grammar and palette.
5. **Performance on low-end devices.** The 4K cell explosion and per-cell text rendering are the risks. Cap cells, measure on a real phone, and make adaptive quality opt-out.
6. **Font/metrics drift.** Canvas glyph placement depends on a monospace font. Measure the font or expose cell size; test fallbacks (Geist Mono, ui-monospace, Menlo, monospace).
7. **Accessibility/SEO.** Canvas art is invisible to crawlers and screen readers. Keep it decorative, offer `label` and `toText()`, and never put essential content in it.
8. **Competition speed.** textmode.js, ASCII Magic, ASCIIGround, Asciitopia, and Rune are all active around the same time. Differentiation (living scenes) matters more than feature count.
9. **Maintenance.** Every scene is a small simulation with its own tuning. Six scenes is a sustainable catalog; twenty is a product.
10. **Naming/trademark.** Check npm and a trademark search before investing in a brand. `ascii-things` is free on npm today but names move fast.
11. **API stability.** Keep v0.x honest: document that options may change. Do not promise a plugin API until scene #2 and #3 have stabilized it.
12. **Monetization (if any).** MIT core + paid custom scenes/editor is the cleanest split; do not put the catalog behind a license that conflicts with the “anyone can use” goal.

### Decisions I need from you

1. **Do you own the upstream code?** Is `stackedlol` your account, and does “haj” permit redistribution?
2. **React-first or vanilla-first?** The custom element is the widest reach; React is the loudest audience. I would ship both, with vanilla as the source of truth.
3. **Catalog scope:** animals only (`ascii-fauna`) or broader living scenes (`ascii-things`)?
4. **Art direction:** keep the current sparse, near-monochrome abyss look, or support multiple palettes from day one? (I recommend palettes, with `abyss` as the default.)
5. **Distribution:** npm package, copy-paste registry (`npx ascii-things add sharks`), or both? (I recommend npm first, registry later.)

---

## 9. Sources

- Upstream repo: <https://github.com/stackedlol/ascii-sharks>
- Fork studied: <https://github.com/chuma-beep/ascii-things> (renamed from `ascii-sharks`)
- textmode.js: <https://github.com/humanbydefinition/textmode.js> · <https://code.textmode.art/>
- ASCII Magic: <https://github.com/kailashsr38/ascii-magic-art> · <https://www.ascii-magic.com/ascii/docs>
- ASCIIGround: <https://github.com/Eoic/ASCIIGround> · <https://www.npmjs.com/package/asciiground>
- Asciitopia: <https://github.com/flawnn/asciitopia> · <https://www.npmjs.com/package/@asciitopia/core>
- Rune: <https://github.com/zeke-john/rune>
- react-ascii-text: <https://www.npmjs.com/package/react-ascii-text>
- WCAG 2.3.1 (three flashes or below threshold): <https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold.html>
- MDN Canvas API: <https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API>
- MDN `prefers-reduced-motion`: <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion>
