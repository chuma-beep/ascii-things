import type { SurfaceVariant } from "ascii-things/webgl";

export type KanjiArt = "torii" | "seasons" | "fan";

interface KanjiBase {
  id: string;
  slug: string;
  title: string;
  family: string;
  description: string;
  glyphs: string;
  code: string;
  copy?: string;
}

export type KanjiWebgl = KanjiBase & {
  kind: "webgl";
  variant: SurfaceVariant;
  text: string;
  density: number;
  cell: number;
  foreground: string;
  accent: string;
};

export type KanjiStatic = KanjiBase & {
  kind: "static";
  art: KanjiArt;
};

export type KanjiMark = KanjiBase & {
  kind: "mark";
  id: "seal" | "scroll";
  slug: "seal" | "scroll";
};

export type KanjiStudy = KanjiWebgl | KanjiStatic;
export type KanjiItem = KanjiStudy | KanjiMark;

export const KANJI_STUDIES: KanjiStudy[] = [
  {
    id: "field",
    slug: "field",
    title: "Kanji field",
    family: "Type",
    description: "A drifting glyph field with a 漢字 wordmark and an orange scan band.",
    glyphs: "永龍風水火土空海月花鳥",
    text: "漢字",
    density: 0.24,
    cell: 10,
    foreground: "#f4ead6",
    accent: "#ff7a1a",
    kind: "webgl",
    variant: "field",
    code: '<AsciiSurface text="漢字" glyphs="永龍風水火土空海月花鳥" />',
  },
  {
    id: "torus-3d",
    slug: "torus-3d",
    title: "Kanji torus",
    family: "3D",
    description: "A raymarched torus wrapped in a slow orbit of kanji.",
    glyphs: "永遠風水火",
    text: "",
    density: 0.3,
    cell: 9,
    foreground: "#e8d5a8",
    accent: "#ffb347",
    kind: "webgl",
    variant: "torus-3d",
    code: '<AsciiSurface variant="torus-3d" glyphs="永遠風水火" />',
  },
  {
    id: "cube-3d",
    slug: "cube-3d",
    title: "Kanji cube",
    family: "3D",
    description: "A rounded cube with a cool palette and a few quiet characters.",
    glyphs: "空海山月",
    text: "",
    density: 0.3,
    cell: 9,
    foreground: "#a9d6ff",
    accent: "#7fbcff",
    kind: "webgl",
    variant: "cube-3d",
    code: '<AsciiSurface variant="cube-3d" glyphs="空海山月" />',
  },
  {
    id: "helix-3d",
    slug: "helix-3d",
    title: "Kanji helix",
    family: "3D",
    description: "A double helix turning through a field of bright characters.",
    glyphs: "龍神光",
    text: "",
    density: 0.32,
    cell: 9,
    foreground: "#c7e8a4",
    accent: "#7ee787",
    kind: "webgl",
    variant: "helix-3d",
    code: '<AsciiSurface variant="helix-3d" glyphs="龍神光" />',
  },
  {
    id: "glyph-rain",
    slug: "glyph-rain",
    title: "Kanji rain",
    family: "Weather",
    description: "Columns of rain, wind, water, and sound falling through the dark.",
    glyphs: "雨風水音",
    text: "",
    density: 0.38,
    cell: 12,
    foreground: "#b8d8ff",
    accent: "#7fbcff",
    kind: "webgl",
    variant: "glyph-rain",
    code: '<AsciiSurface variant="glyph-rain" glyphs="雨風水音" />',
  },
  {
    id: "ripple",
    slug: "ripple",
    title: "Kanji pond",
    family: "Water",
    description: "Concentric rings of water, wave, moon, and shadow characters.",
    glyphs: "水波月影",
    text: "",
    density: 0.3,
    cell: 12,
    foreground: "#b8d8ff",
    accent: "#7fbcff",
    kind: "webgl",
    variant: "ripple",
    code: '<AsciiSurface variant="ripple" glyphs="水波月影" />',
  },
  {
    id: "tunnel",
    slug: "tunnel",
    title: "Kanji gate",
    family: "Architecture",
    description: "A corridor of gates and lantern light made from 門, 光, and 道.",
    glyphs: "門光道",
    text: "",
    density: 0.3,
    cell: 12,
    foreground: "#ffd7a8",
    accent: "#ff7a1a",
    kind: "webgl",
    variant: "tunnel",
    code: '<AsciiSurface variant="tunnel" glyphs="門光道" />',
  },
  {
    id: "galaxy",
    slug: "galaxy",
    title: "Kanji galaxy",
    family: "Sky",
    description: "A spiral of star, moon, night, and light characters.",
    glyphs: "星月夜光",
    text: "",
    density: 0.3,
    cell: 11,
    foreground: "#d8d0ff",
    accent: "#a78bfa",
    kind: "webgl",
    variant: "galaxy",
    code: '<AsciiSurface variant="galaxy" glyphs="星月夜光" />',
  },
  {
    id: "koi",
    slug: "koi",
    title: "Kanji koi",
    family: "Water",
    description: "A koi silhouette with a forked tail and fins, drawn in water characters.",
    glyphs: "鯉水波泳錦",
    text: "",
    density: 0.34,
    cell: 10,
    foreground: "#bff0e0",
    accent: "#34d399",
    kind: "webgl",
    variant: "koi",
    code: '<AsciiSurface variant="koi" glyphs="鯉水波泳錦" />',
  },
  {
    id: "moon",
    slug: "moon",
    title: "Kanji moon",
    family: "Sky",
    description: "A full moon with dark craters, drawn in moon and night characters.",
    glyphs: "月夜光星面斑影",
    text: "",
    density: 0.28,
    cell: 11,
    foreground: "#e8e4ff",
    accent: "#b8c7ff",
    kind: "webgl",
    variant: "moon",
    code: '<AsciiSurface variant="moon" glyphs="月夜光星面斑影" />',
  },
  {
    id: "mountain",
    slug: "mountain",
    title: "Kanji mountain",
    family: "Land",
    description: "A green terrain of mountain, wind, rock, and cloud characters.",
    glyphs: "山風岩雲",
    text: "",
    density: 0.3,
    cell: 11,
    foreground: "#d8e8d0",
    accent: "#86efac",
    kind: "webgl",
    variant: "terrain",
    code: '<AsciiSurface variant="terrain" glyphs="山風岩雲" />',
  },
  {
    id: "wave",
    slug: "wave",
    title: "Kanji wave",
    family: "Sea",
    description: "Caustic water lines made from wave, billow, sea, and open-water characters.",
    glyphs: "波濤海沖",
    text: "",
    density: 0.32,
    cell: 12,
    foreground: "#c7e8ff",
    accent: "#7fbcff",
    kind: "webgl",
    variant: "caustics",
    code: '<AsciiSurface variant="caustics" glyphs="波濤海沖" />',
  },
  {
    id: "torii",
    slug: "torii",
    title: "Kanji torii",
    family: "Architecture",
    description: "A vermilion gate built from gate, light, and path characters.",
    glyphs: "鳥居一朱門道",
    kind: "static",
    art: "torii",
    code: "CSS · 鳥居一朱門道",
    copy: "鳥居一朱門道",
  },
  {
    id: "seasons",
    slug: "seasons",
    title: "Kanji seasons",
    family: "Type",
    description: "Spring, summer, autumn, and winter in a four-panel glyph study.",
    glyphs: "春夏秋冬花風雪月",
    kind: "static",
    art: "seasons",
    code: "CSS · 春夏秋冬花風雪月",
    copy: "春夏秋冬花風雪月",
  },
  {
    id: "fan",
    slug: "fan",
    title: "Kanji fan",
    family: "Object",
    description: "A round summer fan with wind, flower, and moon characters.",
    glyphs: "扇風花月",
    kind: "static",
    art: "fan",
    code: "CSS · 扇風花月",
    copy: "扇風花月",
  },
];

export const KANJI_MARKS: KanjiMark[] = [
  {
    id: "seal",
    slug: "seal",
    title: "Hanko seal",
    family: "Mark",
    description: "A carved vermilion seal with four characters in a square block.",
    glyphs: "永龍風水",
    kind: "mark",
    code: "CSS · 永龍風水",
    copy: "永龍風水",
  },
  {
    id: "scroll",
    slug: "scroll",
    title: "Kanji scroll",
    family: "Paper",
    description: "A vertical seasonal scroll with a small red seal.",
    glyphs: "春夏秋冬",
    kind: "mark",
    code: "CSS · 春夏秋冬",
    copy: "春夏秋冬",
  },
];

export const ALL_KANJI: KanjiItem[] = [...KANJI_STUDIES, ...KANJI_MARKS];
