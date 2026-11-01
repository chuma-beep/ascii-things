import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { SceneAction, SceneHandle, SceneOptions, SceneReady, SceneStats } from "./core/scene";

export interface UseSimulationOptions<
  S extends SceneStats = SceneStats,
  O extends SceneOptions = SceneOptions,
  A extends string = SceneAction,
> {
  /** Scene factory, usually a built-in create function or a custom simulation. */
  create: (canvas: HTMLCanvasElement, options: O) => SceneHandle<S, A>;
  options: O;
  /** Change this when a structural option changes and the engine must be recreated. */
  remountKey?: string;
  onReady?: SceneReady<S, A>;
}

export interface UseSimulationResult<
  S extends SceneStats = SceneStats,
  A extends string = SceneAction,
> {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  scene: SceneHandle<S, A> | null;
  stats: S | null;
  refresh: () => void;
}

/**
 * Owns a canvas simulation for a React component: construction, teardown, live
 * options, a 500ms stats sample, and the ready handle.
 */
export function useSimulation<
  S extends SceneStats = SceneStats,
  O extends SceneOptions = SceneOptions,
  A extends string = SceneAction,
>({
  create,
  options,
  remountKey = "",
  onReady,
}: UseSimulationOptions<S, O, A>): UseSimulationResult<S, A> {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<SceneHandle<S, A> | null>(null);
  const optionsRef = useRef(options);
  const createRef = useRef(create);
  const onReadyRef = useRef(onReady);
  const [scene, setScene] = useState<SceneHandle<S, A> | null>(null);
  const [stats, setStats] = useState<S | null>(null);

  optionsRef.current = options;
  createRef.current = create;
  onReadyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createRef.current(canvas, optionsRef.current);
    sceneRef.current = engine;
    setScene(engine);
    setStats(engine.getStats());
    onReadyRef.current?.(engine);

    const timer = window.setInterval(() => setStats(engine.getStats()), 500);
    return () => {
      window.clearInterval(timer);
      engine.destroy();
      if (sceneRef.current === engine) sceneRef.current = null;
    };
  }, [remountKey]);

  useEffect(() => {
    sceneRef.current?.setOptions(options);
  }, [options]);

  return {
    canvasRef,
    scene,
    stats,
    refresh: () => {
      if (sceneRef.current) setStats(sceneRef.current.getStats());
    },
  };
}
