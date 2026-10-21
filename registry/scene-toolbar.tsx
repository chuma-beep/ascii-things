"use client";

import { useState } from "react";
import {
  AsciiButton,
  AsciiDivider,
  AsciiPanel,
  AsciiStatus,
  AsciiToggle,
  AsciiToolbar,
} from "ascii-things/ui";

export function SceneToolbar() {
  const [calm, setCalm] = useState(false);
  const [lastAction, setLastAction] = useState("Ready");

  const act = (label: string, nextCalm: boolean) => {
    setCalm(nextCalm);
    setLastAction(label);
  };

  return (
    <AsciiPanel
      eyebrow="Control surface"
      heading="Calm the yard."
      actions={
        <AsciiStatus
          label="Mode"
          value={calm ? "CALM" : "LIVE"}
          tone={calm ? "neutral" : "success"}
          pulse={!calm}
          live
        />
      }
      footer={`Last action · ${lastAction}`}
    >
      <AsciiToolbar label="Scene controls">
        <AsciiToggle
          checked={calm}
          onCheckedChange={(checked) => act(checked ? "Calm mode" : "Live mode", checked)}
          label="Calm mode"
          hint="Settles the scene"
        />
        <AsciiDivider orientation="vertical" />
        <AsciiButton variant="solid" onClick={() => act("Wake", false)}>
          Wake
        </AsciiButton>
        <AsciiButton variant="ghost" onClick={() => act("Settle", true)}>
          Settle
        </AsciiButton>
        <AsciiButton variant="quiet" onClick={() => act("Reset", false)}>
          Reset
        </AsciiButton>
      </AsciiToolbar>

      <AsciiDivider label="State" />

      <div className="flex flex-wrap gap-3">
        <AsciiStatus label="Scene" value="Robot dog" tone="accent" />
        <AsciiStatus
          label="Motion"
          value={calm ? "Settled" : "Running"}
          tone={calm ? "neutral" : "success"}
          pulse={!calm}
          live
        />
      </div>
    </AsciiPanel>
  );
}
