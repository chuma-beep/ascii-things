/**
 * Record a canvas for a short, self-contained clip. Browsers support WebM
 * through MediaRecorder; the file is intentionally a capture, not a GIF
 * encoder. Callers should treat unsupported browsers as a no-op.
 */
export async function recordCanvas(canvas: HTMLCanvasElement, durationMs = 4000): Promise<Blob> {
  if (typeof MediaRecorder === "undefined" || typeof canvas.captureStream !== "function") {
    throw new Error("This browser cannot record a canvas.");
  }

  const stream = canvas.captureStream(30);
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
  const mimeType = candidates.find((type) => MediaRecorder.isTypeSupported(type));
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: BlobPart[] = [];

  try {
    return await new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = () => reject(new Error("The canvas recording failed."));
      recorder.onstop = () => {
        for (const track of stream.getTracks()) track.stop();
        const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
        if (blob.size === 0) reject(new Error("The canvas recording was empty."));
        else resolve(blob);
      };
      recorder.start();
      window.setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, durationMs);
    });
  } catch (error) {
    for (const track of stream.getTracks()) track.stop();
    throw error;
  }
}
