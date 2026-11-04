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
import { DitherField, type DitherFieldOptions } from "../dither/core";

export interface AsciiDitherProps extends DitherFieldOptions {
  id?: string;
  className?: string;
  style?: StyleValue;
  /** Accessible description. Defaults to the rendered text. */
  label?: string;
  /** Keep the static first frame. */
  paused?: boolean;
}

/**
 * Canvas dither field with an animated scan band. The host owns the frame:
 * set a height on this element or its parent.
 */
export const AsciiDither = defineComponent({
  name: "AsciiDither",
  inheritAttrs: false,
  props: {
    id: { type: String, default: undefined },
    className: { type: String, default: undefined },
    style: { type: [Object, String, Array] as PropType<StyleValue>, default: undefined },
    label: { type: String, default: undefined },
    paused: { type: Boolean, default: false },
    text: { type: String, default: undefined },
    matrix: {
      type: String as PropType<DitherFieldOptions["matrix"]>,
      default: undefined,
    },
    cell: { type: Number, default: undefined },
    density: { type: Number, default: undefined },
    wordDensity: { type: Number, default: undefined },
    scan: { type: Boolean, default: undefined },
    speed: { type: Number, default: undefined },
    foreground: { type: String, default: undefined },
    accent: { type: String, default: undefined },
    background: { type: String, default: undefined },
    fontFamily: { type: String, default: undefined },
  },
  setup(props, { attrs }) {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    let field: DitherField | null = null;

    const create = () => {
      const canvas = canvasRef.value;
      if (!canvas) return;
      field?.destroy();
      field = new DitherField(canvas, {
        text: props.text,
        matrix: props.matrix,
        cell: props.cell,
        density: props.density,
        wordDensity: props.wordDensity,
        scan: props.scan,
        speed: props.speed,
        foreground: props.foreground,
        accent: props.accent,
        background: props.background,
        fontFamily: props.fontFamily,
      });
      if (props.paused) field.setPaused(true);
    };

    onMounted(create);

    watch(
      () => [
        props.text,
        props.matrix,
        props.cell,
        props.density,
        props.wordDensity,
        props.scan,
        props.speed,
        props.foreground,
        props.accent,
        props.background,
        props.fontFamily,
        props.paused,
      ],
      create,
    );

    onBeforeUnmount(() => {
      field?.destroy();
      field = null;
    });

    return () =>
      h(
        "canvas",
        mergeProps(
          {
            ref: canvasRef,
            id: props.id,
            class: ["ascii-things", "ascii-dither", props.className].filter(Boolean).join(" "),
            role: "img",
            "aria-label": props.label ?? props.text ?? "Dither field",
            style: {
              display: "block",
              width: "100%",
              height: "240px",
            },
          },
          { style: props.style },
          attrs,
        ),
      );
  },
}) as unknown as DefineComponent<AsciiDitherProps>;
