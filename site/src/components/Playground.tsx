import { useState } from "react";
import { AsciiSceneTabs } from "ascii-things/ui";
import SceneDemo, { type SceneKey } from "./SceneDemo";

const SCENES = [
  { id: "sharks", label: "Sharks", meta: "hunt" },
  { id: "robots", label: "Robots", meta: "work" },
  { id: "jellyfish", label: "Jellyfish", meta: "drift" },
  { id: "dog", label: "Dog", meta: "fetch" },
  { id: "starlings", label: "Starlings", meta: "murmur" },
  { id: "fireflies", label: "Fireflies", meta: "blink" },
  { id: "ants", label: "Ants", meta: "forage" },
  { id: "koi", label: "Koi", meta: "feed" },
  { id: "city", label: "City", meta: "rush" },
  { id: "servers", label: "Servers", meta: "ping" },
] as const;

export default function Playground() {
  const [scene, setScene] = useState<SceneKey>("dog");
  const [seed, setSeed] = useState(7);
  const [columns, setColumns] = useState(110);
  const [speed, setSpeed] = useState(1);

  const sceneMeta = SCENES.find((item) => item.id === scene) ?? SCENES[3];
  const sceneItems = SCENES.map((item) => ({ ...item }));

  return (
    <section className="docs-playground" aria-labelledby="playground-title">
      <h2 id="playground-title" className="docs-playground-title">
        Live playground
      </h2>
      <p className="docs-playground-lede">
        Switch scenes, seed the world, and change the art direction. The demo remounts the engine
        when the seed or column count changes, then applies palette, calm, and speed live.
        Everything here runs in one React island.
      </p>

      <AsciiSceneTabs
        scenes={sceneItems}
        value={scene}
        onChange={(id) => setScene(id as SceneKey)}
        ariaLabel="Playground scene"
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
          <span>Columns</span>
          <input
            type="range"
            min={60}
            max={180}
            step={2}
            value={columns}
            onChange={(event) => setColumns(event.currentTarget.valueAsNumber)}
          />
          <output>{columns}</output>
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

      <SceneDemo
        key={`${scene}-${seed}-${columns}`}
        scene={scene}
        seed={seed}
        columns={columns}
        speed={speed}
      />

      <p className="docs-playground-meta">
        Showing <strong>{sceneMeta.label}</strong>. The same options exist in React, vanilla, and
        custom-element form. See the <a href="/api/">API reference</a> for every option.
      </p>
    </section>
  );
}
