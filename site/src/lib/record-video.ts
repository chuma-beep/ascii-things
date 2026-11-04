import { recordMp4 } from "./record-mp4";
import { recordCanvas } from "./record-webm";

export interface RecordedVideo {
  blob: Blob;
  extension: "mp4" | "webm";
}

/**
 * Prefer a real H.264 MP4 through WebCodecs. If the browser cannot encode it,
 * fall back to MediaRecorder's WebM stream and keep the same return shape.
 */
export async function recordVideo(
  canvas: HTMLCanvasElement,
  durationMs = 4000,
): Promise<RecordedVideo> {
  try {
    const blob = await recordMp4(canvas, { duration: durationMs });
    return { blob, extension: "mp4" };
  } catch {
    const blob = await recordCanvas(canvas, durationMs);
    return {
      blob,
      extension: blob.type.includes("mp4") ? "mp4" : "webm",
    };
  }
}
