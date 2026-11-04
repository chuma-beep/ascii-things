import {
  computed,
  defineComponent,
  h,
  mergeProps,
  type ComponentObjectPropsOptions,
  type DefineComponent,
  type PropType,
  type SetupContext,
  type StyleValue,
} from "vue";
import type { PaletteChoice } from "../palette";
import type { SceneAction, SceneHandle, SceneOptions, SceneStats } from "../core/scene";
import { useAsciiScene } from "./use-scene";

type AnyProps = Record<string, unknown>;
type SceneFactory<O extends SceneOptions, S extends SceneStats, A extends string> = (
  canvas: HTMLCanvasElement,
  options: O,
) => SceneHandle<S, A>;

export interface SceneComponentOptions<
  O extends SceneOptions,
  S extends SceneStats,
  A extends string = SceneAction,
> {
  name: string;
  /** Class added after `ascii-things`. */
  className: string;
  create: SceneFactory<O, S, A>;
  /** Runtime prop definitions for the scene-specific fields. */
  props: Record<string, unknown>;
  /** Build the options passed to the scene factory. */
  options: (props: AnyProps) => O;
  /** Structural fields that require a remount when changed. */
  structuralKey: (props: AnyProps) => string;
  defaultWidth?: string | number;
  defaultHeight?: string | number;
}

const sceneOptions = [
  "seed",
  "columns",
  "speed",
  "interactive",
  "maxDpr",
  "maxCells",
  "adaptiveQuality",
  "calm",
  "palette",
  "label",
  "paused",
  "fontFamily",
] as const;

const commonProps = {
  seed: { type: Number, default: undefined },
  columns: { type: Number, default: undefined },
  speed: { type: Number, default: undefined },
  interactive: { type: Boolean, default: undefined },
  maxDpr: { type: Number, default: undefined },
  maxCells: { type: Number, default: undefined },
  adaptiveQuality: { type: Boolean, default: undefined },
  calm: { type: Boolean, default: undefined },
  palette: {
    type: [String, Object] as PropType<PaletteChoice>,
    default: undefined,
  },
  label: { type: String, default: undefined },
  paused: { type: Boolean, default: undefined },
  fontFamily: { type: String, default: undefined },
  /** Render width. Defaults to 100%. */
  width: { type: [Number, String], default: "100%" },
  /** Render height. Defaults to 100%. */
  height: { type: [Number, String], default: "100%" },
  /** Sets CSS aspect-ratio and lets height follow it. */
  aspectRatio: { type: [Number, String], default: undefined },
  id: { type: String, default: undefined },
  className: { type: String, default: undefined },
  style: { type: [Object, String, Array] as PropType<StyleValue>, default: undefined },
  /** Called after the engine is created, including after remounts. */
  onReady: { type: Function as PropType<(scene: SceneHandle) => void>, default: undefined },
} satisfies Record<string, unknown>;

function pickOptions<O extends SceneOptions>(props: AnyProps, keys: readonly string[]): O {
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    const value = props[key];
    if (value !== undefined && value !== null) result[key] = value;
  }
  return result as O;
}

function structuralKey(props: AnyProps, keys: readonly string[]): string {
  return JSON.stringify(keys.map((key) => props[key]));
}

function toCssSize(value: unknown): string | number | undefined {
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}

export function createSceneComponent<
  O extends SceneOptions,
  S extends SceneStats,
  A extends string = SceneAction,
>(options: SceneComponentOptions<O, S, A>): DefineComponent {
  const component = defineComponent({
    name: options.name,
    inheritAttrs: false,
    props: {
      ...commonProps,
      ...options.props,
    } as ComponentObjectPropsOptions,
    setup(props: AnyProps, { attrs }: SetupContext) {
      const p = props;
      const sceneOptionsValue = computed(() => options.options(p));
      const remountKey = computed(() => options.structuralKey(p));

      // biome-ignore lint/correctness/useHookAtTopLevel: useAsciiScene is a Vue composable, not a React hook.
      const { canvasRef } = useAsciiScene({
        create: options.create,
        options: sceneOptionsValue,
        remountKey,
        onReady: (scene) => {
          const handler = p.onReady;
          if (typeof handler === "function") {
            handler(scene);
          }
        },
      });

      return () => {
        const label = typeof p.label === "string" ? p.label : undefined;
        const width = toCssSize(p.width) ?? options.defaultWidth ?? "100%";
        const height = toCssSize(p.height) ?? options.defaultHeight ?? "100%";
        const aspectRatio = toCssSize(p.aspectRatio);
        const userClass = typeof p.className === "string" ? p.className : undefined;

        return h(
          "canvas",
          mergeProps(
            {
              id: p.id,
              class: ["ascii-things", options.className, userClass].filter(Boolean).join(" "),
              role: label ? "img" : undefined,
              "aria-label": label,
              "aria-hidden": label ? undefined : true,
              style: {
                display: "block",
                width,
                height: aspectRatio ? "auto" : height,
                ...(aspectRatio ? { aspectRatio } : null),
              },
            },
            { style: p.style },
            attrs,
            { ref: canvasRef },
          ),
        );
      };
    },
  });

  return component as DefineComponent;
}

export { commonProps, pickOptions, sceneOptions, structuralKey };
