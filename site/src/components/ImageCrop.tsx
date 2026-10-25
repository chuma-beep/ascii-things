import {
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { clamp, normalizeCrop, type CropRect } from "../lib/image/types";

type DragMode = "move" | "nw" | "ne" | "sw" | "se";

interface DragState {
  mode: DragMode;
  startX: number;
  startY: number;
  startCrop: CropRect;
  rect: DOMRect;
}

interface ImageCropProps {
  src: string;
  crop: CropRect;
  onChange: (crop: CropRect) => void;
}

const HANDLES: Array<{ mode: Exclude<DragMode, "move">; label: string }> = [
  { mode: "nw", label: "top left" },
  { mode: "ne", label: "top right" },
  { mode: "sw", label: "bottom left" },
  { mode: "se", label: "bottom right" },
];

export default function ImageCrop({ src, crop, onChange }: ImageCropProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = (event.clientX - drag.startX) / Math.max(1, drag.rect.width);
      const dy = (event.clientY - drag.startY) / Math.max(1, drag.rect.height);
      const start = drag.startCrop;
      let next = start;

      if (drag.mode === "move") {
        next = {
          ...start,
          x: clamp(start.x + dx, 0, 1 - start.w),
          y: clamp(start.y + dy, 0, 1 - start.h),
        };
      } else {
        const minimum = 0.06;
        let left = start.x;
        let top = start.y;
        let right = start.x + start.w;
        let bottom = start.y + start.h;
        if (drag.mode.includes("w")) left = clamp(start.x + dx, 0, right - minimum);
        if (drag.mode.includes("e")) right = clamp(start.x + start.w + dx, left + minimum, 1);
        if (drag.mode.includes("n")) top = clamp(start.y + dy, 0, bottom - minimum);
        if (drag.mode.includes("s")) bottom = clamp(start.y + start.h + dy, top + minimum, 1);
        next = { x: left, y: top, w: right - left, h: bottom - top };
      }

      onChangeRef.current(normalizeCrop(next));
    };
    const up = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  const startDrag = (event: ReactPointerEvent<HTMLElement>, mode: DragMode) => {
    const frame = frameRef.current;
    if (!frame) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startCrop: crop,
      rect: frame.getBoundingClientRect(),
    };
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.04 : 0.01;
    const dx = event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0;
    const dy = event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0;
    if (!dx && !dy) return;
    event.preventDefault();
    if (event.shiftKey) {
      onChange(
        normalizeCrop({
          ...crop,
          w: clamp(crop.w + dx, 0.06, 1 - crop.x),
          h: clamp(crop.h + dy, 0.06, 1 - crop.y),
        }),
      );
      return;
    }
    onChange(
      normalizeCrop({
        ...crop,
        x: clamp(crop.x + dx, 0, 1 - crop.w),
        y: clamp(crop.y + dy, 0, 1 - crop.h),
      }),
    );
  };

  return (
    <div className="studio-crop-area">
      <div className="studio-crop-stage">
        <div className="studio-crop-frame" ref={frameRef}>
          <img src={src} alt="" draggable={false} />
          <div
            className="studio-crop-shade studio-crop-shade--top"
            style={{ height: `${crop.y * 100}%` }}
          />
          <div
            className="studio-crop-shade studio-crop-shade--bottom"
            style={{ top: `${(crop.y + crop.h) * 100}%` }}
          />
          <div
            className="studio-crop-shade studio-crop-shade--left"
            style={{
              top: `${crop.y * 100}%`,
              width: `${crop.x * 100}%`,
              height: `${crop.h * 100}%`,
            }}
          />
          <div
            className="studio-crop-shade studio-crop-shade--right"
            style={{
              top: `${crop.y * 100}%`,
              left: `${(crop.x + crop.w) * 100}%`,
              height: `${crop.h * 100}%`,
            }}
          />
          <button
            type="button"
            className="studio-crop-box"
            style={{
              left: `${crop.x * 100}%`,
              top: `${crop.y * 100}%`,
              width: `${crop.w * 100}%`,
              height: `${crop.h * 100}%`,
            }}
            aria-label="Crop area. Use arrow keys to move. Hold shift and use arrow keys to resize."
            onKeyDown={handleKeyDown}
            onPointerDown={(event) => startDrag(event, "move")}
          >
            {HANDLES.map((handle) => (
              <span
                key={handle.mode}
                className={`studio-crop-handle studio-crop-handle--${handle.mode}`}
                data-handle={handle.mode}
                aria-hidden="true"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  startDrag(event, handle.mode);
                }}
              >
                <span className="studio-visually-hidden">Resize {handle.label}</span>
              </span>
            ))}
          </button>
        </div>
      </div>
      <p className="studio-crop-hint">
        Drag the frame to crop. Arrow keys nudge; shift + arrows resize.
      </p>
    </div>
  );
}
