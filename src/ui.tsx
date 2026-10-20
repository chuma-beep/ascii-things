"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createDog } from "./dog";
import type { AsciiDogOptions, DogStats, DogWorldEvent } from "./dog";

export type { AsciiDogOptions, DogStats, DogWorldEvent };

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function toCssSize(value: string | number | undefined, fallback: string) {
  if (value === undefined) return fallback;
  return typeof value === "number" ? String(value) : value;
}

/* -------------------------------------------------------------------------- */
/* Stage                                                                      */
/* -------------------------------------------------------------------------- */

export interface AsciiStageProps {
  /** Small label in the top-left HUD. */
  label?: ReactNode;
  /** Optional status shown in the top-right HUD. A live dot is added. */
  status?: ReactNode;
  /** Content layered over the canvas. */
  overlay?: ReactNode;
  /** Content below the canvas, usually an AsciiReadout. */
  footer?: ReactNode;
  /** CSS aspect-ratio for the frame. Defaults to 16 / 10. */
  aspectRatio?: string | number;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * A framed scene surface. Put a canvas (or any scene) inside and use the
 * HUD, overlay, and footer slots for host UI.
 */
export function AsciiStage({
  label,
  status,
  overlay,
  footer,
  aspectRatio = "16 / 10",
  ariaLabel,
  className,
  style,
  children,
}: AsciiStageProps) {
  return (
    <figure className={cx("ascii-stage", className)} style={style} aria-label={ariaLabel}>
      <div className="ascii-stage-frame" style={{ aspectRatio: toCssSize(aspectRatio, "16 / 10") }}>
        {children}
        {(label || status) && (
          <div className="ascii-stage-hud">
            {label ? <span className="ascii-stage-label">{label}</span> : <span />}
            {status ? (
              <span className="ascii-stage-status">
                <i className="ascii-stage-dot" aria-hidden="true" />
                {status}
              </span>
            ) : null}
          </div>
        )}
        {overlay ? <div className="ascii-stage-overlay">{overlay}</div> : null}
      </div>
      {footer ? <figcaption className="ascii-stage-footer">{footer}</figcaption> : null}
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/* Prompt                                                                     */
/* -------------------------------------------------------------------------- */

export interface AsciiPromptProps {
  /** Screen-reader label for the input. */
  label?: string;
  placeholder?: string;
  actionLabel?: string;
  /** Optional status under the input. Rendered in a polite live region. */
  status?: ReactNode;
  /** Optional helper text under the input. */
  hint?: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSubmit: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Accessible command input with a monospace shell and an inline action.
 * Enter submits; the input is cleared and refocused after an uncontrolled submit.
 */
export function AsciiPrompt({
  label = "Command",
  placeholder = "Type a command…",
  actionLabel = "Send",
  status,
  hint,
  value,
  defaultValue = "",
  onValueChange,
  onSubmit,
  maxLength = 80,
  disabled = false,
  autoFocus = false,
  className,
  style,
}: AsciiPromptProps) {
  const inputId = useId();
  const statusId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const controlled = value !== undefined;
  const currentValue = controlled ? value : internalValue;
  const describedBy = status || hint ? statusId : undefined;

  const update = (next: string) => {
    if (!controlled) setInternalValue(next);
    onValueChange?.(next);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = currentValue.trim();
    if (!text || disabled) return;
    onSubmit(text);
    update("");
    inputRef.current?.focus();
  };

  return (
    <form className={cx("ascii-prompt", className)} style={style} onSubmit={submit}>
      <label className="ascii-sr-only" htmlFor={inputId}>
        {label}
      </label>
      <div className="ascii-prompt-shell">
        <span className="ascii-prompt-caret" aria-hidden="true">
          ›
        </span>
        <input
          ref={inputRef}
          id={inputId}
          className="ascii-prompt-input"
          type="text"
          value={currentValue}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          enterKeyHint="send"
          aria-describedby={describedBy}
          onChange={(event) => update(event.target.value)}
        />
        <button className="ascii-prompt-action" type="submit" disabled={disabled}>
          {actionLabel}
        </button>
      </div>
      {(status || hint) && (
        <div id={statusId} className="ascii-prompt-meta">
          {status ? (
            <span className="ascii-prompt-status" aria-live="polite">
              {status}
            </span>
          ) : null}
          {hint ? <span className="ascii-prompt-hint">{hint}</span> : null}
        </div>
      )}
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Readout                                                                    */
/* -------------------------------------------------------------------------- */

export interface AsciiReadoutItem {
  label: ReactNode;
  value: ReactNode;
}

export interface AsciiReadoutProps {
  items: AsciiReadoutItem[];
  columns?: number;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

/** A compact label/value grid for live scene metrics. */
export function AsciiReadout({
  items,
  columns = 4,
  ariaLabel,
  className,
  style,
}: AsciiReadoutProps) {
  if (!items.length) return null;
  const readoutStyle = {
    ...style,
    "--ascii-readout-columns": String(columns),
  } as CSSProperties;

  return (
    <dl className={cx("ascii-readout", className)} style={readoutStyle} aria-label={ariaLabel}>
      {items.map((item, index) => (
        <div className="ascii-readout-item" key={index}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* -------------------------------------------------------------------------- */
/* Scene tabs                                                                 */
/* -------------------------------------------------------------------------- */

export interface AsciiSceneTab {
  id: string;
  label: string;
  meta?: string;
}

export interface AsciiSceneTabsProps {
  scenes: AsciiSceneTab[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

/** Keyboard-navigable tabs for switching scenes, palettes, or variants. */
export function AsciiSceneTabs({
  scenes,
  value,
  onChange,
  ariaLabel = "Scenes",
  className,
  style,
}: AsciiSceneTabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % scenes.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + scenes.length) % scenes.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = scenes.length - 1;
    else return;
    event.preventDefault();
    onChange(scenes[next].id);
    window.requestAnimationFrame(() => refs.current[next]?.focus());
  };

  return (
    <div className={cx("ascii-tabs", className)} style={style} role="tablist" aria-label={ariaLabel}>
      {scenes.map((scene, index) => {
        const selected = scene.id === value;
        return (
          <button
            key={scene.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            className="ascii-tab"
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(scene.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <span>{scene.label}</span>
            {scene.meta ? <small>{scene.meta}</small> : null}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dog hero recipe                                                            */
/* -------------------------------------------------------------------------- */

export interface AsciiDogHeroProps extends AsciiDogOptions {
  eyebrow?: ReactNode;
  title?: ReactNode;
  lede?: ReactNode;
  promptLabel?: string;
  placeholder?: string;
  actionLabel?: string;
  stageLabel?: string;
  className?: string;
  style?: CSSProperties;
  onCommand?: (command: string) => void;
}

const REPLIES = [
  "BALL LAUNCHED · UNIT 01 ON IT",
  "VECTOR LOCKED · UNIT 01 ON IT",
  "FETCH QUEUED · GOOD BOY",
  "THROW CONFIRMED · GO GET IT",
];

function fnv1a(text: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Copy-paste-ready dog hero: stage, prompt, live reading, and a ball throw.
 * The host keeps its own page chrome; this is the scene composition only.
 */
export function AsciiDogHero({
  eyebrow = "ROBOT DOG / TEST YARD",
  title = (
    <>
      A small scene.
      <br />
      <em>A very good dog.</em>
    </>
  ),
  lede = "A live ASCII quadruped in a test yard. Type a command, throw the ball, and watch the unit work.",
  promptLabel = "Tell the dog what to fetch",
  placeholder = "Tell the dog what to fetch…",
  actionLabel = "Throw",
  stageLabel = "ROBOT DOG / TEST YARD",
  className,
  style,
  onCommand,
  ...dogProps
}: AsciiDogHeroProps) {
  const {
    label = "A live ASCII robot dog test yard",
    onEvent,
    ...engineOptions
  } = dogProps;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReturnType<typeof createDog> | null>(null);
  const optionsRef = useRef(engineOptions);
  optionsRef.current = engineOptions;
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  const [stats, setStats] = useState<DogStats | null>(null);
  const [echo, setEcho] = useState("yard@04 · awaiting command");
  const [reply, setReply] = useState("UNIT 01 · IDLE · BALL READY");

  const structuralKey = JSON.stringify({
    seed: engineOptions.seed,
    count: engineOptions.count,
    dogs: engineOptions.dogs,
    spread: engineOptions.spread,
    scale: engineOptions.scale,
    maxDpr: engineOptions.maxDpr,
    interactive: engineOptions.interactive,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleEvent = (event: DogWorldEvent) => {
      onEventRef.current?.(event);
      if (event.kind === "nudge") setReply("FETCH COMPLETE · GOOD BOY");
      if (event.kind === "charge" || event.kind === "low") {
        setReply("LOW BATTERY · RETURNING TO DOCK");
      }
    };
    const engine = createDog(canvas, {
      ...optionsRef.current,
      label,
      onEvent: handleEvent,
    });
    engineRef.current = engine;
    const refresh = () => setStats(engine.getStats());
    refresh();
    const timer = window.setInterval(refresh, 500);
    return () => {
      window.clearInterval(timer);
      engine.destroy();
      engineRef.current = null;
    };
  }, [structuralKey, label]);

  const { palette, speed, columns, maxCells, calm } = engineOptions;
  useEffect(() => {
    engineRef.current?.setOptions({ palette, speed, columns, maxCells, calm, label });
  }, [palette, speed, columns, maxCells, calm, label]);

  const submit = (command: string) => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    setEcho(`> ${command}`);
    setReply(REPLIES[fnv1a(command) % REPLIES.length]);
    onCommandRef.current?.(command);
    if (!canvas || !engine) return;
    const hash = fnv1a(command);
    engine.throwBall(
      canvas.clientWidth * (0.2 + ((hash % 1000) / 1000) * 0.6),
      canvas.clientHeight * 0.7,
    );
  };

  const readout = [
    { label: "CELLS", value: stats ? stats.cells.toLocaleString("en-US") : "—" },
    { label: "UNITS", value: stats ? String(stats.dogs).padStart(2, "0") : "—" },
    { label: "STATE", value: stats ? stats.state.toUpperCase() : "—" },
    { label: "FPS", value: stats ? String(Math.round(stats.fps)) : "—" },
  ];

  return (
    <section className={cx("ascii-dog-hero", className)} style={style}>
      <div className="ascii-dog-hero-copy">
        <p className="ascii-kicker">
          <i aria-hidden="true" />
          {eyebrow}
        </p>
        <h2 className="ascii-dog-hero-title">{title}</h2>
        <p className="ascii-dog-hero-lede">{lede}</p>
        <AsciiPrompt
          label={promptLabel}
          placeholder={placeholder}
          actionLabel={actionLabel}
          onSubmit={submit}
          status={
            <>
              <span>{echo}</span>
              <span className="ascii-prompt-reply">{reply}</span>
            </>
          }
        />
      </div>

      <AsciiStage
        className="ascii-dog-hero-stage"
        label={stageLabel}
        status="LIVE"
        aspectRatio="4 / 3"
        footer={<AsciiReadout items={readout} ariaLabel="Live scene statistics" />}
      >
        <canvas
          ref={canvasRef}
          className="ascii-things ascii-dog"
          role="img"
          aria-label={label}
        />
      </AsciiStage>
    </section>
  );
}
