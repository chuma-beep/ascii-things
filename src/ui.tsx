"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type FormEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createDog } from "./dog";
import { createJellyfish } from "./jellyfish";
import { createRobots } from "./robots";
import { createSharks } from "./sharks";
import { createStarlings } from "./starlings";
import { createFireflies } from "./fireflies";
import { createAnts } from "./ants";
import { createKoi } from "./koi";
import { createCity } from "./city";
import { createServers } from "./servers";
import type { SceneAction, SceneHandle, SceneOptions, SceneReady, SceneStats } from "./core/scene";
import type { AsciiDogOptions, DogStats, DogWorldEvent } from "./dog";
import type { AsciiJellyfishOptions } from "./jellyfish/options";
import type { AsciiSharksOptions } from "./options";
import type { AsciiRobotsOptions } from "./robots/options";
import type { AsciiStarlingsOptions } from "./starlings/options";
import type { AsciiFirefliesOptions } from "./fireflies/options";
import type { AsciiAntsOptions } from "./ants/options";
import type { AsciiKoiOptions } from "./koi/options";
import type { AsciiCityOptions } from "./city/options";
import type { AsciiServersOptions } from "./servers/options";

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
    <div
      className={cx("ascii-tabs", className)}
      style={style}
      role="tablist"
      aria-label={ariaLabel}
    >
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
  const { label = "A live ASCII robot dog test yard", onEvent, ...engineOptions } = dogProps;
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
        <canvas ref={canvasRef} className="ascii-things ascii-dog" role="img" aria-label={label} />
      </AsciiStage>
    </section>
  );
}

/* ------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* ------------------------------------------------------------------------- */

export interface UseAsciiSceneOptions<
  S extends SceneStats = SceneStats,
  O extends SceneOptions = SceneOptions,
> {
  /** Scene factory, usually one of `createSharks`, `createRobots`, `createJellyfish`, `createDog`. */
  create: (canvas: HTMLCanvasElement, options: O) => SceneHandle<S>;
  options: O;
  /** Change this when a structural scene option changes and the engine must be recreated. */
  remountKey?: string;
  onReady?: SceneReady<S>;
}

export interface UseAsciiSceneResult<S extends SceneStats = SceneStats> {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  scene: SceneHandle<S> | null;
  stats: S | null;
  refresh: () => void;
}

/**
 * Owns a canvas scene for a React component: construction, teardown, live
 * options, a 500ms stats sample, and the ready handle.
 */
export function useAsciiScene<
  S extends SceneStats = SceneStats,
  O extends SceneOptions = SceneOptions,
>({
  create,
  options,
  remountKey = "",
  onReady,
}: UseAsciiSceneOptions<S, O>): UseAsciiSceneResult<S> {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<SceneHandle<S> | null>(null);
  const optionsRef = useRef(options);
  const createRef = useRef(create);
  const onReadyRef = useRef(onReady);
  const [scene, setScene] = useState<SceneHandle<S> | null>(null);
  const [stats, setStats] = useState<S | null>(null);

  optionsRef.current = options;
  createRef.current = create;
  onReadyRef.current = onReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createRef.current(canvas, optionsRef.current);
    sceneRef.current = engine;
    setScene(engine);
    setStats(engine.getStats());
    onReadyRef.current?.(engine);

    const timer = window.setInterval(() => setStats(engine.getStats()), 500);
    return () => {
      window.clearInterval(timer);
      engine.destroy();
      if (sceneRef.current === engine) sceneRef.current = null;
    };
  }, [remountKey]);

  useEffect(() => {
    sceneRef.current?.setOptions(options);
  }, [options]);

  return {
    canvasRef,
    scene,
    stats,
    refresh: () => {
      if (sceneRef.current) setStats(sceneRef.current.getStats());
    },
  };
}

/* ------------------------------------------------------------------------- */
/* Primitives                                                                 */
/* ------------------------------------------------------------------------- */

export type AsciiButtonVariant = "solid" | "ghost" | "quiet";
export type AsciiButtonSize = "sm" | "md";

export interface AsciiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AsciiButtonVariant;
  size?: AsciiButtonSize;
}

export const AsciiButton = forwardRef<HTMLButtonElement, AsciiButtonProps>(function AsciiButton(
  { variant = "ghost", size = "md", type = "button", className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx("ascii-button", `ascii-button-${variant}`, `ascii-button-${size}`, className)}
      {...props}
    />
  );
});

export interface AsciiToolbarProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function AsciiToolbar({ label, className, ...props }: AsciiToolbarProps) {
  return (
    <div
      {...props}
      role="toolbar"
      aria-label={label ?? (props["aria-label"] as string | undefined)}
      className={cx("ascii-toolbar", className)}
    />
  );
}

export interface AsciiToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
}

export function AsciiToggle({
  checked,
  onCheckedChange,
  label,
  hint,
  className,
  onClick,
  ...props
}: AsciiToggleProps) {
  return (
    <button
      {...props}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={typeof label === "string" ? label : undefined}
      className={cx("ascii-toggle", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onCheckedChange(!checked);
      }}
    >
      <span className="ascii-toggle-track" aria-hidden="true">
        <span className="ascii-toggle-thumb" />
      </span>
      <span className="ascii-toggle-copy">
        <span className="ascii-toggle-label">{label}</span>
        {hint ? <small className="ascii-toggle-hint">{hint}</small> : null}
      </span>
    </button>
  );
}

export type AsciiPanelPadding = "none" | "sm" | "md" | "lg";

export interface AsciiPanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  eyebrow?: ReactNode;
  heading?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  padding?: AsciiPanelPadding;
  children?: ReactNode;
}

export function AsciiPanel({
  eyebrow,
  heading,
  actions,
  footer,
  padding = "md",
  className,
  children,
  ...props
}: AsciiPanelProps) {
  const hasHeader = Boolean(eyebrow || heading || actions);
  return (
    <section {...props} className={cx("ascii-panel", className)}>
      {hasHeader ? (
        <header className="ascii-panel-header">
          <div className="ascii-panel-heading">
            {eyebrow ? <span className="ascii-panel-eyebrow">{eyebrow}</span> : null}
            {heading ? <h3 className="ascii-panel-title">{heading}</h3> : null}
          </div>
          {actions ? <div className="ascii-panel-actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cx("ascii-panel-body", padding !== "md" && `ascii-panel-body-${padding}`)}>
        {children}
      </div>
      {footer ? <footer className="ascii-panel-footer">{footer}</footer> : null}
    </section>
  );
}

export type AsciiStatusTone = "neutral" | "accent" | "success" | "warning";

export interface AsciiStatusProps extends HTMLAttributes<HTMLSpanElement> {
  label: ReactNode;
  value?: ReactNode;
  tone?: AsciiStatusTone;
  pulse?: boolean;
  live?: boolean;
}

export function AsciiStatus({
  label,
  value,
  tone = "neutral",
  pulse = false,
  live = false,
  className,
  ...props
}: AsciiStatusProps) {
  return (
    <span
      {...props}
      aria-live={live ? "polite" : undefined}
      className={cx(
        "ascii-status",
        `ascii-status-${tone}`,
        pulse && "ascii-status-pulse",
        className,
      )}
    >
      <i className="ascii-status-dot" aria-hidden="true" />
      <span className="ascii-status-label">{label}</span>
      {value ? <strong className="ascii-status-value">{value}</strong> : null}
    </span>
  );
}

export interface AsciiDividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  label?: ReactNode;
}

export function AsciiDivider({
  orientation = "horizontal",
  label,
  className,
  ...props
}: AsciiDividerProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: optional labels need a container element.
    <div
      {...props}
      role="separator"
      aria-orientation={orientation}
      className={cx("ascii-divider", `ascii-divider-${orientation}`, className)}
    >
      {label ? <span className="ascii-divider-label">{label}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Scene heroes                                                               */
/* ------------------------------------------------------------------------- */

export type AsciiSceneKind =
  | "sharks"
  | "robots"
  | "jellyfish"
  | "dog"
  | "starlings"
  | "fireflies"
  | "ants"
  | "koi"
  | "city"
  | "servers";

export type AsciiSceneOptionsByKind = {
  sharks: AsciiSharksOptions;
  robots: AsciiRobotsOptions;
  jellyfish: AsciiJellyfishOptions;
  dog: AsciiDogOptions;
  starlings: AsciiStarlingsOptions;
  fireflies: AsciiFirefliesOptions;
  ants: AsciiAntsOptions;
  koi: AsciiKoiOptions;
  city: AsciiCityOptions;
  servers: AsciiServersOptions;
};

interface SceneCopy {
  eyebrow: string;
  title: ReactNode;
  lede: string;
  promptLabel: string;
  placeholder: string;
  actionLabel: string;
  stageLabel: string;
  replies: string[];
}

const SCENE_COPY: Record<AsciiSceneKind, SceneCopy> = {
  sharks: {
    eyebrow: "SHARK TANK / REEF 01",
    title: (
      <>
        A small <em>ocean.</em>
      </>
    ),
    lede: "A reef that schools, hunts, panics, and settles. Touch the water and watch the wake move through it.",
    promptLabel: "Make a ripple",
    placeholder: "Type a ripple…",
    actionLabel: "Splash",
    stageLabel: "SHARKS / OPEN WATER",
    replies: ["WAKE RELEASED", "CURRENT DISTURBED", "SCHOOL SCATTERED", "SURFACE BROKEN"],
  },
  robots: {
    eyebrow: "FACTORY FLOOR / BAY 02",
    title: (
      <>
        A floor that <em>works.</em>
      </>
    ),
    lede: "Patrols, jobs, charging docks, and low batteries. Dispatch a unit and watch the floor rebalance.",
    promptLabel: "Dispatch a unit",
    placeholder: "Assign a job…",
    actionLabel: "Dispatch",
    stageLabel: "ROBOTS / NIGHT SHIFT",
    replies: ["UNIT DISPATCHED", "JOB QUEUED", "BAY REBALANCED", "SHIFT LOG UPDATED"],
  },
  jellyfish: {
    eyebrow: "JELLYFISH BLOOM / DRIFT 03",
    title: (
      <>
        A quiet <em>bloom.</em>
      </>
    ),
    lede: "Bells pulse on a live current. Send a shockwave through the water and watch the bloom answer.",
    promptLabel: "Send a shockwave",
    placeholder: "Disturb the current…",
    actionLabel: "Pulse",
    stageLabel: "JELLYFISH / DEEP CURRENT",
    replies: ["SHOCKWAVE SENT", "CURRENT PULSED", "BLOOM SHIFTED", "PRESSURE CHANGED"],
  },
  dog: {
    eyebrow: "ROBOT DOG / TEST YARD",
    title: (
      <>
        A good dog.
        <br />
        <em>Go get it.</em>
      </>
    ),
    lede: "A test yard with a ball, a dock, and one very good quadruped. Type a command and throw.",
    promptLabel: "Tell the dog what to fetch",
    placeholder: "Tell the dog what to fetch…",
    actionLabel: "Throw",
    stageLabel: "ROBOT DOG / TEST YARD",
    replies: [
      "VECTOR LOCKED · UNIT 01 ON IT",
      "BALL AWAY · FETCHING",
      "COMMAND RECEIVED",
      "GOOD BOY",
    ],
  },
  starlings: {
    eyebrow: "MURMURATION / DUSK 04",
    title: (
      <>
        A sky that <em>turns.</em>
      </>
    ),
    lede: "A flock folds across the dusk, one bird at a time. Break the formation and watch it find itself again.",
    promptLabel: "Scatter the flock",
    placeholder: "Break the formation…",
    actionLabel: "Scatter",
    stageLabel: "STARLINGS / OPEN SKY",
    replies: ["FLOCK BROKEN", "FORMATION SHIFTED", "SKY SCATTERED", "WINGS RESET"],
  },
  fireflies: {
    eyebrow: "MEADOW / NIGHT 05",
    title: (
      <>
        A field that <em>blinks.</em>
      </>
    ),
    lede: "Grass, dusk, and a slow conversation of lights. Flare the meadow and the rhythm changes.",
    promptLabel: "Flare the meadow",
    placeholder: "Change the rhythm…",
    actionLabel: "Flare",
    stageLabel: "FIREFLIES / NIGHT MEADOW",
    replies: ["MEADOW FLARED", "SIGNAL SENT", "RHYTHM CHANGED", "LIGHTS ANSWERED"],
  },
  ants: {
    eyebrow: "COLONY / TRAIL 06",
    title: (
      <>
        A trail that <em>thinks.</em>
      </>
    ),
    lede: "Pheromones, food runs, and a nest that keeps count. Drop a crumb and the colony reorganizes.",
    promptLabel: "Drop a crumb",
    placeholder: "Leave something behind…",
    actionLabel: "Crumb",
    stageLabel: "ANTS / FORAGE LINE",
    replies: ["CRUMB FOUND", "TRAIL MARKED", "COLONY ROUTED", "NEST COUNTED"],
  },
  koi: {
    eyebrow: "KOI POND / DRIFT 07",
    title: (
      <>
        A pond that <em>answers.</em>
      </>
    ),
    lede: "Slow fish, still water, and ripples that outlive the touch. Feed the pond and watch it gather.",
    promptLabel: "Feed the koi",
    placeholder: "Drop a pellet…",
    actionLabel: "Feed",
    stageLabel: "KOI / STILL WATER",
    replies: ["PELLETS DROPPED", "POND STIRRED", "KOI GATHERED", "RIPPLE SENT"],
  },
  city: {
    eyebrow: "CITY GRID / NIGHT 08",
    title: (
      <>
        A city that <em>moves.</em>
      </>
    ),
    lede: "Windows, signals, and traffic on a repeating grid. Call rush hour and the whole block leans in.",
    promptLabel: "Call rush hour",
    placeholder: "Change the pace…",
    actionLabel: "Rush",
    stageLabel: "CITY / AFTER HOURS",
    replies: ["RUSH HOUR", "SIGNALS CYCLED", "TRAFFIC SURGED", "GRID SATURATED"],
  },
  servers: {
    eyebrow: "SERVER RACK / BAY 09",
    title: (
      <>
        A rack that <em>answers.</em>
      </>
    ),
    lede: "Fans, LEDs, and packets crossing a cold aisle. Ping the rack and watch the traffic find its target.",
    promptLabel: "Ping the rack",
    placeholder: "Send a packet…",
    actionLabel: "Ping",
    stageLabel: "SERVERS / COLD AISLE",
    replies: ["PING ACK", "PACKET ROUTED", "RACK ANSWERED", "LATENCY LOW"],
  },
};

const SCENE_ACTIONS: Record<AsciiSceneKind, SceneAction> = {
  sharks: "splash",
  robots: "dispatch",
  jellyfish: "shockwave",
  dog: "throwBall",
  starlings: "scatter",
  fireflies: "flare",
  ants: "crumb",
  koi: "feed",
  city: "rush",
  servers: "ping",
};

const EMPTY_OPTIONS: SceneOptions = {};

const SCENE_FACTORIES: Record<
  AsciiSceneKind,
  (canvas: HTMLCanvasElement, options: SceneOptions) => SceneHandle
> = {
  sharks: (canvas, options) =>
    createSharks(canvas, options as AsciiSharksOptions) as unknown as SceneHandle,
  robots: (canvas, options) =>
    createRobots(canvas, options as AsciiRobotsOptions) as unknown as SceneHandle,
  jellyfish: (canvas, options) =>
    createJellyfish(canvas, options as AsciiJellyfishOptions) as unknown as SceneHandle,
  dog: (canvas, options) => createDog(canvas, options as AsciiDogOptions) as unknown as SceneHandle,
  starlings: (canvas, options) =>
    createStarlings(canvas, options as AsciiStarlingsOptions) as unknown as SceneHandle,
  fireflies: (canvas, options) =>
    createFireflies(canvas, options as AsciiFirefliesOptions) as unknown as SceneHandle,
  ants: (canvas, options) =>
    createAnts(canvas, options as AsciiAntsOptions) as unknown as SceneHandle,
  koi: (canvas, options) => createKoi(canvas, options as AsciiKoiOptions) as unknown as SceneHandle,
  city: (canvas, options) =>
    createCity(canvas, options as AsciiCityOptions) as unknown as SceneHandle,
  servers: (canvas, options) =>
    createServers(canvas, options as AsciiServersOptions) as unknown as SceneHandle,
};

function sceneKey(kind: AsciiSceneKind, options: SceneOptions): string {
  const value = options as Record<string, unknown>;
  switch (kind) {
    case "sharks":
      return JSON.stringify([value.seed, value.density, value.sharks, value.sharkScale]);
    case "robots":
      return JSON.stringify([value.seed, value.count, value.robots, value.scale]);
    case "jellyfish":
      return JSON.stringify([value.seed, value.count, value.jellies, value.scale]);
    case "dog":
      return JSON.stringify([value.seed, value.count, value.dogs, value.scale, value.spread]);
    default:
      return JSON.stringify([value.seed, value.count, value.scale]);
  }
}

export interface AsciiSceneHeroProps<K extends AsciiSceneKind = AsciiSceneKind> {
  scene: K;
  options?: AsciiSceneOptionsByKind[K];
  eyebrow?: ReactNode;
  title?: ReactNode;
  lede?: ReactNode;
  promptLabel?: string;
  placeholder?: string;
  actionLabel?: string;
  stageLabel?: ReactNode;
  status?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onCommand?: (value: string) => void;
  onReady?: SceneReady;
}

export function AsciiSceneHero<K extends AsciiSceneKind>({
  scene: kind,
  options,
  eyebrow,
  title,
  lede,
  promptLabel,
  placeholder,
  actionLabel,
  stageLabel,
  status,
  className,
  style,
  onCommand,
  onReady,
}: AsciiSceneHeroProps<K>) {
  const copy = SCENE_COPY[kind];
  const resolvedOptions = (options ?? EMPTY_OPTIONS) as SceneOptions;
  const { canvasRef, scene, stats } = useAsciiScene({
    create: SCENE_FACTORIES[kind],
    options: resolvedOptions,
    remountKey: sceneKey(kind, resolvedOptions),
    onReady,
  });
  const [echo, setEcho] = useState("yard@01 · awaiting command");
  const [reply, setReply] = useState("READY");

  const handleSubmit = (value: string) => {
    const hash = fnv1a(value);
    setEcho(`> ${value}`);
    setReply(copy.replies[hash % copy.replies.length] ?? "READY");
    onCommand?.(value);

    const canvas = canvasRef.current;
    if (!canvas || !scene) return;
    const x = canvas.clientWidth * (0.2 + ((hash % 1000) / 1000) * 0.6);
    const y = canvas.clientHeight * 0.7;
    scene.trigger(SCENE_ACTIONS[kind], x, y);
  };

  const readout = [
    { label: "CELLS", value: stats ? stats.cells.toLocaleString("en-US") : "—" },
    { label: "GRID", value: stats ? `${stats.columns}×${stats.rows}` : "—" },
    { label: "FPS", value: stats ? String(Math.round(stats.fps)) : "—" },
    { label: "MODE", value: stats ? "LIVE" : "BOOT" },
  ];

  return (
    <section className={cx("ascii-scene-hero", className)} style={style}>
      <div className="ascii-scene-hero-copy">
        <p className="ascii-kicker">
          <i />
          {eyebrow ?? copy.eyebrow}
        </p>
        <h2 className="ascii-scene-hero-title">{title ?? copy.title}</h2>
        <p className="ascii-scene-hero-lede">{lede ?? copy.lede}</p>
        <AsciiPrompt
          label={promptLabel ?? copy.promptLabel}
          placeholder={placeholder ?? copy.placeholder}
          actionLabel={actionLabel ?? copy.actionLabel}
          status={reply}
          hint={echo}
          onSubmit={handleSubmit}
        />
      </div>
      <AsciiStage
        className="ascii-scene-hero-stage"
        label={stageLabel ?? copy.stageLabel}
        status={status ?? "LIVE"}
        aspectRatio="4 / 3"
        footer={<AsciiReadout items={readout} ariaLabel="Live scene statistics" />}
      >
        <canvas
          ref={canvasRef}
          className={`ascii-things ascii-${kind}`}
          role="img"
          aria-label={`A live ASCII ${kind} scene`}
        />
      </AsciiStage>
    </section>
  );
}

export type AsciiSharkHeroProps = Omit<AsciiSceneHeroProps<"sharks">, "scene">;
export type AsciiRobotHeroProps = Omit<AsciiSceneHeroProps<"robots">, "scene">;
export type AsciiJellyfishHeroProps = Omit<AsciiSceneHeroProps<"jellyfish">, "scene">;
export type AsciiStarlingsHeroProps = Omit<AsciiSceneHeroProps<"starlings">, "scene">;
export type AsciiFirefliesHeroProps = Omit<AsciiSceneHeroProps<"fireflies">, "scene">;
export type AsciiAntsHeroProps = Omit<AsciiSceneHeroProps<"ants">, "scene">;
export type AsciiKoiHeroProps = Omit<AsciiSceneHeroProps<"koi">, "scene">;
export type AsciiCityHeroProps = Omit<AsciiSceneHeroProps<"city">, "scene">;
export type AsciiServersHeroProps = Omit<AsciiSceneHeroProps<"servers">, "scene">;

export function AsciiSharkHero(props: AsciiSharkHeroProps) {
  return <AsciiSceneHero scene="sharks" {...props} />;
}

export function AsciiRobotHero(props: AsciiRobotHeroProps) {
  return <AsciiSceneHero scene="robots" {...props} />;
}

export function AsciiJellyfishHero(props: AsciiJellyfishHeroProps) {
  return <AsciiSceneHero scene="jellyfish" {...props} />;
}

export function AsciiStarlingsHero(props: AsciiStarlingsHeroProps) {
  return <AsciiSceneHero scene="starlings" {...props} />;
}

export function AsciiFirefliesHero(props: AsciiFirefliesHeroProps) {
  return <AsciiSceneHero scene="fireflies" {...props} />;
}

export function AsciiAntsHero(props: AsciiAntsHeroProps) {
  return <AsciiSceneHero scene="ants" {...props} />;
}

export function AsciiKoiHero(props: AsciiKoiHeroProps) {
  return <AsciiSceneHero scene="koi" {...props} />;
}

export function AsciiCityHero(props: AsciiCityHeroProps) {
  return <AsciiSceneHero scene="city" {...props} />;
}

export function AsciiServersHero(props: AsciiServersHeroProps) {
  return <AsciiSceneHero scene="servers" {...props} />;
}
