import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AsciiSurface } from "../../src/webgl/react";

const RAMPS = [
  { id: "classic", label: "classic", value: ".:-=+*#%@" },
  { id: "blocks", label: "blocks", value: "░▒▓█" },
  { id: "dots", label: "dots", value: "·•●" },
  { id: "slashes", label: "slashes", value: "/\\|-_" },
] as const;

const ACCENTS = [
  { id: "orange", label: "orange", value: "#ff7a1a" },
  { id: "amber", label: "amber", value: "#ffd166" },
  { id: "cyan", label: "cyan", value: "#41e0d0" },
  { id: "violet", label: "violet", value: "#b28dff" },
] as const;

function Demo() {
  const [text, setText] = useState("ASCII-THINGS");
  const [ramp, setRamp] = useState<string>(RAMPS[0].value);
  const [accent, setAccent] = useState<string>(ACCENTS[0].value);
  const [density, setDensity] = useState(0.16);
  const [cell, setCell] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [scan, setScan] = useState(true);
  const [pointer, setPointer] = useState(true);
  const [paused, setPaused] = useState(false);

  return (
    <>
      <div className="field">
        <AsciiSurface
          text={text}
          glyphs={ramp}
          accent={accent}
          density={density}
          cell={cell}
          speed={speed}
          scan={scan}
          pointer={pointer}
          paused={paused}
          style={{ height: 420 }}
        />
      </div>
      <div className="controls">
        <label>
          Text
          <input value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <label>
          Ramp
          <select value={ramp} onChange={(event) => setRamp(event.target.value)}>
            {RAMPS.map((entry) => (
              <option key={entry.id} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Accent
          <select value={accent} onChange={(event) => setAccent(event.target.value)}>
            {ACCENTS.map((entry) => (
              <option key={entry.id} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Density {density.toFixed(2)}
          <input
            type="range"
            min="0"
            max="0.6"
            step="0.01"
            value={density}
            onChange={(event) => setDensity(Number(event.target.value))}
          />
        </label>
        <label>
          Cell {cell > 0 ? `${cell}px` : "auto"}
          <input
            type="range"
            min="0"
            max="32"
            step="1"
            value={cell}
            onChange={(event) => setCell(Number(event.target.value))}
          />
        </label>
        <label>
          Speed {speed.toFixed(1)}×
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          />
        </label>
        <div className="row">
          <button type="button" aria-pressed={scan} onClick={() => setScan((value) => !value)}>
            scan {scan ? "on" : "off"}
          </button>
          <button
            type="button"
            aria-pressed={pointer}
            onClick={() => setPointer((value) => !value)}
          >
            pointer {pointer ? "on" : "off"}
          </button>
          <button type="button" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
            {paused ? "paused" : "running"}
          </button>
        </div>
      </div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Demo />);
