import { safeBaseName } from "./types";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text: string, filename: string) {
  downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), filename);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not encode the canvas as a PNG."));
    }, "image/png");
  });
}

export function uniqueBaseName(name: string, used: Set<string>) {
  const base = safeBaseName(name);
  let candidate = base;
  let index = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  used.add(candidate);
  return candidate;
}

export async function buildZip(files: Record<string, Uint8Array>): Promise<Blob> {
  const { zipSync } = await import("fflate");
  const bytes = zipSync(files, { level: 6 });
  return new Blob([bytes as BlobPart], { type: "application/zip" });
}
