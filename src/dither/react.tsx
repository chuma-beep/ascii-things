"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { DitherField, type DitherFieldOptions } from "./core";

export interface AsciiDitherProps extends DitherFieldOptions {
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Accessible description. Defaults to the rendered text. */
  label?: string;
  /** Keep the static first frame. */
  paused?: boolean;
}

/**
 * Canvas dither field with an animated scan band. The host owns the frame:
 * set a height on this element or its parent.
 */
export function AsciiDither({
  id,
  className,
  style,
  label,
  paused = false,
  text,
  matrix,
  cell,
  density,
  wordDensity,
  scan,
  speed,
  foreground,
  accent,
  background,
  fontFamily,
}: AsciiDitherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const field = new DitherField(canvas, {
      text,
      matrix,
      cell,
      density,
      wordDensity,
      scan,
      speed,
      foreground,
      accent,
      background,
      fontFamily,
    });
    if (paused) field.setPaused(true);
    return () => field.destroy();
  }, [
    text,
    matrix,
    cell,
    density,
    wordDensity,
    scan,
    speed,
    foreground,
    accent,
    background,
    fontFamily,
    paused,
  ]);

  return (
    <canvas
      ref={canvasRef}
      id={id}
      className={["ascii-things", "ascii-dither", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={label ?? text ?? "Dither field"}
      style={{ display: "block", width: "100%", height: "240px", ...style }}
    />
  );
}
