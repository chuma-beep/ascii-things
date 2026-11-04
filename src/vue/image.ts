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
import {
  renderAsciiImage,
  type AsciiImageOptions,
  type AsciiImageResult,
  type AsciiImageSource,
} from "../image/core";

export interface AsciiImageProps extends AsciiImageOptions {
  /** Image URL, File/Blob, loaded image, or ImageBitmap. */
  src: AsciiImageSource;
  /** Accessible description. Default "ASCII art". */
  alt?: string;
  id?: string;
  className?: string;
  style?: StyleValue;
  onRender?: (result: AsciiImageResult) => void;
  onError?: (error: unknown) => void;
}

/**
 * Vue wrapper for image-to-ASCII. The canvas is rendered once per source or
 * option change; the host owns the layout.
 */
export const AsciiImage = defineComponent({
  name: "AsciiImage",
  inheritAttrs: false,
  props: {
    src: {
      type: [String, Object] as PropType<AsciiImageSource>,
      required: true,
    },
    alt: { type: String, default: "ASCII art" },
    id: { type: String, default: undefined },
    className: { type: String, default: undefined },
    style: { type: [Object, String, Array] as PropType<StyleValue>, default: undefined },
    columns: { type: Number, default: undefined },
    charset: { type: String, default: undefined },
    invert: { type: Boolean, default: undefined },
    dither: {
      type: String as PropType<AsciiImageOptions["dither"]>,
      default: undefined,
    },
    contrast: { type: Number, default: undefined },
    brightness: { type: Number, default: undefined },
    gamma: { type: Number, default: undefined },
    color: { type: Boolean, default: undefined },
    foreground: { type: String, default: undefined },
    background: { type: String, default: undefined },
    fontFamily: { type: String, default: undefined },
    onRender: {
      type: Function as PropType<(result: AsciiImageResult) => void>,
      default: undefined,
    },
    onError: { type: Function as PropType<(error: unknown) => void>, default: undefined },
  },
  setup(props, { attrs }) {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    let token = 0;

    const run = async () => {
      const canvas = canvasRef.value;
      if (!canvas) return;
      const current = ++token;
      try {
        const result = await renderAsciiImage(canvas, props.src, {
          columns: props.columns,
          charset: props.charset,
          invert: props.invert,
          dither: props.dither,
          contrast: props.contrast,
          brightness: props.brightness,
          gamma: props.gamma,
          color: props.color,
          foreground: props.foreground,
          background: props.background,
          fontFamily: props.fontFamily,
        });
        if (current !== token) return;
        props.onRender?.(result);
      } catch (error) {
        if (current !== token) return;
        props.onError?.(error);
      }
    };

    onMounted(() => {
      void run();
    });

    watch(
      () => [
        props.src,
        props.columns,
        props.charset,
        props.invert,
        props.dither,
        props.contrast,
        props.brightness,
        props.gamma,
        props.color,
        props.foreground,
        props.background,
        props.fontFamily,
      ],
      () => {
        void run();
      },
    );

    onBeforeUnmount(() => {
      token += 1;
    });

    return () =>
      h(
        "canvas",
        mergeProps(
          {
            ref: canvasRef,
            id: props.id,
            class: ["ascii-things", "ascii-image", props.className].filter(Boolean).join(" "),
            role: "img",
            "aria-label": props.alt ?? "ASCII art",
            style: {
              display: "block",
              width: "100%",
              height: "auto",
            },
          },
          { style: props.style },
          attrs,
        ),
      );
  },
}) as unknown as DefineComponent<AsciiImageProps>;
