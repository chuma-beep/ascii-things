import { useEffect, useRef, useState } from "react";
import { PALETTE_META, PALETTE_NAMES, type GlyphStyle, type PaletteName } from "ascii-things";
import { AsciiSceneTabs } from "ascii-things/ui";
import SceneDemo, { type SceneKey } from "./SceneDemo";
import {
  createScenePreset,
  encodePreset,
  normalizePreset,
  presetKey,
  presetUrl,
  readPresetFromUrl,
  replacePresetInUrl,
  type SharePreset,
} from "../lib/presets";

interface SceneMeta {
  id: SceneKey;
  label: string;
  meta: string;
  factory: string;
  module: string;
  component: string;
  tag: string;
  glyphs: boolean;
}

const SCENES: SceneMeta[] = [
  {
    id: "sharks",
    label: "Sharks",
    meta: "hunt",
    factory: "createSharks",
    module: "ascii-things/sharks",
    component: "AsciiSharks",
    tag: "ascii-sharks",
    glyphs: true,
  },
  {
    id: "robots",
    label: "Robots",
    meta: "work",
    factory: "createRobots",
    module: "ascii-things/robots",
    component: "AsciiRobots",
    tag: "ascii-robots",
    glyphs: false,
  },
  {
    id: "jellyfish",
    label: "Jellyfish",
    meta: "drift",
    factory: "createJellyfish",
    module: "ascii-things/jellyfish",
    component: "AsciiJellyfish",
    tag: "ascii-jellyfish",
    glyphs: true,
  },
  {
    id: "dog",
    label: "Dog",
    meta: "fetch",
    factory: "createDog",
    module: "ascii-things/dog",
    component: "AsciiDog",
    tag: "ascii-dog",
    glyphs: false,
  },
  {
    id: "starlings",
    label: "Starlings",
    meta: "murmur",
    factory: "createStarlings",
    module: "ascii-things/starlings",
    component: "AsciiStarlings",
    tag: "ascii-starlings",
    glyphs: false,
  },
  {
    id: "fireflies",
    label: "Fireflies",
    meta: "blink",
    factory: "createFireflies",
    module: "ascii-things/fireflies",
    component: "AsciiFireflies",
    tag: "ascii-fireflies",
    glyphs: false,
  },
  {
    id: "ants",
    label: "Ants",
    meta: "forage",
    factory: "createAnts",
    module: "ascii-things/ants",
    component: "AsciiAnts",
    tag: "ascii-ants",
    glyphs: false,
  },
  {
    id: "koi",
    label: "Koi",
    meta: "feed",
    factory: "createKoi",
    module: "ascii-things/koi",
    component: "AsciiKoi",
    tag: "ascii-koi",
    glyphs: true,
  },
  {
    id: "city",
    label: "City",
    meta: "rush",
    factory: "createCity",
    module: "ascii-things/city",
    component: "AsciiCity",
    tag: "ascii-city",
    glyphs: false,
  },
  {
    id: "servers",
    label: "Servers",
    meta: "ping",
    factory: "createServers",
    module: "ascii-things/servers",
    component: "AsciiServers",
    tag: "ascii-servers",
    glyphs: false,
  },
];

const SCENE_BY_ID = Object.fromEntries(SCENES.map((scene) => [scene.id, scene])) as Record<
  SceneKey,
  SceneMeta
>;

const PALETTE_SHORT: Record<PaletteName, string> = {
  abyss: "night",
  paper: "day",
  neon: "loud",
  mono: "quiet",
  amber: "crt",
  blueprint: "draft",
  newsprint: "press",
  terminal: "phosphor",
};

const STORAGE_KEY = "ascii-things:playground-presets:v1";
const MAX_SAVED = 12;
const DEFAULT_PRESET = {
  scene: "dog" as SceneKey,
  palette: "abyss" as PaletteName,
  glyphs: "ascii" as GlyphStyle,
  seed: 7,
  columns: 110,
  density: 1,
  speed: 1,
  calm: false,
  paused: false,
  interactive: true,
};

interface PlaygroundState {
  scene: SceneKey;
  palette: PaletteName;
  glyphs: GlyphStyle;
  seed: number;
  columns: number;
  density: number;
  speed: number;
  calm: boolean;
  paused: boolean;
  interactive: boolean;
}

interface SavedPreset {
  name: string;
  preset: SharePreset;
}

type CodeTab = "vanilla" | "react" | "element";

const CODE_TABS: Array<{ id: CodeTab; label: string }> = [
  { id: "vanilla", label: "Vanilla" },
  { id: "react", label: "React" },
  { id: "element", label: "Custom element" },
];

function round(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function count(base: number, density: number) {
  return Math.max(1, Math.round(base * density));
}

function sceneOptions(state: PlaygroundState): Record<string, unknown> {
  const shared: Record<string, unknown> = {
    palette: state.palette,
    seed: state.seed,
    columns: state.columns,
    speed: round(state.speed),
    calm: state.calm,
    interactive: state.interactive,
  };
  if (state.paused) shared.paused = true;

  switch (state.scene) {
    case "sharks":
      return {
        ...shared,
        density: round(0.85 * state.density),
        glyphs: state.glyphs,
      };
    case "robots":
      return { ...shared, count: count(6, state.density) };
    case "jellyfish":
      return { ...shared, count: count(5, state.density), glyphs: state.glyphs };
    case "dog":
      return {
        ...shared,
        count: 1,
        dogs: [{ size: 1.15 }],
        spread: [0.62, 0.62],
      };
    case "starlings":
      return { ...shared, count: count(120, state.density) };
    case "fireflies":
      return { ...shared, count: count(70, state.density) };
    case "ants":
      return { ...shared, count: count(45, state.density) };
    case "koi":
      return { ...shared, count: count(6, state.density), glyphs: state.glyphs };
    case "city":
      return { ...shared, count: count(18, state.density) };
    case "servers":
      return { ...shared, count: count(8, state.density) };
  }
}

function elementAttributes(state: PlaygroundState): string[] {
  const meta = SCENE_BY_ID[state.scene];
  const attributes = [
    `palette="${state.palette}"`,
    `seed="${state.seed}"`,
    `columns="${state.columns}"`,
    `speed="${round(state.speed)}"`,
  ];
  if (state.calm) attributes.push("calm");
  if (state.paused) attributes.push("paused");
  if (!state.interactive) attributes.push('interactive="false"');
  if (meta.glyphs) attributes.push(`glyphs="${state.glyphs}"`);

  switch (state.scene) {
    case "sharks":
      attributes.push(`density="${round(0.85 * state.density)}"`);
      break;
    case "robots":
      attributes.push(`count="${count(6, state.density)}"`);
      break;
    case "jellyfish":
      attributes.push(`count="${count(5, state.density)}"`);
      break;
    case "dog":
      attributes.push('count="1"');
      break;
    case "starlings":
      attributes.push(`count="${count(120, state.density)}"`);
      break;
    case "fireflies":
      attributes.push(`count="${count(70, state.density)}"`);
      break;
    case "ants":
      attributes.push(`count="${count(45, state.density)}"`);
      break;
    case "koi":
      attributes.push(`count="${count(6, state.density)}"`);
      break;
    case "city":
      attributes.push(`count="${count(18, state.density)}"`);
      break;
    case "servers":
      attributes.push(`count="${count(8, state.density)}"`);
      break;
  }

  return attributes;
}

function jsValue(value: unknown): string {
  return JSON.stringify(value);
}

function jsOptions(options: Record<string, unknown>, indent = "  "): string {
  return Object.entries(options)
    .map(([key, value]) => `${indent}${key}: ${jsValue(value)},`)
    .join("\n");
}

function reactValue(value: unknown): string {
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number" || typeof value === "boolean") return `{${String(value)}}`;
  return `{${JSON.stringify(value)}}`;
}

function renderCode(tab: CodeTab, state: PlaygroundState): string {
  const meta = SCENE_BY_ID[state.scene];
  const options = sceneOptions(state);

  if (tab === "vanilla") {
    return `import { ${meta.factory} } from "${meta.module}";

const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
const scene = ${meta.factory}(canvas, {
${jsOptions(options)}
});

// Later: scene.pause(), scene.resume(), scene.setOptions({ palette: "amber" })`;
  }

  if (tab === "react") {
    const props = Object.entries(options)
      .map(([key, value]) => `        ${key}=${reactValue(value)}`)
      .join("\n");
    return `import { ${meta.component} } from "ascii-things/react";

export function Scene() {
  return (
    <div style={{ height: 420 }}>
      <${meta.component}
${props}
      />
    </div>
  );
}`;
  }

  return `<script type="module">
  import "ascii-things/element";
</script>

<div style="height: 420px">
  <${meta.tag} ${elementAttributes(state).join(" ")}></${meta.tag}>
</div>`;
}

function parseSaved(raw: string): SavedPreset[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        if (typeof entry !== "object" || entry === null) return null;
        const name = typeof entry.name === "string" ? entry.name.trim() : "";
        const preset = normalizePreset(entry.preset);
        if (!name || !preset) return null;
        return { name: name.slice(0, 48), preset };
      })
      .filter((entry): entry is SavedPreset => entry !== null)
      .slice(0, MAX_SAVED);
  } catch {
    return [];
  }
}

export default function Playground() {
  const [scene, setScene] = useState<SceneKey>(DEFAULT_PRESET.scene);
  const [palette, setPalette] = useState<PaletteName>(DEFAULT_PRESET.palette);
  const [glyphs, setGlyphs] = useState<GlyphStyle>(DEFAULT_PRESET.glyphs);
  const [seed, setSeed] = useState(DEFAULT_PRESET.seed);
  const [columns, setColumns] = useState(DEFAULT_PRESET.columns);
  const [density, setDensity] = useState(DEFAULT_PRESET.density);
  const [speed, setSpeed] = useState(DEFAULT_PRESET.speed);
  const [calm, setCalm] = useState(DEFAULT_PRESET.calm);
  const [paused, setPaused] = useState(DEFAULT_PRESET.paused);
  const [interactive, setInteractive] = useState(DEFAULT_PRESET.interactive);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeTab, setCodeTab] = useState<CodeTab>("vanilla");
  const [presetName, setPresetName] = useState("");
  const [saved, setSaved] = useState<SavedPreset[]>([]);
  const nameRef = useRef<HTMLInputElement>(null);

  const state: PlaygroundState = {
    scene,
    palette,
    glyphs,
    seed,
    columns,
    density,
    speed,
    calm,
    paused,
    interactive,
  };
  const sceneMeta = SCENE_BY_ID[scene];
  const code = renderCode(codeTab, state);

  const applyPreset = (preset: SharePreset) => {
    if (preset.kind !== "scene") return;
    if (preset.scene) setScene(preset.scene);
    if (preset.palette) setPalette(preset.palette);
    if (preset.glyphs) setGlyphs(preset.glyphs);
    if (preset.seed !== undefined) setSeed(preset.seed);
    if (preset.columns !== undefined) setColumns(preset.columns);
    if (preset.density !== undefined) setDensity(preset.density);
    if (preset.speed !== undefined) setSpeed(preset.speed);
    if (preset.calm !== undefined) setCalm(preset.calm);
    if (preset.paused !== undefined) setPaused(preset.paused);
    if (preset.interactive !== undefined) setInteractive(preset.interactive);
  };

  useEffect(() => {
    const preset = readPresetFromUrl();
    if (preset?.kind === "surface") {
      window.location.replace(`/surface-playground/?p=${encodePreset(preset)}`);
      return;
    }
    if (preset?.kind === "scene") applyPreset(preset);
    setReady(true);
    // Hydration reads the URL once; later state changes are written back below.
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSaved(parseSaved(raw));
    } catch {
      // Storage can be unavailable in private or sandboxed contexts.
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    replacePresetInUrl(createScenePreset(state));
  }, [ready, scene, palette, glyphs, seed, columns, density, speed, calm, paused, interactive]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyLink = async () => {
    const url = presetUrl(createScenePreset(state));
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy this playground link", url);
    }
  };

  const persist = (next: SavedPreset[]) => {
    setSaved(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Keep the in-memory list even if storage is blocked.
    }
  };

  const savePreset = () => {
    const name = (presetName.trim() || `${sceneMeta.label} ${saved.length + 1}`).slice(0, 48);
    const preset = createScenePreset(state);
    const next = [{ name, preset }, ...saved.filter((entry) => entry.name !== name)].slice(
      0,
      MAX_SAVED,
    );
    persist(next);
    setPresetName("");
  };

  const loadPreset = (preset: SharePreset) => {
    applyPreset(preset);
    setReady(true);
  };

  const deletePreset = (name: string) => {
    persist(saved.filter((entry) => entry.name !== name));
  };

  const sceneItems = SCENES.map((item) => ({ id: item.id, label: item.label, meta: item.meta }));
  const paletteItems = PALETTE_NAMES.map((id) => ({
    id,
    label: PALETTE_META[id].label,
    meta: PALETTE_SHORT[id],
  }));

  return (
    <section className="docs-playground" aria-labelledby="playground-title">
      <h2 id="playground-title" className="docs-playground-title">
        Playground composer
      </h2>
      <p className="docs-playground-lede">
        Compose a scene, then share the exact link. The URL stores the scene, palette, glyph family,
        seed, cell size, density, speed, and interaction state. Save a few presets in this browser
        or copy the generated vanilla, React, or custom-element code.
      </p>

      <AsciiSceneTabs
        scenes={sceneItems}
        value={scene}
        onChange={(id) => setScene(id as SceneKey)}
        ariaLabel="Playground scene"
      />

      <AsciiSceneTabs
        scenes={paletteItems}
        value={palette}
        onChange={(id) => setPalette(id as PaletteName)}
        ariaLabel="Playground palette"
      />

      <div className="docs-playground-controls">
        <label>
          <span>Seed</span>
          <input
            type="number"
            min={0}
            step={1}
            value={seed}
            onChange={(event) => {
              const next = event.currentTarget.valueAsNumber;
              if (Number.isFinite(next)) setSeed(Math.max(0, Math.trunc(next)));
            }}
          />
        </label>
        <label>
          <span>Cell size</span>
          <input
            type="range"
            min={60}
            max={180}
            step={2}
            value={columns}
            onChange={(event) => setColumns(event.currentTarget.valueAsNumber)}
          />
          <output>{columns} col</output>
        </label>
        <label>
          <span>Density</span>
          <input
            type="range"
            min={0.5}
            max={1.8}
            step={0.05}
            value={density}
            onChange={(event) => setDensity(event.currentTarget.valueAsNumber)}
          />
          <output>{density.toFixed(2)}×</output>
        </label>
        <label>
          <span>Speed</span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={speed}
            onChange={(event) => setSpeed(event.currentTarget.valueAsNumber)}
          />
          <output>{speed.toFixed(2)}×</output>
        </label>
      </div>

      <div className="docs-playground-actions">
        {sceneMeta.glyphs && (
          <fieldset className="scene-demo-glyphs">
            <legend>Glyph style</legend>
            {(["ascii", "kanji"] as const).map((style) => (
              <button
                key={style}
                type="button"
                className="scene-demo-button"
                aria-pressed={glyphs === style}
                onClick={() => setGlyphs(style)}
              >
                {style === "ascii" ? "ASCII" : "Kanji"}
              </button>
            ))}
          </fieldset>
        )}
        <button
          type="button"
          className="scene-demo-button"
          aria-pressed={interactive}
          onClick={() => setInteractive((value) => !value)}
        >
          {interactive ? "Pointer on" : "Pointer off"}
        </button>
        <button
          type="button"
          className="scene-demo-button"
          aria-pressed={calm}
          onClick={() => setCalm((value) => !value)}
        >
          {calm ? "Calm on" : "Calm off"}
        </button>
        <button
          type="button"
          className="scene-demo-button"
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? "Resume" : "Pause"}
        </button>
        <button type="button" className="scene-demo-button" onClick={copyLink}>
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>

      <SceneDemo
        key={`${scene}-${seed}-${columns}-${glyphs}-${density}`}
        scene={scene}
        palette={palette}
        glyphs={glyphs}
        seed={seed}
        columns={columns}
        density={density}
        speed={speed}
        calm={calm}
        paused={paused}
        interactive={interactive}
      />

      <div className="docs-playground-share">
        <p>
          Showing <strong>{sceneMeta.label}</strong>. Every control is part of the shareable preset.{" "}
          <a href="/api/">See every option</a>.
        </p>
        <div className="docs-playground-save">
          <label>
            <span>Preset name</span>
            <input
              ref={nameRef}
              type="text"
              value={presetName}
              maxLength={48}
              placeholder={`${sceneMeta.label} study`}
              onChange={(event) => setPresetName(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") savePreset();
              }}
            />
          </label>
          <button type="button" className="scene-demo-button" onClick={savePreset}>
            Save preset
          </button>
        </div>
        {saved.length > 0 ? (
          <ul className="docs-playground-presets" aria-label="Saved playground presets">
            {saved.map((entry) => (
              <li key={`${entry.name}-${presetKey(entry.preset)}`}>
                <button type="button" onClick={() => loadPreset(entry.preset)}>
                  {entry.name}
                </button>
                <button
                  type="button"
                  className="docs-playground-delete"
                  aria-label={`Delete ${entry.name}`}
                  onClick={() => deletePreset(entry.name)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="docs-code">
        <div className="docs-code-tabs" role="tablist" aria-label="Code examples">
          {CODE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={codeTab === tab.id}
              onClick={() => setCodeTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <pre className="docs-code-panel" role="tabpanel">
          <code>{code}</code>
        </pre>
      </div>
    </section>
  );
}
