import { useEffect, useRef, useState } from "react";
import { PALETTES, type GlyphStyle, type PaletteName } from "ascii-things";
import { createSharks } from "ascii-things/sharks";
import { createRobots } from "ascii-things/robots";
import { createJellyfish } from "ascii-things/jellyfish";
import { createDog } from "ascii-things/dog";
import { createStarlings } from "ascii-things/starlings";
import { createFireflies } from "ascii-things/fireflies";
import { createAnts } from "ascii-things/ants";
import { createKoi } from "ascii-things/koi";
import { createCity } from "ascii-things/city";
import { createServers } from "ascii-things/servers";
import type { SceneKey } from "./SceneDemo";

const SCENES: Array<{ id: SceneKey; label: string }> = [
  { id: "sharks", label: "Shark tank" },
  { id: "robots", label: "Robot floor" },
  { id: "jellyfish", label: "Jellyfish bloom" },
  { id: "dog", label: "Robot dog" },
  { id: "starlings", label: "Starlings" },
  { id: "fireflies", label: "Fireflies" },
  { id: "ants", label: "Ants" },
  { id: "koi", label: "Koi pond" },
  { id: "city", label: "City grid" },
  { id: "servers", label: "Server rack" },
];

type Engine = {
  destroy(): void;
  setOptions(options: Record<string, unknown>): void;
  pause(): void;
  resume(): void;
};

function mountScene(
  scene: SceneKey,
  canvas: HTMLCanvasElement,
  palette: PaletteName,
  seed: number,
  columns: number,
  glyphs: GlyphStyle,
): Engine {
  const shared = { palette, seed, columns, calm: false, interactive: false, label: "" };
  switch (scene) {
    case "sharks":
      return createSharks(canvas, { ...shared, density: 0.9, glyphs }) as unknown as Engine;
    case "robots":
      return createRobots(canvas, { ...shared, count: 6 }) as unknown as Engine;
    case "jellyfish":
      return createJellyfish(canvas, { ...shared, count: 5, glyphs }) as unknown as Engine;
    case "dog":
      return createDog(canvas, {
        ...shared,
        count: 1,
        dogs: [{ size: 1.2 }],
        spread: [0.62, 0.62],
      }) as unknown as Engine;
    case "starlings":
      return createStarlings(canvas, { ...shared, count: 120 }) as unknown as Engine;
    case "fireflies":
      return createFireflies(canvas, { ...shared, count: 70 }) as unknown as Engine;
    case "ants":
      return createAnts(canvas, { ...shared, count: 45 }) as unknown as Engine;
    case "koi":
      return createKoi(canvas, { ...shared, count: 6, glyphs }) as unknown as Engine;
    case "city":
      return createCity(canvas, { ...shared, count: 18 }) as unknown as Engine;
    case "servers":
      return createServers(canvas, { ...shared, count: 8 }) as unknown as Engine;
  }
}

export default function SocialCardStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [scene, setScene] = useState<SceneKey>("sharks");
  const [palette, setPalette] = useState<PaletteName>("abyss");
  const [seed, setSeed] = useState(42);
  const [columns, setColumns] = useState(124);
  const [glyphs, setGlyphs] = useState<GlyphStyle>("ascii");
  const [title, setTitle] = useState("ASCII scenes. One canvas.");
  const [subtitle, setSubtitle] = useState("React, Vue, or plain HTML · ascii-things.dev");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = mountScene(scene, canvas, palette, seed, columns, glyphs);
    engineRef.current = engine;
    const timer = window.setInterval(() => engine.setOptions({}), 1000);
    return () => {
      window.clearInterval(timer);
      engine.destroy();
      engineRef.current = null;
    };
  }, [scene, palette, seed, columns, glyphs]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const download = () => {
    const sceneCanvas = canvasRef.current;
    if (!sceneCanvas) return;
    const output = document.createElement("canvas");
    output.width = 1200;
    output.height = 630;
    const context = output.getContext("2d");
    if (!context) return;

    const background = PALETTES[palette].background;
    context.fillStyle = background;
    context.fillRect(0, 0, output.width, output.height);

    const scale = Math.max(output.width / sceneCanvas.width, output.height / sceneCanvas.height);
    const width = sceneCanvas.width * scale;
    const height = sceneCanvas.height * scale;
    context.drawImage(
      sceneCanvas,
      (output.width - width) / 2,
      (output.height - height) / 2,
      width,
      height,
    );

    const gradient = context.createLinearGradient(0, 0, 0, output.height);
    gradient.addColorStop(0, "rgba(0,0,0,0.08)");
    gradient.addColorStop(0.55, "rgba(0,0,0,0.35)");
    gradient.addColorStop(1, "rgba(0,0,0,0.88)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, output.width, output.height);

    const dark = PALETTES[palette].dark;
    context.fillStyle = dark ? "#ece8df" : "#171717";
    context.font = "600 62px Charter, Georgia, serif";
    context.fillText(title.slice(0, 60), 64, 500);
    context.fillStyle = dark ? "rgba(236,232,223,0.7)" : "rgba(23,23,23,0.7)";
    context.font = "500 24px ui-monospace, SFMono-Regular, monospace";
    context.fillText(subtitle.slice(0, 80), 66, 548);
    context.fillStyle = "#ff7a1a";
    context.fillRect(64, 572, 92, 4);

    output.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ascii-card-${scene}-${seed}.png`;
      anchor.rel = "noopener";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Card downloaded.");
    }, "image/png");
  };

  return (
    <section className="docs-playground" aria-labelledby="social-card-title">
      <h2 id="social-card-title" className="docs-playground-title">
        Social card
      </h2>
      <p className="docs-playground-lede">
        Pick a scene, palette, and seed, then add a title. The download is a 1200 × 630 PNG with the
        live canvas baked into it.
      </p>

      <div className="social-card">
        <canvas
          ref={canvasRef}
          className={`ascii-things ascii-${scene}`}
          role="img"
          aria-label={title}
        />
        <div className="social-card__scrim" />
        <div className="social-card__copy">
          <strong>{title || "Untitled card"}</strong>
          <span>{subtitle}</span>
        </div>
      </div>

      <div className="docs-playground-controls">
        <label>
          <span>Scene</span>
          <select
            value={scene}
            onChange={(event) => setScene(event.currentTarget.value as SceneKey)}
          >
            {SCENES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Palette</span>
          <select
            value={palette}
            onChange={(event) => setPalette(event.currentTarget.value as PaletteName)}
          >
            {Object.keys(PALETTES).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
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
          <span>Glyphs</span>
          <select
            value={glyphs}
            onChange={(event) => setGlyphs(event.currentTarget.value as GlyphStyle)}
          >
            <option value="ascii">ASCII</option>
            <option value="kanji">Kanji</option>
          </select>
        </label>
      </div>

      <div className="docs-playground-controls">
        <label>
          <span>Title</span>
          <input
            type="text"
            value={title}
            maxLength={60}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />
        </label>
        <label>
          <span>Subtitle</span>
          <input
            type="text"
            value={subtitle}
            maxLength={80}
            onChange={(event) => setSubtitle(event.currentTarget.value)}
          />
        </label>
      </div>

      <div className="docs-playground-actions">
        <button type="button" className="scene-demo-button" onClick={download}>
          Download 1200 × 630 PNG
        </button>
        <a className="scene-demo-button" href="/playground/">
          Open in playground
        </a>
        {notice ? <span className="scene-demo-status">{notice}</span> : null}
      </div>
    </section>
  );
}
