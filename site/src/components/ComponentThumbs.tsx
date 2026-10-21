import { AsciiKoi } from "ascii-things/react";
import { AsciiDither } from "ascii-things/dither/react";
import { AsciiSurface } from "ascii-things/webgl/react";
import { AsciiDog } from "ascii-things/react";
import {
  AsciiButton,
  AsciiDivider,
  AsciiPanel,
  AsciiStage,
  AsciiStatus,
  AsciiToggle,
  AsciiToolbar,
} from "ascii-things/ui";
import "ascii-things/ui.css";

export function KoiThumb() {
  return (
    <AsciiKoi palette="abyss" seed={12} count={3} columns={86} label="A live ASCII koi pond" />
  );
}

export function DitherThumb() {
  return <AsciiDither text="ASCII-THINGS" matrix="bayer8" density={0.12} />;
}

export function SurfaceThumb() {
  return (
    <AsciiSurface
      text="ASCII-THINGS"
      density={0.16}
      glyphs=".:-=+*#%@"
      pointer
      label="A shader-backed ASCII glyph field"
    />
  );
}

export function ConsoleThumb() {
  return (
    <AsciiStage label="ROBOT DOG / TEST YARD" status="LIVE" aspectRatio="16 / 10">
      <AsciiDog
        palette="abyss"
        seed={7}
        count={1}
        dogs={[{ size: 1.1 }]}
        spread={[0.55, 0.55]}
        columns={86}
        maxCells={9000}
        label="A live ASCII robot dog in a test yard"
      />
    </AsciiStage>
  );
}

export function ToolbarThumb() {
  return (
    <AsciiPanel
      eyebrow="Control surface"
      heading="Calm the yard."
      actions={<AsciiStatus label="Mode" value="LIVE" tone="success" pulse live />}
    >
      <AsciiToolbar label="Scene controls">
        <AsciiToggle
          checked={false}
          onCheckedChange={() => {}}
          label="Calm mode"
          hint="Settles the scene"
        />
        <AsciiDivider orientation="vertical" />
        <AsciiButton variant="solid">Wake</AsciiButton>
        <AsciiButton variant="ghost">Settle</AsciiButton>
      </AsciiToolbar>
    </AsciiPanel>
  );
}
