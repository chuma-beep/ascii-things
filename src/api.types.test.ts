import { describe, expect, it } from "vitest";
import type { SceneAction, SceneHandle, SceneOptions, SceneReady, SceneStats } from "./index";
import type { AsciiSharksOptions, OceanStats, Palette, PaletteChoice } from "./sharks";
import type { AsciiRobotsOptions, RobotStats } from "./robots";
import type { AsciiJellyfishOptions, JellyfishStats } from "./jellyfish";
import type { AsciiDogOptions, DogStats } from "./dog";
import type { AsciiStarlingsOptions, StarlingStats } from "./starlings";
import type { AsciiFirefliesOptions, FireflyStats } from "./fireflies";
import type { AsciiAntsOptions, AntStats } from "./ants";
import type { AsciiKoiOptions, KoiStats } from "./koi";
import type { AsciiCityOptions, CityStats } from "./city";
import type { AsciiServersOptions, ServerStats } from "./servers";
import type {
  AsciiAntsProps,
  AsciiCityProps,
  AsciiDogProps,
  AsciiFirefliesProps,
  AsciiJellyfishProps,
  AsciiKoiProps,
  AsciiRobotsProps,
  AsciiServersProps,
  AsciiSharksProps,
  AsciiStarlingsProps,
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
  AsciiStarlingsOptions,
  StarlingStats,
  AsciiFirefliesOptions,
  FireflyStats,
  AsciiAntsOptions,
  AntStats,
  AsciiKoiOptions,
  KoiStats,
  AsciiCityOptions,
  CityStats,
  AsciiServersOptions,
  ServerStats,
  AsciiSharksProps,
  AsciiRobotsProps,
  AsciiJellyfishProps,
  AsciiDogProps,
  AsciiStarlingsProps,
  AsciiFirefliesProps,
  AsciiAntsProps,
  AsciiKoiProps,
  AsciiCityProps,
  AsciiServersProps,
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
