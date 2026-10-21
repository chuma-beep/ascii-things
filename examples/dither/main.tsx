import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AsciiDither } from "../../src/dither/react";
import type { DitherMatrixName } from "../../src/dither/core";

const MATRICES: DitherMatrixName[] = ["bayer2", "bayer4", "bayer8", "none"];

function Demo() {
  const [text, setText] = useState("ASCII-THINGS");
  const [matrix, setMatrix] = useState<DitherMatrixName>("bayer4");
  const [density, setDensity] = useState(0.1);
  const [scan, setScan] = useState(true);
  const [paused, setPaused] = useState(false);

  return (
    <>
      <div className="field">
        <AsciiDither
          text={text}
          matrix={matrix}
          density={density}
          scan={scan}
          paused={paused}
          style={{ height: 360 }}
        />
      </div>
      <div className="controls">
        <label>
          Text
          <input value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <label>
          Matrix
          <select
            value={matrix}
            onChange={(event) => setMatrix(event.target.value as DitherMatrixName)}
          >
            {MATRICES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Density {density.toFixed(2)}
          <input
            type="range"
            min="0"
            max="0.4"
            step="0.01"
            value={density}
            onChange={(event) => setDensity(Number(event.target.value))}
          />
        </label>
        <label>
          Scan
          <button type="button" onClick={() => setScan((value) => !value)}>
            {scan ? "on" : "off"}
          </button>
        </label>
        <label>
          Motion
          <button type="button" onClick={() => setPaused((value) => !value)}>
            {paused ? "paused" : "running"}
          </button>
        </label>
      </div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Demo />);
