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
import type { AmbientEngine } from "./ambient/engine";
import type { AmbientKind, AsciiAmbientOptions } from "./ambient/options";
import { createStarlings } from "./starlings";
import { createFireflies } from "./fireflies";
import { createAnts } from "./ants";
import { createKoi } from "./koi";
import { createCity } from "./city";
import { createServers } from "./servers";
import { createLagoon, type LagoonEngine, type LagoonVariant } from "./lagoon";
import type { AsciiLagoonOptions } from "./lagoon/options";
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
    orbitScale: options.orbitScale,
    fitSharks: options.fitSharks,
    glyphs: options.glyphs,
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
    glyphs: options.glyphs,
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
/** Shared props for the ambient scene wrappers. */
export interface AmbientReactProps extends AsciiAmbientOptions {
  className?: string;
  style?: CSSProperties;
  id?: string;
  width?: number | string;
  height?: number | string;
  aspectRatio?: number | string;
  onReady?: (scene: SceneHandle) => void;
}

export type AsciiStarlingsProps = AmbientReactProps;
export type AsciiFirefliesProps = AmbientReactProps;
export type AsciiAntsProps = AmbientReactProps;
export type AsciiKoiProps = AmbientReactProps;
export type AsciiCityProps = AmbientReactProps;
export type AsciiServersProps = AmbientReactProps;

type AmbientCreate = (canvas: HTMLCanvasElement, options: AsciiAmbientOptions) => AmbientEngine;

interface AmbientCanvasProps extends AmbientReactProps {
  kind: AmbientKind;
  create: AmbientCreate;
}

function AmbientCanvas({
  kind,
  create,
  className,
  style,
  id,
  width = "100%",
  height = "100%",
  aspectRatio,
  onReady,
  ...options
}: AmbientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<AmbientEngine | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const structuralKey = JSON.stringify({
    seed: options.seed,
    count: options.count,
    scale: options.scale,
    glyphs: options.glyphs,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = create(canvas, optionsRef.current);
    engineRef.current = engine;
    onReadyRef.current?.(engine as unknown as SceneHandle);
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [create, structuralKey]);

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
      ref={canvasRef}
      id={id}
      className={["ascii-things", `ascii-${kind}`, className].filter(Boolean).join(" ")}
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

export function AsciiStarlings(props: AsciiStarlingsProps) {
  return <AmbientCanvas {...props} kind="starlings" create={createStarlings} />;
}

export function AsciiFireflies(props: AsciiFirefliesProps) {
  return <AmbientCanvas {...props} kind="fireflies" create={createFireflies} />;
}

export function AsciiAnts(props: AsciiAntsProps) {
  return <AmbientCanvas {...props} kind="ants" create={createAnts} />;
}

export function AsciiKoi(props: AsciiKoiProps) {
  return <AmbientCanvas {...props} kind="koi" create={createKoi} />;
}

export function AsciiCity(props: AsciiCityProps) {
  return <AmbientCanvas {...props} kind="city" create={createCity} />;
}

export function AsciiServers(props: AsciiServersProps) {
  return <AmbientCanvas {...props} kind="servers" create={createServers} />;
}

export interface AsciiLagoonProps extends AsciiLagoonOptions {
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
 * React wrapper for the full-canvas Lagoon family. Changing `variant`
 * remounts the painter; paused and label changes update live.
 */
export function AsciiLagoon({
  className,
  style,
  id,
  aspectRatio,
  onReady,
  width = "100%",
  height = "100%",
  ...options
}: AsciiLagoonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<LagoonEngine | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const structuralKey = JSON.stringify({ variant: options.variant });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = createLagoon(canvas, optionsRef.current);
    engineRef.current = engine;
    onReadyRef.current?.(engine as unknown as SceneHandle);
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [structuralKey]);

  const { variant, paused, label } = options;

  useEffect(() => {
    engineRef.current?.setOptions({ variant, paused, label });
  }, [variant, paused, label]);

  return (
    <canvas
      id={id}
      ref={canvasRef}
      className={["ascii-things", "ascii-lagoon", className].filter(Boolean).join(" ")}
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

export const AsciiOcean = AsciiSharks;

/** Props shared by the named Lagoon components; the variant is fixed. */
export type AsciiLagoonPresetProps = Omit<AsciiLagoonProps, "variant">;

function lagoonPreset(variant: LagoonVariant, displayName: string) {
  return Object.assign(
    (props: AsciiLagoonPresetProps) => <AsciiLagoon {...props} variant={variant} />,
    { displayName },
  );
}

/** Day lagoon, the sunlit reef scene. */
export const AsciiLagoonDay = lagoonPreset("reef", "AsciiLagoonDay");
/** Night reef, the same lagoon after dark. */
export const AsciiLagoonNight = lagoonPreset("night", "AsciiLagoonNight");
/** Turtle close-up. */
export const AsciiLagoonTurtle = lagoonPreset("turtle", "AsciiLagoonTurtle");
/** Manta flyby. */
export const AsciiLagoonManta = lagoonPreset("manta", "AsciiLagoonManta");
/** Seahorse in seagrass. */
export const AsciiLagoonSeahorse = lagoonPreset("seahorse", "AsciiLagoonSeahorse");
/** Dolphin pod. */
export const AsciiLagoonDolphin = lagoonPreset("dolphin", "AsciiLagoonDolphin");
/** Hammerhead pass. */
export const AsciiLagoonHammerhead = lagoonPreset("hammerhead", "AsciiLagoonHammerhead");
/** Tang school. */
export const AsciiLagoonTang = lagoonPreset("tang", "AsciiLagoonTang");
