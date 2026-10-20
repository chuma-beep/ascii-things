import { describe, expect, it } from "vitest";
import type {
  AsciiAntsHeroProps,
  AsciiButtonProps,
  AsciiButtonSize,
  AsciiButtonVariant,
  AsciiCityHeroProps,
  AsciiDividerProps,
  AsciiFirefliesHeroProps,
  AsciiJellyfishHeroProps,
  AsciiKoiHeroProps,
  AsciiServersHeroProps,
  AsciiStarlingsHeroProps,
  AsciiPanelPadding,
  AsciiPanelProps,
  AsciiRobotHeroProps,
  AsciiSceneHeroProps,
  AsciiSceneKind,
  AsciiSceneOptionsByKind,
  AsciiSharkHeroProps,
  AsciiStatusProps,
  AsciiStatusTone,
  AsciiToggleProps,
  AsciiToolbarProps,
} from "./ui";

type UiTypeSurface = [
  AsciiButtonProps,
  AsciiButtonSize,
  AsciiButtonVariant,
  AsciiToolbarProps,
  AsciiToggleProps,
  AsciiPanelProps,
  AsciiPanelPadding,
  AsciiStatusProps,
  AsciiStatusTone,
  AsciiDividerProps,
  AsciiSceneKind,
  AsciiSceneOptionsByKind,
  AsciiSceneHeroProps<"dog">,
  AsciiSharkHeroProps,
  AsciiRobotHeroProps,
  AsciiJellyfishHeroProps,
  AsciiStarlingsHeroProps,
  AsciiFirefliesHeroProps,
  AsciiAntsHeroProps,
  AsciiKoiHeroProps,
  AsciiCityHeroProps,
  AsciiServersHeroProps,
];

describe("UI type surface", () => {
  it("exports the component and preset types", () => {
    const surface: UiTypeSurface[number] | undefined = undefined;
    expect(surface).toBeUndefined();
  });
});
