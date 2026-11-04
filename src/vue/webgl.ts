import {
  defineComponent,
  h,
  mergeProps,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type DefineComponent,
  type PropType,
  type StyleValue,
} from "vue";
import { AsciiSurfaceEngine, type AsciiSurfaceOptions } from "../webgl/core";

export interface AsciiSurfaceProps extends AsciiSurfaceOptions {
  id?: string;
  className?: string;
  style?: StyleValue;
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
export const AsciiSurface = defineComponent({
  name: "AsciiSurface",
  inheritAttrs: false,
  props: {
    id: { type: String, default: undefined },
    className: { type: String, default: undefined },
    style: { type: [Object, String, Array] as PropType<StyleValue>, default: undefined },
    label: { type: String, default: undefined },
    paused: { type: Boolean, default: false },
    text: { type: String, default: undefined },
    glyphs: { type: String, default: undefined },
    cell: { type: Number, default: undefined },
    density: { type: Number, default: undefined },
    speed: { type: Number, default: undefined },
    scan: { type: Boolean, default: undefined },
    pointer: { type: Boolean, default: undefined },
    foreground: { type: String, default: undefined },
    accent: { type: String, default: undefined },
    background: { type: String, default: undefined },
    fontFamily: { type: String, default: undefined },
    maxDpr: { type: Number, default: undefined },
    variant: {
      type: String as PropType<AsciiSurfaceOptions["variant"]>,
      default: undefined,
    },
  },
  setup(props, { attrs }) {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    let engine: AsciiSurfaceEngine | null = null;

    const create = () => {
      const canvas = canvasRef.value;
      if (!canvas) return;
      engine?.destroy();
      engine = new AsciiSurfaceEngine(canvas, {
        text: props.text,
        glyphs: props.glyphs,
        cell: props.cell,
        density: props.density,
        speed: props.speed,
        scan: props.scan,
        pointer: props.pointer,
        foreground: props.foreground,
        accent: props.accent,
        background: props.background,
        fontFamily: props.fontFamily,
        maxDpr: props.maxDpr,
        variant: props.variant,
      });
      canvas.dataset.renderer = engine.renderer;
      engine.setPaused(props.paused);
    };

    onMounted(create);

    watch(
      () => [
        props.text,
        props.glyphs,
        props.cell,
        props.density,
        props.speed,
        props.scan,
        props.pointer,
        props.foreground,
        props.accent,
        props.background,
        props.fontFamily,
        props.maxDpr,
        props.variant,
        props.paused,
      ],
      create,
    );

    onBeforeUnmount(() => {
      engine?.destroy();
      engine = null;
    });

    return () =>
      h(
        "canvas",
        mergeProps(
          {
            ref: canvasRef,
            id: props.id,
            class: ["ascii-things", "ascii-surface", props.className].filter(Boolean).join(" "),
            role: "img",
            "aria-label": props.label ?? props.text ?? "ASCII surface",
            style: {
              display: "block",
              width: "100%",
              height: "320px",
            },
          },
          { style: props.style },
          attrs,
        ),
      );
  },
}) as unknown as DefineComponent<AsciiSurfaceProps>;
