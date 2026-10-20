"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { OceanEngine } from "./engine";
import type { AsciiSharksOptions } from "./options";
import { RobotEngine } from "./robots/engine";
import type { AsciiRobotsOptions } from "./robots/options";
import { JellyfishEngine } from "./jellyfish/engine";
import type { AsciiJellyfishOptions } from "./jellyfish/options";
import { DogEngine } from "./dog/engine";
import type { AsciiDogOptions } from "./dog/options";
import type { SceneHandle } from "./core/scene";

export interface AsciiSharksProps extends AsciiSharksOptions {
  className?: string;
  style?: CSSProperties;
  id?: string;
  width?: number | string;
  height?: number | string;
  /** Sets CSS aspect-ratio and lets height follow it. */
  aspectRatio?: number | string;
  /** Called after the engine is created, including after remounts. */
  onReady?: (scene: SceneHandle) => void;
}

/**
 * React wrapper. The canvas fills its parent by default, so give the parent
 * a height (or pass `height`). Roster/seed/density changes remount the scene;
 * palette/speed/quality changes update live.
 */
export function AsciiSharks({
  className,
  style,
  id,
  aspectRatio,
  onReady,
  width = "100%",
  height = "100%",
  ...options
}: AsciiSharksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<OceanEngine | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const structuralKey = JSON.stringify({
    sharks: options.sharks,
    seed: options.seed,
    density: options.density,
    sharkScale: options.sharkScale,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new OceanEngine(canvas, optionsRef.current);
    engineRef.current = engine;
    onReadyRef.current?.(engine as unknown as SceneHandle);
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [structuralKey]);

  const {
    palette,
    speed,
    columns,
    maxCells,
    adaptiveQuality,
    calm,
    label,
    paused,
    fontFamily,
    onEvent,
  } = options;
  useEffect(() => {
    engineRef.current?.setOptions({
      palette,
      speed,
      columns,
      maxCells,
      adaptiveQuality,
      calm,
      label,
      paused,
      fontFamily,
      onEvent,
    });
  }, [
    palette,
    speed,
    columns,
    maxCells,
    adaptiveQuality,
    calm,
    label,
    paused,
    fontFamily,
    onEvent,
  ]);

  return (
    <canvas
      id={id}
      ref={canvasRef}
      className={["ascii-things", "ascii-sharks", className].filter(Boolean).join(" ")}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        display: "block",
        width,
        height: aspectRatio ? "auto" : height,
        ...(aspectRatio ? { aspectRatio } : null),
        ...style,
      }}
    />
  );
}

export interface AsciiRobotsProps extends AsciiRobotsOptions {
  className?: string;
  style?: CSSProperties;
  id?: string;
  width?: number | string;
  height?: number | string;
  /** Sets CSS aspect-ratio and lets height follow it. */
  aspectRatio?: number | string;
  /** Called after the engine is created, including after remounts. */
  onReady?: (scene: SceneHandle) => void;
}

/**
 * React wrapper for the robot floor. Fleet/seed/scale changes remount the
 * scene; palette/speed/quality changes update live.
 */
export function AsciiRobots({
  className,
  style,
  id,
  aspectRatio,
  onReady,
  width = "100%",
  height = "100%",
  ...options
}: AsciiRobotsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RobotEngine | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const structuralKey = JSON.stringify({
    robots: options.robots,
    count: options.count,
    seed: options.seed,
    scale: options.scale,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new RobotEngine(canvas, optionsRef.current);
    engineRef.current = engine;
    onReadyRef.current?.(engine as unknown as SceneHandle);
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [structuralKey]);

  const {
    palette,
    speed,
    columns,
    maxCells,
    adaptiveQuality,
    calm,
    label,
    paused,
    fontFamily,
    onEvent,
  } = options;
  useEffect(() => {
    engineRef.current?.setOptions({
      palette,
      speed,
      columns,
      maxCells,
      adaptiveQuality,
      calm,
      label,
      paused,
      fontFamily,
      onEvent,
    });
  }, [
    palette,
    speed,
    columns,
    maxCells,
    adaptiveQuality,
    calm,
    label,
    paused,
    fontFamily,
    onEvent,
  ]);

  return (
    <canvas
      id={id}
      ref={canvasRef}
      className={["ascii-things", "ascii-robots", className].filter(Boolean).join(" ")}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        display: "block",
        width,
        height: aspectRatio ? "auto" : height,
        ...(aspectRatio ? { aspectRatio } : null),
        ...style,
      }}
    />
  );
}

export interface AsciiJellyfishProps extends AsciiJellyfishOptions {
  className?: string;
  style?: CSSProperties;
  id?: string;
  width?: number | string;
  height?: number | string;
  /** Sets CSS aspect-ratio and lets height follow it. */
  aspectRatio?: number | string;
  /** Called after the engine is created, including after remounts. */
  onReady?: (scene: SceneHandle) => void;
}

/**
 * React wrapper for the jellyfish bloom. Roster/seed/scale changes remount
 * the scene; palette/speed/quality changes update live.
 */
export function AsciiJellyfish({
  className,
  style,
  id,
  aspectRatio,
  onReady,
  width = "100%",
  height = "100%",
  ...options
}: AsciiJellyfishProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<JellyfishEngine | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const structuralKey = JSON.stringify({
    jellies: options.jellies,
    count: options.count,
    seed: options.seed,
    scale: options.scale,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new JellyfishEngine(canvas, optionsRef.current);
    engineRef.current = engine;
    onReadyRef.current?.(engine as unknown as SceneHandle);
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [structuralKey]);

  const {
    palette,
    speed,
    columns,
    maxCells,
    adaptiveQuality,
    calm,
    label,
    paused,
    fontFamily,
    onEvent,
  } = options;
  useEffect(() => {
    engineRef.current?.setOptions({
      palette,
      speed,
      columns,
      maxCells,
      adaptiveQuality,
      calm,
      label,
      paused,
      fontFamily,
      onEvent,
    });
  }, [
    palette,
    speed,
    columns,
    maxCells,
    adaptiveQuality,
    calm,
    label,
    paused,
    fontFamily,
    onEvent,
  ]);

  return (
    <canvas
      id={id}
      ref={canvasRef}
      className={["ascii-things", "ascii-jellyfish", className].filter(Boolean).join(" ")}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        display: "block",
        width,
        height: aspectRatio ? "auto" : height,
        ...(aspectRatio ? { aspectRatio } : null),
        ...style,
      }}
    />
  );
}

export interface AsciiDogProps extends AsciiDogOptions {
  className?: string;
  style?: CSSProperties;
  id?: string;
  width?: number | string;
  height?: number | string;
  /** Sets CSS aspect-ratio and lets height follow it. */
  aspectRatio?: number | string;
  /** Called after the engine is created, including after remounts. */
  onReady?: (scene: SceneHandle) => void;
}

/**
 * React wrapper for the robot dog yard. Roster/seed/scale changes remount the
 * scene; palette/speed/quality changes update live. Click to throw the ball.
 */
export function AsciiDog({
  className,
  style,
  id,
  aspectRatio,
  onReady,
  width = "100%",
  height = "100%",
  ...options
}: AsciiDogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DogEngine | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const structuralKey = JSON.stringify({
    dogs: options.dogs,
    count: options.count,
    seed: options.seed,
    scale: options.scale,
    spread: options.spread,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new DogEngine(canvas, optionsRef.current);
    engineRef.current = engine;
    onReadyRef.current?.(engine as unknown as SceneHandle);
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [structuralKey]);

  const {
    palette,
    speed,
    columns,
    maxCells,
    adaptiveQuality,
    calm,
    label,
    paused,
    fontFamily,
    onEvent,
  } = options;
  useEffect(() => {
    engineRef.current?.setOptions({
      palette,
      speed,
      columns,
      maxCells,
      adaptiveQuality,
      calm,
      label,
      paused,
      fontFamily,
      onEvent,
    });
  }, [
    palette,
    speed,
    columns,
    maxCells,
    adaptiveQuality,
    calm,
    label,
    paused,
    fontFamily,
    onEvent,
  ]);

  return (
    <canvas
      id={id}
      ref={canvasRef}
      className={["ascii-things", "ascii-dog", className].filter(Boolean).join(" ")}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        display: "block",
        width,
        height: aspectRatio ? "auto" : height,
        ...(aspectRatio ? { aspectRatio } : null),
        ...style,
      }}
    />
  );
}

/** Back-compat alias for the original demo wrapper. */
export const AsciiOcean = AsciiSharks;
