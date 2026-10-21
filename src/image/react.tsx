"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import {
  renderAsciiImage,
  type AsciiImageOptions,
  type AsciiImageResult,
  type AsciiImageSource,
} from "./core";

export interface AsciiImageProps extends AsciiImageOptions {
  /** Image URL, File/Blob, loaded image, or ImageBitmap. */
  src: AsciiImageSource;
  /** Accessible description. Default "ASCII art". */
  alt?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
  onRender?: (result: AsciiImageResult) => void;
  onError?: (error: unknown) => void;
}

export function AsciiImage({
  src,
  alt = "ASCII art",
  id,
  className,
  style,
  columns,
  charset,
  invert,
  dither,
  contrast,
  color,
  foreground,
  background,
  fontFamily,
  onRender,
  onError,
}: AsciiImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onRenderRef = useRef(onRender);
  const onErrorRef = useRef(onError);
  onRenderRef.current = onRender;
  onErrorRef.current = onError;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    renderAsciiImage(canvas, src, {
      columns,
      charset,
      invert,
      dither,
      contrast,
      color,
      foreground,
      background,
      fontFamily,
    })
      .then((result) => {
        if (!cancelled) onRenderRef.current?.(result);
      })
      .catch((error: unknown) => {
        if (!cancelled) onErrorRef.current?.(error);
      });
    return () => {
      cancelled = true;
    };
  }, [src, columns, charset, invert, dither, contrast, color, foreground, background, fontFamily]);

  return (
    <canvas
      ref={canvasRef}
      id={id}
      className={["ascii-things", "ascii-image", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={alt}
      style={{ display: "block", width: "100%", height: "auto", ...style }}
    />
  );
}
