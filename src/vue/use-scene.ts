import {
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
} from "vue";
import type { SceneAction, SceneHandle, SceneOptions, SceneReady, SceneStats } from "../core/scene";

export interface UseAsciiSceneOptions<
  S extends SceneStats = SceneStats,
  O extends SceneOptions = SceneOptions,
  A extends string = SceneAction,
> {
  /** Scene factory, usually a built-in create function or a custom simulation. */
  create: (canvas: HTMLCanvasElement, options: O) => SceneHandle<S, A>;
  /** Reactive options. Pass a reactive object, ref, or getter. */
  options: MaybeRefOrGetter<O>;
  /** Change this when a structural option changes and the engine must be recreated. */
  remountKey?: MaybeRefOrGetter<string>;
  onReady?: SceneReady<S, A>;
  /** Stats sampling interval in milliseconds. Set to 0 to disable polling. */
  statsInterval?: number;
}

export interface UseAsciiSceneResult<
  S extends SceneStats = SceneStats,
  A extends string = SceneAction,
> {
  canvasRef: Ref<HTMLCanvasElement | null>;
  scene: ShallowRef<SceneHandle<S, A> | null>;
  stats: ShallowRef<S | null>;
  refresh: () => void;
}

/**
 * Owns a canvas simulation for a Vue component or composable: construction,
 * teardown, live options, stats sampling, and the ready handle.
 *
 * The composable is SSR-safe: the engine is only created in `onMounted`, so
 * server rendering produces the canvas element without touching the DOM.
 */
export function useAsciiScene<
  S extends SceneStats = SceneStats,
  O extends SceneOptions = SceneOptions,
  A extends string = SceneAction,
>({
  create,
  options,
  remountKey = "",
  onReady,
  statsInterval = 500,
}: UseAsciiSceneOptions<S, O, A>): UseAsciiSceneResult<S, A> {
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const scene: ShallowRef<SceneHandle<S, A> | null> = shallowRef(null);
  const stats: ShallowRef<S | null> = shallowRef(null);
  let timer: ReturnType<typeof setInterval> | undefined;
  let mounted = false;

  const refresh = () => {
    const current = scene.value;
    if (current) stats.value = current.getStats();
  };

  const start = () => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const engine = create(canvas, toValue(options));
    scene.value = engine;
    stats.value = engine.getStats();
    onReady?.(engine);

    if (statsInterval > 0) {
      timer = setInterval(() => {
        stats.value = engine.getStats();
      }, statsInterval);
    }
  };

  const stop = () => {
    if (timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
    const current = scene.value;
    if (current) {
      current.destroy();
      scene.value = null;
      stats.value = null;
    }
  };

  onMounted(() => {
    mounted = true;
    start();
  });

  onBeforeUnmount(() => {
    mounted = false;
    stop();
  });

  watch(
    () => toValue(remountKey),
    () => {
      if (!mounted) return;
      stop();
      start();
    },
  );

  watch(
    () => toValue(options),
    (next) => {
      scene.value?.setOptions(next);
    },
    { deep: true },
  );

  return {
    canvasRef,
    scene,
    stats,
    refresh,
  };
}
