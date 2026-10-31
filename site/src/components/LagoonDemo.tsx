import { useEffect, useState } from "react";
import { LAGOON_VARIANTS, type LagoonStats, type LagoonVariant } from "ascii-things";
import { AsciiLagoon } from "ascii-things/react";
import { AsciiReadout, AsciiSceneTabs, AsciiStage } from "ascii-things/ui";
import "ascii-things/ui.css";

const DEFAULT_VARIANT: LagoonVariant = "reef";

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

export default function LagoonDemo() {
  const [variant, setVariant] = useState<LagoonVariant>(DEFAULT_VARIANT);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState<LagoonStats | null>(null);
  const reducedMotion = useReducedMotion();

  const current = LAGOON_VARIANTS.find((item) => item.id === variant) ?? LAGOON_VARIANTS[0];
  const status = paused ? "PAUSED" : reducedMotion ? "STILL" : "LIVE";

  return (
    <section className="scene-demo" aria-label="Lagoon live demo">
      <div className="scene-demo-head">
        <AsciiSceneTabs
          scenes={LAGOON_VARIANTS.map((item) => ({
            id: item.id,
            label: item.label,
            meta: item.id,
          }))}
          value={variant}
          onChange={(id) => setVariant(id as LagoonVariant)}
          ariaLabel="Lagoon variant"
        />
        <div className="scene-demo-actions">
          <button
            type="button"
            className="scene-demo-button"
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      <AsciiStage
        label={`LAGOON / ${current.label.toUpperCase()}`}
        status={status}
        aspectRatio="1944 / 1760"
        ariaLabel={`${current.label} live preview`}
        footer={
          <AsciiReadout
            items={[
              { label: "VARIANT", value: current.label },
              { label: "CELLS", value: stats ? stats.cells.toLocaleString("en-US") : "—" },
              { label: "COLUMNS", value: stats ? String(stats.columns) : "—" },
              { label: "FPS", value: stats ? String(Math.round(stats.fps)) : "—" },
            ]}
            ariaLabel="Lagoon live statistics"
          />
        }
      >
        <AsciiLagoon
          variant={variant}
          paused={paused}
          label={`A live ASCII ${current.label} in a lagoon`}
          onReady={(scene) => setStats(scene.getStats() as LagoonStats)}
        />
      </AsciiStage>

      <p className="scene-demo-status" aria-live="polite">
        {current.description}
      </p>

      <p className="scene-demo-note">
        The Lagoon family uses a full-canvas ASCII renderer. It is a passive scene: use the variant
        tabs to choose an animal or mood, and the copied example to put it in a page.
      </p>
    </section>
  );
}
