import {
  createDog,
  createJellyfish,
  createRobots,
  createSharks,
  type AsciiDogOptions,
  type AsciiJellyfishOptions,
  type AsciiRobotsOptions,
  type AsciiSharksOptions,
  type DogSpec,
  type JellyfishSpec,
  type RobotSpec,
  type SharkSpec,
} from "./src";

// Sharks: ?sharks=thresher,hammerhead,mako,nurse&palette=paper&seed=7
// Robots: ?scene=robots&count=7&palette=neon&seed=7
// Jellyfish: ?scene=jellyfish&jellies=moon:1.2,lion:1,box:0.8&palette=neon&seed=7
// Robot dog: ?scene=dog&count=2&palette=paper&seed=7
// Common: palette, seed, speed, columns, maxCells, maxDpr, calm, interactive
const params = new URLSearchParams(location.search);
const number = (key: string) => (params.has(key) ? Number(params.get(key)) : undefined);
const palette = params.get("palette") as AsciiSharksOptions["palette"] | null;
const calm = params.get("calm") === "1" || params.get("calm") === "true";
const interactive = params.get("interactive") !== "0";
const canvas = document.querySelector("canvas")!;

const parseSpecs = <K extends string>(raw: string | null, valid: readonly K[], step: number) =>
  raw
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, i) => {
      const [kind, size] = part.split(":");
      return {
        kind: (valid.includes(kind as K) ? kind : valid[i % valid.length]) as K,
        size: size ? Number(size) : 1 - i * step,
      };
    });

const parseSizes = (raw: string | null): DogSpec[] | undefined =>
  raw
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const size = Number(part);
      return { size: Number.isFinite(size) && size > 0 ? size : 1 };
    });

let scene:
  | ReturnType<typeof createSharks>
  | ReturnType<typeof createRobots>
  | ReturnType<typeof createJellyfish>
  | ReturnType<typeof createDog>;

if (params.get("scene") === "dog") {
  scene = createDog(canvas, {
    dogs: parseSizes(params.get("dogs")),
    count: number("count"),
    palette: palette ?? undefined,
    seed: number("seed"),
    speed: number("speed"),
    columns: number("columns"),
    maxCells: number("maxCells"),
    maxDpr: number("maxDpr"),
    scale: number("scale"),
    calm,
    interactive,
  } satisfies AsciiDogOptions);
} else if (params.get("scene") === "jellyfish") {
  const jellies: JellyfishSpec[] | undefined = parseSpecs(
    params.get("jellies"),
    ["moon", "lion", "box", "atolla", "crystal"] as const,
    0.05,
  );
  scene = createJellyfish(canvas, {
    jellies,
    count: number("count"),
    palette: palette ?? undefined,
    seed: number("seed"),
    speed: number("speed"),
    columns: number("columns"),
    maxCells: number("maxCells"),
    maxDpr: number("maxDpr"),
    scale: number("scale"),
    calm,
    interactive,
  } satisfies AsciiJellyfishOptions);
} else if (params.get("scene") === "robots") {
  const robots: RobotSpec[] | undefined = parseSpecs(
    params.get("robots"),
    ["scout", "hauler", "sentinel"] as const,
    0.05,
  );
  scene = createRobots(canvas, {
    robots,
    count: number("count"),
    palette: palette ?? undefined,
    seed: number("seed"),
    speed: number("speed"),
    columns: number("columns"),
    maxCells: number("maxCells"),
    maxDpr: number("maxDpr"),
    scale: number("scale"),
    calm,
    interactive,
  } satisfies AsciiRobotsOptions);
} else {
  const sharks: SharkSpec[] | undefined = parseSpecs(
    params.get("sharks"),
    [
      "classic",
      "hammerhead",
      "zebra",
      "tiger",
      "greathammer",
      "mako",
      "thresher",
      "nurse",
    ] as const,
    0.1,
  );
  scene = createSharks(canvas, {
    sharks,
    palette: palette ?? undefined,
    seed: number("seed"),
    density: number("density"),
    speed: number("speed"),
    columns: number("columns"),
    maxCells: number("maxCells"),
    maxDpr: number("maxDpr"),
    sharkScale: number("sharkScale"),
    calm,
    interactive,
  });
}

// Console testing: asciiScene.getStats(), asciiScene.pause(), asciiScene.setOptions({ palette: "paper" })
(window as unknown as { asciiScene: typeof scene }).asciiScene = scene;
