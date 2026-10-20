import { describe, expect, it } from "vitest";
import type { SceneAction, SceneHandle, SceneOptions, SceneReady, SceneStats } from "./index";
import type { AsciiSharksOptions, OceanStats, Palette, PaletteChoice } from "./sharks";
import type { AsciiRobotsOptions, RobotStats } from "./robots";
import type { AsciiJellyfishOptions, JellyfishStats } from "./jellyfish";
import type { AsciiDogOptions, DogStats } from "./dog";
import type {
  AsciiDogProps,
  AsciiJellyfishProps,
  AsciiRobotsProps,
  AsciiSharksProps,
} from "./react";
import type {
  AsciiDogHeroProps,
  AsciiPromptProps,
  AsciiReadoutItem,
  AsciiReadoutProps,
  AsciiSceneTab,
  AsciiSceneTabsProps,
  AsciiStageProps,
} from "./ui";

/**
 * Compile-time contract for the public type surface. If a type is removed or
 * renamed, `tsc` fails here before the runtime export snapshot is updated.
 */
type PublicTypeSurface = [
  SceneAction,
  SceneHandle,
  SceneOptions,
  SceneReady,
  SceneStats,
  AsciiSharksOptions,
  OceanStats,
  Palette,
  PaletteChoice,
  AsciiRobotsOptions,
  RobotStats,
  AsciiJellyfishOptions,
  JellyfishStats,
  AsciiDogOptions,
  DogStats,
  AsciiSharksProps,
  AsciiRobotsProps,
  AsciiJellyfishProps,
  AsciiDogProps,
  AsciiStageProps,
  AsciiPromptProps,
  AsciiReadoutItem,
  AsciiReadoutProps,
  AsciiSceneTab,
  AsciiSceneTabsProps,
  AsciiDogHeroProps,
];

describe("public type surface", () => {
  it("imports the frozen type names", () => {
    const surface: PublicTypeSurface[number] | undefined = undefined;
    expect(surface).toBeUndefined();
  });
});
