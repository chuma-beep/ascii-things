"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { AsciiSurfaceEngine, type AsciiSurfaceOptions } from "./core";

export interface AsciiSurfaceProps extends AsciiSurfaceOptions {
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Accessible description. Defaults to the rendered text. */
  label?: string;
  /** Keep the static first frame. */
  paused?: boolean;
}

/**
 * A WebGL ASCII surface: a living glyph field with an optional wordmark,
 * accent scan, and pointer response. The host owns the frame: set a height on
 * this element or its parent.
 */
export function AsciiSurface({
  id,
  className,
  style,
  label,
  paused = false,
  text,
  glyphs,
  cell,
  density,
  speed,
  scan,
  pointer,
  foreground,
  accent,
  background,
  fontFamily,
  maxDpr,
  variant,
}: AsciiSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new AsciiSurfaceEngine(canvas, {
      text,
      glyphs,
      cell,
      density,
      speed,
      scan,
      pointer,
      foreground,
      accent,
      background,
      fontFamily,
      maxDpr,
      variant,
    });
    canvas.dataset.renderer = engine.renderer;
    engine.setPaused(paused);
    return () => engine.destroy();
  }, [
    text,
    glyphs,
    cell,
    density,
    speed,
    scan,
    pointer,
    foreground,
    accent,
    background,
    fontFamily,
    maxDpr,
    variant,
    paused,
  ]);

  return (
    <canvas
      ref={canvasRef}
      id={id}
      className={["ascii-things", "ascii-surface", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={label ?? text ?? "ASCII surface"}
      style={{ display: "block", width: "100%", height: "320px", ...style }}
    />
  );
}
