import type { SceneOptions, SceneStats } from "../core/scene";

/** Public names for the Lagoon scene variants. */
export type LagoonVariant =
  | "reef"
  | "night"
  | "turtle"
  | "manta"
  | "seahorse"
  | "dolphin"
  | "hammerhead"
  | "tang";

export interface LagoonVariantMeta {
  id: LagoonVariant;
  label: string;
  description: string;
}

/** One ordered registry for the site cards, docs, and API examples. */
export const LAGOON_VARIANTS: readonly LagoonVariantMeta[] = [
  {
    id: "reef",
    label: "Reef",
    description: "A sunlit lagoon with the whole reef in motion.",
  },
  {
    id: "night",
    label: "Night reef",
    description: "The same reef after dark, lit by a cool moon current.",
  },
  {
    id: "turtle",
    label: "Turtle close-up",
    description: "A honu macro with a slow, deliberate swim.",
  },
  {
    id: "manta",
    label: "Manta flyby",
    description: "A wide manta crossing the blue on a long arc.",
  },
  {
    id: "seahorse",
    label: "Seahorse",
    description: "A seahorse holding station in warm seagrass.",
  },
  {
    id: "dolphin",
    label: "Dolphin pod",
    description: "A pod crossing open surface water.",
  },
  {
    id: "hammerhead",
    label: "Hammerhead pass",
    description: "A hammerhead sweeping past the reef edge.",
  },
  {
    id: "tang",
    label: "Tang school",
    description: "A school of yellow tangs folding through the shallows.",
  },
];

export const DEFAULT_LAGOON_VARIANT: LagoonVariant = "reef";

export interface AsciiLagoonOptions extends SceneOptions {
  /** Animal or mood variant. Default "reef". */
  variant?: LagoonVariant;
}

export interface LagoonStats extends SceneStats {
  variant: LagoonVariant;
}
