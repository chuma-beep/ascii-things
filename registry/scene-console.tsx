"use client";

import { useState, type CSSProperties } from "react";
import { AsciiDog } from "ascii-things/react";
import { AsciiPrompt, AsciiReadout, AsciiSceneTabs, AsciiStage } from "ascii-things/ui";

type Palette = "abyss" | "neon" | "mono" | "paper";

const PALETTES: Array<{ id: Palette; label: string; meta: string }> = [
  { id: "abyss", label: "Abyss", meta: "night" },
  { id: "paper", label: "Paper", meta: "day" },
  { id: "neon", label: "Neon", meta: "loud" },
  { id: "mono", label: "Mono", meta: "quiet" },
];

export function SceneConsole() {
  const [palette, setPalette] = useState<Palette>("abyss");
  const [command, setCommand] = useState("Awaiting command");
  const [status, setStatus] = useState("READY");
  const stageStyle =
    palette === "paper"
      ? ({
          "--ascii-bg": "#ece8df",
          "--ascii-panel": "#f6f2ea",
          "--ascii-ink": "#101112",
          "--ascii-muted": "rgba(16, 17, 18, 0.66)",
          "--ascii-faint": "rgba(16, 17, 18, 0.52)",
          "--ascii-line": "rgba(16, 17, 18, 0.18)",
          "--ascii-line-soft": "rgba(16, 17, 18, 0.1)",
          "--ascii-accent": "#c2410c",
          "--ascii-accent-soft": "rgba(194, 65, 12, 0.14)",
        } as CSSProperties)
      : undefined;

  return (
    <div className="grid gap-4">
      <AsciiSceneTabs
        scenes={PALETTES}
        value={palette}
        onChange={(id) => setPalette(id as Palette)}
        ariaLabel="Scene palette"
      />

      <AsciiStage
        label="ROBOT DOG / TEST YARD"
        status="LIVE"
        aspectRatio="16 / 10"
        style={stageStyle}
        footer={
          <AsciiReadout
            ariaLabel="Scene metadata"
            items={[
              { label: "SCENE", value: "DOG" },
              { label: "PALETTE", value: palette.toUpperCase() },
              { label: "SEED", value: "07" },
              { label: "COMMAND", value: command.toUpperCase() },
            ]}
          />
        }
      >
        <AsciiDog
          palette={palette}
          seed={7}
          count={1}
          dogs={[{ size: 1.1 }]}
          spread={[0.55, 0.55]}
          columns={120}
          maxCells={12000}
          label="A live ASCII robot dog in a test yard"
        />
      </AsciiStage>

      <AsciiPrompt
        label="Command the unit"
        placeholder="Ask the dog to fetch…"
        actionLabel="Send"
        status={status}
        hint="Enter submits · input clears · focus stays"
        onSubmit={(value) => {
          setCommand(value);
          setStatus(`QUEUED · ${value.toUpperCase()}`);
        }}
      />
    </div>
  );
}
