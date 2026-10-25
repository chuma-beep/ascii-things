import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { renderAsciiImage, type AsciiImageResult } from "ascii-things/image";
import ImageCrop from "./ImageCrop";
import { createDemoCanvas } from "../lib/image/demo";
import {
  buildZip,
  canvasToBlob,
  downloadBlob,
  downloadText,
  uniqueBaseName,
} from "../lib/image/export";
import { buildProcessedCanvas } from "../lib/image/processing";
import { buildSvg } from "../lib/image/svg";
import {
  DEFAULT_OPTIONS,
  FULL_CROP,
  MAX_FILES,
  MAX_FILE_BYTES,
  RAMPS,
  normalizeCrop,
  safeBaseName,
  type CropRect,
  type StudioOptions,
  type StudioSource,
} from "../lib/image/types";

type Mode = "single" | "batch";
type View = "render" | "text";

interface RangeFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
  hint?: string;
}

function RangeField({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
  hint,
}: RangeFieldProps) {
  return (
    <label className="studio-range" htmlFor={id}>
      <span className="studio-range-head">
        <span>{label}</span>
        <output htmlFor={id}>{display}</output>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint ? <span className="studio-hint">{hint}</span> : null}
    </label>
  );
}

interface CheckFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  hint?: string;
}

function CheckField({ label, checked, onChange, disabled, hint }: CheckFieldProps) {
  return (
    <label className="studio-check">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        {label}
        {hint ? <small>{hint}</small> : null}
      </span>
    </label>
  );
}

const IMAGE_EXTENSION = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

function isImageFile(file: File) {
  return file.type.startsWith("image/") || IMAGE_EXTENSION.test(file.name);
}

function formatBytes(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `image-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadImageElement(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The image could not be decoded."));
    image.src = url;
  });
}

async function decodeBlob(blob: Blob, objectUrl: string) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob);
      if (bitmap.width > 0 && bitmap.height > 0) {
        return { drawable: bitmap, width: bitmap.width, height: bitmap.height };
      }
      bitmap.close();
    } catch {
      // SVG and a few browser formats still need the image element path.
    }
  }
  const image = await loadImageElement(objectUrl);
  return { drawable: image, width: image.naturalWidth, height: image.naturalHeight };
}

function coreOptions(options: StudioOptions) {
  return {
    columns: options.columns,
    charset: options.ramp,
    invert: options.invert,
    dither: options.dither,
    contrast: options.contrast,
    brightness: options.brightness,
    gamma: options.gamma,
    color: options.color && !options.edge,
    foreground: options.foreground,
    background: options.transparent ? "transparent" : options.background,
  };
}

async function waitForFonts() {
  if (typeof document !== "undefined" && document.fonts?.ready) await document.fonts.ready;
}

async function renderInto(
  canvas: HTMLCanvasElement,
  source: StudioSource,
  options: StudioOptions,
  width: number,
  dpr = 2,
): Promise<AsciiImageResult> {
  await waitForFonts();
  const processed = buildProcessedCanvas(
    source.drawable,
    source.width,
    source.height,
    source.crop,
    options.edge,
    options.edgeStrength,
  );
  return renderAsciiImage(canvas, processed, {
    ...coreOptions(options),
    width,
    dpr,
  });
}

async function renderSource(source: StudioSource, options: StudioOptions, width: number, dpr = 2) {
  const canvas = document.createElement("canvas");
  const result = await renderInto(canvas, source, options, width, dpr);
  return { canvas, result };
}

function sourceLabel(source: StudioSource) {
  const cropWidth = Math.max(1, Math.round(source.width * source.crop.w));
  const cropHeight = Math.max(1, Math.round(source.height * source.crop.h));
  return `${cropWidth} × ${cropHeight}`;
}

export default function ImageStudio() {
  const [mode, setMode] = useState<Mode>("single");
  const [sources, setSources] = useState<StudioSource[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [options, setOptions] = useState<StudioOptions>(DEFAULT_OPTIONS);
  const [customRamp, setCustomRamp] = useState(DEFAULT_OPTIONS.ramp);
  const [view, setView] = useState<View>("render");
  const [results, setResults] = useState<Record<string, AsciiImageResult>>({});
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [lastRenderMs, setLastRenderMs] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState(900);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const objectUrlsRef = useRef(new Set<string>());
  const initializedRef = useRef(false);
  const sourcesRef = useRef<StudioSource[]>([]);
  const activeIdRef = useRef<string | null>(null);
  const modeRef = useRef<Mode>("single");

  sourcesRef.current = sources;
  activeIdRef.current = activeId;
  modeRef.current = mode;

  const activeSource = sources.find((source) => source.id === activeId) ?? null;
  const activeResult = activeSource ? results[activeSource.id] : undefined;
  const presetName = RAMPS.find((ramp) => ramp.value === options.ramp)?.name;
  const selectRamp = presetName ?? "custom";
  const cropZoom = activeSource ? 1 / Math.max(activeSource.crop.w, activeSource.crop.h) : 1;

  const disposeSource = useCallback((source: StudioSource) => {
    if (source.thumbUrl.startsWith("blob:")) {
      objectUrlsRef.current.delete(source.thumbUrl);
      URL.revokeObjectURL(source.thumbUrl);
    }
    if (typeof ImageBitmap !== "undefined" && source.drawable instanceof ImageBitmap) {
      source.drawable.close();
    }
  }, []);

  const sourceFromBlob = useCallback(async (blob: Blob, name: string, bytes?: number) => {
    const objectUrl = URL.createObjectURL(blob);
    objectUrlsRef.current.add(objectUrl);
    try {
      const decoded = await decodeBlob(blob, objectUrl);
      const source: StudioSource = {
        id: makeId(),
        name,
        drawable: decoded.drawable,
        width: decoded.width,
        height: decoded.height,
        bytes: bytes ?? blob.size,
        thumbUrl: objectUrl,
        crop: { ...FULL_CROP },
      };
      return source;
    } catch (reason) {
      objectUrlsRef.current.delete(objectUrl);
      URL.revokeObjectURL(objectUrl);
      throw reason;
    }
  }, []);

  const insertSources = useCallback(
    (next: StudioSource[]) => {
      if (next.length === 0) return;
      const current = sourcesRef.current;
      const currentMode = modeRef.current;
      let merged: StudioSource[];

      if (currentMode === "single") {
        current.forEach(disposeSource);
        merged = next.slice(0, MAX_FILES);
        next.slice(MAX_FILES).forEach(disposeSource);
      } else {
        const room = Math.max(0, MAX_FILES - current.length);
        if (room === 0) {
          next.forEach(disposeSource);
          setError(`You can keep up to ${MAX_FILES} images in a batch.`);
          return;
        }
        const accepted = next.slice(0, room);
        next.slice(room).forEach(disposeSource);
        merged = [...current, ...accepted];
        if (next.length > accepted.length) {
          setError(`Only ${room} more image${room === 1 ? "" : "s"} fit in this batch.`);
        }
      }

      sourcesRef.current = merged;
      activeIdRef.current = next[0].id;
      modeRef.current = merged.length > 1 ? "batch" : "single";
      setSources(merged);
      setActiveId(next[0].id);
      setMode(modeRef.current);
    },
    [disposeSource],
  );

  const addFiles = useCallback(
    async (incoming: File[]) => {
      const files = incoming.filter(isImageFile);
      if (files.length === 0) {
        setError("Choose a PNG, JPEG, WebP, GIF, AVIF, or SVG image.");
        return;
      }
      const room =
        modeRef.current === "batch"
          ? Math.max(0, MAX_FILES - sourcesRef.current.length)
          : MAX_FILES;
      if (room === 0) {
        setError(`You can keep up to ${MAX_FILES} images in a batch.`);
        return;
      }
      const accepted = files.slice(0, room);
      setError(null);
      if (files.length > accepted.length) {
        setError(`Only ${room} more image${room === 1 ? "" : "s"} fit in this batch.`);
      }
      setBusy("Reading images…");
      const loaded: StudioSource[] = [];
      for (const file of accepted) {
        if (file.size > MAX_FILE_BYTES) {
          setError(`${file.name} is larger than ${formatBytes(MAX_FILE_BYTES)}.`);
          continue;
        }
        try {
          loaded.push(await sourceFromBlob(file, file.name, file.size));
        } catch (reason) {
          setError(`${file.name}: ${errorMessage(reason)}`);
        }
      }
      setBusy(null);
      if (loaded.length > 0) insertSources(loaded);
    },
    [insertSources, sourceFromBlob],
  );

  const loadDemo = useCallback(() => {
    setError(null);
    const canvas = createDemoCanvas();
    const source: StudioSource = {
      id: makeId(),
      name: "Robot dog / demo",
      drawable: canvas,
      width: canvas.width,
      height: canvas.height,
      thumbUrl: canvas.toDataURL("image/png"),
      crop: { ...FULL_CROP },
      isDemo: true,
    };
    insertSources([source]);
  }, [insertSources]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    loadDemo();
  }, [loadDemo]);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      const files = Array.from(event.clipboardData?.files ?? []).filter(isImageFile);
      if (files.length > 0) {
        event.preventDefault();
        void addFiles(files);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [addFiles]);

  useEffect(() => {
    const element = previewWrapRef.current;
    if (!element) return;
    const measure = () => {
      const width = Math.max(
        320,
        Math.min(1400, Math.round(element.getBoundingClientRect().width)),
      );
      setPreviewWidth((current) => (current === width ? current : width));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [activeSource?.id, view]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!activeSource) {
      setRendering(false);
      return;
    }
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const started = performance.now();
    const timer = window.setTimeout(() => {
      void (async () => {
        setRendering(true);
        setRenderError(null);
        try {
          const result = await renderInto(canvas, activeSource, options, previewWidth, 2);
          if (!cancelled) {
            setResults((current) => ({ ...current, [activeSource.id]: result }));
            setLastRenderMs(Math.round(performance.now() - started));
          }
        } catch (reason) {
          if (!cancelled) setRenderError(errorMessage(reason));
        } finally {
          if (!cancelled) setRendering(false);
        }
      })();
    }, 60);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeSource, options, previewWidth]);

  useEffect(() => {
    return () => {
      for (const source of sourcesRef.current) disposeSource(source);
    };
  }, [disposeSource]);

  const updateOption = useCallback((patch: Partial<StudioOptions>) => {
    setOptions((current) => ({ ...current, ...patch }));
    setRendering(true);
  }, []);

  const updateCrop = useCallback((crop: CropRect) => {
    const id = activeIdRef.current;
    if (!id) return;
    setRendering(true);
    setSources((current) => {
      const next = current.map((source) =>
        source.id === id ? { ...source, crop: normalizeCrop(crop) } : source,
      );
      sourcesRef.current = next;
      return next;
    });
  }, []);

  const resetCrop = useCallback(() => {
    updateCrop(FULL_CROP);
  }, [updateCrop]);

  const setCropZoom = useCallback(
    (zoom: number) => {
      const size = 1 / Math.max(1, zoom);
      updateCrop({ x: (1 - size) / 2, y: (1 - size) / 2, w: size, h: size });
    },
    [updateCrop],
  );

  const removeSource = useCallback(
    (id: string) => {
      const current = sourcesRef.current;
      const target = current.find((source) => source.id === id);
      if (!target) return;
      disposeSource(target);
      const next = current.filter((source) => source.id !== id);
      sourcesRef.current = next;
      setSources(next);
      if (activeIdRef.current === id) {
        const nextActive = next[0]?.id ?? null;
        activeIdRef.current = nextActive;
        setActiveId(nextActive);
      }
      if (next.length <= 1) {
        modeRef.current = "single";
        setMode("single");
      }
      setResults((currentResults) => {
        const nextResults = { ...currentResults };
        delete nextResults[id];
        return nextResults;
      });
    },
    [disposeSource],
  );

  const clearAll = useCallback(() => {
    for (const source of sourcesRef.current) disposeSource(source);
    sourcesRef.current = [];
    activeIdRef.current = null;
    modeRef.current = "single";
    setSources([]);
    setActiveId(null);
    setMode("single");
    setResults({});
    setRenderError(null);
    setNotice("");
  }, [disposeSource]);

  const loadRemote = useCallback(
    async (url: string) => {
      let parsed: URL;
      try {
        parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          throw new Error("Use an http:// or https:// image URL.");
        }
      } catch (reason) {
        setError(errorMessage(reason));
        return;
      }

      setBusy("Fetching remote image…");
      setError(null);
      try {
        let response = await fetch(`/api/image-proxy?url=${encodeURIComponent(parsed.href)}`, {
          headers: { accept: "image/*" },
        });
        if ([404, 405, 501].includes(response.status)) {
          response = await fetch(parsed.href, { mode: "cors" });
        }
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(
            data && typeof data.error === "string"
              ? data.error
              : `The image request failed (${response.status}).`,
          );
        }
        const blob = await response.blob();
        if (blob.size === 0) throw new Error("The remote file was empty.");
        const name =
          decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() ?? "") ||
          "remote-image";
        const source = await sourceFromBlob(blob, name, blob.size);
        insertSources([source]);
        setRemoteUrl("");
      } catch (reason) {
        setError(
          `Could not load that URL. ${errorMessage(reason)} Remote images must allow CORS or use the image proxy.`,
        );
      } finally {
        setBusy(null);
      }
    },
    [insertSources, sourceFromBlob],
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void addFiles(files);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length > 0) void addFiles(files);
  };

  const handleUrlSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (remoteUrl.trim()) void loadRemote(remoteUrl.trim());
  };

  const copyText = async () => {
    if (!activeResult) return;
    try {
      await navigator.clipboard.writeText(activeResult.text);
      setNotice("ASCII text copied.");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = activeResult.text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setNotice("ASCII text copied.");
      } catch {
        setError("Could not copy automatically. Use the TXT download instead.");
      } finally {
        textarea.remove();
      }
    }
  };

  const downloadTxt = async () => {
    if (!activeSource) return;
    setExporting("txt");
    try {
      const { result } = await renderSource(activeSource, options, 1400, 2);
      downloadText(result.text, `${safeBaseName(activeSource.name)}-ascii.txt`);
      setNotice("TXT downloaded.");
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setExporting(null);
    }
  };

  const downloadPng = async () => {
    if (!activeSource) return;
    setExporting("png");
    try {
      const { canvas } = await renderSource(activeSource, options, 1400, 2);
      const blob = await canvasToBlob(canvas);
      downloadBlob(blob, `${safeBaseName(activeSource.name)}-ascii.png`);
      setNotice("PNG downloaded.");
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setExporting(null);
    }
  };

  const downloadSvg = async () => {
    if (!activeSource) return;
    setExporting("svg");
    try {
      const { result } = await renderSource(activeSource, options, 1400, 2);
      const svg = buildSvg(result, options, activeSource.name);
      downloadBlob(
        new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
        `${safeBaseName(activeSource.name)}-ascii.svg`,
      );
      setNotice("SVG downloaded.");
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setExporting(null);
    }
  };

  const downloadZip = async () => {
    if (sources.length === 0) return;
    setExporting("zip");
    setBatchProgress(`0 / ${sources.length}`);
    setError(null);
    try {
      const used = new Set<string>();
      const files: Record<string, Uint8Array> = {};
      const encoder = new TextEncoder();
      const failures: string[] = [];

      for (let index = 0; index < sources.length; index += 1) {
        const source = sources[index];
        setBatchProgress(`${index + 1} / ${sources.length} · ${source.name}`);
        try {
          const { canvas, result } = await renderSource(source, options, 1400, 2);
          const base = uniqueBaseName(`${safeBaseName(source.name)}-ascii`, used);
          files[`text/${base}.txt`] = encoder.encode(result.text);
          const png = await canvasToBlob(canvas);
          files[`png/${base}.png`] = new Uint8Array(await png.arrayBuffer());
          files[`svg/${base}.svg`] = encoder.encode(buildSvg(result, options, source.name));
        } catch (reason) {
          failures.push(`${source.name}: ${errorMessage(reason)}`);
        }
      }

      if (failures.length > 0) files["errors.txt"] = encoder.encode(failures.join("\n"));
      if (Object.keys(files).length === 0) throw new Error("No images could be converted.");
      const zip = await buildZip(files);
      downloadBlob(zip, "ascii-things-batch.zip");
      setNotice(
        failures.length > 0
          ? `ZIP downloaded with ${failures.length} conversion error${failures.length === 1 ? "" : "s"}.`
          : "Batch ZIP downloaded.",
      );
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBatchProgress(null);
      setExporting(null);
    }
  };

  const resetOptions = () => {
    setOptions(DEFAULT_OPTIONS);
    setCustomRamp(DEFAULT_OPTIONS.ramp);
    setRendering(true);
  };

  const onRampSelect = (value: string) => {
    if (value === "custom") {
      updateOption({ ramp: customRamp });
      return;
    }
    const preset = RAMPS.find((ramp) => ramp.name === value);
    if (preset) {
      setCustomRamp(preset.value);
      updateOption({ ramp: preset.value });
    }
  };

  return (
    <div className="image-studio not-content" aria-busy={busy !== null || exporting !== null}>
      <header className="studio-intro">
        <div>
          <p className="studio-kicker">ASCII-THINGS / IMAGE LAB</p>
          <h1 className="studio-display">
            Image <span aria-hidden="true">→</span> ASCII
          </h1>
          <p className="studio-lede">
            Turn a photograph, screenshot, or drawing into a living glyph field. Tune the ramp,
            tone, crop, and colour, then take the text, a PNG, or an SVG with you.
          </p>
        </div>
        <div className="studio-intro-side">
          <div className="studio-mode-switch">
            <button
              type="button"
              aria-pressed={mode === "single"}
              onClick={() => setMode("single")}
            >
              Single
            </button>
            <button type="button" aria-pressed={mode === "batch"} onClick={() => setMode("batch")}>
              Batch
            </button>
          </div>
          <p className="studio-private">
            <span aria-hidden="true">●</span> Rendered on this device
          </p>
          <a className="studio-guide-link" href="/guide/image/">
            Read the image API →
          </a>
        </div>
      </header>

      <div className="studio-workbench">
        <div className="studio-side">
          <section
            className={`studio-panel studio-source${dragging ? " is-dragging" : ""}`}
            aria-labelledby="studio-source-title"
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (event.currentTarget === event.target) setDragging(false);
            }}
            onDrop={handleDrop}
          >
            <div className="studio-panel-head">
              <span className="studio-eyebrow">01 / Source</span>
              <span className="studio-tag">LOCAL</span>
            </div>
            <h2 id="studio-source-title" className="studio-panel-title">
              {activeSource ? activeSource.name : "Bring an image"}
            </h2>

            {activeSource ? (
              <>
                <ImageCrop
                  src={activeSource.thumbUrl}
                  width={activeSource.width}
                  height={activeSource.height}
                  crop={activeSource.crop}
                  onChange={updateCrop}
                />
                <div className="studio-source-meta">
                  <span>{sourceLabel(activeSource)}</span>
                  <span>{formatBytes(activeSource.bytes)}</span>
                  <span>
                    {Math.max(
                      1,
                      Math.round(1 / Math.max(activeSource.crop.w, activeSource.crop.h)),
                    )}
                    × crop
                  </span>
                </div>
                <RangeField
                  id="studio-crop-zoom"
                  label="Crop zoom"
                  value={cropZoom}
                  min={1}
                  max={16.7}
                  step={0.1}
                  display={`${cropZoom.toFixed(1)}×`}
                  onChange={setCropZoom}
                />
                <div className="studio-source-actions">
                  <button type="button" onClick={() => fileInputRef.current?.click()}>
                    {mode === "batch" ? "Add images" : "Replace image"}
                  </button>
                  <button type="button" className="studio-button-quiet" onClick={resetCrop}>
                    Reset crop
                  </button>
                  <button
                    type="button"
                    className="studio-button-quiet"
                    onClick={() => removeSource(activeSource.id)}
                  >
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                className="studio-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="studio-dropzone-mark" aria-hidden="true">
                  +
                </span>
                <span className="studio-dropzone-title">Drop, paste, or choose an image</span>
                <span className="studio-dropzone-hint">PNG · JPEG · WebP · GIF · AVIF · SVG</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              className="studio-visually-hidden"
              type="file"
              aria-label="Choose image files"
              tabIndex={-1}
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
              multiple={mode === "batch"}
              onChange={handleFileChange}
            />

            <div className="studio-source-links">
              <button type="button" className="studio-button-quiet" onClick={loadDemo}>
                Load demo
              </button>
              <button
                type="button"
                className="studio-button-quiet"
                onClick={() => {
                  setMode("batch");
                  fileInputRef.current?.click();
                }}
              >
                Add to batch
              </button>
              <button type="button" className="studio-button-quiet" onClick={clearAll}>
                Clear all
              </button>
            </div>

            <p className="studio-privacy">
              Uploaded images stay in this browser. Remote URLs are fetched through a narrow image
              proxy.
            </p>

            <form className="studio-url" onSubmit={handleUrlSubmit}>
              <label htmlFor="studio-remote-url">Use an image URL</label>
              <div>
                <input
                  id="studio-remote-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  value={remoteUrl}
                  onChange={(event) => setRemoteUrl(event.target.value)}
                  disabled={busy !== null}
                />
                <button type="submit" disabled={busy !== null || !remoteUrl.trim()}>
                  Load
                </button>
              </div>
              <small>HTTP(S) only. The remote host must allow the image proxy.</small>
            </form>

            {error ? (
              <p className="studio-error" role="alert">
                {error}
              </p>
            ) : null}
            {busy ? <p className="studio-busy">{busy}</p> : null}
          </section>

          <section className="studio-panel studio-controls" aria-labelledby="studio-controls-title">
            <div className="studio-panel-head">
              <span className="studio-eyebrow">03 / Controls</span>
              <span className="studio-tag">LIVE</span>
            </div>
            <h2 id="studio-controls-title" className="studio-panel-title">
              Tune the field
            </h2>

            <div className="studio-field-grid">
              <fieldset className="studio-fieldset">
                <legend>Resolution</legend>
                <RangeField
                  id="studio-columns"
                  label="Columns"
                  value={options.columns}
                  min={24}
                  max={280}
                  step={1}
                  display={`${options.columns}`}
                  onChange={(value) => updateOption({ columns: value })}
                />
                <div className="studio-preset-row">
                  {[48, 80, 96, 140, 200].map((columns) => (
                    <button
                      key={columns}
                      type="button"
                      className="studio-chip"
                      aria-pressed={options.columns === columns}
                      onClick={() => updateOption({ columns })}
                    >
                      {columns}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="studio-fieldset">
                <legend>Glyphs</legend>
                <label className="studio-select" htmlFor="studio-ramp">
                  <span>Character ramp</span>
                  <select
                    id="studio-ramp"
                    value={selectRamp}
                    onChange={(event) => onRampSelect(event.target.value)}
                  >
                    {RAMPS.map((ramp) => (
                      <option key={ramp.name} value={ramp.name}>
                        {ramp.name} — {ramp.note}
                      </option>
                    ))}
                    <option value="custom">Custom…</option>
                  </select>
                </label>
                {selectRamp === "custom" ? (
                  <label className="studio-text-field" htmlFor="studio-custom-ramp">
                    <span>Custom ramp · light → dense</span>
                    <input
                      id="studio-custom-ramp"
                      type="text"
                      value={customRamp}
                      onChange={(event) => {
                        setCustomRamp(event.target.value);
                        updateOption({ ramp: event.target.value });
                      }}
                      spellCheck={false}
                    />
                  </label>
                ) : null}
                <label className="studio-select" htmlFor="studio-dither">
                  <span>Dither</span>
                  <select
                    id="studio-dither"
                    value={options.dither}
                    onChange={(event) =>
                      updateOption({ dither: event.target.value as StudioOptions["dither"] })
                    }
                  >
                    <option value="none">None</option>
                    <option value="floyd-steinberg">Floyd–Steinberg</option>
                    <option value="bayer">Bayer 4×4</option>
                  </select>
                </label>
              </fieldset>

              <fieldset className="studio-fieldset">
                <legend>Tone</legend>
                <RangeField
                  id="studio-contrast"
                  label="Contrast"
                  value={options.contrast}
                  min={0.2}
                  max={3}
                  step={0.05}
                  display={options.contrast.toFixed(2)}
                  onChange={(value) => updateOption({ contrast: value })}
                />
                <RangeField
                  id="studio-brightness"
                  label="Brightness"
                  value={options.brightness}
                  min={-0.5}
                  max={0.5}
                  step={0.01}
                  display={options.brightness.toFixed(2)}
                  onChange={(value) => updateOption({ brightness: value })}
                />
                <RangeField
                  id="studio-gamma"
                  label="Gamma"
                  value={options.gamma}
                  min={0.4}
                  max={2.5}
                  step={0.05}
                  display={options.gamma.toFixed(2)}
                  onChange={(value) => updateOption({ gamma: value })}
                />
                <CheckField
                  label="Invert ramp"
                  checked={options.invert}
                  onChange={(checked) => updateOption({ invert: checked })}
                />
              </fieldset>

              <fieldset className="studio-fieldset">
                <legend>Edge field</legend>
                <CheckField
                  label="Sobel edges"
                  checked={options.edge}
                  onChange={(checked) =>
                    updateOption({ edge: checked, color: checked ? false : options.color })
                  }
                  hint="Outputs monochrome contours."
                />
                {options.edge ? (
                  <RangeField
                    id="studio-edge-strength"
                    label="Edge strength"
                    value={options.edgeStrength}
                    min={0.5}
                    max={4}
                    step={0.1}
                    display={options.edgeStrength.toFixed(1)}
                    onChange={(value) => updateOption({ edgeStrength: value })}
                  />
                ) : null}
              </fieldset>

              <fieldset className="studio-fieldset">
                <legend>Colour</legend>
                <CheckField
                  label="Source colour"
                  checked={options.color && !options.edge}
                  disabled={options.edge}
                  onChange={(checked) => updateOption({ color: checked })}
                  hint={
                    options.edge
                      ? "Disabled while edges are active."
                      : "Colour each glyph from the source."
                  }
                />
                <div className="studio-colour-row">
                  <label className="studio-colour">
                    <span>Ink</span>
                    <input
                      type="color"
                      value={options.foreground}
                      onChange={(event) => updateOption({ foreground: event.target.value })}
                    />
                  </label>
                  <label className="studio-colour">
                    <span>Paper</span>
                    <input
                      type="color"
                      value={options.background}
                      disabled={options.transparent}
                      onChange={(event) => updateOption({ background: event.target.value })}
                    />
                  </label>
                </div>
                <CheckField
                  label="Transparent background"
                  checked={options.transparent}
                  onChange={(checked) => updateOption({ transparent: checked })}
                  hint="PNG and SVG exports keep the alpha channel."
                />
              </fieldset>
            </div>

            <button
              type="button"
              className="studio-button-quiet studio-reset"
              onClick={resetOptions}
            >
              Reset settings
            </button>
          </section>
        </div>

        <section className="studio-panel studio-stage" aria-labelledby="studio-preview-title">
          <div className="studio-stage-head">
            <div>
              <span className="studio-eyebrow">02 / Output</span>
              <h2 id="studio-preview-title" className="studio-panel-title">
                ASCII field
              </h2>
            </div>
            <div className="studio-tabs" role="tablist" aria-label="Output view">
              <button
                type="button"
                role="tab"
                aria-selected={view === "render"}
                onClick={() => setView("render")}
              >
                Render
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === "text"}
                onClick={() => setView("text")}
              >
                Text
              </button>
            </div>
          </div>

          {activeSource ? (
            <>
              <div
                className={`studio-preview${options.transparent ? " is-transparent" : ""}`}
                ref={previewWrapRef}
              >
                <canvas
                  ref={previewCanvasRef}
                  className="studio-canvas"
                  role="img"
                  aria-label={`ASCII conversion of ${activeSource.name}`}
                  aria-hidden={view !== "render"}
                  style={{ display: view === "render" ? "block" : "none" }}
                />
                {view === "text" ? (
                  <pre className="studio-text-output">{activeResult?.text ?? "Rendering…"}</pre>
                ) : null}
                {rendering ? <span className="studio-rendering">rendering…</span> : null}
                {renderError ? (
                  <div className="studio-render-error" role="alert">
                    {renderError}
                  </div>
                ) : null}
              </div>

              <div className="studio-stats" aria-live="polite">
                <span>
                  <b>{activeResult?.columns ?? "—"}</b> cols
                </span>
                <span>
                  <b>{activeResult?.rows ?? "—"}</b> rows
                </span>
                <span>
                  <b>{activeResult ? activeResult.text.split("\n").join("").length : "—"}</b> chars
                </span>
                <span>
                  <b>{activeSource.width}</b> × <b>{activeSource.height}</b> source
                </span>
                {lastRenderMs !== null ? <span>{lastRenderMs} ms</span> : null}
              </div>

              <div className="studio-actions">
                <button
                  type="button"
                  className="studio-button-solid"
                  onClick={copyText}
                  disabled={!activeResult || rendering}
                >
                  Copy ASCII
                </button>
                <button
                  type="button"
                  onClick={downloadTxt}
                  disabled={!activeSource || !activeResult || rendering || exporting !== null}
                >
                  {exporting === "txt" ? "Preparing…" : "TXT"}
                </button>
                <button
                  type="button"
                  onClick={downloadPng}
                  disabled={!activeSource || !activeResult || rendering || exporting !== null}
                >
                  {exporting === "png" ? "Preparing…" : "PNG 2×"}
                </button>
                <button
                  type="button"
                  onClick={downloadSvg}
                  disabled={!activeSource || !activeResult || rendering || exporting !== null}
                >
                  {exporting === "svg" ? "Preparing…" : "SVG"}
                </button>
              </div>
            </>
          ) : (
            <div className="studio-empty">
              <span className="studio-empty-mark" aria-hidden="true">
                ⌁
              </span>
              <p>No image yet. Drop one in, paste from the clipboard, or load the demo.</p>
              <button type="button" onClick={() => fileInputRef.current?.click()}>
                Choose an image
              </button>
            </div>
          )}
        </section>
      </div>

      {mode === "batch" ? (
        <section className="studio-panel studio-batch" aria-labelledby="studio-batch-title">
          <div className="studio-batch-head">
            <div>
              <span className="studio-eyebrow">04 / Batch</span>
              <h2 id="studio-batch-title" className="studio-panel-title">
                Queue / {sources.length} <span className="studio-batch-max">of {MAX_FILES}</span>
              </h2>
            </div>
            <div className="studio-batch-actions">
              <button type="button" onClick={() => fileInputRef.current?.click()}>
                Add images
              </button>
              <button
                type="button"
                className="studio-button-solid"
                onClick={downloadZip}
                disabled={sources.length === 0 || exporting !== null}
              >
                {exporting === "zip" ? "Packing…" : "Download ZIP"}
              </button>
              <button type="button" className="studio-button-quiet" onClick={clearAll}>
                Clear
              </button>
            </div>
          </div>
          <div className="studio-queue">
            {sources.map((source) => (
              <div
                key={source.id}
                className={`studio-queue-item${source.id === activeId ? " is-active" : ""}`}
              >
                <button
                  type="button"
                  className="studio-queue-select"
                  onClick={() => {
                    activeIdRef.current = source.id;
                    setActiveId(source.id);
                  }}
                  aria-pressed={source.id === activeId}
                >
                  <img src={source.thumbUrl} alt="" />
                  <span>
                    <b>{source.name}</b>
                    <small>{sourceLabel(source)}</small>
                  </span>
                </button>
                <button
                  type="button"
                  className="studio-queue-remove"
                  onClick={() => removeSource(source.id)}
                  aria-label={`Remove ${source.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {batchProgress ? <p className="studio-busy">{batchProgress}</p> : null}
          <p className="studio-hint">
            Batch exports one TXT, PNG, and SVG per image inside a ZIP. Settings and crop apply per
            image.
          </p>
        </section>
      ) : null}

      <p
        className={notice ? "studio-notice is-visible" : "studio-notice"}
        role="status"
        aria-live="polite"
      >
        {notice}
      </p>
    </div>
  );
}
