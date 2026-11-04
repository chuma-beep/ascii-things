import type { DefineComponent, PropType, StyleValue } from "vue";
import type { GlyphStyle, SceneHandle } from "../core/scene";
export type { PaletteChoice } from "../palette";
export type { SceneAction, SceneStats } from "../core/scene";
import type { AsciiSharksOptions } from "../options";
import { createSharks, type OceanStats } from "../sharks";
import { createRobots, type RobotStats } from "../robots";
import { createJellyfish, type JellyfishStats } from "../jellyfish";
import { createDog, type DogStats } from "../dog";
import type { AsciiRobotsOptions } from "../robots/options";
import type { AsciiJellyfishOptions } from "../jellyfish/options";
import type { AsciiDogOptions } from "../dog/options";
import type { AmbientStats } from "../ambient";
import type { AsciiAmbientOptions } from "../ambient/options";
import { createStarlings } from "../starlings";
import { createFireflies } from "../fireflies";
import { createAnts } from "../ants";
import { createKoi } from "../koi";
import { createCity } from "../city";
import { createServers } from "../servers";
import { createLagoon, type LagoonStats, type LagoonVariant } from "../lagoon";
import type { AsciiLagoonOptions } from "../lagoon/options";
import { createSceneComponent, pickOptions, sceneOptions, structuralKey } from "./create-scene";

export { useAsciiScene } from "./use-scene";
export type { UseAsciiSceneOptions, UseAsciiSceneResult } from "./use-scene";
export type { AsciiAmbientOptions } from "../ambient/options";
export { createSceneComponent } from "./create-scene";
export type { SceneComponentOptions } from "./create-scene";

/** Props shared by every scene wrapper. */
export interface SceneWrapperProps {
  className?: string;
  style?: StyleValue;
  id?: string;
  width?: number | string;
  height?: number | string;
  /** Sets CSS aspect-ratio and lets height follow it. */
  aspectRatio?: number | string;
  /** Called after the engine is created, including after remounts. */
  onReady?: (scene: SceneHandle) => void;
}

export type AsciiSharksProps = AsciiSharksOptions & SceneWrapperProps;
export type AsciiRobotsProps = AsciiRobotsOptions & SceneWrapperProps;
export type AsciiJellyfishProps = AsciiJellyfishOptions & SceneWrapperProps;
export type AsciiDogProps = AsciiDogOptions & SceneWrapperProps;
export type AmbientVueProps = AsciiAmbientOptions & SceneWrapperProps;
export type AsciiStarlingsProps = AmbientVueProps;
export type AsciiFirefliesProps = AmbientVueProps;
export type AsciiAntsProps = AmbientVueProps;
export type AsciiKoiProps = AmbientVueProps;
export type AsciiCityProps = AmbientVueProps;
export type AsciiServersProps = AmbientVueProps;
export type AsciiLagoonProps = AsciiLagoonOptions & SceneWrapperProps;
export type AsciiLagoonPresetProps = Omit<AsciiLagoonProps, "variant">;

const glyphProp = {
  glyphs: { type: String as PropType<GlyphStyle>, default: undefined },
};

const eventProp = {
  onEvent: { type: Function, default: undefined },
};

const sharkKeys = [
  ...sceneOptions,
  "sharks",
  "glyphs",
  "density",
  "sharkScale",
  "orbitScale",
  "fitSharks",
  "onEvent",
] as const;
const robotKeys = [...sceneOptions, "robots", "count", "scale", "onEvent"] as const;
const jellyfishKeys = [...sceneOptions, "jellies", "glyphs", "count", "scale", "onEvent"] as const;
const dogKeys = [...sceneOptions, "dogs", "count", "scale", "spread", "onEvent"] as const;
const ambientKeys = [...sceneOptions, "count", "scale", "glyphs", "onEvent"] as const;
const lagoonKeys = [...sceneOptions, "variant"] as const;

export const AsciiSharks = createSceneComponent<AsciiSharksOptions, OceanStats>({
  name: "AsciiSharks",
  className: "ascii-sharks",
  create: createSharks,
  props: {
    sharks: { type: Array as PropType<AsciiSharksOptions["sharks"]>, default: undefined },
    ...glyphProp,
    density: { type: Number, default: undefined },
    sharkScale: { type: Number, default: undefined },
    orbitScale: { type: Number, default: undefined },
    fitSharks: { type: Boolean, default: undefined },
    ...eventProp,
  },
  options: (props) => pickOptions<AsciiSharksOptions>(props, sharkKeys),
  structuralKey: (props) =>
    structuralKey(props, [
      "sharks",
      "seed",
      "density",
      "sharkScale",
      "orbitScale",
      "fitSharks",
      "glyphs",
    ]),
}) as unknown as DefineComponent<AsciiSharksProps>;

/** Back-compat alias for the original demo wrapper. */
export const AsciiOcean = AsciiSharks;

export const AsciiRobots = createSceneComponent<AsciiRobotsOptions, RobotStats>({
  name: "AsciiRobots",
  className: "ascii-robots",
  create: createRobots,
  props: {
    robots: { type: Array as PropType<AsciiRobotsOptions["robots"]>, default: undefined },
    count: { type: Number, default: undefined },
    scale: { type: Number, default: undefined },
    ...eventProp,
  },
  options: (props) => pickOptions<AsciiRobotsOptions>(props, robotKeys),
  structuralKey: (props) => structuralKey(props, ["robots", "count", "seed", "scale"]),
}) as unknown as DefineComponent<AsciiRobotsProps>;

export const AsciiJellyfish = createSceneComponent<AsciiJellyfishOptions, JellyfishStats>({
  name: "AsciiJellyfish",
  className: "ascii-jellyfish",
  create: createJellyfish,
  props: {
    jellies: { type: Array as PropType<AsciiJellyfishOptions["jellies"]>, default: undefined },
    ...glyphProp,
    count: { type: Number, default: undefined },
    scale: { type: Number, default: undefined },
    ...eventProp,
  },
  options: (props) => pickOptions<AsciiJellyfishOptions>(props, jellyfishKeys),
  structuralKey: (props) => structuralKey(props, ["jellies", "count", "seed", "scale", "glyphs"]),
}) as unknown as DefineComponent<AsciiJellyfishProps>;

export const AsciiDog = createSceneComponent<AsciiDogOptions, DogStats>({
  name: "AsciiDog",
  className: "ascii-dog",
  create: createDog,
  props: {
    dogs: { type: Array as PropType<AsciiDogOptions["dogs"]>, default: undefined },
    count: { type: Number, default: undefined },
    scale: { type: Number, default: undefined },
    spread: {
      type: Array as unknown as PropType<AsciiDogOptions["spread"]>,
      default: undefined,
    },
    ...eventProp,
  },
  options: (props) => pickOptions<AsciiDogOptions>(props, dogKeys),
  structuralKey: (props) => structuralKey(props, ["dogs", "count", "seed", "scale", "spread"]),
}) as unknown as DefineComponent<AsciiDogProps>;

function ambientComponent(
  name: string,
  kind: string,
  create: (canvas: HTMLCanvasElement, options: AsciiAmbientOptions) => SceneHandle<AmbientStats>,
): DefineComponent {
  return createSceneComponent<AsciiAmbientOptions, AmbientStats>({
    name,
    className: `ascii-${kind}`,
    create,
    props: {
      count: { type: Number, default: undefined },
      scale: { type: Number, default: undefined },
      ...glyphProp,
      ...eventProp,
    },
    options: (props) => pickOptions<AsciiAmbientOptions>(props, ambientKeys),
    structuralKey: (props) => structuralKey(props, ["seed", "count", "scale", "glyphs"]),
  });
}

export const AsciiStarlings = ambientComponent(
  "AsciiStarlings",
  "starlings",
  createStarlings,
) as unknown as DefineComponent<AsciiStarlingsProps>;
export const AsciiFireflies = ambientComponent(
  "AsciiFireflies",
  "fireflies",
  createFireflies,
) as unknown as DefineComponent<AsciiFirefliesProps>;
export const AsciiAnts = ambientComponent(
  "AsciiAnts",
  "ants",
  createAnts,
) as unknown as DefineComponent<AsciiAntsProps>;
export const AsciiKoi = ambientComponent(
  "AsciiKoi",
  "koi",
  createKoi,
) as unknown as DefineComponent<AsciiKoiProps>;
export const AsciiCity = ambientComponent(
  "AsciiCity",
  "city",
  createCity,
) as unknown as DefineComponent<AsciiCityProps>;
export const AsciiServers = ambientComponent(
  "AsciiServers",
  "servers",
  createServers,
) as unknown as DefineComponent<AsciiServersProps>;

const lagoonProps = {
  variant: {
    type: String as PropType<LagoonVariant>,
    default: undefined,
  },
} satisfies Record<string, unknown>;

export const AsciiLagoon = createSceneComponent<AsciiLagoonOptions, LagoonStats>({
  name: "AsciiLagoon",
  className: "ascii-lagoon",
  create: createLagoon,
  props: lagoonProps,
  options: (props) => pickOptions<AsciiLagoonOptions>(props, lagoonKeys),
  structuralKey: (props) => structuralKey(props, ["variant"]),
}) as unknown as DefineComponent<AsciiLagoonProps>;

function lagoonPreset(
  name: string,
  variant: LagoonVariant,
): DefineComponent<AsciiLagoonPresetProps> {
  return createSceneComponent<AsciiLagoonOptions, LagoonStats>({
    name,
    className: "ascii-lagoon",
    create: createLagoon,
    props: lagoonProps,
    options: (props) => ({
      ...pickOptions<AsciiLagoonOptions>(props, lagoonKeys),
      variant,
    }),
    structuralKey: () => JSON.stringify([variant]),
  }) as unknown as DefineComponent<AsciiLagoonPresetProps>;
}

/** Day lagoon, the sunlit reef scene. */
export const AsciiLagoonDay = lagoonPreset("AsciiLagoonDay", "reef");
/** Night reef, the same lagoon after dark. */
export const AsciiLagoonNight = lagoonPreset("AsciiLagoonNight", "night");
/** Turtle close-up. */
export const AsciiLagoonTurtle = lagoonPreset("AsciiLagoonTurtle", "turtle");
/** Manta flyby. */
export const AsciiLagoonManta = lagoonPreset("AsciiLagoonManta", "manta");
/** Seahorse in seagrass. */
export const AsciiLagoonSeahorse = lagoonPreset("AsciiLagoonSeahorse", "seahorse");
/** Dolphin pod. */
export const AsciiLagoonDolphin = lagoonPreset("AsciiLagoonDolphin", "dolphin");
/** Hammerhead pass. */
export const AsciiLagoonHammerhead = lagoonPreset("AsciiLagoonHammerhead", "hammerhead");
/** Tang school. */
export const AsciiLagoonTang = lagoonPreset("AsciiLagoonTang", "tang");

// Keep the type surface explicit for consumers inspecting generated declarations.
export type { SceneHandle, SceneWrapperProps as AsciiSceneProps };
