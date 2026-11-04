import { useEffect, useRef, useState } from "react";
import type { SurfaceVariant } from "ascii-things/webgl";
import { AsciiSurface } from "ascii-things/webgl/react";
import {
  SURFACE_VARIANTS,
  createSurfacePreset,
  presetPath,
  presetUrl,
  readPresetFromUrl,
  replacePresetInUrl,
  type SharePreset,
} from "../lib/presets";
import { recordCanvas } from "../lib/record-webm";

const DEFAULTS = {
  variant: "globe" as SurfaceVariant,
  density: 0.3,
  cell: 5,
  speed: 1,
  text: "",
  ramp: "",
  fg: "#7fbcff",
  bg: "#050607",
  accent: "#c7e8a4",
  interactive: false,
};

interface SurfacePlaygroundProps {
  initialPreset?: SharePreset;
}

export default function SurfacePlayground({ initialPreset }: SurfacePlaygroundProps) {
  const [variant, setVariant] = useState<SurfaceVariant>(DEFAULTS.variant);
  const [density, setDensity] = useState(DEFAULTS.density);
  const [cell, setCell] = useState(DEFAULTS.cell);
  const [speed, setSpeed] = useState(DEFAULTS.speed);
  const [text, setText] = useState(DEFAULTS.text);
  const [ramp, setRamp] = useState(DEFAULTS.ramp);
  const [fg, setFg] = useState(DEFAULTS.fg);
  const [bg, setBg] = useState(DEFAULTS.bg);
  const [accent, setAccent] = useState(DEFAULTS.accent);
  const [interactive, setInteractive] = useState(DEFAULTS.interactive);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recording, setRecording] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const applyPreset = (preset: SharePreset) => {
    if (preset.kind !== "surface") return;
    if (preset.variant) setVariant(preset.variant);
    if (preset.density !== undefined) setDensity(preset.density);
    if (preset.cell !== undefined) setCell(preset.cell);
    if (preset.speed !== undefined) setSpeed(preset.speed);
    if (preset.text !== undefined) setText(preset.text);
    if (preset.ramp !== undefined) setRamp(preset.ramp);
    if (preset.fg) setFg(preset.fg);
    if (preset.bg) setBg(preset.bg);
    if (preset.accent) setAccent(preset.accent);
    if (preset.interactive !== undefined) setInteractive(preset.interactive);
  };

  useEffect(() => {
    const preset = initialPreset ?? readPresetFromUrl();
    if (preset?.kind === "surface") applyPreset(preset);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    replacePresetInUrl(
      createSurfacePreset({
        variant,
        density,
        cell,
        speed,
        text,
        ramp,
        fg,
        bg,
        accent,
        interactive,
      }),
    );
  }, [ready, variant, density, cell, speed, text, ramp, fg, bg, accent, interactive]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const sharePreset = createSurfacePreset({
    variant,
    density,
    cell,
    speed,
    text,
    ramp,
    fg,
    bg,
    accent,
    interactive,
  });
  const sharePath = presetPath(sharePreset, "/surface-playground/");

  const copyLink = async () => {
    const url = presetUrl(sharePreset, "/surface-playground/");
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy this surface link", url);
    }
  };

  const recordClip = async () => {
    const canvas = stageRef.current?.querySelector("canvas");
    if (!canvas || recording) return;
    setRecording(true);
    try {
      const blob = await recordCanvas(canvas, 4000);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ascii-surface-${variant}.${blob.type.includes("mp4") ? "mp4" : "webm"}`;
      anchor.rel = "noopener";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // Unsupported browsers simply keep the live canvas.
    } finally {
      setRecording(false);
    }
  };

  return (
    <section className="docs-playground" aria-labelledby="surface-playground-title">
      <h2 id="surface-playground-title" className="docs-playground-title">
        Surface composer
      </h2>
      <p className="docs-playground-lede">
        Tune a shader-backed ASCII surface by variant, cells, speed, glyph ramp, and colour. The URL
        stores the exact configuration, so a surface is as easy to send as a scene.
      </p>

      <div className="docs-playground-controls">
        <label>
          <span>Variant</span>
          <select
            value={variant}
            onChange={(event) => setVariant(event.currentTarget.value as SurfaceVariant)}
          >
            {SURFACE_VARIANTS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Density</span>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={density}
            onChange={(event) => setDensity(event.currentTarget.valueAsNumber)}
          />
          <output>{density.toFixed(2)}</output>
        </label>
        <label>
          <span>Cell</span>
          <input
            type="range"
            min={2}
            max={24}
            step={1}
            value={cell}
            onChange={(event) => setCell(event.currentTarget.valueAsNumber)}
          />
          <output>{cell}px</output>
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
        <label>
          <span>Wordmark</span>
          <input
            type="text"
            value={text}
            maxLength={32}
            placeholder="optional"
            onChange={(event) => setText(event.currentTarget.value)}
          />
        </label>
        <label>
          <span>Glyph ramp</span>
          <input
            type="text"
            value={ramp}
            maxLength={64}
            placeholder="default"
            onChange={(event) => setRamp(event.currentTarget.value)}
          />
        </label>
      </div>

      <div className="docs-playground-controls">
        <label>
          <span>Ink</span>
          <input type="color" value={fg} onChange={(event) => setFg(event.currentTarget.value)} />
        </label>
        <label>
          <span>Background</span>
          <input type="color" value={bg} onChange={(event) => setBg(event.currentTarget.value)} />
        </label>
        <label>
          <span>Accent</span>
          <input
            type="color"
            value={accent}
            onChange={(event) => setAccent(event.currentTarget.value)}
          />
        </label>
      </div>

      <div className="docs-playground-actions">
        <button
          type="button"
          className="scene-demo-button"
          aria-pressed={interactive}
          onClick={() => setInteractive((value) => !value)}
        >
          {interactive ? "Pointer on" : "Pointer off"}
        </button>
        <button type="button" className="scene-demo-button" onClick={copyLink}>
          {copied ? "Link copied" : "Copy link"}
        </button>
        <a className="scene-demo-button" href={sharePath}>
          Preset URL
        </a>
        <button
          type="button"
          className="scene-demo-button"
          onClick={() => void recordClip()}
          disabled={recording}
        >
          {recording ? "Recording…" : "Record 4s"}
        </button>
        <a className="scene-demo-button" href="/playground/">
          Scene playground
        </a>
      </div>

      <div className="surface-playground-stage" ref={stageRef}>
        <AsciiSurface
          variant={variant}
          density={density}
          cell={cell}
          speed={speed}
          text={text}
          glyphs={ramp || undefined}
          foreground={fg}
          background={bg}
          accent={accent}
          pointer={interactive}
          label={`${variant} ASCII surface`}
          style={{ height: "420px" }}
        />
      </div>

      <div className="docs-code">
        <pre className="docs-code-panel">
          <code>{`<AsciiSurface
  variant="${variant}"
  density={${density}}
  cell={${cell}}
  speed={${speed}}
  foreground="${fg}"
  background="${bg}"
  accent="${accent}"
  pointer={${interactive}}
/>`}</code>
        </pre>
      </div>
    </section>
  );
}
