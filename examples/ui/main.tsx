import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { AsciiDog } from "../../src/react";
import {
  AsciiDogHero,
  AsciiPrompt,
  AsciiReadout,
  AsciiSceneTabs,
  AsciiStage,
} from "../../src/ui";
import type { PaletteName } from "../../src/palette";
import "../../src/ui.css";
import "./style.css";

const PALETTES = [
  { id: "abyss", label: "Abyss", meta: "night" },
  { id: "paper", label: "Paper", meta: "day" },
  { id: "neon", label: "Neon", meta: "loud" },
  { id: "mono", label: "Mono", meta: "quiet" },
] as const;

function App() {
  const [palette, setPalette] = useState<PaletteName>("abyss");
  const [lastCommand, setLastCommand] = useState("—");
  const [promptStatus, setPromptStatus] = useState("AWAITING COMMAND");

  return (
    <div className="ui-page">
      <header className="ui-header">
        <a className="ui-brand" href="/">
          ascii-things<span>®</span>
        </a>
        <nav aria-label="Primary">
          <a href="/">Landing</a>
          <a href="/examples/playground/">Playground ↗</a>
          <a href="https://github.com/chuma-beep/ascii-things">GitHub ↗</a>
        </nav>
        <span className="ui-version">ui / 0.4.0</span>
      </header>

      <main className="ui-wrap">
        <section className="ui-intro">
          <p className="ui-kicker"><i /> First-party UI / no Tailwind required</p>
          <h1>
            Bring your own interface.
            <br />
            <em>Or use ours.</em>
          </h1>
          <p className="ui-lede">
            A small set of React components for framing scenes, capturing commands,
            and reading live state. CSS variables in, your design system out.
          </p>
          <div className="ui-badges">
            <span>React 18+</span>
            <span>Zero runtime deps</span>
            <span>Copy-paste friendly</span>
            <span>Shadcn-compatible</span>
          </div>
        </section>

        <AsciiDogHero
          className="ui-hero"
          eyebrow="FULL COMPOSITION / 01"
          title={
            <>
              The whole scene.
              <br />
              <em>In four components.</em>
            </>
          }
          lede="AsciiDogHero wires a live dog, a command input, a framed stage, and a stats readout. Swap the copy, keep the behavior."
          palette="abyss"
          seed={7}
          dogs={[{ size: 1.15 }]}
          spread={[0.68, 0.68]}
          onCommand={(command) => setLastCommand(command)}
        />

        <section className="ui-section" aria-labelledby="pieces-title">
          <div className="ui-section-head">
            <div>
              <p className="ui-kicker">The pieces / 02</p>
              <h2 id="pieces-title">Compose it your way.</h2>
            </div>
            <p>
              Use the recipe, or assemble a stage, prompt, readout, and tabs
              yourself. Every component is controlled where it matters.
            </p>
          </div>

          <div className="ui-grid">
            <article className="ui-card">
              <div className="ui-card-head">
                <div>
                  <span>AsciiStage / AsciiSceneTabs</span>
                  <h3>Scene surface</h3>
                </div>
                <span className="ui-tag">LIVE</span>
              </div>
              <AsciiSceneTabs
                scenes={PALETTES.map((item) => ({ ...item }))}
                value={palette}
                onChange={(id) => setPalette(id as PaletteName)}
                ariaLabel="Scene palette"
              />
              <AsciiStage
                label="ROBOT DOG / ALT YARD"
                status="LIVE"
                aspectRatio="4 / 3"
                footer={
                  <AsciiReadout
                    ariaLabel="Scene metadata"
                    items={[
                      { label: "SCENE", value: "DOG" },
                      { label: "PALETTE", value: palette.toUpperCase() },
                      { label: "SEED", value: "07" },
                      { label: "INPUT", value: lastCommand.toUpperCase() },
                    ]}
                  />
                }
              >
                <AsciiDog
                  palette={palette}
                  seed={7}
                  count={1}
                  dogs={[{ size: 1.15 }]}
                  spread={[0.5, 0.5]}
                  columns={110}
                  maxCells={12000}
                  label="An alternate ASCII robot dog yard"
                />
              </AsciiStage>
              <p className="ui-note">
                Tabs are keyboard-navigable. Palette changes update the live engine
                without recreating the world.
              </p>
            </article>

            <article className="ui-card">
              <div className="ui-card-head">
                <div>
                  <span>AsciiPrompt</span>
                  <h3>Command input</h3>
                </div>
                <span className="ui-tag">A11Y</span>
              </div>
              <AsciiPrompt
                label="Command the unit"
                placeholder="Ask the dog to fetch…"
                actionLabel="Send"
                status={promptStatus}
                hint="Enter submits · input clears · focus stays"
                onSubmit={(value) => setPromptStatus(`QUEUED · ${value.toUpperCase()}`)}
              />
              <p className="ui-note">
                Uncontrolled by default, controlled when you pass <code>value</code>.
                The status line is a polite live region.
              </p>
              <pre className="ui-code"><code>{`<AsciiPrompt
  label="Command the unit"
  onSubmit={handleCommand}
  status={status}
/>`}</code></pre>
            </article>
          </div>
        </section>

        <section className="ui-section ui-section-last" aria-labelledby="install-title">
          <div className="ui-section-head">
            <div>
              <p className="ui-kicker">Install / 03</p>
              <h2 id="install-title">One import. Your chrome.</h2>
            </div>
            <p>
              The UI subpath ships as React source compiled to ESM. Import the CSS
              once, then let your host app own the page.
            </p>
          </div>

          <div className="ui-install-grid">
            <pre className="ui-code ui-code-large"><code>{`import {
  AsciiDogHero,
  AsciiStage,
  AsciiPrompt,
  AsciiReadout,
  AsciiSceneTabs,
} from "ascii-things/ui";
import "ascii-things/ui.css";

<AsciiDogHero palette="abyss" seed={7} />`}</code></pre>
            <div className="ui-recipe">
              <p className="ui-kicker">With shadcn</p>
              <h3>Use your Input and Button.</h3>
              <p>
                Keep <code>AsciiStage</code> and <code>AsciiDog</code>, then pass
                your own controls through the stage overlay or below it. shadcn is
                copy-paste code, so it never becomes a runtime dependency.
              </p>
              <a className="ui-link" href="/examples/dog-input/">
                Open the shadcn-style recipe ↗
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="ui-footer">
        <span>ascii-things / ui</span>
        <span>Zero deps · MIT · Built from ascii-sharks</span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
