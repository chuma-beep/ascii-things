import { useEffect, useRef, useState } from "react";
import type { GlyphStyle, PaletteName } from "ascii-things";
import { createJellyfish } from "ascii-things/jellyfish";
import type { JellyfishStats } from "ascii-things/jellyfish";
import { createDog } from "ascii-things/dog";
import type { DogStats } from "ascii-things/dog";
import { createSharks } from "ascii-things/sharks";
import type { OceanStats } from "ascii-things/sharks";
import { createRobots } from "ascii-things/robots";
import type { RobotStats } from "ascii-things/robots";
import { createStarlings } from "ascii-things/starlings";
import type { StarlingStats } from "ascii-things/starlings";
import { createFireflies } from "ascii-things/fireflies";
import { createAnts } from "ascii-things/ants";
import { createKoi } from "ascii-things/koi";
import { createCity } from "ascii-things/city";
import { createServers } from "ascii-things/servers";
import { AsciiPrompt, AsciiReadout, AsciiSceneTabs, AsciiStage } from "ascii-things/ui";
import "ascii-things/ui.css";

export type SceneKey =
  | "sharks"
  | "robots"
  | "jellyfish"
  | "dog"
  | "starlings"
  | "fireflies"
  | "ants"
  | "koi"
  | "city"
  | "servers";

export interface SceneDemoProps {
  /** Which scene to mount. Defaults to the robot dog. */
  scene?: SceneKey;
  /** Starting palette. The tabs update it live. */
  palette?: PaletteName;
  /** Fixed world seed so screenshots and docs stay reproducible. */
  seed?: number;
  /** Art-direction target passed to the engine. */
  columns?: number;
  /** Simulation time scale. `0` freezes the world. */
  speed?: number;
  className?: string;
}

type DemoStats = Partial<OceanStats & RobotStats & JellyfishStats & DogStats & StarlingStats>;

interface DemoOptions {
  palette?: PaletteName;
  calm?: boolean;
  speed?: number;
}

interface DemoEngine {
  pause(): void;
  resume(): void;
  setOptions(options: DemoOptions): void;
  getStats(): object;
  destroy(): void;
  throwBall?: (x: number, y: number) => void;
  trigger?: (action: string, x: number, y: number) => void;
}

const PALETTES = [
  { id: "abyss", label: "Abyss", meta: "night" },
  { id: "paper", label: "Paper", meta: "day" },
  { id: "neon", label: "Neon", meta: "loud" },
  { id: "mono", label: "Mono", meta: "quiet" },
] as const;

const SCENES: Record<SceneKey, { label: string; stage: string; interaction: string }> = {
  sharks: {
    label: "Shark tank",
    stage: "SHARK TANK / OPEN WATER",
    interaction: "Click to splash. Move the pointer to scatter the school.",
  },
  robots: {
    label: "Robot floor",
    stage: "ROBOT FLOOR / SHIFT 02",
    interaction: "Click the floor to dispatch the nearest idle robot.",
  },
  jellyfish: {
    label: "Jellyfish bloom",
    stage: "JELLYFISH BLOOM / CURRENT 04",
    interaction: "Click to send a shockwave through the bloom.",
  },
  dog: {
    label: "Robot dog",
    stage: "ROBOT DOG / TEST YARD",
    interaction: "Click to throw the ball, or type a command below.",
  },
  starlings: {
    label: "Starlings",
    stage: "STARLINGS / EVENING SKY",
    interaction: "Click to scatter the murmuration.",
  },
  fireflies: {
    label: "Fireflies",
    stage: "FIREFLIES / DUSK MEADOW",
    interaction: "Click to flare the meadow.",
  },
  ants: {
    label: "Ants",
    stage: "ANTS / FORAGE TRAIL",
    interaction: "Click to drop a crumb on the trail.",
  },
  koi: {
    label: "Koi",
    stage: "KOI / GARDEN POND",
    interaction: "Click to feed the pond.",
  },
  city: {
    label: "City",
    stage: "CITY / NIGHT GRID",
    interaction: "Click to rush the traffic grid.",
  },
  servers: {
    label: "Servers",
    stage: "SERVERS / RACK 04",
    interaction: "Click to ping a rack.",
  },
};

const labels: Record<SceneKey, string> = {
  sharks: "A live ASCII shark tank",
  robots: "A live ASCII robot factory floor",
  jellyfish: "A live ASCII jellyfish bloom",
  dog: "A live ASCII robot dog test yard",
  starlings: "A live ASCII murmuration of starlings",
  fireflies: "A live ASCII firefly meadow",
  ants: "A live ASCII ant foraging trail",
  koi: "A live ASCII koi pond",
  city: "A live ASCII city grid at night",
  servers: "A live ASCII server rack",
};

function buildEngine(
  scene: SceneKey,
  canvas: HTMLCanvasElement,
  palette: PaletteName,
  calm: boolean,
  seed: number,
  columns: number,
  glyphs: GlyphStyle,
): DemoEngine {
  const shared = {
    palette,
    seed,
    columns,
    calm,
    interactive: true,
    label: labels[scene],
  };

  switch (scene) {
    case "sharks":
      return createSharks(canvas, { ...shared, density: 0.85, glyphs }) as unknown as DemoEngine;
    case "robots":
      return createRobots(canvas, { ...shared, count: 6 }) as unknown as DemoEngine;
    case "jellyfish":
      return createJellyfish(canvas, { ...shared, count: 5, glyphs }) as unknown as DemoEngine;
    case "dog":
      return createDog(canvas, {
        ...shared,
        count: 1,
        dogs: [{ size: 1.15 }],
        spread: [0.62, 0.62],
      }) as unknown as DemoEngine;
    case "starlings":
      return createStarlings(canvas, { ...shared, count: 120 }) as unknown as DemoEngine;
    case "fireflies":
      return createFireflies(canvas, { ...shared, count: 70 }) as unknown as DemoEngine;
    case "ants":
      return createAnts(canvas, { ...shared, count: 45 }) as unknown as DemoEngine;
    case "koi":
      return createKoi(canvas, { ...shared, count: 6, glyphs }) as unknown as DemoEngine;
    case "city":
      return createCity(canvas, shared) as unknown as DemoEngine;
    case "servers":
      return createServers(canvas, shared) as unknown as DemoEngine;
  }
}

const ACTIONS: Record<SceneKey, string> = {
  sharks: "splash",
  robots: "dispatch",
  jellyfish: "shockwave",
  dog: "throwBall",
  starlings: "scatter",
  fireflies: "flare",
  ants: "crumb",
  koi: "feed",
  city: "rush",
  servers: "ping",
};

const PROMPTS: Record<SceneKey, { label: string; placeholder: string; action: string }> = {
  sharks: {
    label: "Make a ripple",
    placeholder: "Disturb the water…",
    action: "Splash",
  },
  robots: {
    label: "Dispatch a unit",
    placeholder: "Assign a job…",
    action: "Dispatch",
  },
  jellyfish: {
    label: "Send a shockwave",
    placeholder: "Disturb the current…",
    action: "Pulse",
  },
  dog: {
    label: "Tell the dog what to fetch",
    placeholder: "Throw the ball, ask for a sit…",
    action: "Throw",
  },
  starlings: {
    label: "Scatter the murmuration",
    placeholder: "Startle the flock…",
    action: "Scatter",
  },
  fireflies: {
    label: "Flare the meadow",
    placeholder: "Call the fireflies…",
    action: "Flare",
  },
  ants: {
    label: "Drop a crumb",
    placeholder: "Send the colony foraging…",
    action: "Crumb",
  },
  koi: {
    label: "Feed the pond",
    placeholder: "Scatter a handful of food…",
    action: "Feed",
  },
  city: {
    label: "Rush the traffic",
    placeholder: "Change the rhythm…",
    action: "Rush",
  },
  servers: {
    label: "Ping a rack",
    placeholder: "Send a packet…",
    action: "Ping",
  },
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function fnv1a(text: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function numeric(value: number | undefined) {
  return value === undefined ? "—" : Math.round(value).toLocaleString("en-US");
}

/**
 * A small, SSR-safe React island used throughout the docs. The DOM chrome is
 * rendered on the server; the canvas engine starts in an effect, so no browser
 * API is touched during render.
 */
export default function SceneDemo({
  scene = "dog",
  palette: initialPalette = "abyss",
  seed = 7,
  columns = 110,
  speed = 1,
  className,
}: SceneDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DemoEngine | null>(null);
  const [palette, setPalette] = useState<PaletteName>(initialPalette);
  const [glyphs, setGlyphs] = useState<GlyphStyle>("ascii");
  const [calm, setCalm] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState<DemoStats | null>(null);
  const [echo, setEcho] = useState("yard@04 · awaiting command");
  const reducedMotion = useReducedMotion();
  const effectiveCalm = calm || reducedMotion;
  const meta = SCENES[scene];
  const showGlyphSelector = scene === "sharks" || scene === "jellyfish" || scene === "koi";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = buildEngine(scene, canvas, palette, effectiveCalm, seed, columns, glyphs);
    engine.setOptions({ speed });
    engineRef.current = engine;

    const refresh = () => setStats(engine.getStats() as DemoStats);
    refresh();
    const timer = window.setInterval(refresh, 500);

    return () => {
      window.clearInterval(timer);
      engine.destroy();
      engineRef.current = null;
    };
    // Palette and calm are applied live below; only the world identity or the
    // glyph variant remounts.
  }, [scene, seed, columns, glyphs]);

  useEffect(() => {
    engineRef.current?.setOptions({ palette, calm: effectiveCalm, speed });
  }, [palette, effectiveCalm, speed]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (paused) engine.pause();
    else engine.resume();
  }, [paused]);

  const command = (value: string) => {
    setEcho(`> ${value}`);
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine?.trigger) return;
    const hash = fnv1a(value);
    engine.trigger(
      ACTIONS[scene],
      canvas.clientWidth * (0.2 + ((hash % 1000) / 1000) * 0.6),
      canvas.clientHeight * 0.7,
    );
  };

  const readout = (() => {
    if (scene === "sharks") {
      return [
        { label: "CELLS", value: numeric(stats?.cells) },
        { label: "SHARKS", value: numeric(stats?.sharks) },
        { label: "FISH", value: numeric(stats?.fish) },
        { label: "FPS", value: numeric(stats?.fps) },
      ];
    }
    if (scene === "robots") {
      return [
        { label: "CELLS", value: numeric(stats?.cells) },
        { label: "UNITS", value: numeric(stats?.robots) },
        { label: "CHARGING", value: numeric(stats?.charging) },
        { label: "FPS", value: numeric(stats?.fps) },
      ];
    }
    if (scene === "jellyfish") {
      return [
        { label: "CELLS", value: numeric(stats?.cells) },
        { label: "JELLIES", value: numeric(stats?.jellies) },
        { label: "PULSING", value: numeric(stats?.pulsing) },
        { label: "FPS", value: numeric(stats?.fps) },
      ];
    }
    if (scene === "starlings") {
      return [
        { label: "CELLS", value: numeric(stats?.cells) },
        { label: "BIRDS", value: numeric(stats?.birds) },
        { label: "PREDATORS", value: numeric(stats?.predators) },
        { label: "FPS", value: numeric(stats?.fps) },
      ];
    }
    if (scene === "fireflies") {
      return [
        { label: "CELLS", value: numeric(stats?.cells) },
        { label: "FIREFLIES", value: numeric(stats?.fireflies) },
        { label: "LIT", value: numeric(stats?.lit) },
        { label: "FPS", value: numeric(stats?.fps) },
      ];
    }
    if (scene === "ants") {
      return [
        { label: "CELLS", value: numeric(stats?.cells) },
        { label: "ANTS", value: numeric(stats?.ants) },
        { label: "FOOD", value: numeric(stats?.food) },
        { label: "FPS", value: numeric(stats?.fps) },
      ];
    }
    if (scene === "koi") {
      return [
        { label: "CELLS", value: numeric(stats?.cells) },
        { label: "KOI", value: numeric(stats?.koi) },
        { label: "RIPPLES", value: numeric(stats?.ripples) },
        { label: "FPS", value: numeric(stats?.fps) },
      ];
    }
    if (scene === "city") {
      return [
        { label: "CELLS", value: numeric(stats?.cells) },
        { label: "CARS", value: numeric(stats?.cars) },
        { label: "LIGHTS", value: numeric(stats?.lights) },
        { label: "FPS", value: numeric(stats?.fps) },
      ];
    }
    if (scene === "servers") {
      return [
        { label: "CELLS", value: numeric(stats?.cells) },
        { label: "RACKS", value: numeric(stats?.servers) },
        { label: "PACKETS", value: numeric(stats?.packets) },
        { label: "FPS", value: numeric(stats?.fps) },
      ];
    }
    return [
      { label: "CELLS", value: numeric(stats?.cells) },
      { label: "UNITS", value: numeric(stats?.dogs) },
      { label: "STATE", value: stats?.state ? stats.state.toUpperCase() : "—" },
      { label: "FPS", value: numeric(stats?.fps) },
    ];
  })();

  const status = reducedMotion
    ? "Reduced motion is on. The scene settles to one still frame and pointer actions are off."
    : paused
      ? "Scene paused. Press Resume to start the clock again."
      : meta.interaction;

  return (
    <section
      className={["scene-demo", className].filter(Boolean).join(" ")}
      aria-label={`${meta.label} live demo`}
    >
      <div className="scene-demo-head">
        <AsciiSceneTabs
          scenes={PALETTES.map((item) => ({ ...item }))}
          value={palette}
          onChange={(id) => setPalette(id as PaletteName)}
          ariaLabel="Demo palette"
        />
        <div className="scene-demo-actions">
          {showGlyphSelector && (
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
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            className="scene-demo-button"
            aria-pressed={effectiveCalm}
            onClick={() => setCalm((value) => !value)}
          >
            {effectiveCalm ? "Calm on" : "Calm off"}
          </button>
        </div>
      </div>

      <AsciiStage
        label={scene === "dog" ? undefined : meta.stage}
        status={paused ? "PAUSED" : reducedMotion ? "STILL" : "LIVE"}
        aspectRatio="16 / 9"
        ariaLabel={`${meta.label} scene preview`}
        footer={<AsciiReadout items={readout} ariaLabel={`${meta.label} live statistics`} />}
      >
        <canvas
          ref={canvasRef}
          className={`ascii-things ascii-${scene}`}
          role="img"
          aria-label={labels[scene]}
        />
      </AsciiStage>

      <p className="scene-demo-status" aria-live="polite">
        {status}
      </p>

      <AsciiPrompt
        label={PROMPTS[scene].label}
        placeholder={PROMPTS[scene].placeholder}
        actionLabel={PROMPTS[scene].action}
        status={echo}
        hint={`Enter submits · ${meta.interaction}`}
        disabled={reducedMotion}
        onSubmit={command}
      />

      <p className="scene-demo-note">
        Seed <code>{seed}</code>, columns <code>{columns}</code>, and speed <code>{speed}</code> are
        fixed in this demo. The palette and calm controls update the running engine without
        rebuilding the world.
      </p>
    </section>
  );
}
