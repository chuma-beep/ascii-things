import {
  renderAsciiImage,
  type AsciiImageCharset,
  type AsciiImageDither,
  type AsciiImageSource,
} from "../../src/image";

const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const fileInput = document.querySelector<HTMLInputElement>("#file")!;
const drop = document.querySelector<HTMLElement>("#drop")!;
const pick = document.querySelector<HTMLButtonElement>("#pick")!;
const urlForm = document.querySelector<HTMLFormElement>("#url-form")!;
const urlInput = document.querySelector<HTMLInputElement>("#url")!;
const error = document.querySelector<HTMLElement>("#error")!;
const columns = document.querySelector<HTMLInputElement>("#columns")!;
const columnsValue = document.querySelector<HTMLElement>("#columns-value")!;
const contrast = document.querySelector<HTMLInputElement>("#contrast")!;
const contrastValue = document.querySelector<HTMLElement>("#contrast-value")!;
const charset = document.querySelector<HTMLSelectElement>("#charset")!;
const dither = document.querySelector<HTMLSelectElement>("#dither")!;
const invert = document.querySelector<HTMLInputElement>("#invert")!;
const color = document.querySelector<HTMLInputElement>("#color")!;
const stats = document.querySelector<HTMLElement>("#stats")!;
const text = document.querySelector<HTMLElement>("#text")!;
const copy = document.querySelector<HTMLButtonElement>("#copy")!;
const download = document.querySelector<HTMLButtonElement>("#download")!;
const sourcePreview = document.querySelector<HTMLImageElement>("#source-preview")!;
const sourceName = document.querySelector<HTMLElement>("#source-name")!;

let source: AsciiImageSource = "/examples/image/avatar.png";
let objectUrl: string | null = null;
let renderId = 0;
let timer = 0;

function options() {
  return {
    columns: Number(columns.value),
    contrast: Number(contrast.value),
    charset: charset.value as AsciiImageCharset,
    dither: dither.value as AsciiImageDither,
    invert: invert.checked,
    color: color.checked,
  };
}

function setBusy(busy: boolean) {
  canvas.classList.toggle("is-busy", busy);
}

async function render() {
  const id = ++renderId;
  setBusy(true);
  error.hidden = true;
  try {
    const result = await renderAsciiImage(canvas, source, options());
    if (id !== renderId) return;
    text.textContent = result.text;
    stats.textContent = `${result.columns} × ${result.rows} · ${result.columns * result.rows} cells`;
    copy.disabled = false;
    download.disabled = false;
  } catch (cause) {
    if (id !== renderId) return;
    error.hidden = false;
    error.textContent =
      cause instanceof Error
        ? `${cause.message} Remote images need CORS headers. Try a local file.`
        : "Could not read that image. Try a local file.";
    stats.textContent = "no image";
    copy.disabled = true;
    download.disabled = true;
  } finally {
    if (id === renderId) setBusy(false);
  }
}

function schedule() {
  window.clearTimeout(timer);
  timer = window.setTimeout(render, 120);
}

function loadFile(file: File) {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  source = file;
  sourcePreview.src = objectUrl;
  sourceName.textContent = file.name;
  render();
}

function useUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return;
  let label = trimmed;
  try {
    label = new URL(trimmed, window.location.href).hostname;
  } catch {
    // Keep the raw value as the label.
  }
  source = trimmed;
  sourcePreview.src = trimmed;
  sourceName.textContent = label;
  render();
}

pick.addEventListener("click", () => fileInput.click());
drop.addEventListener("click", (event) => {
  if (event.target !== pick) fileInput.click();
});
drop.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) loadFile(file);
});

for (const eventName of ["dragenter", "dragover"]) {
  drop.addEventListener(eventName, (event) => {
    event.preventDefault();
    drop.classList.add("is-dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  drop.addEventListener(eventName, (event) => {
    event.preventDefault();
    drop.classList.remove("is-dragging");
  });
}
drop.addEventListener("drop", (event) => {
  const file = event.dataTransfer?.files?.[0];
  if (file?.type.startsWith("image/")) loadFile(file);
});

urlForm.addEventListener("submit", (event) => {
  event.preventDefault();
  useUrl(urlInput.value);
});

columns.addEventListener("input", () => {
  columnsValue.textContent = columns.value;
  schedule();
});
contrast.addEventListener("input", () => {
  contrastValue.textContent = Number(contrast.value).toFixed(2);
  schedule();
});
for (const control of [charset, dither, invert, color]) {
  control.addEventListener("change", schedule);
}

copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(text.textContent ?? "");
    copy.textContent = "COPIED";
    window.setTimeout(() => {
      copy.textContent = "COPY TEXT";
    }, 1400);
  } catch {
    error.hidden = false;
    error.textContent = "Clipboard access was denied. Select the plain-text block instead.";
  }
});

download.addEventListener("click", () => {
  const blob = new Blob([text.textContent ?? ""], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ascii-image.txt";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});

if (window.matchMedia("(max-width: 720px)").matches) {
  columns.value = "56";
}
columnsValue.textContent = columns.value;
contrastValue.textContent = Number(contrast.value).toFixed(2);
copy.disabled = true;
download.disabled = true;

render();
document.fonts.ready.then(render);
