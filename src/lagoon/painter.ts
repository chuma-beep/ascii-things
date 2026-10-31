// Top-down Hawaiian lagoon in ASCII cells, lifted from the standalone stage.
// Everything is a pure function of t and every motion has an integer number of
// cycles per T, so the 24.5 second loop is seamless. The scene is deliberately
// independent of the lab UI: one instance can sit behind any overlay.

const W = 1944;
const H = 1760;
const T = 24.5;
const TAU = Math.PI * 2;
const w = TAU / T;
const CW = 16;
const CH = 22;
const COLS = Math.ceil(W / CW);
const ROWS = Math.ceil(H / CH);
const SS = 4;
const STATIC_TIME = 5.2;
const FRAME_MS = 1000 / 30;

export const LAGOON_STAGE = {
  width: W,
  height: H,
  cellWidth: CW,
  cellHeight: CH,
  columns: COLS,
  rows: ROWS,
} as const;

type RGB = [number, number, number];
type PointPath = (t: number) => [number, number];

export type LagoonScene =
  | "day"
  | "night"
  | "turtle"
  | "manta"
  | "seahorse"
  | "dolphin"
  | "hammer"
  | "tang";

const hash = (a: number, b: number, c: number) => {
  const h = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return h - Math.floor(h);
};

const mix = (a: RGB, b: RGB, k: number): RGB => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];

const rgb = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const lum = (c: RGB) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;

// Lagoon: sunlit shallows top-left, deeper blue bottom-right.
const STOPS: Array<[number, RGB]> = [
  [0, [178, 244, 232]],
  [0.42, [74, 214, 214]],
  [0.78, [26, 168, 202]],
  [1, [14, 128, 182]],
];

// Night reef: deep indigo surface, almost black in the trench.
const NIGHT_STOPS: Array<[number, RGB]> = [
  [0, [17, 36, 72]],
  [0.42, [9, 24, 52]],
  [0.78, [4, 14, 34]],
  [1, [2, 7, 19]],
];

// Honu macro: warm, sunlit shallows with a soft teal falloff.
const TURTLE_STOPS: Array<[number, RGB]> = [
  [0, [255, 230, 176]],
  [0.28, [220, 236, 190]],
  [0.58, [116, 207, 188]],
  [0.82, [34, 154, 166]],
  [1, [9, 92, 120]],
];

// Manta flyby: bright surface water falling away to a deep blue reef edge.
const MANTA_STOPS: Array<[number, RGB]> = [
  [0, [206, 252, 244]],
  [0.22, [122, 236, 230]],
  [0.5, [52, 198, 210]],
  [0.76, [18, 142, 187]],
  [1, [7, 84, 143]],
];

// Seahorse: warm sunlit shallows in the seagrass, green-gold near the lens
// and a cool turquoise falloff toward the deep.
const SEAHORSE_STOPS: Array<[number, RGB]> = [
  [0, [255, 240, 196]],
  [0.24, [232, 232, 174]],
  [0.52, [140, 214, 186]],
  [0.78, [46, 164, 168]],
  [1, [11, 96, 122]],
];

// Dolphin pod: open, bright surface water with a long blue falloff. The pod
// crosses a wide band of clear water rather than sitting against a close reef.
const DOLPHIN_STOPS: Array<[number, RGB]> = [
  [0, [172, 246, 238]],
  [0.2, [96, 224, 223]],
  [0.46, [38, 186, 205]],
  [0.74, [14, 136, 184]],
  [1, [6, 82, 148]],
];

// Hammerhead pass: clear blue water, bright at the surface and falling into a
// deep reef blue so the wide cephalofoil reads as a dark silhouette.
const HAMMER_STOPS: Array<[number, RGB]> = [
  [0, [208, 250, 246]],
  [0.2, [128, 234, 234]],
  [0.46, [48, 182, 212]],
  [0.74, [16, 120, 180]],
  [1, [5, 64, 132]],
];

// Tang school: warm, sunlit turquoise with a shallow sandy bloom top-left and
// enough blue at the edges for the yellow bodies to sit forward.
const TANG_STOPS: Array<[number, RGB]> = [
  [0, [224, 252, 220]],
  [0.22, [126, 240, 222]],
  [0.48, [42, 206, 204]],
  [0.72, [18, 165, 188]],
  [0.9, [12, 120, 166]],
  [1, [8, 82, 140]],
];

const stopsFor = (scene: LagoonScene) =>
  scene === "night"
    ? NIGHT_STOPS
    : scene === "turtle"
      ? TURTLE_STOPS
      : scene === "manta"
        ? MANTA_STOPS
        : scene === "seahorse"
          ? SEAHORSE_STOPS
          : scene === "dolphin"
            ? DOLPHIN_STOPS
            : scene === "hammer"
              ? HAMMER_STOPS
              : scene === "tang"
                ? TANG_STOPS
                : STOPS;

const sampleStops = (stops: Array<[number, RGB]>, k: number): RGB => {
  for (let i = 1; i < stops.length; i++) {
    if (k <= stops[i][0]) {
      return mix(
        stops[i - 1][1],
        stops[i][1],
        (k - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]),
      );
    }
  }
  return stops[stops.length - 1][1];
};

const water = (x: number, y: number, scene: LagoonScene = "day"): RGB => {
  const k = Math.min(1, Math.max(0, (x * 0.45 + y * 0.9) / (W * 0.45 + H * 0.9)));
  return sampleStops(stopsFor(scene), k);
};

const ell = (
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot: number,
  fill: string | CanvasGradient,
) => {
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot || 0, 0, TAU);
  g.fillStyle = fill;
  g.fill();
};

const halo = (g: CanvasRenderingContext2D, r: number, color: string) => {
  const glow = g.createRadialGradient(0, 0, 0, 0, 0, r);
  glow.addColorStop(0, color);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = glow;
  g.beginPath();
  g.arc(0, 0, r, 0, TAU);
  g.fill();
};

// ---------- creatures, drawn in local px facing +x ----------

interface TurtlePalette {
  flipper: string;
  flipperLight: string;
  head: string;
  snout: string;
  eye: string;
  marginal: string;
  shell: [string, string, string];
  scute: string;
  dot: string;
  rim?: string;
}

const DAY_TURTLE: TurtlePalette = {
  flipper: "#9c8a5c",
  flipperLight: "#c2b183",
  head: "#a39060",
  snout: "#b8a573",
  eye: "#4b3f22",
  marginal: "#c9b067",
  shell: ["#7d6a2e", "#5e5022", "#3f3616"],
  scute: "#b39a4a",
  dot: "#e0c56a",
};

const NIGHT_TURTLE: TurtlePalette = {
  flipper: "#123049",
  flipperLight: "#1a4058",
  head: "#153950",
  snout: "#1c4861",
  eye: "#020b14",
  marginal: "#1a4a60",
  shell: ["#143a52", "#0e2a41", "#081a2b"],
  scute: "#174058",
  dot: "#2b6a7c",
  rim: "rgba(126,238,255,0.5)",
};

function turtle(
  g: CanvasRenderingContext2D,
  t: number,
  ph: number,
  pal: TurtlePalette = DAY_TURTLE,
) {
  const f = Math.sin((TAU * 14 * t) / T + ph);
  for (const m of [-1, 1]) {
    g.save();
    g.translate(62, 58 * m);
    g.rotate(m * (1.15 + 0.55 * f));
    ell(g, 0, 78 * m, 26, 92, 0, pal.flipper);
    ell(g, 0, 70 * m, 14, 70, 0, pal.flipperLight);
    g.restore();
    g.save();
    g.translate(-92, 40 * m);
    g.rotate(m * (2.2 - 0.3 * f));
    ell(g, 0, 26 * m, 15, 34, 0, pal.flipper);
    g.restore();
  }
  ell(g, 118, 0, 30, 24, 0, pal.head);
  ell(g, 150, 0, 34, 27, 0, pal.snout);
  ell(g, 146, -10, 7, 5, 0, pal.eye);
  ell(g, 146, 10, 7, 5, 0, pal.eye);
  ell(g, 0, 0, 132, 100, 0, pal.marginal); // marginal rim
  const sh = g.createRadialGradient(-10, 0, 10, 0, 0, 125);
  sh.addColorStop(0, pal.shell[0]);
  sh.addColorStop(0.7, pal.shell[1]);
  sh.addColorStop(1, pal.shell[2]);
  ell(g, 0, 0, 120, 90, 0, sh);
  g.fillStyle = pal.scute; // scutes
  for (const [x, y, r] of [
    [60, 0, 26],
    [12, 0, 30],
    [-38, 0, 28],
    [-80, 0, 20],
    [40, -50, 22],
    [-8, -56, 24],
    [-56, -46, 20],
    [40, 50, 22],
    [-8, 56, 24],
    [-56, 46, 20],
  ]) {
    g.beginPath();
    for (let k = 0; k < 6; k++) {
      g.lineTo(x + r * Math.cos((k * TAU) / 6), y + r * 0.8 * Math.sin((k * TAU) / 6));
    }
    g.fill();
  }
  g.fillStyle = pal.dot;
  for (const [x, y] of [
    [60, 0],
    [12, 0],
    [-38, 0],
    [-8, -56],
    [-8, 56],
  ]) {
    g.beginPath();
    g.arc(x, y, 8, 0, TAU);
    g.fill();
  }
  if (pal.rim) {
    g.lineWidth = 8;
    g.strokeStyle = pal.rim;
    g.beginPath();
    g.ellipse(0, 0, 127, 95, 0, 0, TAU);
    g.stroke();
    g.beginPath();
    g.ellipse(142, 0, 42, 30, 0, 0, TAU);
    g.stroke();
  }
}

interface MantaPalette {
  tail: string;
  body: string;
  cephalic: string;
  shoulder: string;
  patch: string;
  rim?: string;
  rimWidth?: number;
  glow?: string;
}

const DAY_MANTA: MantaPalette = {
  tail: "#1c2733",
  body: "#1e2b3a",
  cephalic: "#26364a",
  shoulder: "#e9eef0",
  patch: "#8fa3b0",
};

const NIGHT_MANTA: MantaPalette = {
  tail: "#4a9eb4",
  body: "#204a6a",
  cephalic: "#2f6d8c",
  shoulder: "#2c688a",
  patch: "#24597a",
  rim: "rgba(150,242,255,0.66)",
  rimWidth: 12,
  glow: "rgba(92,224,244,0.16)",
};

function manta(g: CanvasRenderingContext2D, t: number, pal: MantaPalette = DAY_MANTA) {
  const f = Math.sin((TAU * 10 * t) / T);
  const span = 300 + 22 * f;
  const back = -40 - 30 * f;
  if (pal.glow) halo(g, 420, pal.glow);
  const bodyPath = () => {
    g.beginPath();
    g.moveTo(96, -42);
    g.quadraticCurveTo(40, -span * 0.75, back, -span);
    g.quadraticCurveTo(-60, -110, -118, -26);
    g.lineTo(-118, 26);
    g.quadraticCurveTo(-60, 110, back, span);
    g.quadraticCurveTo(40, span * 0.75, 96, 42);
    g.closePath();
  };
  g.beginPath();
  g.moveTo(-110, 0);
  g.lineTo(-330, 4 * f);
  g.lineWidth = pal.rim ? 9 : 7;
  g.strokeStyle = pal.tail;
  g.stroke();
  bodyPath();
  g.fillStyle = pal.body;
  g.fill();
  if (pal.rim) {
    bodyPath();
    g.lineWidth = pal.rimWidth ?? 7;
    g.strokeStyle = pal.rim;
    g.stroke();
    g.fillStyle = pal.rim;
    for (const m of [-1, 1]) {
      g.beginPath();
      g.arc(back, span * 0.97 * m, 9, 0, TAU);
      g.fill();
    }
  }
  for (const m of [-1, 1]) {
    ell(g, 120, 40 * m, 34, 12, 0.35 * m, pal.cephalic); // cephalic fins
    ell(g, 18, 82 * m, 70, 30, -0.5 * m, pal.shoulder); // shoulder patches
    ell(g, -10, 150 * m, 40, 18, -0.6 * m, pal.patch);
  }
}

interface DolphinPalette {
  body: string;
  fin: string;
  flipper: string;
  back: string;
  cape: string;
  rim?: string;
  rimWidth?: number;
  glow?: string;
}

const DAY_DOLPHIN: DolphinPalette = {
  body: "#5c6d7c",
  fin: "#4b5a68",
  flipper: "#6f8190",
  back: "#8a9cab",
  cape: "#43515e",
};

const NIGHT_DOLPHIN: DolphinPalette = {
  body: "#22546f",
  fin: "#19425a",
  flipper: "#2b627c",
  back: "#316b86",
  cape: "#15384f",
  rim: "rgba(140,240,255,0.65)",
  rimWidth: 9,
  glow: "rgba(92,224,244,0.15)",
};

function dolphin(
  g: CanvasRenderingContext2D,
  t: number,
  ph: number,
  pal: DolphinPalette = DAY_DOLPHIN,
) {
  const b = 0.22 * Math.sin((TAU * 60 * t) / T + ph);
  if (pal.glow) halo(g, 260, pal.glow);
  g.save();
  g.translate(-30, 0);
  g.rotate(b);
  g.beginPath();
  g.moveTo(10, -44);
  g.quadraticCurveTo(-90, -24, -150, -9);
  g.lineTo(-150, 9);
  g.quadraticCurveTo(-90, 24, 10, 44);
  g.fillStyle = pal.body;
  g.fill();
  if (pal.rim) {
    g.lineWidth = pal.rimWidth ?? 5;
    g.strokeStyle = pal.rim;
    g.stroke();
  }
  g.translate(-150, 0);
  g.rotate(b * 1.4);
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(-20, -60, -52, -66);
  g.quadraticCurveTo(-30, -20, -40, 0);
  g.quadraticCurveTo(-30, 20, -52, 66);
  g.quadraticCurveTo(-20, 60, 0, 0);
  g.fillStyle = pal.fin;
  g.fill();
  if (pal.rim) {
    g.lineWidth = pal.rimWidth ? pal.rimWidth - 1 : 4;
    g.strokeStyle = pal.rim;
    g.stroke();
  }
  g.restore();
  for (const m of [-1, 1]) ell(g, 40, 48 * m, 44, 13, -0.75 * m, pal.flipper);
  g.beginPath();
  g.moveTo(-40, -44);
  g.quadraticCurveTo(40, -58, 150, -18);
  g.lineTo(200, -4);
  g.lineTo(200, 4);
  g.lineTo(150, 18);
  g.quadraticCurveTo(40, 58, -40, 44);
  g.fillStyle = pal.back;
  g.fill();
  if (pal.rim) {
    g.lineWidth = pal.rimWidth ?? 5;
    g.strokeStyle = pal.rim;
    g.stroke();
  }
  ell(g, 20, 0, 120, 22, 0, pal.cape); // dark cape along the back
}

interface TangPalette {
  fin: string;
  body: string;
  head: string;
  rim?: string;
  glow?: string;
}

const DAY_TANG: TangPalette = {
  fin: "#f2c200",
  body: "#ffd61f",
  head: "#ffe46a",
};

const NIGHT_TANG: TangPalette = {
  fin: "#245166",
  body: "#2c6278",
  head: "#3a7a8e",
  rim: "rgba(255,222,120,0.9)",
  glow: "rgba(255,214,96,0.22)",
};

function tang(g: CanvasRenderingContext2D, t: number, ph: number, pal: TangPalette = DAY_TANG) {
  const b = 0.35 * Math.sin((TAU * 110 * t) / T + ph);
  if (pal.glow) halo(g, 96, pal.glow);
  g.save();
  g.translate(-30, 0);
  g.rotate(b);
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(-34, -20);
  g.lineTo(-28, 0);
  g.lineTo(-34, 20);
  g.closePath();
  g.fillStyle = pal.fin;
  g.fill();
  if (pal.rim) {
    g.lineWidth = 5;
    g.strokeStyle = pal.rim;
    g.stroke();
  }
  g.restore();
  ell(g, 8, 0, 46, 15, 0, pal.body);
  if (pal.rim) {
    g.lineWidth = 5;
    g.strokeStyle = pal.rim;
    g.beginPath();
    g.ellipse(8, 0, 46, 15, 0, 0, TAU);
    g.stroke();
  }
  ell(g, 40, 0, 12, 9, 0, pal.head);
}

interface WhalePalette {
  body: string;
  tail: string;
  fin: string;
  back: string;
  belly: string;
  tubercle: string;
  rim?: string;
  rimWidth?: number;
  glow?: string;
}

const DAY_WHALE: WhalePalette = {
  body: "#2b3d52",
  tail: "#dfe7ea",
  fin: "#e6eef0",
  back: "#33475e",
  belly: "#1e2d3e",
  tubercle: "#596f86",
};

const NIGHT_WHALE: WhalePalette = {
  body: "#1d4762",
  tail: "#346f88",
  fin: "#38738c",
  back: "#204f6a",
  belly: "#0c2538",
  tubercle: "#56a4b8",
  rim: "rgba(140,240,255,0.5)",
  rimWidth: 10,
  glow: "rgba(92,210,238,0.11)",
};

function whale(g: CanvasRenderingContext2D, t: number, pal: WhalePalette = DAY_WHALE) {
  const b = 0.16 * Math.sin((TAU * 8 * t) / T);
  if (pal.glow) halo(g, 430, pal.glow);
  g.save();
  g.translate(-260, 0);
  g.rotate(b);
  g.beginPath();
  g.moveTo(40, -70);
  g.quadraticCurveTo(-120, -30, -260, -14);
  g.lineTo(-260, 14);
  g.quadraticCurveTo(-120, 30, 40, 70);
  g.fillStyle = pal.body;
  g.fill();
  if (pal.rim) {
    g.lineWidth = pal.rimWidth ?? 5;
    g.strokeStyle = pal.rim;
    g.stroke();
  }
  g.translate(-260, 0);
  g.rotate(b * 1.5);
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(-30, -110, -90, -130);
  g.quadraticCurveTo(-60, -40, -70, 0);
  g.quadraticCurveTo(-60, 40, -90, 130);
  g.quadraticCurveTo(-30, 110, 0, 0);
  g.fillStyle = pal.tail;
  g.fill();
  if (pal.rim) {
    g.lineWidth = pal.rimWidth ?? 5;
    g.strokeStyle = pal.rim;
    g.stroke();
  }
  g.restore();
  const fl = 0.15 * Math.sin((TAU * 8 * t) / T + 1);
  for (const m of [-1, 1]) {
    // the long pectoral fins
    g.save();
    g.translate(150, 95 * m);
    g.rotate(m > 0 ? 0.6 + fl : Math.PI - 0.6 - fl);
    ell(g, 0, 120, 30, 125, 0, pal.fin);
    if (pal.rim) {
      g.lineWidth = pal.rimWidth ? pal.rimWidth - 2 : 4;
      g.strokeStyle = pal.rim;
      g.beginPath();
      g.ellipse(0, 120, 30, 125, 0, 0, TAU);
      g.stroke();
    }
    g.restore();
  }
  g.beginPath();
  g.moveTo(330, 0);
  g.quadraticCurveTo(300, -110, 100, -130);
  g.quadraticCurveTo(-120, -110, -260, -70);
  g.lineTo(-260, 70);
  g.quadraticCurveTo(-120, 110, 100, 130);
  g.quadraticCurveTo(300, 110, 330, 0);
  g.fillStyle = pal.back;
  g.fill();
  if (pal.rim) {
    g.lineWidth = pal.rimWidth ?? 5;
    g.strokeStyle = pal.rim;
    g.stroke();
  }
  g.fillStyle = pal.tubercle;
  for (let k = 0; k < 7; k++) {
    g.beginPath();
    g.arc(300 - k * 30, 0, 7, 0, TAU);
    g.fill();
  } // tubercles
  g.beginPath();
  g.moveTo(-60, -10);
  g.quadraticCurveTo(-90, 0, -60, 10);
  g.fillStyle = pal.belly;
  g.fill();
}

interface HibiscusPalette {
  petal: string;
  inner: string;
  core: string;
  stamen: string;
  tip: string;
}

const DAY_HIBISCUS: HibiscusPalette = {
  petal: "#ef3b5a",
  inner: "#d42448",
  core: "#8a0f2e",
  stamen: "#ffd84a",
  tip: "#ffe27a",
};

const NIGHT_HIBISCUS: HibiscusPalette = {
  petal: "#8f3560",
  inner: "#6c2449",
  core: "#40122f",
  stamen: "#e0a94a",
  tip: "#f6d784",
};

function hibiscus(g: CanvasRenderingContext2D, s: number, pal: HibiscusPalette = DAY_HIBISCUS) {
  for (let k = 0; k < 5; k++) {
    g.save();
    g.rotate((k * TAU) / 5);
    ell(g, 52 * s, 0, 52 * s, 40 * s, 0, pal.petal);
    ell(g, 40 * s, 0, 30 * s, 22 * s, 0, pal.inner);
    g.restore();
  }
  ell(g, 0, 0, 22 * s, 22 * s, 0, pal.core);
  g.save();
  g.rotate(0.6);
  ell(g, 44 * s, 0, 40 * s, 5 * s, 0, pal.stamen);
  ell(g, 84 * s, 0, 10 * s, 10 * s, 0, pal.tip);
  g.restore();
}

interface PlumeriaPalette {
  petal: string;
  center: string;
  centerFade: string;
}

const DAY_PLUMERIA: PlumeriaPalette = {
  petal: "#fffaf0",
  center: "#ffb800",
  centerFade: "rgba(255,214,90,0)",
};

const NIGHT_PLUMERIA: PlumeriaPalette = {
  petal: "#93abc4",
  center: "#e0aa58",
  centerFade: "rgba(255,196,96,0)",
};

function plumeria(g: CanvasRenderingContext2D, s: number, pal: PlumeriaPalette = DAY_PLUMERIA) {
  for (let k = 0; k < 5; k++) {
    g.save();
    g.rotate((k * TAU) / 5);
    ell(g, 36 * s, 12 * s, 40 * s, 24 * s, 0.35, pal.petal);
    g.restore();
  }
  const c = g.createRadialGradient(0, 0, 2, 0, 0, 34 * s);
  c.addColorStop(0, pal.center);
  c.addColorStop(1, pal.centerFade);
  ell(g, 0, 0, 34 * s, 34 * s, 0, c);
}

// ---------- honu macro: a portrait in the same cell language ----------

const BOKEH = Array.from({ length: 30 }, (_, k) => ({
  x: hash(k, 1, 3) * W,
  y: hash(k, 2, 5) * H,
  r: 54 + hash(k, 3, 7) * 238,
  warm: hash(k, 4, 9),
  a: 0.035 + hash(k, 5, 11) * 0.12,
}));

function drawTurtleBackdrop(g: CanvasRenderingContext2D) {
  // Slanted shafts of late-afternoon light.
  g.save();
  g.globalCompositeOperation = "screen";
  for (let k = 0; k < 5; k++) {
    const off = -W * 0.25 + k * W * 0.3;
    const beam = g.createLinearGradient(off, -H * 0.1, off + W * 0.32, H * 1.1);
    beam.addColorStop(0, "rgba(255,246,205,0)");
    beam.addColorStop(0.42, "rgba(255,247,210,0.115)");
    beam.addColorStop(0.62, "rgba(255,238,179,0.075)");
    beam.addColorStop(1, "rgba(255,232,164,0)");
    g.fillStyle = beam;
    g.fillRect(0, 0, W, H);
  }
  g.restore();

  // Reef bokeh: soft out-of-focus discs behind the animal.
  g.save();
  g.globalCompositeOperation = "screen";
  for (let k = 0; k < BOKEH.length; k++) {
    const b = BOKEH[k];
    const c: RGB =
      b.warm > 0.68 ? [255, 226, 170] : b.warm > 0.34 ? [128, 232, 208] : [255, 171, 132];
    const disc = g.createRadialGradient(b.x, b.y, b.r * 0.18, b.x, b.y, b.r);
    disc.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${b.a * 0.32})`);
    disc.addColorStop(0.68, `rgba(${c[0]},${c[1]},${c[2]},${b.a * 0.5})`);
    disc.addColorStop(0.9, `rgba(${c[0]},${c[1]},${c[2]},${b.a * 0.9})`);
    disc.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    g.fillStyle = disc;
    g.beginPath();
    g.arc(b.x, b.y, b.r, 0, TAU);
    g.fill();
    g.lineWidth = 2 + b.a * 16;
    g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${b.a * 1.15})`;
    g.beginPath();
    g.arc(b.x, b.y, b.r * 0.88, 0, TAU);
    g.stroke();
  }
  g.restore();

  // Distant reef shelves, very low contrast.
  for (let k = 0; k < 7; k++) {
    const x = hash(k, 21, 5) * W;
    const y = H * 0.78 + hash(k, 22, 7) * H * 0.3;
    ell(
      g,
      x,
      y,
      90 + hash(k, 23, 9) * 230,
      34 + hash(k, 24, 11) * 90,
      hash(k, 25, 13) * 0.5,
      "rgba(12,84,88,0.11)",
    );
  }

  const vignette = g.createRadialGradient(
    W * 0.56,
    H * 0.46,
    W * 0.24,
    W * 0.56,
    H * 0.46,
    W * 0.8,
  );
  vignette.addColorStop(0, "rgba(0,24,28,0)");
  vignette.addColorStop(0.72, "rgba(0,30,32,0.03)");
  vignette.addColorStop(1, "rgba(0,24,30,0.2)");
  g.fillStyle = vignette;
  g.fillRect(0, 0, W, H);
}

// Manta flyby backdrop: static sun shafts and a distant reef edge in haze.
function drawMantaBackdrop(g: CanvasRenderingContext2D) {
  g.save();
  g.globalCompositeOperation = "screen";
  for (let k = 0; k < 5; k++) {
    const off = -W * 0.2 + k * W * 0.26 + (k % 2 ? -36 : 28);
    const beam = g.createLinearGradient(off, -H * 0.12, off + W * 0.36, H * 1.08);
    beam.addColorStop(0, "rgba(240,255,250,0)");
    beam.addColorStop(0.34, `rgba(232,255,247,${0.06 + (k % 3) * 0.02})`);
    beam.addColorStop(0.6, "rgba(206,250,244,0.035)");
    beam.addColorStop(1, "rgba(198,246,240,0)");
    g.fillStyle = beam;
    g.fillRect(0, 0, W, H);
  }
  g.restore();

  // The surface pulls the eye up; the bottom falls into deeper blue.
  const depth = g.createLinearGradient(0, H * 0.5, 0, H);
  depth.addColorStop(0, "rgba(4,54,102,0)");
  depth.addColorStop(1, "rgba(3,34,78,0.4)");
  g.fillStyle = depth;
  g.fillRect(0, 0, W, H);

  // Distant reef shelves, far out of focus.
  for (let k = 0; k < 8; k++) {
    const x = hash(k, 41, 5) * W;
    const y = H * 0.82 + hash(k, 42, 7) * H * 0.24;
    ell(
      g,
      x,
      y,
      150 + hash(k, 43, 9) * 320,
      44 + hash(k, 44, 11) * 110,
      hash(k, 45, 13) * 0.4,
      k % 2 ? "rgba(10,74,92,0.15)" : "rgba(6,48,84,0.2)",
    );
  }

  // A faint surface shelf right at the top.
  const surface = g.createLinearGradient(0, 0, 0, H * 0.22);
  surface.addColorStop(0, "rgba(236,255,252,0.3)");
  surface.addColorStop(1, "rgba(236,255,252,0)");
  g.fillStyle = surface;
  g.fillRect(0, 0, W, H * 0.22);

  const vignette = g.createRadialGradient(W * 0.5, H * 0.46, W * 0.3, W * 0.5, H * 0.46, W * 0.86);
  vignette.addColorStop(0, "rgba(0,24,36,0)");
  vignette.addColorStop(0.74, "rgba(0,24,36,0.04)");
  vignette.addColorStop(1, "rgba(0,20,34,0.26)");
  g.fillStyle = vignette;
  g.fillRect(0, 0, W, H);
}

const HONU = {
  rim: "#c2a662",
  rimDark: "#70602f",
  shellLight: "#6f5d2b",
  shell: "#514521",
  shellDark: "#332c14",
  seam: "rgba(22,20,9,0.9)",
  scuteLight: "#a68a49",
  scute: "#806b36",
  scuteDark: "#4f4020",
  growth: "rgba(202,178,105,0.36)",
  barnacle: "rgba(230,219,176,0.86)",
  skinLight: "#c3bc7c",
  skin: "#8b8b4a",
  skinDark: "#4b5527",
  scaleLight: "rgba(218,206,141,0.42)",
  flipper: "#7f8043",
  flipperDark: "#4a5226",
  flipperSpot: "rgba(41,48,23,0.68)",
  irisLight: "#f6cc6b",
  iris: "#dca23f",
  irisDark: "#8d5d20",
  pupil: "#090b06",
  catchlight: "rgba(255,252,232,0.96)",
  beakLight: "#e3d29a",
  beak: "#c3ad70",
  beakDark: "#927c4b",
};

function drawScute(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot: number,
  seed: number,
) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  const points = () => {
    g.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (k * TAU) / 6 + (hash(seed, k, 1) - 0.5) * 0.1;
      const r = 1 + (hash(seed, k, 2) - 0.5) * 0.09;
      g.lineTo(Math.cos(a) * rx * r, Math.sin(a) * ry * r);
    }
    g.closePath();
  };
  points();
  const fill = g.createRadialGradient(-rx * 0.24, -ry * 0.3, 6, 0, 0, Math.max(rx, ry));
  fill.addColorStop(0, HONU.scuteLight);
  fill.addColorStop(0.62, HONU.scute);
  fill.addColorStop(1, HONU.scuteDark);
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = 13;
  g.strokeStyle = HONU.seam;
  g.stroke();

  g.beginPath();
  for (let k = 0; k < 6; k++) {
    const a = (k * TAU) / 6;
    g.lineTo(Math.cos(a) * rx * 0.68, Math.sin(a) * ry * 0.68);
  }
  g.closePath();
  g.lineWidth = 4.5;
  g.strokeStyle = HONU.growth;
  g.stroke();

  g.lineWidth = 4;
  g.strokeStyle = "rgba(226,205,136,0.4)";
  g.beginPath();
  g.ellipse(0, 0, rx * 0.74, ry * 0.74, 0, 3.44, 5.42);
  g.stroke();

  g.lineWidth = 3;
  g.strokeStyle = "rgba(38,34,14,0.32)";
  for (let k = 0; k < 6; k++) {
    const a = (k * TAU) / 6 + 0.12;
    g.beginPath();
    g.moveTo(Math.cos(a) * rx * 0.26, Math.sin(a) * ry * 0.26);
    g.lineTo(Math.cos(a) * rx * 0.92, Math.sin(a) * ry * 0.92);
    g.stroke();
  }

  for (let k = 0; k < 10; k++) {
    const a = hash(seed, k, 3) * TAU;
    const rr = 0.22 + hash(seed, k, 4) * 0.58;
    ell(
      g,
      Math.cos(a) * rx * rr,
      Math.sin(a) * ry * rr,
      2 + hash(seed, k, 5) * 7,
      2 + hash(seed, k, 6) * 5,
      a,
      k % 3 ? "rgba(58,58,28,0.14)" : HONU.barnacle,
    );
  }
  g.restore();
}

function drawHonu(g: CanvasRenderingContext2D, t: number) {
  const phase = w * t;
  const bob = Math.sin(phase * 2 + 0.4);
  const sway = Math.sin(phase + 0.9);
  const stroke = Math.sin(phase * 2 + 0.9);
  const strokeAlt = Math.sin(phase * 2 + 0.9 + Math.PI);
  const roll = Math.sin(phase * 2 + 0.15);
  const pitch = Math.cos(phase * 2 + 0.5);
  const drift = Math.sin(phase + 0.35);
  const surge = Math.sin(phase * 2 + 1.2);
  const time = ((t % T) + T) % T;
  const blink = time > 12.55 && time < 13.45 ? Math.sin(((time - 12.55) / 0.9) * Math.PI) : 0;

  // The whole animal drifts a little in the current, then every part adds its
  // own slower counter-motion. All harmonics are integer cycles per loop.
  g.save();
  g.translate(drift * 7, bob * 4);
  g.rotate(sway * 0.0035);

  // Rear flipper, tucked under the shell at the lower left. It beats opposite
  // the near front flipper so the animal reads as swimming, not posing.
  g.save();
  g.translate(405 + strokeAlt * 11, 1505 + surge * 9);
  g.rotate(0.34 + sway * 0.012 + strokeAlt * 0.055);
  g.scale(1 + strokeAlt * 0.012, 1 + strokeAlt * 0.018);
  const rear = g.createLinearGradient(-190, -220, 190, 310);
  rear.addColorStop(0, "#9a9158");
  rear.addColorStop(0.55, "#71733c");
  rear.addColorStop(1, "#434824");
  g.beginPath();
  g.moveTo(-105, -140);
  g.quadraticCurveTo(150, -190, 232, 8);
  g.quadraticCurveTo(282, 168, 54, 322);
  g.quadraticCurveTo(-168, 258, -196, 54);
  g.closePath();
  g.fillStyle = rear;
  g.fill();
  g.lineWidth = 7;
  g.strokeStyle = "rgba(44,48,23,0.55)";
  g.stroke();
  g.save();
  g.clip();
  for (let k = 0; k < 44; k++) {
    ell(
      g,
      -180 + hash(k, 1, 4) * 430,
      -180 + hash(k, 2, 6) * 500,
      10 + hash(k, 3, 8) * 15,
      6 + hash(k, 4, 10) * 10,
      hash(k, 5, 12) * TAU,
      HONU.flipperSpot,
    );
  }
  g.restore();
  g.restore();

  // Shell, cropped by the left and bottom edges on purpose. It rolls and
  // pitches a few degrees while the head keeps its own slower rhythm.
  g.save();
  g.translate(560 + drift * 8, 1238 + bob * 8);
  g.rotate(-0.24 + sway * 0.007 + roll * 0.014);
  g.scale(1 + pitch * 0.006, 1 - pitch * 0.004);

  ell(g, 26, 52, 928, 635, 0, "rgba(3,47,48,0.2)");
  const rim = g.createLinearGradient(-680, -610, 760, 620);
  rim.addColorStop(0, "#c3b270");
  rim.addColorStop(0.45, HONU.rim);
  rim.addColorStop(0.78, "#8b8046");
  rim.addColorStop(1, HONU.rimDark);
  ell(g, 0, 0, 900, 605, 0, rim);
  g.lineWidth = 13;
  g.strokeStyle = "rgba(48,49,25,0.62)";
  g.beginPath();
  g.ellipse(0, 0, 900, 605, 0, 0, TAU);
  g.stroke();

  const shell = g.createRadialGradient(-210, -230, 40, 0, 0, 900);
  shell.addColorStop(0, HONU.shellLight);
  shell.addColorStop(0.58, HONU.shell);
  shell.addColorStop(1, HONU.shellDark);
  ell(g, 0, 0, 846, 552, 0, shell);

  // Marginal plates around the rim.
  for (let k = 0; k < 30; k++) {
    const a = (k / 30) * TAU;
    g.save();
    g.translate(Math.cos(a) * 846, Math.sin(a) * 552);
    g.rotate(a + Math.PI / 2);
    const plate = g.createLinearGradient(0, -38, 0, 38);
    plate.addColorStop(0, k % 2 ? "#ad9d5c" : "#988d50");
    plate.addColorStop(1, k % 2 ? "#7c723d" : "#6b6334");
    g.beginPath();
    g.ellipse(0, 0, 56, 33, 0, 0, TAU);
    g.fillStyle = plate;
    g.fill();
    g.lineWidth = 4.5;
    g.strokeStyle = "rgba(45,46,23,0.7)";
    g.stroke();
    g.restore();
  }

  // Growth rings just inside the seam.
  for (let k = 0; k < 3; k++) {
    g.lineWidth = 2.5;
    g.strokeStyle = `rgba(196,180,108,${0.09 + k * 0.035})`;
    g.beginPath();
    g.ellipse(0, 0, 826 - k * 28, 532 - k * 19, 0, 0, TAU);
    g.stroke();
  }

  const scutes: Array<[number, number, number, number, number]> = [
    [-560, 0, 134, 104, 0.02],
    [-240, 0, 142, 112, -0.03],
    [80, 0, 146, 114, 0.02],
    [400, 0, 134, 104, -0.02],
    [-470, -300, 126, 92, 0.18],
    [-140, -310, 134, 98, -0.12],
    [190, -304, 134, 98, 0.1],
    [500, -270, 118, 86, -0.16],
    [-470, 300, 126, 92, -0.18],
    [-140, 310, 134, 98, 0.12],
    [190, 304, 134, 98, -0.1],
    [500, 270, 118, 86, 0.16],
  ];
  for (let k = 0; k < scutes.length; k++) {
    const [x, y, rx, ry, rot] = scutes[k];
    drawScute(g, x, y, rx, ry, rot, k + 3);
  }

  for (let k = 0; k < 18; k++) {
    const a = hash(k, 31, 7) * TAU;
    const rr = 0.55 + hash(k, 32, 9) * 0.38;
    ell(
      g,
      Math.cos(a) * 830 * rr,
      Math.sin(a) * 535 * rr,
      22 + hash(k, 33, 11) * 58,
      12 + hash(k, 34, 13) * 34,
      a,
      k % 4 ? "rgba(52,62,28,0.14)" : "rgba(190,177,108,0.12)",
    );
  }

  g.save();
  g.globalCompositeOperation = "screen";
  ell(g, -210, -280, 570, 250, -0.1, "rgba(255,241,193,0.09)");
  g.restore();
  g.restore();

  // Front flipper sweeping out to the lower right, anchored at the shoulder.
  g.save();
  g.translate(0, bob * 4);
  g.rotate(sway * 0.005 + stroke * 0.03);
  g.translate(1020, 1040);
  g.rotate(stroke * 0.105);
  g.scale(1 + stroke * 0.008, 1 - stroke * 0.012);
  g.translate(-1020, -1040);
  const flipperPath = () => {
    g.beginPath();
    g.moveTo(1020, 1040);
    g.quadraticCurveTo(1280, 1104, 1530, 1238);
    g.quadraticCurveTo(1770, 1356, 1878, 1498);
    g.quadraticCurveTo(1812, 1556, 1682, 1542);
    g.quadraticCurveTo(1448, 1502, 1228, 1372);
    g.quadraticCurveTo(1036, 1260, 986, 1136);
    g.closePath();
  };
  flipperPath();
  const flip = g.createLinearGradient(1060, 1060, 1810, 1530);
  flip.addColorStop(0, "#b1a463");
  flip.addColorStop(0.42, HONU.flipper);
  flip.addColorStop(0.82, "#666a36");
  flip.addColorStop(1, HONU.flipperDark);
  g.fillStyle = flip;
  g.fill();
  g.save();
  flipperPath();
  g.clip();
  for (let k = 0; k < 62; k++) {
    ell(
      g,
      1000 + hash(k, 41, 5) * 880,
      1030 + hash(k, 42, 7) * 560,
      11 + hash(k, 43, 9) * 18,
      7 + hash(k, 44, 11) * 12,
      hash(k, 45, 13) * TAU,
      HONU.flipperSpot,
    );
  }
  g.restore();
  flipperPath();
  g.lineWidth = 8;
  g.strokeStyle = "rgba(50,54,27,0.58)";
  g.stroke();
  g.lineWidth = 3;
  g.strokeStyle = "rgba(226,211,148,0.28)";
  g.beginPath();
  g.moveTo(1040, 1062);
  g.quadraticCurveTo(1460, 1250, 1846, 1490);
  g.stroke();
  for (let k = 0; k < 7; k++) {
    ell(g, 1762 + k * 10, 1518 - k * 14, 12, 9, -0.5, "rgba(214,201,137,0.5)");
  }
  g.restore();

  // Neck and head drift together, with a slow nod and a little counter-roll.
  g.save();
  g.translate(drift * 4, bob * 8);
  g.rotate(sway * 0.007 + Math.sin(phase * 2 + 1.4) * 0.005);

  const neck = g.createLinearGradient(1000, 760, 1230, 1080);
  neck.addColorStop(0, HONU.skinLight);
  neck.addColorStop(0.55, HONU.skin);
  neck.addColorStop(1, HONU.skinDark);
  g.beginPath();
  g.moveTo(1040, 716);
  g.quadraticCurveTo(1168, 762, 1216, 902);
  g.quadraticCurveTo(1256, 1026, 1122, 1114);
  g.quadraticCurveTo(1000, 1180, 926, 1040);
  g.quadraticCurveTo(894, 894, 1008, 780);
  g.closePath();
  g.fillStyle = neck;
  g.fill();
  g.lineWidth = 6;
  g.strokeStyle = "rgba(61,63,31,0.35)";
  g.stroke();
  g.save();
  g.clip();
  for (let k = 0; k < 30; k++) {
    ell(
      g,
      930 + hash(k, 51, 3) * 310,
      760 + hash(k, 52, 5) * 350,
      22 + hash(k, 53, 7) * 26,
      14 + hash(k, 54, 9) * 18,
      hash(k, 55, 11) * TAU,
      k % 2 ? "rgba(184,170,101,0.26)" : "rgba(57,61,29,0.22)",
    );
  }
  g.restore();
  g.restore();

  g.save();
  g.translate(1250 + drift * 3, 620 + bob * 11);
  g.rotate(-0.16 + sway * 0.01 + Math.sin(phase * 2 + 1.9) * 0.007);

  ell(g, 34, 42, 414, 318, 0, "rgba(4,46,44,0.22)");
  const head = g.createRadialGradient(-118, -130, 30, 0, 0, 440);
  head.addColorStop(0, "#b7ac68");
  head.addColorStop(0.48, HONU.skin);
  head.addColorStop(0.78, "#64652f");
  head.addColorStop(1, HONU.skinDark);
  ell(g, 0, 0, 390, 300, 0, head);
  ell(g, -18, -214, 328, 112, -0.05, "rgba(203,187,116,0.3)");

  // Large head scales, left as texture for the sampling pass.
  for (let row = -4; row <= 4; row++) {
    for (let col = -5; col <= 5; col++) {
      const sx = col * 64 + (Math.abs(row) % 2) * 30;
      const sy = row * 52;
      const d = (sx / 372) ** 2 + (sy / 286) ** 2;
      if (d > 0.9) continue;
      const ex = sx - 60;
      const ey = sy + 120;
      if ((ex * ex) / 190 ** 2 + (ey * ey) / 170 ** 2 < 1) continue;
      const h = hash(row, col, 61);
      ell(
        g,
        sx,
        sy,
        25 + h * 22,
        17 + h * 14,
        (hash(row, col, 62) - 0.5) * 0.7,
        h > 0.56 ? HONU.scaleLight : "rgba(82,84,43,0.34)",
      );
    }
  }

  for (let k = 0; k < 16; k++) {
    const a = hash(k, 63, 3) * TAU;
    const rr = 0.2 + hash(k, 64, 5) * 0.62;
    ell(
      g,
      Math.cos(a) * 340 * rr,
      Math.sin(a) * 256 * rr,
      18 + hash(k, 65, 7) * 36,
      12 + hash(k, 66, 9) * 24,
      a,
      "rgba(58,62,30,0.2)",
    );
  }

  // Beak, nostril, and the mouth line.
  const beak = g.createLinearGradient(288, -66, 466, 108);
  beak.addColorStop(0, HONU.beakLight);
  beak.addColorStop(0.62, HONU.beak);
  beak.addColorStop(1, HONU.beakDark);
  g.beginPath();
  g.moveTo(292, -48);
  g.quadraticCurveTo(424, -48, 466, 24);
  g.quadraticCurveTo(432, 92, 338, 100);
  g.quadraticCurveTo(290, 80, 292, -48);
  g.closePath();
  g.fillStyle = beak;
  g.fill();
  g.lineWidth = 5;
  g.strokeStyle = "rgba(83,76,42,0.42)";
  g.stroke();
  ell(g, 372, 10, 10, 7, -0.2, "rgba(43,43,23,0.9)");
  g.beginPath();
  g.moveTo(318, 74);
  g.quadraticCurveTo(392, 98, 454, 50);
  g.lineWidth = 6;
  g.strokeStyle = "rgba(66,59,31,0.78)";
  g.stroke();

  // The eye: socket, weathered lid, amber iris, deep pupil, catchlight.
  const ex = 60;
  const ey = -120;
  ell(g, ex, ey, 174, 152, -0.06, "rgba(52,48,22,0.92)");
  g.lineWidth = 10;
  g.strokeStyle = "rgba(207,190,119,0.46)";
  g.beginPath();
  g.ellipse(ex, ey, 154, 132, -0.06, 0, TAU);
  g.stroke();

  if (blink < 0.02) {
    const iris = g.createRadialGradient(ex + 20, ey - 18, 4, ex, ey, 118);
    iris.addColorStop(0, HONU.irisLight);
    iris.addColorStop(0.48, HONU.iris);
    iris.addColorStop(0.82, HONU.irisDark);
    iris.addColorStop(1, "#5e431b");
    ell(g, ex, ey, 112, 103, -0.06, iris);
    g.lineWidth = 2.6;
    g.strokeStyle = "rgba(250,220,145,0.48)";
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * TAU + 0.07;
      g.beginPath();
      g.moveTo(ex + Math.cos(a) * 66, ey + Math.sin(a) * 60);
      g.lineTo(ex + Math.cos(a) * 108, ey + Math.sin(a) * 98);
      g.stroke();
    }
    ell(g, ex + 4, ey + 4, 64, 70, 0, HONU.pupil);
    ell(g, ex - 25, ey - 31, 25, 19, -0.4, HONU.catchlight);
    ell(g, ex + 27, ey + 29, 9, 7, 0, "rgba(255,248,218,0.66)");
    ell(g, ex + 9, ey - 7, 94, 83, -0.06, "rgba(255,244,204,0.07)");
  } else {
    const lid = g.createLinearGradient(ex, ey - 130, ex, ey + 130);
    lid.addColorStop(0, HONU.skinLight);
    lid.addColorStop(0.55, HONU.skin);
    lid.addColorStop(1, HONU.skinDark);
    ell(g, ex, ey, 158, 140 * blink, -0.03, lid);
    g.lineWidth = 4;
    g.strokeStyle = "rgba(49,52,24,0.6)";
    g.beginPath();
    g.ellipse(ex, ey, 158, 140 * blink, -0.03, 0, TAU);
    g.stroke();
  }

  // Brow ridge and a few wrinkles around the eye.
  g.lineWidth = 5;
  g.strokeStyle = "rgba(48,51,24,0.36)";
  for (let k = 0; k < 3; k++) {
    g.beginPath();
    g.ellipse(ex - 8, ey - 12, 190 + k * 14, 162 + k * 12, -0.06, 3.55, 5.05);
    g.stroke();
  }
  g.restore();

  g.restore();
}

// ---------- manta flyby: one close pass in sunlit blue water ----------

interface FlyMantaPalette {
  back: string;
  backMid: string;
  backLight: string;
  edge: string;
  patch: string;
  patchSoft: string;
  belly: string;
  cephalic: string;
  cephLight: string;
  eye: string;
  gill: string;
  tail: string;
  tailMid: string;
  tailLight: string;
  rim: string;
}

const FLY_MANTA: FlyMantaPalette = {
  back: "#0d1a25",
  backMid: "#152a38",
  backLight: "#274455",
  edge: "#060f17",
  patch: "rgba(225,237,231,0.26)",
  patchSoft: "rgba(225,237,231,0.14)",
  belly: "rgba(226,240,233,0.3)",
  cephalic: "#1d3544",
  cephLight: "rgba(118,166,174,0.5)",
  eye: "#050d14",
  gill: "rgba(26,52,58,0.6)",
  tail: "#0a151f",
  tailMid: "#152837",
  tailLight: "#2e4b5a",
  rim: "rgba(184,238,232,0.42)",
};

const FLY_MANTA_FAR: FlyMantaPalette = {
  back: "#225263",
  backMid: "#2d6373",
  backLight: "#4a8490",
  edge: "#173d4b",
  patch: "rgba(218,240,234,0.34)",
  patchSoft: "rgba(218,240,234,0.16)",
  belly: "rgba(214,238,231,0.26)",
  cephalic: "#2a5c6b",
  cephLight: "rgba(150,204,205,0.4)",
  eye: "#0a2733",
  gill: "rgba(24,62,72,0.4)",
  tail: "#1a4454",
  tailMid: "#225364",
  tailLight: "#3b7382",
  rim: "rgba(196,240,236,0.3)",
};

interface MantaTailPoint {
  x: number;
  y: number;
  u: number;
}

function mantaTailPoints(t: number, phaseOffset = 0, count = 40): MantaTailPoint[] {
  const phase = (TAU * 2 * t) / T + 1.6 + phaseOffset;
  const glide = Math.sin((TAU * t) / T + 0.9 + phaseOffset * 0.6);
  const baseX = -140;
  const points: MantaTailPoint[] = [{ x: baseX, y: 0, u: 0 }];
  for (let k = 1; k <= count; k++) {
    const u = k / count;
    points.push({
      x: baseX - u * 860,
      y: (18 * u + 60 * u * u) * Math.sin(phase - u * 2.8) + 10 * glide * u,
      u,
    });
  }
  return points;
}

function drawMantaTail(
  g: CanvasRenderingContext2D,
  t: number,
  pal: FlyMantaPalette = FLY_MANTA,
  phaseOffset = 0,
) {
  const points = mantaTailPoints(t, phaseOffset);
  let px = points[0].x;
  let py = points[0].y;

  g.save();
  g.lineCap = "round";
  for (let k = 1; k < points.length; k++) {
    const { x, y, u } = points[k];
    g.lineWidth = 28 * (1 - u) ** 0.5 + 4;
    g.strokeStyle = u > 0.82 ? pal.tailLight : u > 0.5 ? pal.tailMid : pal.tail;
    g.beginPath();
    g.moveTo(px, py);
    g.lineTo(x, y);
    g.stroke();
    if (u < 0.94) {
      g.lineWidth = Math.max(1.8, g.lineWidth * 0.3);
      g.strokeStyle = pal.tailLight;
      g.globalAlpha = 0.45;
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(x, y);
      g.stroke();
      g.globalAlpha = 1;
    }
    px = x;
    py = y;
  }
  g.restore();
}

// Drawn in local px facing +x: a broad diamond with a long whip tail, a pale
// near-side trailing glint, gill slits, cephalic lobes, and small eye marks.
function drawFlyManta(
  g: CanvasRenderingContext2D,
  t: number,
  pal: FlyMantaPalette = FLY_MANTA,
  phaseOffset = 0,
  withTail = true,
) {
  const phase = (TAU * t) / T + phaseOffset;
  const flap = Math.sin(phase * 2 + 0.55);
  const glide = Math.sin(phase + 1.1);
  const bank = Math.sin(phase + 2.4);
  const span = 536 + 38 * flap;
  const back = -64 - 30 * flap;
  const base = -140;

  if (withTail) drawMantaTail(g, t, pal, phaseOffset);

  g.save();
  g.rotate(bank * 0.02);
  g.scale(1, 1 + 0.035 * flap + 0.008 * glide);

  g.save();
  g.globalCompositeOperation = "screen";
  halo(g, span * 1.18, "rgba(152,242,232,0.06)");
  g.restore();

  const bodyPath = () => {
    g.beginPath();
    g.moveTo(225, 0);
    g.bezierCurveTo(223, -34, 212, -60, 195, -80);
    g.quadraticCurveTo(110, -420, back, -span);
    g.quadraticCurveTo(-40, -340, -210, -60);
    g.quadraticCurveTo(-175, -30, -140, 0);
    g.quadraticCurveTo(-175, 30, -210, 60);
    g.quadraticCurveTo(-40, 340, back, span);
    g.quadraticCurveTo(110, 420, 195, 80);
    g.bezierCurveTo(212, 60, 223, 34, 225, 0);
    g.closePath();
  };

  bodyPath();
  const dorsal = g.createLinearGradient(160, -span, -300, span);
  dorsal.addColorStop(0, pal.backLight);
  dorsal.addColorStop(0.3, pal.backMid);
  dorsal.addColorStop(0.72, pal.back);
  dorsal.addColorStop(1, pal.edge);
  g.fillStyle = dorsal;
  g.fill();

  g.save();
  bodyPath();
  g.clip();

  const headGlow = g.createRadialGradient(104, -30, 10, 104, -30, 300);
  headGlow.addColorStop(0, "rgba(126,178,188,0.24)");
  headGlow.addColorStop(1, "rgba(126,178,188,0)");
  g.fillStyle = headGlow;
  g.fillRect(-340, -span - 60, 900, span * 2 + 120);

  // Countershading: a pale glint along the near trailing edge, plus a fainter
  // one on the far wing. Keep it subtle so the dorsal silhouette stays solid.
  g.beginPath();
  g.moveTo(back, span);
  g.quadraticCurveTo(-40, span * 0.38, -210, 60);
  g.lineTo(-210, 30);
  g.quadraticCurveTo(-40, span * 0.34, back, span * 0.94);
  g.closePath();
  g.fillStyle = "rgba(220,240,232,0.13)";
  g.fill();

  const farGlint = g.createRadialGradient(-110, -span * 0.64, 12, -110, -span * 0.64, 260);
  farGlint.addColorStop(0, "rgba(210,231,225,0.16)");
  farGlint.addColorStop(1, "rgba(210,231,225,0)");
  g.fillStyle = farGlint;
  g.beginPath();
  g.arc(-110, -span * 0.64, 260, 0, TAU);
  g.fill();

  // A few soft dapples caught on the back.
  g.save();
  g.globalCompositeOperation = "screen";
  for (let k = 0; k < 9; k++) {
    const dx = -240 + hash(k, 4, 7) * 440;
    const dy = -span * 0.78 + hash(k, 5, 9) * span * 1.56;
    ell(
      g,
      dx,
      dy,
      26 + hash(k, 6, 11) * 52,
      9 + hash(k, 7, 13) * 20,
      hash(k, 8, 5) * TAU,
      "rgba(154,232,224,0.055)",
    );
  }
  g.restore();

  // Faint radial ribs across each wing.
  g.lineWidth = 2;
  g.strokeStyle = "rgba(126,170,176,0.13)";
  for (const m of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const y0 = (64 + k * 68) * m;
      g.beginPath();
      g.moveTo(60, y0);
      g.quadraticCurveTo(-120, y0 * 1.5, -220 - k * 14, y0 * 2.2);
      g.stroke();
    }
  }
  g.restore();

  // Pale shoulder patches sweeping back from the head.
  for (const m of [-1, 1]) {
    g.save();
    g.translate(96, 150 * m);
    g.rotate(-0.55 * m);
    ell(g, 0, 0, 112, 19, 0, pal.patch);
    ell(g, 74, 0, 50, 10, 0, pal.patchSoft);
    g.restore();
  }

  // Cephalic lobes, then the small eye marks on either side of the head.
  ell(g, 214, 0, 26, 54, 0, "rgba(206,228,222,0.14)");
  for (const m of [-1, 1]) {
    g.save();
    g.translate(240, 64 * m);
    g.rotate(0.42 * m);
    ell(g, 30, 0, 76, 23, 0, pal.cephalic);
    ell(g, 52, -3 * m, 44, 10, 0, pal.cephLight);
    g.restore();
    ell(g, 206, 46 * m, 17, 19, 0, "rgba(196,226,220,0.38)");
    ell(g, 206, 46 * m, 10, 12, 0, pal.eye);
    ell(g, 202, 42 * m, 4, 4, 0, "rgba(222,248,240,0.9)");
  }

  // Ventral gill slits, readable through the pale near-side sheen.
  for (const m of [-1, 1]) {
    ell(
      g,
      16,
      86 * m,
      64,
      36,
      -0.5 * m,
      m > 0 ? "rgba(202,228,221,0.18)" : "rgba(196,220,213,0.08)",
    );
    for (let k = 0; k < 5; k++) {
      const x = 58 - k * 17;
      g.beginPath();
      g.moveTo(x + 10, 44 * m);
      g.quadraticCurveTo(x - 2, 76 * m, x - 10, 118 * m);
      g.lineWidth = 5.4 - k * 0.3;
      g.strokeStyle = m > 0 ? pal.gill : "rgba(26,52,58,0.3)";
      g.stroke();
    }
  }

  // Leading-edge rim light and the dorsal ridge.
  g.lineWidth = 6;
  g.strokeStyle = "rgba(148,206,204,0.22)";
  for (const m of [-1, 1]) {
    g.beginPath();
    g.moveTo(195, 80 * m);
    g.quadraticCurveTo(110, 420 * m, back, span * m);
    g.stroke();
  }
  g.lineWidth = 2;
  g.strokeStyle = "rgba(120,170,176,0.18)";
  g.beginPath();
  g.moveTo(200, 0);
  g.quadraticCurveTo(-40, 0, base, 0);
  g.stroke();

  // A pale rim and wingtip marks keep the silhouette legible against the water.
  bodyPath();
  g.lineWidth = 10;
  g.strokeStyle = pal.rim;
  g.stroke();
  for (const m of [-1, 1]) {
    ell(g, back, span * m, 20, 13, 0, pal.rim);
  }

  g.restore();
}

// A small silver school drifts behind the manta to give it scale and depth.
const P_MANTA_FISH: PointPath = (t) => [
  972 + 760 * Math.cos(2 * w * t + 2.2),
  1010 + 380 * Math.sin(2 * w * t + 2.2),
];

const MANTA_SCHOOL: Array<[number, number, number]> = [
  [0, 0, 0.7],
  [-180, -50, 0.6],
  [-340, 30, 0.62],
  [-520, -26, 0.54],
  [-680, 48, 0.48],
];

const MANTA_TANG: TangPalette = {
  fin: "#7fb4b1",
  body: "#a8d2cc",
  head: "#d6eee7",
};

// ---------- seahorse close-up: one animal in the seagrass ----------

interface SeahorsePalette {
  body: string;
  bodyMid: string;
  bodyDeep: string;
  bodyLight: string;
  rim: string;
  crest: string;
  crestLight: string;
  eyeRing: string;
  eye: string;
  glint: string;
  ring: string;
  ringLight: string;
  dapple: string;
}

const SEAHORSE: SeahorsePalette = {
  body: "#d99f4b",
  bodyMid: "#b87c33",
  bodyDeep: "#7d5222",
  bodyLight: "#f2d494",
  rim: "rgba(255,247,212,0.5)",
  crest: "#b9792c",
  crestLight: "#eec27a",
  eyeRing: "#f6e4b4",
  eye: "#20160c",
  glint: "rgba(255,253,238,0.95)",
  ring: "rgba(96,56,16,0.52)",
  ringLight: "rgba(255,235,186,0.3)",
  dapple: "rgba(255,242,206,0.4)",
};

// Local px, origin at the mid-trunk, +x is the snout. The body is a tapering
// tube stamped from a Catmull-Rom spine; the tail continues the same curve
// into a prehensile spiral.
type SpinePoint = [number, number, number];

const SEA_SPINE: SpinePoint[] = [
  [40, -556, 46],
  [46, -506, 96],
  [56, -448, 86],
  [44, -388, 54],
  [54, -318, 62],
  [80, -216, 98],
  [100, -110, 116],
  [90, -4, 110],
  [64, 96, 92],
  [28, 194, 66],
  [-2, 280, 46],
  [-16, 330, 30],
];

const SEA_TAIL: SpinePoint[] = [
  [-16, 326, 30],
  [-26, 386, 30],
  [-14, 436, 27],
  [21, 471, 24],
  [72, 478, 21],
  [113, 451, 18],
  [120, 412, 15],
  [94, 388, 12],
  [64, 401, 10],
  [58, 426, 7],
  [77, 436, 5],
];

const SEA_SNOUT: SpinePoint[] = [
  [134, -490, 36],
  [170, -484, 33],
  [204, -478, 30],
  [236, -472, 27],
  [262, -466, 24],
  [280, -460, 22],
  [292, -456, 20],
];

const SEA_ORIGIN: [number, number] = [972, 900];

interface SeaPose {
  x: number;
  y: number;
  angle: number;
  scale: number;
  flip: boolean;
  offset: number;
  haze: number;
}

// Two closed drifts: the foreground animal crosses the centre of the stage
// while the smaller one traces a slower diagonal through the upper left. Both
// are pure functions of t, so the pair returns to its start every loop.
function seaPoses(t: number, fit: number): [SeaPose, SeaPose] {
  const p = w * t;
  const mapX = (x: number) => SEA_ORIGIN[0] + (x - SEA_ORIGIN[0]) * fit;
  const mapY = (y: number) => SEA_ORIGIN[1] + (y - SEA_ORIGIN[1]) * fit;

  const foreX = 1090 + 65 * Math.cos(p + 0.9);
  const foreY = 990 + 135 * Math.sin(p + 2.3) + 16 * Math.sin(2 * p + 1.1);
  const backX = 680 + 30 * Math.sin(p + 3.7) + 6 * Math.sin(2 * p + 0.9);
  const backY = 655 + 150 * Math.sin(p + 3.7) + 20 * Math.sin(2 * p + 2.6);

  return [
    {
      x: mapX(foreX),
      y: mapY(foreY),
      angle: -0.05 - 0.06 * Math.sin(p + 0.9) + 0.02 * Math.sin(2 * p + 0.6),
      scale: 0.98 * fit,
      flip: false,
      offset: 0,
      haze: 0,
    },
    {
      x: mapX(backX),
      y: mapY(backY),
      angle: 0.05 + 0.04 * Math.sin(p + 0.4) + 0.015 * Math.sin(2 * p + 1.9),
      scale: 0.5 * fit,
      flip: true,
      offset: 7.3,
      haze: 1,
    },
  ];
}

function drawSeahorseAt(g: CanvasRenderingContext2D, t: number, pose: SeaPose) {
  g.save();
  g.translate(pose.x, pose.y);
  g.rotate(pose.angle);
  g.scale(pose.flip ? -pose.scale : pose.scale, pose.scale);
  drawSeahorse(g, t, pose.offset, pose.haze ? 0.55 : 1);
  g.restore();
}

// Catmull-Rom through [x, y, radius] control points. Smoothing both the
// centerline and the width keeps the stamped tube free of visible kinks.
function seaSpline(ctrl: SpinePoint[], steps: number): SpinePoint[] {
  const out: SpinePoint[] = [];
  const at = (i: number) => ctrl[Math.max(0, Math.min(ctrl.length - 1, i))];
  for (let s = 0; s <= steps; s++) {
    const u = (s / steps) * (ctrl.length - 1);
    const i = Math.min(ctrl.length - 2, Math.floor(u));
    const f = u - i;
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const f2 = f * f;
    const f3 = f2 * f;
    const v = (a: number, b: number, c: number, d: number) =>
      0.5 *
      (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f2 + (-a + 3 * b - 3 * c + d) * f3);
    out.push([
      v(p0[0], p1[0], p2[0], p3[0]),
      v(p0[1], p1[1], p2[1], p3[1]),
      v(p0[2], p1[2], p2[2], p3[2]),
    ]);
  }
  return out;
}

function drawSeahorseBackdrop(g: CanvasRenderingContext2D) {
  // Late-afternoon shafts raking down through the shallows.
  g.save();
  g.globalCompositeOperation = "screen";
  for (let k = 0; k < 5; k++) {
    const off = -W * 0.15 + k * W * 0.27;
    const beam = g.createLinearGradient(off, -H * 0.1, off + W * 0.3, H * 1.08);
    beam.addColorStop(0, "rgba(255,246,206,0)");
    beam.addColorStop(0.4, `rgba(255,248,214,${0.08 + (k % 3) * 0.015})`);
    beam.addColorStop(0.64, "rgba(255,238,178,0.05)");
    beam.addColorStop(1, "rgba(255,232,164,0)");
    g.fillStyle = beam;
    g.fillRect(0, 0, W, H);
  }
  g.restore();

  // Sandy floor: a warm shelf that the grass grows out of.
  const deep = g.createLinearGradient(0, H * 0.54, 0, H);
  deep.addColorStop(0, "rgba(6,84,104,0)");
  deep.addColorStop(1, "rgba(5,66,92,0.34)");
  g.fillStyle = deep;
  g.fillRect(0, H * 0.54, W, H * 0.46);

  const floor = g.createLinearGradient(0, H * 0.76, 0, H);
  floor.addColorStop(0, "rgba(220,198,136,0)");
  floor.addColorStop(0.66, "rgba(206,186,126,0.2)");
  floor.addColorStop(1, "rgba(178,158,104,0.4)");
  g.fillStyle = floor;
  g.fillRect(0, H * 0.76, W, H * 0.24);

  for (let k = 0; k < 9; k++) {
    const x = hash(k, 51, 5) * W;
    const y = H * 0.9 + hash(k, 52, 7) * H * 0.14;
    ell(
      g,
      x,
      y,
      120 + hash(k, 53, 9) * 260,
      26 + hash(k, 54, 11) * 60,
      hash(k, 55, 13) * 0.35,
      k % 2 ? "rgba(150,138,92,0.12)" : "rgba(98,120,88,0.1)",
    );
  }

  // Distant reef mounds, low contrast, mostly behind the grass.
  for (let k = 0; k < 7; k++) {
    const x = hash(k, 61, 5) * W;
    const y = H * 0.83 + hash(k, 62, 7) * H * 0.16;
    ell(
      g,
      x,
      y,
      90 + hash(k, 63, 9) * 200,
      40 + hash(k, 64, 11) * 90,
      hash(k, 65, 13) * 0.4,
      k % 2 ? "rgba(44,116,96,0.12)" : "rgba(78,112,72,0.11)",
    );
  }

  // A soft surface shelf, warmer than the manta's cold cap.
  const surface = g.createLinearGradient(0, 0, 0, H * 0.2);
  surface.addColorStop(0, "rgba(255,252,226,0.34)");
  surface.addColorStop(1, "rgba(255,252,226,0)");
  g.fillStyle = surface;
  g.fillRect(0, 0, W, H * 0.2);

  const vignette = g.createRadialGradient(W * 0.5, H * 0.48, W * 0.28, W * 0.5, H * 0.48, W * 0.86);
  vignette.addColorStop(0, "rgba(0,30,30,0)");
  vignette.addColorStop(0.72, "rgba(0,32,32,0.04)");
  vignette.addColorStop(1, "rgba(0,26,34,0.24)");
  g.fillStyle = vignette;
  g.fillRect(0, 0, W, H);
}

function drawSeahorse(g: CanvasRenderingContext2D, t: number, offset = 0, detail = 1) {
  const phase = w * (t + offset);
  const pectoral = Math.sin(60 * phase + 1.1);
  const dorsal = Math.sin(48 * phase + 0.4);
  const flex = Math.sin(w * (t + offset) + 2.1);
  const grow = Math.sin(w * (t + offset) + 0.7);
  const snoutSwing = 0.13 * Math.sin(w * (t + offset) + 1.6);

  const body = seaSpline(SEA_SPINE, 120);
  const snout = seaSpline(SEA_SNOUT, 26);
  const tail = seaSpline(SEA_TAIL, 110).map(([x, y, r], i): SpinePoint => {
    const u = i / 110;
    const swing = 0.3 * flex * u * u;
    const spread = 1 + 0.08 * grow * u;
    const dx = x + 16;
    const dy = y - 326;
    const ca = Math.cos(swing);
    const sa = Math.sin(swing);
    return [
      -16 + (dx * ca - dy * sa) * spread,
      326 + (dx * sa + dy * ca) * spread,
      r * (1 + 0.035 * flex * u),
    ];
  });

  const paint = g.createLinearGradient(-150, -640, 220, 470);
  paint.addColorStop(0, SEAHORSE.bodyLight);
  paint.addColorStop(0.34, SEAHORSE.body);
  paint.addColorStop(0.72, SEAHORSE.bodyMid);
  paint.addColorStop(1, SEAHORSE.bodyDeep);

  const outline = () => {
    g.beginPath();
    for (const [x, y, r] of body) {
      g.moveTo(x + r, y);
      g.arc(x, y, r, 0, TAU);
    }
  };

  g.save();

  // Dorsal fin: a dark, rayed membrane behind the silhouette.
  g.beginPath();
  g.moveTo(-6, -322);
  for (let k = 0; k <= 7; k++) {
    const u = k / 7;
    const y = -322 + u * 310;
    const x = -38 - 146 * Math.sin(u * Math.PI) - 12 * dorsal - (k % 2 ? 16 : 0);
    g.lineTo(x, y);
  }
  g.lineTo(-8, -6);
  g.quadraticCurveTo(-36, 26, -10, -12);
  g.closePath();
  g.fillStyle = "rgba(238,222,170,0.5)";
  g.fill();
  g.strokeStyle = "rgba(255,248,216,0.6)";
  g.lineWidth = 8;
  g.stroke();
  g.strokeStyle = "rgba(74,84,44,0.8)";
  for (let k = 0; k < 8; k++) {
    const u = k / 7;
    const y = -322 + u * 310;
    const x = -38 - 146 * Math.sin(u * Math.PI) - 12 * dorsal - (k % 2 ? 16 : 0);
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(-8, -296 + k * 33);
    g.quadraticCurveTo(-92, -286 + k * 32, x, y);
    g.stroke();
  }

  // Warm rim light on the sunlit (upper-left) edge, then the body fill.
  g.save();
  g.translate(-6, -7);
  outline();
  g.fillStyle = SEAHORSE.rim;
  g.fill();
  g.restore();

  outline();
  g.fillStyle = paint;
  g.fill();

  // Everything below is clipped to the animal so texture never leaks.
  g.save();
  outline();
  g.clip();

  const back = g.createLinearGradient(-130, -300, 90, 200);
  back.addColorStop(0, "rgba(58,32,8,0.66)");
  back.addColorStop(1, "rgba(58,32,8,0)");
  g.fillStyle = back;
  g.fillRect(-260, -700, 560, 1300);

  const belly = g.createRadialGradient(150, -60, 20, 150, -60, 300);
  belly.addColorStop(0, "rgba(255,246,212,0.55)");
  belly.addColorStop(0.55, "rgba(255,238,194,0.24)");
  belly.addColorStop(1, "rgba(255,238,194,0)");
  g.fillStyle = belly;
  g.fillRect(-90, -380, 470, 680);

  // Soft dapples along the flank.
  for (let k = 0; k < Math.round(26 * detail); k++) {
    const dx = -34 + hash(k, 1, 9) * 204;
    const dy = -470 + hash(k, 2, 10) * 760;
    ell(
      g,
      26 + dx * 0.82,
      dy,
      8 + hash(k, 3, 11) * 20,
      4 + hash(k, 4, 12) * 9,
      hash(k, 5, 13) * TAU,
      SEAHORSE.dapple,
    );
  }

  // Trunk rings: one curved rib every few centimetres of spine. The head stays
  // smooth so the eye and snout read as a face, not a caterpillar.
  let ringStart = 0;
  while (ringStart < body.length && body[ringStart][1] < -370) ringStart++;
  const ribStep = detail < 1 ? 7 : 4;
  for (let i = ringStart; i < body.length - 2; i += ribStep) {
    const [x, y, r] = body[i];
    const [nx, ny] = body[i + 1];
    const angle = Math.atan2(ny - y, nx - x);
    const px = -Math.sin(angle);
    const py = Math.cos(angle);
    const span = r * 0.96;
    g.beginPath();
    g.moveTo(x - px * span, y - py * span);
    g.quadraticCurveTo(
      x + Math.cos(angle) * 11,
      y + Math.sin(angle) * 11,
      x + px * span,
      y + py * span,
    );
    g.lineWidth = 4.2;
    g.strokeStyle = SEAHORSE.ring;
    g.stroke();
    g.beginPath();
    g.moveTo(x - px * span * 0.9, y - py * span * 0.9);
    g.quadraticCurveTo(
      x + Math.cos(angle) * 17,
      y + Math.sin(angle) * 17,
      x + px * span * 0.9,
      y + py * span * 0.9,
    );
    g.lineWidth = 2;
    g.strokeStyle = SEAHORSE.ringLight;
    g.stroke();
  }

  // A darker cheek and a lit brow give the head an expression.
  ell(g, 96, -430, 52, 32, 0.22, "rgba(120,72,24,0.24)");
  ell(g, 116, -514, 46, 28, -0.2, "rgba(255,241,198,0.26)");
  g.beginPath();
  g.ellipse(118, -526, 38, 21, -0.2, 3.5, 5.95);
  g.lineWidth = 7;
  g.strokeStyle = "rgba(94,54,16,0.46)";
  g.stroke();

  g.restore();

  // Snout swings from the cheek: a live head without moving the eye. The base
  // stays buried in the head so the join never shows.
  g.save();
  g.translate(134, -484);
  g.rotate(snoutSwing);
  g.translate(-134, 484);
  g.beginPath();
  for (const [x, y, r] of snout) {
    g.moveTo(x + r, y);
    g.arc(x, y, r, 0, TAU);
  }
  g.fillStyle = paint;
  g.fill();

  // A lit ridge, a dark underside, and rings near the tip.
  g.beginPath();
  g.moveTo(138, -512);
  g.quadraticCurveTo(226, -492, 292, -472);
  g.lineWidth = 8;
  g.strokeStyle = "rgba(255,242,200,0.48)";
  g.stroke();
  g.beginPath();
  g.moveTo(138, -462);
  g.quadraticCurveTo(226, -444, 290, -434);
  g.lineWidth = 9;
  g.strokeStyle = "rgba(92,52,14,0.42)";
  g.stroke();
  for (let k = 1; k <= 3; k++) {
    const [x, y, r] = snout[Math.min(snout.length - 1, k * 6)];
    g.beginPath();
    g.ellipse(x, y, r * 0.28, r * 0.94, -0.18, 0, TAU);
    g.lineWidth = 3;
    g.strokeStyle = "rgba(104,62,20,0.42)";
    g.stroke();
  }

  // Mouth and a nostril at the tip of the snout.
  ell(g, 295, -456, 10, 12, -0.2, "rgba(74,40,10,0.72)");
  ell(g, 278, -474, 3.5, 3.5, 0, "rgba(74,40,10,0.55)");
  g.restore();

  // Tail: the same paint, stroked with a tapering width so it stays joined.
  g.lineCap = "round";
  for (let i = 1; i < tail.length; i++) {
    const [x, y, r] = tail[i];
    const [px, py] = tail[i - 1];
    g.beginPath();
    g.moveTo(px, py);
    g.lineTo(x, y);
    g.lineWidth = Math.max(7, r * 2);
    g.strokeStyle = paint;
    g.stroke();
  }
  const tailStep = detail < 1 ? 8 : 4;
  for (let i = 4; i < tail.length - 2; i += tailStep) {
    const [x, y, r] = tail[i];
    const [nx, ny] = tail[i + 1];
    const angle = Math.atan2(ny - y, nx - x);
    const px = -Math.sin(angle);
    const py = Math.cos(angle);
    g.beginPath();
    g.moveTo(x - px * r * 0.85, y - py * r * 0.85);
    g.lineTo(x + px * r * 0.85, y + py * r * 0.85);
    g.lineWidth = 3;
    g.strokeStyle = SEAHORSE.ring;
    g.stroke();
  }
  const [tipX, tipY] = tail[tail.length - 1];
  ell(g, tipX, tipY, 8, 8, 0, "rgba(255,240,196,0.5)");

  // Coronet: the little dragon's crown.
  const crest = () => {
    g.beginPath();
    g.moveTo(-18, -548);
    g.quadraticCurveTo(-10, -612, -2, -650);
    g.quadraticCurveTo(8, -616, 14, -594);
    g.quadraticCurveTo(24, -640, 34, -678);
    g.quadraticCurveTo(44, -634, 50, -604);
    g.quadraticCurveTo(62, -640, 74, -658);
    g.quadraticCurveTo(80, -616, 86, -590);
    g.quadraticCurveTo(98, -592, 106, -566);
    g.lineTo(98, -548);
    g.closePath();
  };
  g.save();
  g.translate(-7, -13);
  crest();
  g.fillStyle = "rgba(255,246,208,0.44)";
  g.fill();
  g.restore();
  crest();
  g.fillStyle = SEAHORSE.crest;
  g.fill();
  g.strokeStyle = SEAHORSE.crestLight;
  g.lineWidth = 4;
  g.stroke();

  // Small dorsal knobs down the neck and back.
  for (let k = 0; k < 6; k++) {
    const y = -536 + k * 66;
    const x = -2 - k * 5;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x - 18 - k * 3, y - 10);
    g.lineTo(x - 6, y + 14);
    g.closePath();
    g.fillStyle = k > 3 ? SEAHORSE.bodyMid : SEAHORSE.crest;
    g.fill();
  }

  // Near-side pectoral fin, fluttering in front of the neck.
  const fan = 0.82 + 0.18 * pectoral;
  g.save();
  g.translate(74, -336);
  g.rotate(0.5 + 0.12 * pectoral);
  g.beginPath();
  g.moveTo(0, -16);
  g.quadraticCurveTo(58 * fan, -50 * fan, 106 * fan, -10 * fan);
  g.quadraticCurveTo(74 * fan, 38 * fan, 0, 22);
  g.closePath();
  g.fillStyle = "rgba(226,178,104,0.52)";
  g.fill();
  g.strokeStyle = "rgba(176,112,40,0.62)";
  g.lineWidth = 2.5;
  g.stroke();
  for (let k = 0; k < 5; k++) {
    g.beginPath();
    g.moveTo(6, -2);
    g.lineTo(80 * fan, -30 * fan + k * 17 * fan);
    g.lineWidth = 2.2;
    g.strokeStyle = "rgba(106,64,18,0.72)";
    g.stroke();
  }
  g.restore();

  // The round eye and its wet glint.
  ell(g, 120, -508, 33, 30, -0.15, SEAHORSE.eyeRing);
  ell(g, 120, -508, 21, 19, -0.15, SEAHORSE.eye);
  ell(g, 111, -517, 7, 7, 0, SEAHORSE.glint);

  g.restore();
}

// ---------- dolphin pod: three animals crossing open sunlit water ----------

interface PodPalette {
  body: string;
  bodyMid: string;
  bodyLight: string;
  bodyDeep: string;
  belly: string;
  bellySoft: string;
  cape: string;
  beak: string;
  beakLight: string;
  fin: string;
  finLight: string;
  eye: string;
  glint: string;
  rim: string;
  wake: string;
}

const POD_DOLPHIN: PodPalette = {
  body: "#3d6073",
  bodyMid: "#52798a",
  bodyLight: "#8fb1b9",
  bodyDeep: "#19384b",
  belly: "#c9ded9",
  bellySoft: "rgba(188,221,214,0.42)",
  cape: "#102f43",
  beak: "#5d8795",
  beakLight: "#b2d2cc",
  fin: "#1e4357",
  finLight: "#6d969e",
  eye: "#041219",
  glint: "rgba(242,255,250,0.96)",
  rim: "rgba(220,253,245,0.58)",
  wake: "rgba(246,255,251,0.62)",
};

const POD_DOLPHIN_FAR: PodPalette = {
  body: "#3b7387",
  bodyMid: "#508897",
  bodyLight: "#8ab6ba",
  bodyDeep: "#1a4b60",
  belly: "#bad9d2",
  bellySoft: "rgba(184,219,212,0.34)",
  cape: "#173f54",
  beak: "#6b98a4",
  beakLight: "#b7d8d2",
  fin: "#2b6073",
  finLight: "#77a9ae",
  eye: "#061e29",
  glint: "rgba(235,255,250,0.82)",
  rim: "rgba(218,251,244,0.4)",
  wake: "rgba(240,255,249,0.44)",
};

// Local px, rostrum to peduncle, facing +x. The width profile gives the melon,
// a narrow beak, a full shoulder, and a long taper into the tail stock.
const POD_BODY: SpinePoint[] = [
  [378, 0, 7],
  [350, 0, 9],
  [325, 0, 11],
  [300, 0, 13],
  [276, 0, 16],
  [252, 0, 18],
  [234, 0, 31],
  [214, 0, 49],
  [190, 0, 62],
  [166, 0, 61],
  [140, 0, 66],
  [110, 0, 73],
  [62, 0, 82],
  [4, 0, 84],
  [-58, 0, 74],
  [-124, 0, 57],
  [-186, 0, 40],
  [-238, 0, 24],
  [-278, 0, 16],
];

function podBody(t: number, offset: number): SpinePoint[] {
  const swim = (TAU * 44 * t) / T + offset;
  const ctrl = POD_BODY;
  const points = seaSpline(ctrl, 96);
  return points.map(([x, y, r], i): SpinePoint => {
    const u = i / (points.length - 1);
    const tailWave = 30 * u * u * Math.sin(swim - u * 2.7);
    const shoulderWave = 6 * u * Math.sin(swim + 0.9 - u * 1.4);
    return [x, y + tailWave + shoulderWave, r];
  });
}

function drawPodFlukes(g: CanvasRenderingContext2D, pal: PodPalette, swim: number) {
  const flap = Math.sin(swim + 0.4);
  g.save();
  g.rotate(0.1 * flap);
  const path = () => {
    g.beginPath();
    g.moveTo(-4, 0);
    g.quadraticCurveTo(58, -38, 150, -160 - 18 * flap);
    g.quadraticCurveTo(178, -84, 96, -10);
    g.lineTo(72, 0);
    g.lineTo(96, 10);
    g.quadraticCurveTo(178, 84, 150, 160 + 18 * flap);
    g.quadraticCurveTo(58, 38, -4, 0);
    g.closePath();
  };
  path();
  const fill = g.createLinearGradient(0, -110, -80, 120);
  fill.addColorStop(0, pal.finLight);
  fill.addColorStop(0.38, pal.fin);
  fill.addColorStop(1, pal.bodyDeep);
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = pal.rim;
  g.stroke();

  // Pale trailing tips and a shallow notch make the flukes read from above.
  for (const m of [-1, 1]) {
    g.beginPath();
    g.moveTo(96, 0);
    g.quadraticCurveTo(126, 34 * m, 150, 132 * m);
    g.lineWidth = 5;
    g.strokeStyle = pal.bellySoft;
    g.stroke();
  }
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(82, 0);
  g.lineWidth = 3;
  g.strokeStyle = pal.cape;
  g.stroke();
  g.restore();
}

function drawPodFlipper(g: CanvasRenderingContext2D, pal: PodPalette, side: -1 | 1, swing: number) {
  g.save();
  g.translate(154, side * 44);
  g.rotate(side * 0.08 * swing);
  const path = () => {
    g.beginPath();
    g.moveTo(0, 0);
    g.quadraticCurveTo(-4, side * 36, -72, side * 98);
    g.quadraticCurveTo(-84, side * 52, -42, side * 12);
    g.quadraticCurveTo(-18, side * 2, 0, 0);
    g.closePath();
  };
  path();
  const fill = g.createLinearGradient(0, 0, -70, 90 * side);
  fill.addColorStop(0, pal.finLight);
  fill.addColorStop(0.45, pal.fin);
  fill.addColorStop(1, pal.bodyDeep);
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = 3.5;
  g.strokeStyle = pal.rim;
  g.stroke();
  g.beginPath();
  g.moveTo(-8, side * 10);
  g.quadraticCurveTo(-44, side * 30, -68, side * 86);
  g.lineWidth = 2.5;
  g.strokeStyle = pal.bellySoft;
  g.stroke();
  g.restore();
}

function drawPodDorsal(
  g: CanvasRenderingContext2D,
  pal: PodPalette,
  baseX: number,
  baseY: number,
  swing: number,
) {
  g.save();
  g.translate(baseX, baseY);
  g.rotate(0.03 * swing);
  const path = () => {
    g.beginPath();
    g.moveTo(70, 16);
    g.quadraticCurveTo(26, -64, -62, -142);
    g.quadraticCurveTo(-48, -62, -78, -6);
    g.quadraticCurveTo(-42, 14, 10, 24);
    g.closePath();
  };
  path();
  const fill = g.createLinearGradient(30, -110, -30, 10);
  fill.addColorStop(0, pal.finLight);
  fill.addColorStop(0.42, pal.fin);
  fill.addColorStop(1, pal.cape);
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = pal.rim;
  g.stroke();
  g.beginPath();
  g.moveTo(62, 6);
  g.quadraticCurveTo(8, -54, -58, -132);
  g.lineWidth = 3;
  g.strokeStyle = pal.bellySoft;
  g.stroke();
  g.restore();
}

// Drawn in local px facing +x. A three-quarter-from-above view keeps the melon,
// beak, eye, dorsal fin, both flippers, and the horizontal flukes legible in
// the same average luminance that the cell pass uses for every other animal.
function drawPodDolphin(
  g: CanvasRenderingContext2D,
  t: number,
  pal: PodPalette,
  phaseOffset = 0,
  detail = 1,
  bank = 0,
) {
  const swim = (TAU * 44 * t) / T + phaseOffset;
  const points = podBody(t, phaseOffset);
  const tail = points[points.length - 1];
  const previous = points[points.length - 3];
  const tailAngle = Math.atan2(tail[1] - previous[1], tail[0] - previous[0]);
  const active = 0.7 + 0.3 * Math.sin(swim * 0.5 + 0.6);

  g.save();
  g.scale(1, 1 - 0.15 * Math.abs(bank));
  g.rotate(0.055 * bank);

  // Tail first: the peduncle hides the root of the flukes.
  g.save();
  g.translate(tail[0], tail[1]);
  g.rotate(tailAngle);
  drawPodFlukes(g, pal, swim);
  g.restore();

  // The far flipper peeks past the body on the shadow side.
  g.save();
  g.globalAlpha = 0.82;
  drawPodFlipper(g, pal, -1, swim);
  g.restore();

  // A falcate dorsal fin rises off the back.
  const finIndex = Math.round(points.length * 0.44);
  const finPoint = points[finIndex];
  drawPodDorsal(g, pal, finPoint[0], finPoint[1] - finPoint[2] * 0.55, swim);

  const outline = () => {
    g.beginPath();
    for (const [x, y, r] of points) {
      g.moveTo(x + r, y);
      g.arc(x, y, r, 0, TAU);
    }
  };

  // Sunlit rim, then the fusiform body.
  g.save();
  g.translate(-7, -9);
  outline();
  g.fillStyle = pal.rim;
  g.fill();
  g.restore();

  outline();
  const paint = g.createLinearGradient(40, -130, -20, 128);
  paint.addColorStop(0, pal.cape);
  paint.addColorStop(0.32, pal.bodyDeep);
  paint.addColorStop(0.58, pal.body);
  paint.addColorStop(0.82, pal.bodyMid);
  paint.addColorStop(1, pal.bodyLight);
  g.fillStyle = paint;
  g.fill();

  g.save();
  outline();
  g.clip();

  // Countershading: a dark dorsal cape and a pale near flank.
  const cape = g.createLinearGradient(0, -120, 0, 22);
  cape.addColorStop(0, "rgba(17,49,68,0.56)");
  cape.addColorStop(1, "rgba(17,49,68,0)");
  g.fillStyle = cape;
  g.fillRect(-330, -180, 700, 280);

  const belly = g.createLinearGradient(0, 12, 0, 120);
  belly.addColorStop(0, "rgba(235,249,242,0)");
  belly.addColorStop(0.5, "rgba(235,249,242,0.44)");
  belly.addColorStop(1, "rgba(235,249,242,0.8)");
  g.fillStyle = belly;
  g.fillRect(-260, 0, 560, 150);

  // A bright flank stripe and a few soft dapples catch the shafts.
  g.beginPath();
  g.moveTo(276, 2);
  g.quadraticCurveTo(154, 42, 12, 56);
  g.quadraticCurveTo(-112, 60, -208, 36);
  g.lineWidth = 11;
  g.strokeStyle = "rgba(226,246,240,0.28)";
  g.stroke();
  for (let k = 0; k < Math.round(24 * detail); k++) {
    const u = hash(k, 7, 13) * 0.78 + 0.06;
    const i = Math.min(points.length - 1, Math.round(u * (points.length - 1)));
    const [px, py, pr] = points[i];
    const angle = hash(k, 8, 15) * TAU;
    const dist = (hash(k, 9, 17) - 0.5) * pr * 1.2;
    ell(
      g,
      px + Math.cos(angle) * dist,
      py + Math.sin(angle) * dist * 0.72,
      8 + hash(k, 10, 19) * 20,
      3 + hash(k, 11, 21) * 7,
      angle,
      k % 3 ? "rgba(212,241,235,0.09)" : "rgba(18,65,83,0.14)",
    );
  }

  // The head keeps a cleaner surface so the eye and beak stay readable.
  g.beginPath();
  g.moveTo(250, 0);
  g.quadraticCurveTo(206, 26, 142, 35);
  g.lineWidth = 8;
  g.strokeStyle = "rgba(219,244,238,0.22)";
  g.stroke();
  g.restore();

  // Beak: a pale, narrow snout with a dark mouth line and a nostril.
  const beak = () => {
    g.beginPath();
    g.moveTo(376, -2);
    g.quadraticCurveTo(350, -11, 302, -13);
    g.quadraticCurveTo(264, -12, 228, 2);
    g.quadraticCurveTo(288, 10, 376, 3);
    g.closePath();
  };
  beak();
  const beakFill = g.createLinearGradient(228, -14, 376, 16);
  beakFill.addColorStop(0, pal.beak);
  beakFill.addColorStop(0.62, pal.beakLight);
  beakFill.addColorStop(1, pal.belly);
  g.fillStyle = beakFill;
  g.fill();
  g.lineWidth = 2.5;
  g.strokeStyle = "rgba(25,67,82,0.24)";
  g.stroke();

  g.beginPath();
  g.moveTo(368, 4);
  g.quadraticCurveTo(326, 18, 270, 16);
  g.lineWidth = 3.5;
  g.strokeStyle = "rgba(24,57,72,0.62)";
  g.stroke();

  // Blowhole and the near eye, with a wet catchlight.
  ell(g, 130, -25, 12, 5, -0.1, "rgba(19,49,63,0.7)");
  ell(g, 190, 34, 23, 19, -0.14, "rgba(219,247,241,0.5)");
  ell(g, 190, 34, 15, 13, -0.14, pal.eye);
  ell(g, 185, 29, 5, 4, 0, pal.glint);
  g.beginPath();
  g.ellipse(190, 34, 23, 19, -0.14, 3.2, 6.1);
  g.lineWidth = 2;
  g.strokeStyle = "rgba(26,65,80,0.38)";
  g.stroke();

  // The near flipper sweeps out below the shoulder.
  drawPodFlipper(g, pal, 1, swim);

  // A small active glide accompanies the swim beat.
  g.beginPath();
  g.moveTo(42, -42);
  g.quadraticCurveTo(-48, -27, -112, 1);
  g.lineWidth = 4;
  g.strokeStyle = pal.bellySoft;
  g.globalAlpha = 0.5 + 0.3 * active;
  g.stroke();
  g.globalAlpha = 1;

  g.restore();
}

// ---------- hammerhead pass: two cephalofoil silhouettes in clear blue water ----------

interface HammerPalette {
  body: string;
  bodyMid: string;
  bodyLight: string;
  bodyDeep: string;
  belly: string;
  bellySoft: string;
  cape: string;
  fin: string;
  finLight: string;
  head: string;
  headLight: string;
  eye: string;
  glint: string;
  rim: string;
  mouth: string;
  wake: string;
}

const HAMMER_SHARK: HammerPalette = {
  body: "#425a63",
  bodyMid: "#526a6f",
  bodyLight: "#748c87",
  bodyDeep: "#1e343c",
  belly: "#d7e4da",
  bellySoft: "rgba(206,230,220,0.34)",
  cape: "#132a33",
  fin: "#2b4650",
  finLight: "#6f8e89",
  head: "#4a636a",
  headLight: "#6d8881",
  eye: "#041418",
  glint: "rgba(244,255,250,0.98)",
  rim: "rgba(206,244,234,0.6)",
  mouth: "rgba(18,36,42,0.85)",
  wake: "rgba(244,255,250,0.62)",
};

// The far animal is pushed toward the water's own blue and loses contrast, so
// it reads as depth without disappearing into the backdrop.
const HAMMER_SHARK_FAR: HammerPalette = {
  body: "#4a6d79",
  bodyMid: "#62868b",
  bodyLight: "#82a49f",
  bodyDeep: "#214a59",
  belly: "#b9d6ce",
  bellySoft: "rgba(190,220,212,0.24)",
  cape: "#1a4150",
  fin: "#356470",
  finLight: "#7fa8a7",
  head: "#4f757d",
  headLight: "#71958f",
  eye: "#062029",
  glint: "rgba(232,255,250,0.8)",
  rim: "rgba(200,240,235,0.36)",
  mouth: "rgba(16,48,56,0.62)",
  wake: "rgba(238,255,250,0.42)",
};

// Local px, facing +x. The width profile gives the broad shoulder, a deep
// chest, and a long taper into a thin caudal peduncle. The torso is lengthened
// and widened modestly; the head bar stays fixed and the pectoral is widened
// just enough to read cleanly against the larger body.
const HAMMER_BODY_SCALE = 1.3;
const HAMMER_BODY_WIDTH_SCALE = 1.35;

const HAMMER_BODY: SpinePoint[] = [
  [300, 0, 24],
  [276, 0, 42],
  [246, 0, 56],
  [210, 0, 62],
  [168, 0, 60],
  [116, 0, 54],
  [58, 0, 46],
  [-4, 0, 40],
  [-64, 0, 32],
  [-118, 0, 24],
  [-166, 0, 17],
  [-206, 0, 12],
  [-238, 0, 9],
];

// 30 tail beats per loop keeps the swish fast enough to read while the loop
// stays seamless; the two animals use different offsets so they never beat in
// unison.
function hammerBody(t: number, offset: number): SpinePoint[] {
  const swim = (TAU * 30 * t) / T + offset;
  const points = seaSpline(HAMMER_BODY, 110);
  return points.map(([x, y, r], i): SpinePoint => {
    const u = i / (points.length - 1);
    const tailWave = 54 * u * u * Math.sin(swim - u * 3);
    const torsoWave = 8 * u * Math.sin(swim + 0.8 - u * 1.5);
    return [x, y + tailWave + torsoWave, r];
  });
}

// The hammer: a broad transverse bar with a round eye lobe at each end and a
// shallow notch on the leading edge. The rear edge cuts back to a narrow neck
// so the T shape survives even at the background scale.
function hammerCephalofoil(g: CanvasRenderingContext2D) {
  g.beginPath();
  g.moveTo(296, -44);
  g.bezierCurveTo(316, -92, 332, -136, 340, -164);
  g.lineTo(344, -176);
  g.arc(376, -216, 56, Math.PI, TAU, false);
  g.bezierCurveTo(424, -180, 410, -112, 406, -56);
  g.quadraticCurveTo(396, -26, 380, -12);
  g.quadraticCurveTo(368, 0, 380, 12);
  g.quadraticCurveTo(396, 26, 406, 56);
  g.bezierCurveTo(410, 112, 424, 180, 428, 212);
  g.arc(376, 216, 56, 0, Math.PI, false);
  g.lineTo(340, 164);
  g.bezierCurveTo(332, 136, 316, 92, 296, 44);
  g.quadraticCurveTo(288, 0, 296, -44);
  g.closePath();
}

// Heterocercal caudal fin: a long swept upper lobe and a short lower lobe. The
// asymmetry is what separates a shark from a dolphin in silhouette.
function drawHammerTail(g: CanvasRenderingContext2D, pal: HammerPalette, swim: number) {
  const flap = Math.sin(swim + 0.35);
  g.save();
  g.rotate(0.13 * flap);
  const path = () => {
    g.beginPath();
    g.moveTo(8, -4);
    g.quadraticCurveTo(100, -46, 250, -196);
    g.quadraticCurveTo(196, -100, 112, -20);
    g.lineTo(54, -2);
    g.quadraticCurveTo(104, 34, 176, 92);
    g.quadraticCurveTo(108, 44, 8, 4);
    g.closePath();
  };
  path();
  const fill = g.createLinearGradient(50, -180, 220, 110);
  fill.addColorStop(0, pal.finLight);
  fill.addColorStop(0.32, pal.fin);
  fill.addColorStop(1, pal.bodyDeep);
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = 4.5;
  g.strokeStyle = pal.rim;
  g.stroke();

  // Pale trailing edges and the ridge along the upper lobe.
  g.beginPath();
  g.moveTo(38, 6);
  g.quadraticCurveTo(100, 38, 170, 86);
  g.lineWidth = 5;
  g.strokeStyle = pal.bellySoft;
  g.stroke();
  g.beginPath();
  g.moveTo(48, -10);
  g.quadraticCurveTo(150, -88, 238, -182);
  g.lineWidth = 3;
  g.strokeStyle = "rgba(222,246,236,0.42)";
  g.stroke();
  g.restore();
}

// A long, swept pectoral fin. side -1 is the far fin, +1 the near one.
function drawHammerPectoral(
  g: CanvasRenderingContext2D,
  pal: HammerPalette,
  side: -1 | 1,
  swing: number,
  anchorX: number = 200,
  anchorY: number = side * 46,
) {
  g.save();
  g.translate(anchorX, anchorY);
  g.rotate(side * (0.08 + 0.04 * swing));
  const path = () => {
    g.beginPath();
    g.moveTo(18, side * -14);
    g.bezierCurveTo(8, side * 40, -14, side * 100, -44, side * 156);
    g.bezierCurveTo(-92, side * 118, -70, side * 44, -34, side * 8);
    g.quadraticCurveTo(-8, side * -6, 18, side * -14);
    g.closePath();
  };
  path();
  const fill = g.createLinearGradient(0, side * 10, -130, side * 180);
  fill.addColorStop(0, pal.finLight);
  fill.addColorStop(0.16, pal.fin);
  fill.addColorStop(1, pal.bodyDeep);
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = pal.rim;
  g.stroke();
  g.beginPath();
  g.moveTo(-4, side * 16);
  g.quadraticCurveTo(-30, side * 62, -46, side * 144);
  g.lineWidth = 3;
  g.strokeStyle = pal.bellySoft;
  g.stroke();
  g.restore();
}

// Tall, falcate first dorsal: the second unmistakable shark mark after the
// head. Drawn last so it sits on top of the back in this from-above view.
function drawHammerDorsal(
  g: CanvasRenderingContext2D,
  pal: HammerPalette,
  baseX: number,
  baseY: number,
  sway: number,
) {
  g.save();
  g.translate(baseX, baseY);
  g.rotate(0.03 * sway);
  const path = () => {
    g.beginPath();
    g.moveTo(132, -34);
    g.quadraticCurveTo(92, -126, -8, -214);
    g.quadraticCurveTo(-2, -124, -52, -38);
    g.quadraticCurveTo(42, -26, 132, -34);
    g.closePath();
  };
  path();
  const fill = g.createLinearGradient(40, -190, -30, -20);
  fill.addColorStop(0, pal.finLight);
  fill.addColorStop(0.22, pal.fin);
  fill.addColorStop(1, pal.cape);
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = 4.5;
  g.strokeStyle = pal.rim;
  g.stroke();
  g.beginPath();
  g.moveTo(136, -38);
  g.quadraticCurveTo(74, -156, -8, -284);
  g.lineWidth = 3.2;
  g.strokeStyle = pal.bellySoft;
  g.stroke();
  g.restore();
}

// Drawn in local px facing +x, three-quarter from above. The wide head bar,
// eyes at the wing tips, tall dorsal, swept pectorals, and heterocercal tail
// all remain readable in the averaged cell pass.
function drawHammerShark(
  g: CanvasRenderingContext2D,
  t: number,
  pal: HammerPalette,
  phaseOffset = 0,
  detail = 1,
  bank = 0,
) {
  const swim = (TAU * 30 * t) / T + phaseOffset;
  const points = hammerBody(t, phaseOffset);
  const tail = points[points.length - 1];

  g.save();
  g.scale(1, 1 - 0.12 * Math.abs(bank));
  g.rotate(0.05 * bank);

  // Enlarge the torso around the neck. The head stays fixed; the tail, dorsal,
  // and pectorals are anchored to the broader body rather than stretched.
  const bodySpace = () => {
    g.translate(300, 0);
    g.scale(HAMMER_BODY_SCALE, HAMMER_BODY_WIDTH_SCALE);
    g.translate(-300, 0);
  };
  const bodyPoint = (x: number, y: number): [number, number] => [
    300 + (x - 300) * HAMMER_BODY_SCALE,
    y * HAMMER_BODY_WIDTH_SCALE,
  ];

  // Tail first: the same tail, at the scaled end of the longer torso.
  const scaledTail = bodyPoint(tail[0], tail[1]);
  g.save();
  g.translate(scaledTail[0], scaledTail[1]);
  g.rotate(Math.PI);
  drawHammerTail(g, pal, swim);
  g.restore();

  // The far pectoral peeks past the flank on the shadow side. The fin keeps
  // its original size; only its anchor follows the broader body.
  const farPec = bodyPoint(200, -46);
  g.save();
  g.globalAlpha = 0.8;
  drawHammerPectoral(g, pal, -1, swim, farPec[0], farPec[1]);
  g.restore();

  g.save();
  bodySpace();

  const outline = () => {
    g.beginPath();
    for (const [x, y, r] of points) {
      g.moveTo(x + r, y);
      g.arc(x, y, r, 0, TAU);
    }
  };

  // Sunlit rim, then the fusiform body.
  g.save();
  g.translate(-6, -8);
  outline();
  g.fillStyle = pal.rim;
  g.fill();
  g.restore();

  outline();
  const paint = g.createLinearGradient(60, -150, -40, 130);
  paint.addColorStop(0, pal.cape);
  paint.addColorStop(0.3, pal.bodyDeep);
  paint.addColorStop(0.56, pal.body);
  paint.addColorStop(0.82, pal.bodyMid);
  paint.addColorStop(1, pal.bodyLight);
  g.fillStyle = paint;
  g.fill();

  g.save();
  outline();
  g.clip();

  // A dark dorsal cape and a pale near flank.
  const cape = g.createLinearGradient(0, -130, 0, 24);
  cape.addColorStop(0, "rgba(18,45,54,0.5)");
  cape.addColorStop(1, "rgba(18,45,54,0)");
  g.fillStyle = cape;
  g.fillRect(-320, -180, 700, 290);

  const belly = g.createLinearGradient(0, 10, 0, 120);
  belly.addColorStop(0, "rgba(232,242,232,0)");
  belly.addColorStop(0.68, "rgba(232,242,232,0.08)");
  belly.addColorStop(1, "rgba(232,242,232,0.26)");
  g.fillStyle = belly;
  g.fillRect(-260, 0, 560, 150);

  // Lateral line and a few countershaded dapples.
  g.beginPath();
  g.moveTo(262, 22);
  g.quadraticCurveTo(120, 58, -30, 52);
  g.quadraticCurveTo(-150, 44, -232, 20);
  g.lineWidth = 3;
  g.strokeStyle = "rgba(224,245,235,0.16)";
  g.stroke();
  for (let k = 0; k < Math.round(22 * detail); k++) {
    const u = hash(k, 17, 13) * 0.74 + 0.12;
    const i = Math.min(points.length - 1, Math.round(u * (points.length - 1)));
    const [px, py, pr] = points[i];
    const angle = hash(k, 18, 15) * TAU;
    const dist = (hash(k, 19, 17) - 0.5) * pr * 1.2;
    ell(
      g,
      px + Math.cos(angle) * dist,
      py + Math.sin(angle) * dist * 0.7,
      7 + hash(k, 20, 19) * 16,
      2.5 + hash(k, 21, 21) * 5,
      angle,
      k % 3 ? "rgba(200,226,217,0.08)" : "rgba(16,54,62,0.12)",
    );
  }
  g.restore();
  g.restore();

  // Cephalofoil: a lit leading edge, a dark body-facing edge, and a bright
  // rim so the T survives the cell pass at every scale.
  hammerCephalofoil(g);
  const headFill = g.createLinearGradient(428, 0, 296, 0);
  headFill.addColorStop(0, pal.headLight);
  headFill.addColorStop(0.18, pal.head);
  headFill.addColorStop(0.72, pal.body);
  headFill.addColorStop(1, pal.bodyDeep);
  g.fillStyle = headFill;
  g.fill();
  g.lineWidth = 7;
  g.strokeStyle = pal.rim;
  g.stroke();
  g.lineWidth = 2.5;
  g.strokeStyle = "rgba(236,255,249,0.5)";
  g.stroke();

  // A dark seam under the rear edge separates the head bar from the body.
  g.beginPath();
  g.moveTo(300, -52);
  g.quadraticCurveTo(284, 0, 300, 52);
  g.lineWidth = 12;
  g.strokeStyle = "rgba(12,30,36,0.24)";
  g.stroke();

  // Pale leading edge follows the notch, and the mouth/nostrils sit on the
  // underside of the bar.
  g.beginPath();
  g.moveTo(424, -204);
  g.bezierCurveTo(420, -168, 410, -106, 404, -56);
  g.quadraticCurveTo(394, -24, 378, -10);
  g.quadraticCurveTo(366, 0, 378, 10);
  g.quadraticCurveTo(394, 24, 404, 56);
  g.bezierCurveTo(410, 106, 420, 168, 424, 204);
  g.lineWidth = 10;
  g.strokeStyle = "rgba(238,252,242,0.42)";
  g.stroke();
  ell(g, 372, 0, 30, 58, 0, "rgba(222,238,226,0.12)");
  g.beginPath();
  g.moveTo(358, -32);
  g.quadraticCurveTo(388, -10, 396, 0);
  g.quadraticCurveTo(388, 10, 358, 32);
  g.lineWidth = 5.5;
  g.strokeStyle = pal.mouth;
  g.stroke();
  for (let k = 0; k < 5; k++) {
    const u = 0.16 + k * 0.17;
    const mx = 360 + u * 34;
    const my = -28 + u * 28;
    ell(g, mx, my, 4, 2, 0.4, "rgba(26,48,50,0.45)");
  }

  // Eyes sit in the rounded outer lobes, with a pale socket and a catchlight.
  for (const side of [-1, 1] as const) {
    const ex = 378;
    const ey = side * 216;
    ell(g, ex, ey, 29, 26, side * 0.1, "rgba(234,253,246,0.7)");
    ell(g, ex, ey, 27, 24, side * 0.1, "rgba(12,30,36,0.34)");
    ell(g, ex, ey, 18, 16, side * 0.1, pal.eye);
    ell(g, ex - 4, ey - 4 * side, 6, 5, 0, pal.glint);
  }
  // Nostrils tucked in from the eye lobes.
  for (const side of [-1, 1] as const) {
    ell(g, 400, side * 48, 5, 2.6, side * 0.2, "rgba(24,46,50,0.6)");
  }

  // Five gill slits clearly on the flank behind the head.
  g.save();
  bodySpace();
  g.save();
  g.globalAlpha = 0.8;
  for (let k = 0; k < 5; k++) {
    g.beginPath();
    g.moveTo(250 - k * 12, 26);
    g.quadraticCurveTo(240 - k * 12, 44, 246 - k * 12, 64);
    g.lineWidth = 3;
    g.strokeStyle = "rgba(12,32,38,0.78)";
    g.stroke();
  }
  g.restore();
  g.restore();

  // Tall dorsal fin sits on top of the broader back. Its shape is unchanged;
  // only the anchor follows the scaled body.
  const finIndex = Math.round(points.length * 0.4);
  const finPoint = points[finIndex];
  const finAnchor = bodyPoint(finPoint[0], finPoint[1] - finPoint[2] * 0.5);
  drawHammerDorsal(g, pal, finAnchor[0], finAnchor[1], swim);

  // The near pectoral sweeps out below the shoulder at the scaled anchor.
  const nearPec = bodyPoint(200, 46);
  drawHammerPectoral(g, pal, 1, swim, nearPec[0], nearPec[1]);

  g.restore();
}

// Two closed, tilted orbits: the large animal sweeps low through the frame at
// a three-quarter angle while the smaller one crosses the upper water the other
// way. The tilt keeps the cephalofoil from being seen edge-on for the whole loop.
const hammerOrbit = (
  t: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angle: number,
  phase: number,
): [number, number] => {
  const p = w * t + phase;
  const c = Math.cos(p);
  const s = Math.sin(p);
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  return [cx + rx * c * ca - ry * s * sa, cy + rx * c * sa + ry * s * ca];
};

const HAMMER_FORE: PointPath = (t) => hammerOrbit(t, 972, 1320, 540, 60, 0.28, 0.55);

const HAMMER_FAR: PointPath = (t) => hammerOrbit(t, 980, 460, 420, 70, -0.5, 3.9);

interface HammerCamera {
  map: (x: number, y: number) => [number, number];
  zoom: number;
  narrow: boolean;
  wide: boolean;
}

function hammerCamera(stageAspect: number): HammerCamera {
  if (stageAspect < 0.85) {
    // Portrait stages crop the wide canvas to a narrow centre band. Pull the
    // animals toward the middle and shrink them so the head bar, body, and
    // heterocercal tail all stay inside the crop in every heading.
    return {
      map: (x, y) => [W / 2 + (x - W / 2) * 0.52, H / 2 + (y - H / 2) * 1.02],
      zoom: 0.72,
      narrow: true,
      wide: false,
    };
  }
  if (stageAspect > 1.3) {
    // The 16:10 embed card crops top and bottom; compress the vertical lanes.
    return {
      map: (x, y) => [x, H / 2 + (y - H / 2) * 0.78],
      zoom: 0.82,
      narrow: false,
      wide: true,
    };
  }
  return {
    map: (x, y) => [x, y],
    zoom: 1,
    narrow: false,
    wide: false,
  };
}

function hammerPose(path: PointPath, t: number, camera: HammerCamera): [number, number, number] {
  const [x0, y0] = path(t);
  const [x1, y1] = path(t + 0.02);
  const [x, y] = camera.map(x0, y0);
  const [x2, y2] = camera.map(x1, y1);
  return [x, y, Math.atan2(y2 - y, x2 - x)];
}

const PILOT_FISH: Array<[number, number, number]> = [
  [250, -120, 0.62],
  [300, -158, 0.54],
  [350, -196, 0.46],
  [214, -176, 0.66],
  [264, -214, 0.54],
  [314, -252, 0.44],
  [178, -228, 0.56],
  [228, -266, 0.46],
  [282, 116, 0.58],
  [330, 156, 0.48],
  [240, 158, 0.54],
  [356, -108, 0.5],
];

const HAMMER_PILOT: TangPalette = {
  fin: "#5f8794",
  body: "#8fb6c0",
  head: "#bdd9dc",
  rim: "rgba(232,252,250,0.3)",
};

const HAMMER_RAMP = "@#%&*+~=:;·";
const HAMMER_EDGE = "·'.,:;~";

const POD_RAMP = "@#%&*+~=:;·";
const POD_EDGE = "·'.,:;~";

// Three closed circuits. Each returns to its start in 24.5 s; the differing
// radii, directions, and second harmonics make the pod cross and separate.
const POD_FORE: PointPath = (t) => [
  962 + 560 * Math.cos(w * t + 0.35) + 80 * Math.sin(2 * w * t + 1),
  840 + 300 * Math.sin(w * t + 0.35) + 60 * Math.sin(2 * w * t + 1.1),
];

const POD_SURFACE: PointPath = (t) => [
  1070 + 430 * Math.cos(-w * t + 2.8),
  470 + 120 * Math.sin(-w * t + 2.8) + 16 * Math.sin(2 * w * t + 0.5),
];

const POD_DEEP: PointPath = (t) => [
  800 + 330 * Math.cos(w * t + 2.1) + 90 * Math.sin(2 * w * t + 0.2),
  1320 + 90 * Math.sin(w * t + 2.1) + 14 * Math.sin(2 * w * t + 1.6),
];

interface PodCamera {
  map: (x: number, y: number) => [number, number];
  zoom: number;
  narrow: boolean;
  wide: boolean;
}

function podCamera(stageAspect: number): PodCamera {
  if (stageAspect < 0.85) {
    // Portrait stages crop to the middle third of the canvas. Pull the pod in
    // horizontally so all three bodies and their flukes stay inside the crop.
    return {
      map: (x, y) => [W / 2 + (x - W / 2) * 0.46, H / 2 + (y - H / 2) * 1.08],
      zoom: 0.52,
      narrow: true,
      wide: false,
    };
  }
  if (stageAspect > 1.3) {
    // The 16:10 embed card crops the top and bottom, so compress the vertical
    // lanes and keep the surface animal away from the frame edge.
    return {
      map: (x, y) => [x, H / 2 + (y - H / 2) * 0.74],
      zoom: 0.78,
      narrow: false,
      wide: true,
    };
  }
  return {
    map: (x, y) => [x, y],
    zoom: 1,
    narrow: false,
    wide: false,
  };
}

function podPose(path: PointPath, t: number, camera: PodCamera): [number, number, number] {
  const [x0, y0] = path(t);
  const [x1, y1] = path(t + 0.02);
  const [x, y] = camera.map(x0, y0);
  const [x2, y2] = camera.map(x1, y1);
  return [x, y, Math.atan2(y2 - y, x2 - x)];
}

function drawDolphinBackdrop(g: CanvasRenderingContext2D) {
  // Sun shafts raking down from the surface.
  g.save();
  g.globalCompositeOperation = "screen";
  for (let k = 0; k < 6; k++) {
    const off = -W * 0.22 + k * W * 0.23 + (k % 2 ? -42 : 34);
    const beam = g.createLinearGradient(off, -H * 0.14, off + W * 0.38, H * 1.08);
    beam.addColorStop(0, "rgba(244,255,250,0)");
    beam.addColorStop(0.3, `rgba(238,255,248,${0.12 + (k % 3) * 0.025})`);
    beam.addColorStop(0.62, "rgba(216,252,245,0.07)");
    beam.addColorStop(1, "rgba(204,248,240,0)");
    g.fillStyle = beam;
    g.fillRect(0, 0, W, H);
  }
  g.restore();

  // Open water falls away to a deep blue floor.
  const depth = g.createLinearGradient(0, H * 0.44, 0, H);
  depth.addColorStop(0, "rgba(3,58,108,0)");
  depth.addColorStop(0.62, "rgba(4,50,96,0.2)");
  depth.addColorStop(1, "rgba(2,28,70,0.5)");
  g.fillStyle = depth;
  g.fillRect(0, H * 0.44, W, H * 0.56);

  // Distant reef haze: soft shelves and a few far coral crowns in blue.
  for (let k = 0; k < 10; k++) {
    const x = hash(k, 91, 5) * W;
    const y = H * 0.82 + hash(k, 92, 7) * H * 0.2;
    ell(
      g,
      x,
      y,
      140 + hash(k, 93, 9) * 330,
      34 + hash(k, 94, 11) * 100,
      hash(k, 95, 13) * 0.4,
      k % 2 ? "rgba(8,92,116,0.14)" : "rgba(5,60,104,0.18)",
    );
  }
  for (let k = 0; k < 6; k++) {
    const x = hash(k, 96, 3) * W;
    const y = H * 0.88 + hash(k, 97, 5) * H * 0.12;
    const r = 40 + hash(k, 98, 7) * 80;
    for (let n = 0; n < 5; n++) {
      const a = (n / 5) * TAU + hash(k, 99, 9);
      ell(
        g,
        x + Math.cos(a) * r * 0.42,
        y + Math.sin(a) * r * 0.2,
        r * 0.34,
        r * 0.16,
        a,
        "rgba(20,112,120,0.1)",
      );
    }
  }

  // A pale surface shelf and loose bokeh discs lift the top of the frame.
  const surface = g.createLinearGradient(0, 0, 0, H * 0.24);
  surface.addColorStop(0, "rgba(242,255,252,0.38)");
  surface.addColorStop(0.55, "rgba(230,255,249,0.12)");
  surface.addColorStop(1, "rgba(230,255,249,0)");
  g.fillStyle = surface;
  g.fillRect(0, 0, W, H * 0.24);

  g.save();
  g.globalCompositeOperation = "screen";
  for (let k = 0; k < 12; k++) {
    const x = hash(k, 101, 7) * W;
    const y = hash(k, 102, 9) * H * 0.46;
    const r = 38 + hash(k, 103, 11) * 130;
    const c = k % 3 === 0 ? "255,247,208" : "196,255,244";
    const disc = g.createRadialGradient(x, y, r * 0.2, x, y, r);
    disc.addColorStop(0, `rgba(${c},0.035)`);
    disc.addColorStop(0.72, `rgba(${c},0.06)`);
    disc.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = disc;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }
  g.restore();

  const vignette = g.createRadialGradient(W * 0.5, H * 0.44, W * 0.34, W * 0.5, H * 0.44, W * 0.86);
  vignette.addColorStop(0, "rgba(0,28,42,0)");
  vignette.addColorStop(0.74, "rgba(0,28,42,0.035)");
  vignette.addColorStop(1, "rgba(0,20,38,0.22)");
  g.fillStyle = vignette;
  g.fillRect(0, 0, W, H);
}

// Clear blue water with hard sun shafts raking through it, a deep blue floor,
// and a distant reef haze. Kept low-contrast so the two sharks own the frame.
function drawHammerBackdrop(g: CanvasRenderingContext2D) {
  g.save();
  g.globalCompositeOperation = "screen";
  for (let k = 0; k < 7; k++) {
    const off = -W * 0.2 + k * W * 0.2 + (k % 2 ? -48 : 40);
    const beam = g.createLinearGradient(off, -H * 0.18, off + W * 0.34, H * 1.06);
    beam.addColorStop(0, "rgba(248,255,252,0)");
    beam.addColorStop(0.26, `rgba(240,255,250,${0.14 + (k % 3) * 0.03})`);
    beam.addColorStop(0.58, "rgba(220,252,246,0.075)");
    beam.addColorStop(1, "rgba(206,246,240,0)");
    g.fillStyle = beam;
    g.fillRect(0, 0, W, H);
  }
  g.restore();

  // The water column falls away into reef blue.
  const depth = g.createLinearGradient(0, H * 0.4, 0, H);
  depth.addColorStop(0, "rgba(3,62,112,0)");
  depth.addColorStop(0.56, "rgba(4,54,100,0.18)");
  depth.addColorStop(1, "rgba(2,26,68,0.52)");
  g.fillStyle = depth;
  g.fillRect(0, H * 0.4, W, H * 0.6);

  // Distant reef haze: soft blue shelves with a few far coral crowns.
  for (let k = 0; k < 12; k++) {
    const x = hash(k, 141, 5) * W;
    const y = H * 0.79 + hash(k, 142, 7) * H * 0.22;
    ell(
      g,
      x,
      y,
      170 + hash(k, 143, 9) * 360,
      30 + hash(k, 144, 11) * 96,
      hash(k, 145, 13) * 0.35,
      k % 2 ? "rgba(7,88,116,0.12)" : "rgba(5,58,104,0.16)",
    );
  }
  for (let k = 0; k < 7; k++) {
    const x = hash(k, 146, 3) * W;
    const y = H * 0.9 + hash(k, 147, 5) * H * 0.1;
    const r = 46 + hash(k, 148, 7) * 92;
    for (let n = 0; n < 6; n++) {
      const a = (n / 6) * TAU + hash(k, 149, 9);
      ell(
        g,
        x + Math.cos(a) * r * 0.4,
        y + Math.sin(a) * r * 0.18,
        r * 0.3,
        r * 0.13,
        a,
        "rgba(18,110,120,0.09)",
      );
    }
  }

  // Sunlit surface shelf and a handful of bokeh discs.
  const surface = g.createLinearGradient(0, 0, 0, H * 0.22);
  surface.addColorStop(0, "rgba(244,255,252,0.4)");
  surface.addColorStop(0.52, "rgba(232,255,250,0.13)");
  surface.addColorStop(1, "rgba(230,255,249,0)");
  g.fillStyle = surface;
  g.fillRect(0, 0, W, H * 0.22);

  g.save();
  g.globalCompositeOperation = "screen";
  for (let k = 0; k < 14; k++) {
    const x = hash(k, 151, 7) * W;
    const y = hash(k, 152, 9) * H * 0.42;
    const r = 34 + hash(k, 153, 11) * 120;
    const c = k % 3 === 0 ? "255,248,214" : "198,255,246";
    const disc = g.createRadialGradient(x, y, r * 0.2, x, y, r);
    disc.addColorStop(0, `rgba(${c},0.03)`);
    disc.addColorStop(0.7, `rgba(${c},0.055)`);
    disc.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = disc;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }
  g.restore();

  const vignette = g.createRadialGradient(W * 0.5, H * 0.44, W * 0.32, W * 0.5, H * 0.44, W * 0.88);
  vignette.addColorStop(0, "rgba(0,26,44,0)");
  vignette.addColorStop(0.72, "rgba(0,26,44,0.04)");
  vignette.addColorStop(1, "rgba(0,18,40,0.26)");
  g.fillStyle = vignette;
  g.fillRect(0, 0, W, H);
}

// Tang school: a shallow, sunlit Hawaiian reef. Coral heads frame the edges
// and the lower third, with a sandy channel through the middle so the school
// always has clear water to cross.
const TANG_CORALS: Array<[number, number, number, number]> = [
  [240, 1440, 196, 0],
  [548, 1642, 142, 1],
  [1772, 1478, 216, 2],
  [1642, 332, 132, 3],
  [112, 642, 124, 4],
  [1118, 1716, 168, 5],
  [1878, 916, 108, 6],
];

const TANG_CORAL_PALS: Array<[string, string, string, string]> = [
  ["#e9815c", "#c95862", "#f2b777", "#8d3f4f"],
  ["#d98c63", "#b95468", "#e8ab7b", "#7c3d58"],
  ["#d06f8d", "#97527e", "#e9a6a4", "#68406d"],
  ["#cc8b53", "#a65a4b", "#e6b47a", "#75464a"],
  ["#b97878", "#8f5264", "#dca48a", "#5e3a50"],
  ["#c9925d", "#9b624d", "#e4b47b", "#6d4248"],
  ["#c07a89", "#8e5372", "#e0a397", "#603c5b"],
];

function drawTangBackdrop(g: CanvasRenderingContext2D) {
  // Shafts of late-morning sun raking down from the upper left.
  g.save();
  g.globalCompositeOperation = "screen";
  for (let k = 0; k < 6; k++) {
    const off = -W * 0.24 + k * W * 0.24 + (k % 2 ? -38 : 30);
    const beam = g.createLinearGradient(off, -H * 0.16, off + W * 0.34, H * 1.08);
    beam.addColorStop(0, "rgba(255,255,224,0)");
    beam.addColorStop(0.28, `rgba(255,253,214,${0.1 + (k % 3) * 0.025})`);
    beam.addColorStop(0.58, "rgba(224,255,238,0.055)");
    beam.addColorStop(1, "rgba(206,250,236,0)");
    g.fillStyle = beam;
    g.fillRect(0, 0, W, H);
  }
  g.restore();

  // Shallow sand channel. Barely-there warm patches keep the middle open.
  for (let k = 0; k < 9; k++) {
    const x = 160 + hash(k, 201, 5) * (W - 320);
    const y = H * 0.28 + hash(k, 202, 7) * H * 0.62;
    ell(
      g,
      x,
      y,
      150 + hash(k, 203, 9) * 330,
      54 + hash(k, 204, 11) * 140,
      hash(k, 205, 13) * 0.8 - 0.4,
      k % 3 === 0 ? "rgba(255,248,198,0.12)" : "rgba(214,250,218,0.08)",
    );
  }

  // Coral heads: clustered lobes with a dark base, warm branches, and a few
  // pale tips. They are deliberately low-contrast so the fish stay legible.
  for (let c = 0; c < TANG_CORALS.length; c++) {
    const [cx, cy, r, tone] = TANG_CORALS[c];
    const [light, mid, warm, dark] = TANG_CORAL_PALS[tone];

    // Shadow and a soft deep-water halo under each head.
    ell(g, cx + 18, cy + r * 0.24, r * 1.02, r * 0.46, 0, "rgba(4,58,66,0.2)");
    ell(g, cx, cy + r * 0.1, r * 0.92, r * 0.5, 0, dark);

    for (let k = 0; k < 11; k++) {
      const a = hash(cx, cy, k) * TAU;
      const d = hash(cy, cx, k) * r * 0.62;
      const px = cx + Math.cos(a) * d;
      const py = cy + Math.sin(a) * d * 0.46;
      ell(
        g,
        px,
        py,
        r * (0.2 + 0.22 * hash(k, c, 3)),
        r * (0.13 + 0.17 * hash(c, k, 5)),
        a * 0.7,
        k % 3 === 0 ? light : k % 3 === 1 ? mid : warm,
      );
    }

    // A ring of blunt branches, like finger coral.
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * TAU + hash(c, k, 21) * 0.36;
      const bx = cx + Math.cos(a) * r * 0.44;
      const by = cy + Math.sin(a) * r * 0.22 + 6;
      g.save();
      g.translate(bx, by);
      g.rotate(a * 0.64 - Math.PI / 2);
      ell(g, 0, -r * 0.12, r * 0.075, r * 0.25, 0, k % 2 ? mid : warm);
      ell(g, 0, -r * 0.26, r * 0.05, r * 0.1, 0, light);
      g.restore();
    }

    ell(g, cx - r * 0.2, cy - r * 0.14, r * 0.16, r * 0.09, -0.3, "rgba(255,255,236,0.16)");

    // Static ASCII texture over the coral: the same cell language as the rest
    // of the lagoon, baked into the background once per look.
    g.save();
    g.font = '500 15px "Geist Mono", ui-monospace, monospace';
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (let j = 0; j < ROWS; j += 2) {
      for (let i = 0; i < COLS; i += 2) {
        const x = i * CW + CW / 2;
        const y = j * CH + CH / 2;
        const nx = (x - cx) / (r * 0.96);
        const ny = (y - cy) / (r * 0.58);
        if (nx * nx + ny * ny > 1) continue;
        const h = hash(i, j, c + 31);
        if (h < 0.3) continue;
        g.fillStyle = `rgba(255,241,206,${0.13 + h * 0.24})`;
        g.fillText(h > 0.86 ? ":" : h > 0.62 ? "·" : ".", x, y);
      }
    }
    g.restore();
  }

  // Deep water at the lower right and a pale surface shelf at the top.
  const depth = g.createLinearGradient(0, H * 0.42, 0, H);
  depth.addColorStop(0, "rgba(3,66,104,0)");
  depth.addColorStop(0.6, "rgba(4,62,102,0.14)");
  depth.addColorStop(1, "rgba(2,36,82,0.4)");
  g.fillStyle = depth;
  g.fillRect(0, H * 0.42, W, H * 0.58);

  const surface = g.createLinearGradient(0, 0, 0, H * 0.2);
  surface.addColorStop(0, "rgba(250,255,232,0.34)");
  surface.addColorStop(0.54, "rgba(236,255,228,0.1)");
  surface.addColorStop(1, "rgba(232,255,232,0)");
  g.fillStyle = surface;
  g.fillRect(0, 0, W, H * 0.2);

  // Loose reef bokeh, soft and warm.
  g.save();
  g.globalCompositeOperation = "screen";
  for (let k = 0; k < 11; k++) {
    const x = hash(k, 221, 7) * W;
    const y = hash(k, 222, 9) * H * 0.52;
    const r = 34 + hash(k, 223, 11) * 118;
    const c = k % 3 === 0 ? "255,247,204" : "190,255,232";
    const disc = g.createRadialGradient(x, y, r * 0.18, x, y, r);
    disc.addColorStop(0, `rgba(${c},0.035)`);
    disc.addColorStop(0.7, `rgba(${c},0.06)`);
    disc.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = disc;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }
  g.restore();

  const vignette = g.createRadialGradient(W * 0.52, H * 0.44, W * 0.3, W * 0.52, H * 0.44, W * 0.9);
  vignette.addColorStop(0, "rgba(0,30,38,0)");
  vignette.addColorStop(0.72, "rgba(0,30,38,0.03)");
  vignette.addColorStop(1, "rgba(0,22,38,0.22)");
  g.fillStyle = vignette;
  g.fillRect(0, 0, W, H);
}

const P: Record<string, PointPath> = {
  turtleA: (t) => [
    972 + 1080 * Math.cos(w * t + 0.3),
    860 + 640 * Math.sin(w * t + 0.3) + 140 * Math.sin(2 * w * t),
  ],
  turtleB: (t) => [900 + 700 * Math.sin(-w * t + 1), 880 - 1080 * Math.cos(-w * t + 1)],
  turtleC: (t) => [972 + 1150 * Math.sin(w * t + 4), 900 + 560 * Math.sin(2 * w * t + 4.6)],
  manta: (t) => [972 + 1380 * Math.cos(-w * t + 3.6), 820 + 900 * Math.sin(-w * t + 3.6)],
  dolphin: (t) => [
    972 + 1350 * Math.cos(2 * w * t + 0.8),
    900 + 950 * Math.sin(2 * w * t + 0.8) + 160 * Math.sin(4 * w * t),
  ],
  school: (t) => [972 + 1150 * Math.sin(2 * w * t + 5), 880 + 800 * Math.sin(3 * w * t + 1)],
  whale: (t) => [972 + 1900 * Math.cos(w * t + 2.4), 1350 + 380 * Math.sin(w * t + 2.4)],
};

// Manta flyby: a wide, slow circuit that keeps the animal near the lens.
const P_MANTA: PointPath = (t) => [
  972 + 760 * Math.cos(w * t + 0.24),
  1110 + 340 * Math.sin(w * t + 0.24) + 66 * Math.sin(2 * w * t + 1.57),
];

// A second, smaller manta on the opposite circuit. Different heading, height,
// and flap phase so the two animals pass rather than follow each other.
const P_MANTA_FAR: PointPath = (t) => [
  1000 + 500 * Math.cos(-w * t + 3.7),
  610 + 300 * Math.sin(-w * t + 3.7) + 44 * Math.sin(2 * w * t + 0.4),
];

// Night keeps the same curves but tighter orbits so the larger cast stays in
// frame instead of only clipping through the edges.
const P_NIGHT: Record<string, PointPath> = {
  manta: (t) => [972 + 600 * Math.cos(-w * t + 3.6), 880 + 460 * Math.sin(-w * t + 3.6)],
  dolphin: (t) => [
    972 + 760 * Math.cos(2 * w * t + 0.8),
    880 + 600 * Math.sin(2 * w * t + 0.8) + 90 * Math.sin(4 * w * t),
  ],
  whale: (t) => [972 + 600 * Math.cos(w * t + 2.4), 1260 + 280 * Math.sin(w * t + 2.4)],
};

const pose = (fn: PointPath, t: number): [number, number, number] => {
  const [x, y] = fn(t);
  const [x2, y2] = fn(t + 0.02);
  return [x, y, Math.atan2(y2 - y, x2 - x)];
};

const FISH: Array<[number, number]> = [
  [0, 0],
  [-120, -70],
  [-120, 75],
  [-240, -10],
  [-230, -140],
  [-235, 130],
  [-360, -75],
  [-355, 70],
  [-470, 5],
  [-480, -150],
  [-470, 150],
];

const FLOWERS: Array<[string, number, number, number, number]> = [
  ["h", 0.0, 260, 1.0, 1],
  ["p", 0.22, 1240, 0.9, -1],
  ["h", 0.47, 640, 0.8, -1],
  ["p", 0.63, 1560, 1.1, 1],
  ["p", 0.86, 120, 0.8, 1],
];

const RAMP = "8%XSSt%t;:";
const EDGE = "',.o:;";
const SPRINK = ["#ff5fa2", "#16c79a", "#8b6cff", "#ffb000"];
const NIGHT_RAMP = "·.,:;~+*#";
const NIGHT_EDGE = "·.,:;";
const NIGHT_SPRINK = ["#7ef7ff", "#3ee0d0", "#9a8cff", "#d8f8ff"];

// Macro uses a denser ramp: the fill carries the hue, the glyph carries the form.
const MACRO_RAMP = "@#%*+~:;,.·";
const MACRO_EDGE = "'.,:;";

// Manta keeps the fill solid so the silhouette survives, with quiet texture.
const MANTA_RAMP = "·:;~+*";
const MANTA_EDGE = "·:;'";

const REEF_GLINTS: Array<[number, number]> = [
  [300, 1460],
  [1520, 1560],
  [1900, 420],
  [220, 300],
  [560, 1580],
  [1740, 1480],
  [140, 1600],
  [1800, 220],
  [80, 380],
  [1700, 1650],
  [40, 900],
  [1960, 980],
  [700, 1180],
  [1220, 420],
];

// Dense mixed glyphs for the seahorse's body, softer marks at the rim.
const SEA_RAMP = "@#%&*+~=:;·";
const SEA_EDGE = "·'.,:;~";

interface SeaBlade {
  x: number;
  h: number;
  lean: number;
  phase: number;
  depth: number;
  width: number;
  short: boolean;
  tone: number;
}

// A band of seagrass across the floor: clumps of ribbon blades behind the
// animal, a dense short understorey at the sand line, and a few near blades
// that cross in front of it.
const SEA_BLADES: SeaBlade[] = (() => {
  const blades: SeaBlade[] = [];
  for (let c = 0; c < 12; c++) {
    const cx = ((c + 0.5) / 12) * W + (hash(c, 31, 5) - 0.5) * 190;
    const count = 3 + ((hash(c, 32, 7) * 3) | 0);
    for (let k = 0; k < count; k++) {
      const n = c * 11 + k;
      blades.push({
        x: cx + (hash(n, 41, 5) - 0.5) * 170,
        h: 280 + hash(n, 42, 7) * 900,
        lean: (hash(n, 43, 9) - 0.5) * 420,
        phase: hash(n, 44, 11) * TAU,
        depth: hash(n, 45, 13),
        width: hash(n, 46, 15) > 0.28 ? 2 : 1,
        short: false,
        tone: hash(n, 47, 17),
      });
    }
  }
  for (let k = 0; k < 40; k++) {
    blades.push({
      x: ((k + 0.5) / 40) * W + (hash(k, 51, 5) - 0.5) * 80,
      h: 80 + hash(k, 52, 7) * 290,
      lean: (hash(k, 53, 9) - 0.5) * 140,
      phase: hash(k, 54, 11) * TAU,
      depth: hash(k, 55, 13),
      width: 2 + (hash(k, 57, 19) > 0.6 ? 1 : 0),
      short: true,
      tone: hash(k, 56, 15),
    });
  }
  // Mid-height blades in the central band: the mobile crop is much narrower
  // than the stage, so the bed needs life inside the portrait, not just at
  // the desktop edges.
  for (let k = 0; k < 14; k++) {
    blades.push({
      x: 600 + hash(k, 61, 5) * 740,
      h: 260 + hash(k, 62, 7) * 640,
      lean: (hash(k, 63, 9) - 0.5) * 240,
      phase: hash(k, 64, 11) * TAU,
      depth: 0.2 + hash(k, 65, 13) * 0.7,
      width: hash(k, 66, 15) > 0.5 ? 2 : 1,
      short: false,
      tone: hash(k, 67, 17),
    });
  }
  // A few very tall blades frame the portrait at both edges of the stage.
  for (let k = 0; k < 8; k++) {
    const left = k % 2 === 0;
    const lane = k < 4 ? 0 : k < 6 ? 1 : 2;
    const inset = lane === 0 ? 40 + hash(k, 71, 5) * 220 : 470 + hash(k, 71, 5) * 150;
    blades.push({
      x: left ? inset : W - inset,
      h: 900 + hash(k, 73, 9) * 580,
      lean: (left ? 1 : -1) * (50 + hash(k, 74, 11) * 120),
      phase: hash(k, 75, 13) * TAU,
      depth: 0.55 + hash(k, 76, 15) * 0.45,
      width: 1,
      short: false,
      tone: hash(k, 77, 17),
    });
  }
  return blades;
})();

// ---------- tang school ----------

interface SchoolTangPalette {
  fin: string;
  finLine: string;
  body: string;
  back: string;
  belly: string;
  snout: string;
  eye: string;
  eyeRing: string;
  glint: string;
  edge: string;
  gill: string;
  mouth: string;
  spine: string;
}

const TANG_YELLOW: SchoolTangPalette = {
  fin: "rgba(255,222,92,0.36)",
  finLine: "rgba(255,244,170,0.46)",
  body: "#ffd21f",
  back: "#eaa600",
  belly: "#ffe982",
  snout: "#ffe98c",
  eye: "#211806",
  eyeRing: "rgba(255,238,132,0.5)",
  glint: "#fffbe2",
  edge: "rgba(255,243,158,0.52)",
  gill: "rgba(206,137,0,0.36)",
  mouth: "rgba(72,42,0,0.62)",
  spine: "rgba(255,249,218,0.74)",
};

const TANG_GOLD: SchoolTangPalette = {
  fin: "rgba(255,210,74,0.35)",
  finLine: "rgba(255,235,152,0.44)",
  body: "#ffbd12",
  back: "#db7b00",
  belly: "#ffd766",
  snout: "#ffe07e",
  eye: "#201505",
  eyeRing: "rgba(255,226,112,0.5)",
  glint: "#fff8d8",
  edge: "rgba(255,233,142,0.5)",
  gill: "rgba(190,116,0,0.36)",
  mouth: "rgba(66,36,0,0.62)",
  spine: "rgba(255,246,210,0.7)",
};

const TANG_LEMON: SchoolTangPalette = {
  fin: "rgba(255,236,126,0.36)",
  finLine: "rgba(255,250,196,0.46)",
  body: "#ffe85c",
  back: "#f2bb17",
  belly: "#fff6bf",
  snout: "#fff4b4",
  eye: "#251c08",
  eyeRing: "rgba(255,248,178,0.5)",
  glint: "#fffef0",
  edge: "rgba(255,249,190,0.54)",
  gill: "rgba(216,158,24,0.34)",
  mouth: "rgba(78,48,4,0.6)",
  spine: "rgba(255,252,226,0.78)",
};

const TANG_PALETTES = [TANG_YELLOW, TANG_GOLD, TANG_LEMON];

// Drawn in local px facing +x. A deep, disc-shaped body with a pointed snout,
// a pale caudal spine, translucent dorsal/anal/tail fins, and a dark eye.
function drawSchoolTang(
  g: CanvasRenderingContext2D,
  t: number,
  ph: number,
  pal: SchoolTangPalette,
  rich = false,
) {
  const p = w * t + ph;
  const bend = Math.sin(2 * p + 0.4);
  const tail = Math.sin(4 * p + 0.7);
  const flutter = Math.sin(5 * p + 1.2);
  const finSpread = 0.94 + 0.06 * Math.sin(3 * p + 1.6);

  g.save();
  g.rotate(0.035 * bend + 0.016 * Math.sin(3 * p + 0.8));

  // Tail fin: broad, forked, and translucent enough that the reef shows through.
  g.save();
  g.translate(-86, 0);
  g.rotate(0.2 * tail);
  g.beginPath();
  g.moveTo(0, -9);
  g.bezierCurveTo(-40, -54, -82, -94, -130, -108);
  g.bezierCurveTo(-106, -66, -101, -28, -101, 0);
  g.bezierCurveTo(-101, 28, -106, 66, -130, 108);
  g.bezierCurveTo(-82, 94, -40, 54, 0, 9);
  g.closePath();
  g.fillStyle = pal.fin;
  g.fill();
  g.strokeStyle = pal.finLine;
  g.lineWidth = 2.2;
  g.globalAlpha = 0.55;
  for (let k = 0; k < 6; k++) {
    const u = k / 5;
    g.beginPath();
    g.moveTo(-8, (u - 0.5) * 12);
    g.lineTo(-124, (u - 0.5) * 196);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.restore();

  // Dorsal and anal fins, drawn behind the body.
  for (const side of [-1, 1] as const) {
    g.beginPath();
    g.moveTo(72, side * 54);
    g.bezierCurveTo(38, side * 96, -8, side * 126, -66, side * 110);
    g.quadraticCurveTo(-98, side * 96, -104, side * 56);
    g.quadraticCurveTo(-66, side * 90, -18, side * 84);
    g.bezierCurveTo(28, side * 78, 52, side * 68, 72, side * 54);
    g.closePath();
    g.fillStyle = pal.fin;
    g.fill();

    g.strokeStyle = pal.finLine;
    g.lineWidth = 2;
    g.globalAlpha = 0.48;
    for (let k = 0; k < 6; k++) {
      const u = k / 5;
      const bx = 60 - u * 154;
      const ex = bx - 12 - u * 6;
      const ey = side * (102 + 15 * Math.sin(u * Math.PI));
      g.beginPath();
      g.moveTo(bx, side * 60);
      g.lineTo(ex, ey);
      g.stroke();
    }
    g.globalAlpha = 1;
  }

  // Body disc with a pointed snout.
  const body = () => {
    g.beginPath();
    g.moveTo(124, 0);
    g.bezierCurveTo(116, -34, 104, -52, 74, -66);
    g.bezierCurveTo(36, -88, -28, -92, -86, -52);
    g.quadraticCurveTo(-103, -20, -103, 0);
    g.quadraticCurveTo(-103, 20, -86, 52);
    g.bezierCurveTo(-28, 92, 36, 88, 74, 66);
    g.bezierCurveTo(104, 52, 116, 34, 124, 0);
    g.closePath();
  };

  // A soft cast shadow and a darker rim stop overlapping fish from reading as
  // one yellow mass.
  g.save();
  g.translate(8, 11);
  g.beginPath();
  g.ellipse(4, 0, 104, 84, 0, 0, TAU);
  g.fillStyle = "rgba(12,84,82,0.11)";
  g.fill();
  g.restore();

  const grad = g.createLinearGradient(0, -88, 0, 88);
  grad.addColorStop(0, pal.back);
  grad.addColorStop(0.26, pal.body);
  grad.addColorStop(0.72, pal.body);
  grad.addColorStop(1, pal.belly);
  body();
  g.fillStyle = grad;
  g.fill();
  g.strokeStyle = pal.edge;
  g.lineWidth = 3;
  g.stroke();
  body();
  g.strokeStyle = "rgba(137,82,0,0.58)";
  g.lineWidth = 15;
  g.stroke();

  // A soft lateral sheen and subtle scale flecks give each fish its own face.
  g.save();
  body();
  g.clip();
  const sheen = g.createLinearGradient(-40, -70, 70, 70);
  sheen.addColorStop(0, "rgba(255,255,236,0)");
  sheen.addColorStop(0.52, "rgba(255,255,236,0.18)");
  sheen.addColorStop(1, "rgba(255,255,236,0)");
  g.fillStyle = sheen;
  g.fillRect(-120, -100, 260, 200);

  // Pale belly and a warmer dorsal saddle: at cell scale these broad patches
  // keep the disc reading as a lit fish rather than a flat gold tile.
  ell(g, 8, 54, 88, 22, 0, "rgba(255,249,208,0.34)");
  ell(g, -4, -56, 84, 19, 0, "rgba(211,132,0,0.16)");

  if (rich) {
    for (let k = 0; k < 12; k++) {
      const sx = 74 - hash(ph, k, 3) * 150;
      const sy = -62 + hash(ph, k, 5) * 124;
      ell(g, sx, sy, 3 + hash(k, ph, 7) * 4, 2 + hash(k, ph, 9) * 2.4, 0, "rgba(221,148,0,0.2)");
    }
  }
  g.restore();

  // Gill arc.
  g.strokeStyle = pal.gill;
  g.lineWidth = 2.4;
  g.beginPath();
  g.ellipse(42, 0, 26, 44, 0, -1.04, 1.04);
  g.stroke();

  // Pointed snout and mouth tip.
  g.beginPath();
  g.moveTo(96, -12);
  g.quadraticCurveTo(138, -8, 166, 0);
  g.quadraticCurveTo(138, 8, 96, 12);
  g.closePath();
  g.fillStyle = pal.snout;
  g.fill();
  g.strokeStyle = pal.mouth;
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(160, 0);
  g.lineTo(167, 0);
  g.stroke();

  // Caudal spine: the small white blade at the tail base.
  ell(g, -88, 0, 7, 16, 0, pal.spine);

  // Pectoral fin, translucent over the flank.
  g.save();
  g.translate(10, 8);
  g.rotate(-0.22 + 0.18 * flutter);
  g.beginPath();
  g.ellipse(-8, 0, 56 * finSpread, 19, 0.08, 0, TAU);
  g.fillStyle = pal.fin;
  g.fill();
  g.strokeStyle = pal.finLine;
  g.lineWidth = 1.6;
  g.globalAlpha = 0.46;
  for (let k = 0; k < 4; k++) {
    g.beginPath();
    g.moveTo(-4, (k - 1.5) * 6);
    g.lineTo(-56, (k - 1.5) * 24);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.restore();

  // Eye with a small catchlight and a warm lid ring.
  g.beginPath();
  g.arc(78, -19, 12.5, 0, TAU);
  g.fillStyle = pal.eye;
  g.fill();
  g.strokeStyle = pal.eyeRing;
  g.lineWidth = 2.4;
  g.stroke();
  g.beginPath();
  g.arc(81.5, -22.5, 4.2, 0, TAU);
  g.fillStyle = pal.glint;
  g.fill();

  g.restore();
}

// A loose double-row school: four leaders, then staggered rows that trail and
// fan out. Sizes fall off with distance so the back of the school reads deeper.
const TANG_SCHOOL: Array<[number, number, number, number]> = (() => {
  const fish: Array<[number, number, number, number]> = [
    [80, -12, 0.74, 0.4],
    [30, -100, 0.66, 1.9],
    [36, 96, 0.7, 3.2],
    [-32, -6, 0.64, 5.1],
  ];
  const rows = [4, 4, 4, 3, 2];
  for (let row = 0; row < rows.length; row++) {
    const count = rows[row];
    for (let n = 0; n < count; n++) {
      const u = count === 1 ? 0 : n / (count - 1) - 0.5;
      const x = -132 - row * 185 - hash(row, n, 11) * 36;
      const y = u * (330 + row * 50) + (hash(row, n, 12) - 0.5) * 54;
      const s = 0.58 + hash(row, n, 13) * 0.14 - row * 0.006;
      fish.push([x, y, s, hash(row, n, 14) * TAU]);
    }
  }
  return fish;
})();

// The school loops a wide, slightly wobbling circuit around the reef.
const P_TANG_SCHOOL: PointPath = (t) => [
  972 + 410 * Math.cos(w * t + 0.9) + 95 * Math.cos(2 * w * t + 2.2),
  890 + 210 * Math.sin(w * t + 0.9) + 55 * Math.sin(2 * w * t + 0.4),
];

// Two larger tangs keep their own close passes so the school has scale.
const P_TANG_NEAR_A: PointPath = (t) => [
  520 + 210 * Math.cos(2 * w * t + 5.4) + 40 * Math.sin(w * t + 2.1),
  460 + 130 * Math.sin(2 * w * t + 5.4) + 24 * Math.sin(2 * w * t + 1.3),
];

const P_TANG_NEAR_B: PointPath = (t) => [
  1490 + 150 * Math.cos(2 * w * t + 0.35) + 34 * Math.sin(w * t + 3.2),
  760 + 110 * Math.sin(2 * w * t + 0.35) + 20 * Math.cos(2 * w * t + 2.4),
];

interface TangCamera {
  map: (x: number, y: number) => [number, number];
  zoom: number;
  narrow: boolean;
  wide: boolean;
}

function tangCamera(stageAspect: number): TangCamera {
  if (stageAspect < 0.85) {
    // Portrait stages crop the wide canvas to a centre band. Squash toward the
    // middle so the whole school stays inside the crop.
    return {
      map: (x, y) => [W / 2 + (x - W / 2) * 0.63, H / 2 + (y - H / 2) * 0.99],
      zoom: 0.88,
      narrow: true,
      wide: false,
    };
  }
  if (stageAspect > 1.3) {
    // The 16:10 embed crops top and bottom; compress the vertical spread.
    return {
      map: (x, y) => [x, H / 2 + (y - H / 2) * 0.74],
      zoom: 0.84,
      narrow: false,
      wide: true,
    };
  }
  return {
    map: (x, y) => [x, y],
    zoom: 1,
    narrow: false,
    wide: false,
  };
}

interface TangPlacement {
  x: number;
  y: number;
  a: number;
  flip: boolean;
  s: number;
  ph: number;
  near: boolean;
  pal: SchoolTangPalette;
}

function tangPlacements(t: number, camera: TangCamera): TangPlacement[] {
  const out: TangPlacement[] = [];

  for (let k = 0; k < TANG_SCHOOL.length; k++) {
    const [dx, dy, scale, ph] = TANG_SCHOOL[k];
    // Fish further back swim on a slightly delayed copy of the leader path, so
    // the school stretches and closes through turns instead of moving as a rig.
    const lag = 0.05 + Math.max(0, -dx - 20) * 0.0012;
    const bt = t - lag;
    const [px, py] = P_TANG_SCHOOL(bt);
    const [px2, py2] = P_TANG_SCHOOL(bt + 0.02);
    const heading = Math.atan2(py2 - py, px2 - px);
    const wobX = 8 * Math.sin(3 * w * t + ph + 0.4) + 3 * Math.sin(5 * w * t + ph * 1.7);
    const wobY = 10 * Math.sin(2 * w * t + ph + 0.7) + 4 * Math.sin(4 * w * t + ph * 0.4);
    const lx = dx + wobX;
    const ly = dy + wobY;
    const ca = Math.cos(heading);
    const sa = Math.sin(heading);
    const wx = px + lx * ca - ly * sa;
    const wy = py + lx * sa + ly * ca;
    const [x, y] = camera.map(wx, wy);
    const [mx, my] = camera.map(px, py);
    const [mx2, my2] = camera.map(px2, py2);
    const a = Math.atan2(my2 - my, mx2 - mx) + 0.12 * Math.sin(2 * w * t + ph + 1.1);
    out.push({
      x,
      y,
      a,
      flip: Math.cos(a) < 0,
      s: scale * camera.zoom * (1 + 0.026 * Math.sin(2 * w * t + ph)),
      ph,
      near: false,
      pal: TANG_PALETTES[k % TANG_PALETTES.length],
    });
  }

  for (const [path, scale, ph] of [
    [P_TANG_NEAR_A, 1.18, 0.7],
    [P_TANG_NEAR_B, 1.02, 3.8],
  ] as Array<[PointPath, number, number]>) {
    const [px, py] = path(t);
    const [px2, py2] = path(t + 0.02);
    const [x, y] = camera.map(px, py);
    const [mx, my] = camera.map(px, py);
    const [mx2, my2] = camera.map(px2, py2);
    const a = Math.atan2(my2 - my, mx2 - mx) + 0.05 * Math.sin(2 * w * t + ph);
    out.push({
      x,
      y,
      a,
      flip: Math.cos(a) < 0,
      s: scale * camera.zoom * (1 + 0.018 * Math.sin(2 * w * t + ph)),
      ph,
      near: true,
      pal: ph > 2 ? TANG_GOLD : TANG_YELLOW,
    });
  }

  return out;
}

const TANG_RAMP = "·:;~+*#";
const TANG_EDGE = "·'.,:;~";

export interface LagoonPainter {
  start: () => void;
  stop: () => void;
  setScene: (scene: LagoonScene) => void;
  destroy: () => void;
}

interface LagoonOptions {
  scene?: LagoonScene;
}

export function createLagoonPainter(
  canvas: HTMLCanvasElement,
  options: LagoonOptions = {},
): LagoonPainter {
  const context = canvas.getContext("2d");
  const stage = canvas.closest<HTMLElement>("[data-lagoon-stage]");
  if (!context) {
    return {
      start: () => undefined,
      stop: () => undefined,
      setScene: () => undefined,
      destroy: () => undefined,
    };
  }
  const ctx: CanvasRenderingContext2D = context;
  const normalizeScene = (value: LagoonScene | undefined): LagoonScene =>
    value === "night" ||
    value === "turtle" ||
    value === "manta" ||
    value === "seahorse" ||
    value === "dolphin" ||
    value === "hammer" ||
    value === "tang"
      ? value
      : "day";

  let scene: LagoonScene = normalizeScene(options.scene);
  if (stage) stage.dataset.lagoonScene = scene;

  canvas.width = W;
  canvas.height = H;

  const mk = (cw: number, ch: number): [HTMLCanvasElement, CanvasRenderingContext2D] => {
    const c = document.createElement("canvas");
    c.width = cw;
    c.height = ch;
    const context = c.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Lagoon needs a 2D canvas context.");
    return [c, context];
  };

  const [oc, ox] = mk(COLS * SS, ROWS * SS); // supersampled layer, averaged into cells
  const [bgc, bgx] = mk(W, H); // static water + grid
  const [blc, blx] = mk(W, H); // frosted area under the UI

  function paintBackground() {
    bgx.setTransform(1, 0, 0, 1, 0, 0);
    bgx.clearRect(0, 0, W, H);

    const g = bgx.createLinearGradient(0, 0, W * 0.45, H * 0.9);
    for (const [k, c] of stopsFor(scene)) g.addColorStop(k, rgb(c));
    bgx.fillStyle = g;
    bgx.fillRect(0, 0, W, H);

    bgx.fillStyle = scene === "night" ? "rgba(126,223,255,0.045)" : "rgba(255,255,255,0.07)";
    for (let x = 0; x < W; x += CW) bgx.fillRect(x, 0, 1, H);
    for (let y = 0; y < H; y += CH) bgx.fillRect(0, y, W, 1);

    if (scene === "manta") {
      drawMantaBackdrop(bgx);
      return;
    }

    if (scene === "turtle") {
      drawTurtleBackdrop(bgx);
      return;
    }

    if (scene === "seahorse") {
      drawSeahorseBackdrop(bgx);
      return;
    }

    if (scene === "dolphin") {
      drawDolphinBackdrop(bgx);
      return;
    }

    if (scene === "hammer") {
      drawHammerBackdrop(bgx);
      return;
    }

    if (scene === "tang") {
      drawTangBackdrop(bgx);
      return;
    }

    if (scene !== "night") return;

    // Faint moon bloom in the upper water, plus reflected stars.
    const mx = W * 0.66;
    const my = H * 0.03;
    const bloom = bgx.createRadialGradient(mx, my, 10, mx, my, W * 0.46);
    bloom.addColorStop(0, "rgba(206,231,255,0.26)");
    bloom.addColorStop(0.22, "rgba(136,185,255,0.12)");
    bloom.addColorStop(0.62, "rgba(64,104,196,0.04)");
    bloom.addColorStop(1, "rgba(20,42,90,0)");
    bgx.fillStyle = bloom;
    bgx.fillRect(0, 0, W, H);

    const core = bgx.createRadialGradient(mx, my, 0, mx, my, 220);
    core.addColorStop(0, "rgba(232,244,255,0.26)");
    core.addColorStop(1, "rgba(180,220,255,0)");
    bgx.fillStyle = core;
    bgx.fillRect(mx - 240, my - 240, 480, 480);

    // Soft, stretched reflection under the moon: a long path with no hard edge.
    bgx.save();
    bgx.translate(mx, H * 0.55);
    bgx.scale(0.27, 1);
    const reflection = bgx.createRadialGradient(0, 0, 0, 0, 0, H * 0.66);
    reflection.addColorStop(0, "rgba(136,198,255,0.14)");
    reflection.addColorStop(0.55, "rgba(92,152,232,0.065)");
    reflection.addColorStop(1, "rgba(60,110,200,0)");
    bgx.fillStyle = reflection;
    bgx.fillRect(-W, -H, W * 2, H * 2);
    bgx.restore();

    for (let k = 0; k < 320; k++) {
      const sx = hash(k, 1, 7) * W;
      const sy = hash(k, 2, 9) * H * 0.94;
      const bright = hash(k, 3, 11);
      if (bright < 0.32) continue;
      const size = bright > 0.93 ? 2 : 1;
      bgx.fillStyle = `rgba(206,232,255,${0.1 + bright * 0.42})`;
      bgx.fillRect(sx, sy, size, size);
    }
  }

  paintBackground();

  // ---------- per-cell sampling ----------

  function sample(draw: (g: CanvasRenderingContext2D) => void) {
    ox.setTransform(1, 0, 0, 1, 0, 0);
    ox.clearRect(0, 0, oc.width, oc.height);
    ox.setTransform((COLS * SS) / (COLS * CW), 0, 0, (ROWS * SS) / (ROWS * CH), 0, 0);
    draw(ox);
    const d = ox.getImageData(0, 0, oc.width, oc.height).data;
    const out = new Float32Array(COLS * ROWS * 4);
    const rw = oc.width * 4;
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        let r = 0;
        let gg = 0;
        let b = 0;
        let a = 0;
        for (let v = 0; v < SS; v++) {
          for (let u = 0, p = (j * SS + v) * rw + i * SS * 4; u < SS; u++, p += 4) {
            const al = d[p + 3];
            r += d[p] * al;
            gg += d[p + 1] * al;
            b += d[p + 2] * al;
            a += al;
          }
        }
        const o = (j * COLS + i) * 4;
        if (a > 0) {
          out[o] = r / a;
          out[o + 1] = gg / a;
          out[o + 2] = b / a;
          out[o + 3] = a / (255 * SS * SS);
        }
      }
    }
    return out;
  }

  const put = (
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    a: number,
    s: number,
    draw: (g: CanvasRenderingContext2D) => void,
  ) => {
    g.save();
    g.translate(x, y);
    g.rotate(a);
    if (s !== 1) g.scale(s, s);
    draw(g);
    g.restore();
  };

  // Reef floor is static: sample it once per look.
  function drawReef(g: CanvasRenderingContext2D, night: boolean) {
    const pal = night
      ? {
          blobA: ["#1b4a60", "#153d52"],
          blobB: ["#194457", "#123748"],
          blobC: ["#263b5f", "#2b4168"],
          blobD: ["#1c4b59", "#204f64"],
          coral: ["#215c6d", "#2c7080", "#1b4f64", "#245e70"],
          spiral: "#15304a",
          spiralCore: "#0f253b",
        }
      : {
          blobA: ["#d98a6a", "#c46a5a"],
          blobB: ["#d8b86a", "#c49c4c"],
          blobC: ["#c9a0d8", "#e2a0b8"],
          blobD: ["#d6b870", "#e8907a"],
          coral: ["#ff6a3d", "#ff8a2a", "#e8483c", "#ff7a3a"],
          spiral: "#3a1f4a",
          spiralCore: "#2a1438",
        };
    const blob = (x: number, y: number, r: number, c1: string, c2: string, n: number) => {
      for (let k = 0; k < n; k++) {
        const a = hash(x, y, k) * TAU;
        const d = hash(y, x, k) * r * 0.7;
        ell(
          g,
          x + Math.cos(a) * d,
          y + Math.sin(a) * d * 0.9,
          r * (0.35 + 0.3 * hash(k, x, y)),
          r * (0.3 + 0.3 * hash(k, y, x)),
          a,
          k % 2 ? c1 : c2,
        );
      }
    };
    blob(140, 1600, 110, pal.blobA[0], pal.blobA[1], 10);
    blob(1800, 220, 100, pal.blobB[0], pal.blobB[1], 9);
    blob(80, 380, 80, pal.blobC[0], pal.blobC[1], 7);
    blob(1700, 1650, 110, pal.blobD[0], pal.blobD[1], 10);
    const coral: Array<[number, number, number, string]> = [
      [300, 1460, 46, pal.coral[0]],
      [1520, 1560, 40, pal.coral[1]],
      [1900, 420, 36, pal.coral[2]],
      [220, 300, 34, pal.coral[3]],
    ];
    for (const [x, y, r, c] of coral) {
      g.save();
      g.translate(x, y);
      g.rotate(hash(x, y, 1) * TAU);
      for (let k = 0; k < 5; k++) {
        g.save();
        g.rotate((k * TAU) / 5);
        ell(g, r * 0.6, 0, r * 0.65, r * 0.2, 0, c);
        g.restore();
      }
      ell(g, 0, 0, r * 0.3, r * 0.3, 0, c);
      g.restore();
    }
    if (night) {
      // Bioluminescent coral hearts, sampled into a few bright cells each.
      for (const [x, y, r] of coral) {
        g.save();
        g.translate(x, y);
        const glow = g.createRadialGradient(0, 0, 0, 0, 0, r * 1.35);
        glow.addColorStop(0, "rgba(112,244,226,0.58)");
        glow.addColorStop(0.38, "rgba(82,204,224,0.22)");
        glow.addColorStop(1, "rgba(82,204,224,0)");
        g.fillStyle = glow;
        g.beginPath();
        g.arc(0, 0, r * 1.35, 0, TAU);
        g.fill();
        g.restore();
      }
    }
    for (const [x, y] of [
      [560, 1580],
      [1740, 1480],
      [1960, 980],
      [40, 900],
    ]) {
      g.save();
      g.translate(x, y);
      for (let k = 0; k < 12; k++) {
        g.rotate(TAU / 12);
        ell(g, 22, 0, 22, 3, 0, pal.spiral);
      }
      ell(g, 0, 0, 14, 14, 0, pal.spiralCore);
      g.restore();
    }
  }

  const reef = sample((g) => drawReef(g, false));
  const reefNight = sample((g) => drawReef(g, true));

  function cells(L: Float32Array, depth: number, t: number, glyphs: boolean, night = false) {
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const o = (j * COLS + i) * 4;
        const a = L[o + 3];
        if (a < 0.12) continue;
        const x = i * CW;
        const y = j * CH;
        let c: RGB = [L[o], L[o + 1], L[o + 2]];
        if (depth) c = mix(c, water(x, y, night ? "night" : "day"), depth);
        const flick = hash(i, j, Math.floor(t * 7));
        if (a > 0.5) {
          ctx.fillStyle = rgb(night ? mix(c, [3, 10, 20], 0.12) : c, depth ? 0.9 : 1);
          ctx.fillRect(x + 1, y + 1, CW - 2, CH - 2);
          if (!glyphs) continue;
          const l = lum(c);
          if (night) {
            const ch =
              NIGHT_RAMP[
                Math.max(0, Math.min(NIGHT_RAMP.length - 1, Math.floor(1 + l * 7 + flick * 3)))
              ];
            ctx.fillStyle =
              flick < 0.08
                ? NIGHT_SPRINK[(flick * 100) | 0]
                : rgb(
                    mix([94, 216, 232], [212, 248, 255], Math.min(1, l * 2.2)),
                    Math.max(0, l - 0.1) * 1.3,
                  );
            ctx.fillText(ch, x + CW / 2, y + CH / 2 + 1);
            continue;
          }
          const ch =
            RAMP[Math.max(0, Math.min(RAMP.length - 1, Math.floor(1 + l * 5 + flick * 4)))];
          ctx.fillStyle =
            flick < 0.04
              ? SPRINK[(flick * 100) | 0]
              : rgb(
                  l < 0.42 ? mix(c, [255, 255, 255], 0.62) : mix(c, [0, 0, 0], 0.58),
                  depth ? 0.6 : 1,
                );
          ctx.fillText(ch, x + CW / 2, y + CH / 2 + 1);
        } else {
          if (night) {
            ctx.fillStyle = rgb(mix(c, [108, 224, 238], 0.5), Math.min(0.58, a * 1.7));
            ctx.fillText(NIGHT_EDGE[(flick * NIGHT_EDGE.length) | 0], x + CW / 2, y + CH / 2 + 1);
            continue;
          }
          ctx.fillStyle = rgb(c, Math.min(1, a * 1.6) * (depth ? 0.6 : 1));
          ctx.fillText(EDGE[(flick * EDGE.length) | 0], x + CW / 2, y + CH / 2 + 1);
        }
      }
    }
  }

  // Macro cells keep the same cell grid but let the carving read: dark scutes
  // get dense pale glyphs, lit skin gets sparse dark glyphs.
  function macroCells(L: Float32Array, t: number) {
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const o = (j * COLS + i) * 4;
        const a = L[o + 3];
        if (a < 0.11) continue;
        const x = i * CW;
        const y = j * CH;
        const c: RGB = [L[o], L[o + 1], L[o + 2]];
        const flick = hash(i, j, Math.floor(t * 7));
        if (a > 0.5) {
          const edge = Math.min(1, Math.abs(x / W - 0.56) * 0.72 + Math.abs(y / H - 0.46) * 0.52);
          const tint = mix(c, water(x, y, "turtle"), 0.05 + edge * 0.19);
          ctx.fillStyle = rgb(tint, 0.93);
          ctx.fillRect(x + 1, y + 1, CW - 2, CH - 2);
          const l = lum(c);
          const index = Math.max(
            0,
            Math.min(MACRO_RAMP.length - 1, Math.floor((1 - l) * MACRO_RAMP.length + flick * 1.35)),
          );
          const ink = l < 0.46 ? mix(c, [255, 246, 210], 0.6) : mix(c, [24, 30, 16], 0.66);
          ctx.fillStyle = rgb(ink, 0.74);
          ctx.fillText(MACRO_RAMP[index], x + CW / 2, y + CH / 2 + 1);
          if (flick > 0.992 && l > 0.42) {
            ctx.fillStyle = `rgba(255,248,215,${0.55 + (flick - 0.992) * 30})`;
            ctx.fillText("*", x + CW / 2, y + CH / 2 + 1);
          }
          continue;
        }
        ctx.fillStyle = rgb(mix(c, [255, 247, 216], 0.16), Math.min(0.72, a * 1.35));
        ctx.fillText(
          MACRO_EDGE[(hash(i, j, Math.floor(t * 6)) * MACRO_EDGE.length) | 0],
          x + CW / 2,
          y + CH / 2 + 1,
        );
      }
    }
  }

  // Manta cells keep a solid silhouette and let the glyphs read as skin and
  // dapple rather than noise. Edge cells feather into the water.
  function mantaCells(L: Float32Array, t: number) {
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const o = (j * COLS + i) * 4;
        const a = L[o + 3];
        if (a < 0.1) continue;
        const x = i * CW;
        const y = j * CH;
        const c: RGB = [L[o], L[o + 1], L[o + 2]];
        const l = lum(c);
        const flick = hash(i, j, Math.floor(t * 6));
        if (a > 0.44) {
          ctx.fillStyle = rgb(c, 0.96);
          ctx.fillRect(x + 1, y + 1, CW - 2, CH - 2);
          const ink = l < 0.42 ? mix(c, [206, 246, 236], 0.46) : mix(c, [10, 46, 56], 0.62);
          const index = Math.max(
            0,
            Math.min(MANTA_RAMP.length - 1, Math.floor((1 - l) * MANTA_RAMP.length * 0.82 + flick)),
          );
          ctx.fillStyle = rgb(ink, l < 0.42 ? 0.18 : 0.3);
          ctx.fillText(MANTA_RAMP[index], x + CW / 2, y + CH / 2 + 1);
          if (flick > 0.988 && l < 0.4) {
            ctx.fillStyle = "rgba(224,252,242,0.38)";
            ctx.fillText("*", x + CW / 2, y + CH / 2 + 1);
          }
          continue;
        }
        const edgeInk = l < 0.35 ? mix(c, [188, 238, 234], 0.56) : mix(c, [16, 66, 78], 0.3);
        ctx.fillStyle = rgb(edgeInk, Math.min(0.9, a * 1.5));
        ctx.fillText(
          MANTA_EDGE[(hash(i, j, Math.floor(t * 5)) * MANTA_EDGE.length) | 0],
          x + CW / 2,
          y + CH / 2 + 1,
        );
      }
    }
  }

  // Tails are rendered directly on the cell grid so the whip stays continuous
  // at any scale, instead of dissolving in the averaged sampling pass.
  function mantaTailCells(
    t: number,
    path: PointPath,
    scale: number,
    pal: FlyMantaPalette,
    phaseOffset: number,
    camera: (x: number, y: number) => [number, number],
  ) {
    const [ox0, oy0, angle] = pose(path, t);
    const [ox, oy] = camera(ox0, oy0);
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const points = mantaTailPoints(t, phaseOffset, 220);
    let lastI = -99;
    let lastJ = -99;
    for (const p of points) {
      const gx = ox + (p.x * ca - p.y * sa) * scale;
      const gy = oy + (p.x * sa + p.y * ca) * scale;
      if (gx < -24 || gx > W + 24 || gy < -24 || gy > H + 24) continue;
      const i = Math.floor(gx / CW);
      const j = Math.floor(gy / CH);
      if (i === lastI && j === lastJ) continue;
      lastI = i;
      lastJ = j;
      if (p.u > 0.84) {
        // Fade the last stretch to a single small mark so the whip tapers.
        const size = p.u > 0.95 ? 4 : 8;
        ctx.globalAlpha = 0.76;
        ctx.fillStyle = pal.tailMid;
        ctx.fillRect(i * CW + (CW - size) / 2, j * CH + (CH - size) / 2, size, size);
      } else {
        ctx.globalAlpha = 0.94;
        ctx.fillStyle = pal.tail;
        ctx.fillRect(i * CW + 1, j * CH + 1, CW - 2, CH - 2);
      }
      if (p.u < 0.9) {
        ctx.globalAlpha = p.u > 0.14 ? 0.52 : 0.3;
        ctx.fillStyle = pal.tailLight;
        ctx.fillText("·", i * CW + CW / 2, j * CH + CH / 2 + 1);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Sparse bokeh rings and warm caustics, drawn as cells behind the honu.
  function turtleBackGlyphs(t: number) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let k = 0; k < BOKEH.length; k++) {
      const b = BOKEH[k];
      if (b.a < 0.065) continue;
      const x = b.x + 9 * Math.sin(w * t + k * 1.7);
      const y = b.y + 6 * Math.cos(w * 2 * t + k);
      const c: RGB =
        b.warm > 0.68 ? [255, 236, 188] : b.warm > 0.34 ? [146, 240, 218] : [255, 186, 148];
      const ring = 0.72 + 0.05 * Math.sin(w * 2 * t + k);
      for (let n = 0; n < 14; n++) {
        const a = (n / 14) * TAU;
        const px = x + Math.cos(a) * b.r * ring;
        const py = y + Math.sin(a) * b.r * ring;
        if (px < -20 || px > W + 20 || py < -20 || py > H + 20) continue;
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${b.a * (0.5 + 0.5 * hash(k, n, 17))})`;
        ctx.fillText(
          n % 4 ? "·" : "°",
          Math.floor(px / CW) * CW + CW / 2,
          Math.floor(py / CH) * CH + CH / 2,
        );
      }
    }

    for (let j = 0; j < ROWS; j += 2) {
      for (let i = 0; i < COLS; i += 2) {
        const x = i * CW;
        const y = j * CH;
        const v =
          Math.sin(x * 0.009 + y * 0.005 + w * 2 * t + 2.2 * Math.sin(y * 0.008 - w * 2 * t)) +
          Math.sin(-x * 0.006 + y * 0.011 - w * 3 * t + 1.4 * Math.sin(x * 0.007 + w * t));
        if (v < 1.62) continue;
        const k = Math.min(1, (v - 1.62) / 0.9);
        ctx.fillStyle = `rgba(255,250,224,${0.06 + 0.22 * k})`;
        ctx.fillText(k > 0.52 ? "~" : "·", x + CW / 2, y + CH / 2);
      }
    }
    ctx.restore();
  }

  // Bubbles, motes, and a soft wake in front of the portrait.
  function turtleFrontGlyphs(t: number) {
    const stroke = Math.sin(w * 2 * t + 0.9);
    const strokeAlt = Math.sin(w * 2 * t + 0.9 + Math.PI);
    const drift = Math.sin(w * t + 0.35);
    const exhale = 0.55 + 0.45 * Math.max(0, Math.sin(w * 2 * t + 0.7));
    const plumes: Array<[number, number, number, number, number]> = [
      [1698, 742, 66, 11, 2],
      [1512, 1400, 46, 7, 1],
      [1188, 1010, 34, 5, 2],
      [720, 930, 54, 6, 1],
    ];
    for (let p = 0; p < plumes.length; p++) {
      const [px, py, spread, count, speed] = plumes[p];
      const pulse = p === 0 ? exhale : 1;
      for (let k = 0; k < count; k++) {
        const u = ((t / T) * speed + hash(p, k, 3)) % 1;
        const bx = px + Math.sin(u * TAU + k) * spread + (hash(p, k, 4) - 0.5) * 36;
        const by = py - u * (430 + hash(p, k, 5) * 230);
        const alpha = (1 - u) * (0.34 + 0.44 * hash(p, k, 6)) * pulse;
        const glyph = ["·", "°", "o", "O"][(hash(p, k, 7) * 4) | 0];
        ctx.fillStyle = `rgba(255,249,224,${alpha})`;
        ctx.fillText(glyph, Math.floor(bx / CW) * CW + CW / 2, Math.floor(by / CH) * CH + CH / 2);
      }
    }

    // Air shaken loose by the near flipper: a short, pulsing trail.
    const tipX = 1770 + stroke * 28;
    const tipY = 1460 + stroke * 36;
    for (let k = 0; k < 10; k++) {
      const u = ((t / T) * 2 + hash(k, 81, 3)) % 1;
      const bx = tipX + Math.sin(u * TAU + k) * (40 + strokeAlt * 8) + (hash(k, 82, 4) - 0.5) * 30;
      const by = tipY - u * (280 + hash(k, 83, 5) * 190);
      const alpha = (0.16 + 0.32 * (1 - u)) * (0.55 + 0.45 * Math.max(0, stroke));
      ctx.fillStyle = `rgba(255,250,228,${alpha})`;
      ctx.fillText(
        ["·", "°", "o"][(hash(k, 84, 6) * 3) | 0],
        Math.floor(bx / CW) * CW + CW / 2,
        Math.floor(by / CH) * CH + CH / 2,
      );
    }

    // A shallow ripple line under the chin follows the head's slow drift.
    for (let k = 0; k < 12; k++) {
      const u = k / 11;
      const x = 880 + u * 640 + 16 * Math.sin(w * 2 * t + k) + drift * 7;
      const y = 1050 + 44 * Math.sin(u * Math.PI) + 9 * Math.cos(w * 2 * t + k * 0.7);
      ctx.fillStyle = `rgba(255,250,229,${0.12 + 0.18 * (1 - u)})`;
      ctx.fillText(
        k % 3 ? "·" : "~",
        Math.floor(x / CW) * CW + CW / 2,
        Math.floor(y / CH) * CH + CH / 2,
      );
    }

    // A short displaced-water wake peeling off the flipper tip.
    for (let k = 0; k < 10; k++) {
      const u = k / 9;
      const x = 1636 + u * 244 + 20 * Math.sin(w * 2 * t + u * 3.2) + stroke * 10;
      const y = 1452 + u * 76 + 18 * Math.cos(w * 2 * t + u * 2.1);
      ctx.fillStyle = `rgba(255,251,234,${0.08 + 0.17 * (1 - u)})`;
      ctx.fillText(
        k % 2 ? "·" : "~",
        Math.floor(x / CW) * CW + CW / 2,
        Math.floor(y / CH) * CH + CH / 2,
      );
    }

    for (let j = 0; j < ROWS; j += 3) {
      for (let i = 0; i < COLS; i += 3) {
        const h = hash(i, j, 71);
        if (h < 0.972) continue;
        const x = i * CW + 14 * Math.sin(w * t + h * TAU);
        const y = j * CH + 10 * Math.cos(w * 2 * t + h * 13);
        ctx.fillStyle = `rgba(255,244,205,${0.1 + 0.32 * (0.5 + 0.5 * Math.sin(w * 2 * t + h * 31))})`;
        ctx.fillText("·", x, y);
      }
    }
  }

  // ---------- manta flyby passes ----------

  // Depth shadow and a slow caustic net behind the animal.
  function mantaWater(t: number, camera: (x: number, y: number) => [number, number], zoom = 1) {
    const [mx, my] = camera(...P_MANTA(t));
    const radius = 720 * zoom;
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    const shade = ctx.createRadialGradient(mx - 40, my + 70, 40, mx - 40, my + 70, radius);
    shade.addColorStop(0, "rgba(14,74,108,0.2)");
    shade.addColorStop(1, "rgba(14,74,108,0)");
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(mx - 40, my + 70, radius, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let j = 0; j < ROWS; j += 2) {
      for (let i = 0; i < COLS; i += 2) {
        const x = i * CW;
        const y = j * CH;
        const v =
          Math.sin(x * 0.008 + y * 0.005 + w * 2 * t + 1.7 * Math.sin(y * 0.006 - w * 2 * t)) +
          Math.sin(-x * 0.005 + y * 0.009 - w * 3 * t + 1.3 * Math.sin(x * 0.005 + w * t));
        if (v < 1.56) continue;
        const k = Math.min(1, (v - 1.56) / 0.8);
        ctx.fillStyle = `rgba(236,255,248,${0.05 + 0.15 * k})`;
        ctx.fillText(k > 0.56 ? "~" : "·", x + CW / 2, y + CH / 2);
      }
    }
    ctx.restore();
  }

  // Plankton and a second, softer caustic pass keep the manta inside the water.
  function mantaFront(t: number) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let k = 0; k < 54; k++) {
      const h1 = hash(k, 101, 7);
      const h2 = hash(k, 102, 11);
      const h3 = hash(k, 103, 13);
      const x = (((h1 * W + 30 * Math.sin(w * t + h3 * TAU)) % W) + W) % W;
      const y = (((h2 * H + 18 * Math.cos(2 * w * t + h3 * 17)) % H) + H) % H;
      ctx.fillStyle = `rgba(238,255,246,${0.08 + 0.3 * h3})`;
      ctx.fillText(h3 > 0.9 ? "°" : h3 > 0.62 ? "+" : "·", x, y);
    }

    for (let j = 0; j < ROWS; j += 3) {
      for (let i = 0; i < COLS; i += 3) {
        const x = i * CW;
        const y = j * CH;
        const v =
          Math.sin(x * 0.006 - y * 0.004 + w * 3 * t + 1.2 * Math.sin(y * 0.007 + w * t)) +
          Math.sin(-x * 0.007 + y * 0.008 - w * 2 * t + 1.6 * Math.sin(x * 0.006 - w * 2 * t));
        if (v < 1.62) continue;
        const k = Math.min(1, (v - 1.62) / 0.7);
        ctx.fillStyle = `rgba(226,252,240,${0.04 + 0.11 * k})`;
        ctx.fillText(k > 0.5 ? "~" : "·", x + CW / 2, y + CH / 2);
      }
    }
    ctx.restore();
  }

  function drawMantaFrame(t: number) {
    ctx.drawImage(bgc, 0, 0);
    ctx.font = '500 15px "Geist Mono", ui-monospace, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Portrait stages crop the wide canvas to a narrow center band. Pull the
    // two animals toward the middle so both bodies and both tails stay in view.
    const stageAspect = stage ? stage.clientWidth / Math.max(1, stage.clientHeight) : W / H;
    const compact = stageAspect < 0.85;
    const squash = compact ? 0.45 : 1;
    const zoom = compact ? 0.72 : 1;
    const camera = (x: number, y: number): [number, number] =>
      compact ? [W / 2 + (x - W / 2) * squash, H / 2 + (y - H / 2) * 0.9] : [x, y];

    mantaWater(t, camera, zoom);
    mantaTailCells(t, P_MANTA_FAR, 0.4 * zoom, FLY_MANTA_FAR, 2.3, camera);
    mantaTailCells(t, P_MANTA, 0.7 * zoom, FLY_MANTA, 0, camera);

    const layer = sample((g) => {
      const [bx0, by0, ba] = pose(P_MANTA_FAR, t);
      const [bx, by] = camera(bx0, by0);
      put(g, bx, by, ba, 0.4 * zoom, (g) => drawFlyManta(g, t, FLY_MANTA_FAR, 2.3, false));

      const [fx, fy, fa] = pose(P_MANTA_FISH, t);
      const ca = Math.cos(fa);
      const sa = Math.sin(fa);
      g.save();
      g.globalAlpha = 0.58;
      for (const [dx, dy, s] of MANTA_SCHOOL) {
        const [px, py] = camera(fx + dx * ca - dy * sa, fy + dx * sa + dy * ca);
        put(g, px, py, fa + 0.12 * Math.sin(w * 9 * t + dx), s * 2.1 * zoom, (g) =>
          tang(g, t, dx, MANTA_TANG),
        );
      }
      g.restore();

      const [x0, y0, a] = pose(P_MANTA, t);
      const [x, y] = camera(x0, y0);
      put(g, x, y, a, 0.7 * zoom, (g) => drawFlyManta(g, t, FLY_MANTA, 0, false));
    });

    mantaCells(layer, t);
    mantaFront(t);
  }

  // Sparse drifting plankton, reef glints, and the moon's reflection.
  function nightSurface(t: number) {
    const phase = w * t;

    // Two slow, wide current bands, one full cycle per loop.
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let k = 0; k < 2; k++) {
      const off = ((t / T + k / 2) % 1) * (W + H) * 1.1 - H * 0.55;
      const band = ctx.createLinearGradient(off, 0, off + 420, 220);
      band.addColorStop(0, "rgba(70,150,230,0)");
      band.addColorStop(0.5, "rgba(70,150,230,0.05)");
      band.addColorStop(1, "rgba(70,150,230,0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    for (let j = 0; j < ROWS; j += 2) {
      for (let i = 0; i < COLS; i += 2) {
        const h = hash(i, j, 17);
        if (h < 0.936) continue;
        const px = i * CW + CW / 2 + 16 * Math.sin(phase + h * TAU);
        const py = j * CH + CH / 2 + 9 * Math.cos(2 * phase + h * 19);
        const pulse = 0.35 + 0.65 * Math.max(0, Math.sin(2 * phase + h * 31)) ** 2;
        const teal = h > 0.968;
        ctx.fillStyle = teal
          ? `rgba(80,235,210,${0.2 + 0.5 * pulse})`
          : `rgba(120,225,255,${0.18 + 0.46 * pulse})`;
        ctx.fillText(pulse > 0.74 ? "*" : "·", px, py);
      }
    }

    for (let k = 0; k < REEF_GLINTS.length; k++) {
      const [x, y] = REEF_GLINTS[k];
      const pulse = 0.5 + 0.5 * Math.sin(2 * phase + k * 1.7);
      for (let n = 0; n < 6; n++) {
        const a = hash(k, n, 2) * TAU;
        const r = 10 + hash(k, n, 3) * 92;
        ctx.fillStyle =
          n % 2
            ? `rgba(76,236,208,${0.18 + 0.5 * pulse * (1 - n / 7)})`
            : `rgba(120,226,255,${0.2 + 0.55 * pulse * (1 - n / 7)})`;
        ctx.fillText(n % 3 ? "·" : "+", x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7);
      }
    }
  }

  function moonPath(t: number) {
    const phase = w * t;
    const mx = W * 0.66;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let j = 0; j < ROWS; j++) {
      const y = j * CH + CH / 2;
      const spread = 52 + (y / H) * (H * 0.22);
      const center = mx + 32 * Math.sin(y * 0.004 + phase);
      const fade = 0.94 - (y / H) * 0.58;
      for (let i = 0; i < COLS; i++) {
        const x = i * CW + CW / 2;
        const d = Math.abs(x - center);
        if (d > spread) continue;
        const falloff = 1 - d / spread;
        const h = hash(i, j, Math.floor(t * 4));
        if (h > 0.3 + 0.4 * falloff) continue;
        const alpha = Math.min(0.9, (0.16 + 0.8 * falloff * falloff) * fade * (0.6 + h));
        ctx.fillStyle = `rgba(190,235,255,${alpha})`;
        ctx.fillText(h > 0.46 ? "~" : h > 0.22 ? "-" : "·", x, y);
      }
    }
    ctx.restore();
  }

  // ---------- seahorse close-up ----------

  // Solid body cells keep the silhouette, edge cells get a pale rim mark so
  // the head, crest, and curled tail stay legible against the water.
  function seahorseCells(L: Float32Array, t: number) {
    const alphaAt = (i: number, j: number) => {
      if (i < 0 || j < 0 || i >= COLS || j >= ROWS) return 0;
      return L[(j * COLS + i) * 4 + 3];
    };

    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const o = (j * COLS + i) * 4;
        const a = L[o + 3];
        if (a < 0.08) continue;
        const x = i * CW;
        const y = j * CH;
        const depth = Math.min(0.5, Math.max(0, (1 - a) * 1.8));
        const c: RGB = mix(
          [L[o], L[o + 1], L[o + 2]],
          water(x + CW / 2, y + CH / 2, "seahorse"),
          depth * 0.36,
        );
        const l = lum(c);
        const flick = hash(i, j, Math.floor(t * 6));
        const rim =
          alphaAt(i - 1, j) < 0.4 ||
          alphaAt(i + 1, j) < 0.4 ||
          alphaAt(i, j - 1) < 0.4 ||
          alphaAt(i, j + 1) < 0.4;

        if (a > 0.4) {
          ctx.fillStyle = rgb(c, 0.9);
          ctx.fillRect(x + 1, y + 1, CW - 2, CH - 2);
          const index = Math.max(
            0,
            Math.min(
              SEA_RAMP.length - 1,
              Math.floor((1 - l) * SEA_RAMP.length * 0.96 + flick * 0.9),
            ),
          );
          if (rim) {
            ctx.fillStyle = rgb(mix(c, [255, 246, 210], 0.6), 0.5 + 0.3 * a);
            ctx.fillText(SEA_EDGE[(flick * SEA_EDGE.length) | 0], x + CW / 2, y + CH / 2 + 1);
          } else {
            const ink = l < 0.44 ? mix(c, [255, 246, 214], 0.62) : mix(c, [44, 28, 8], 0.6);
            ctx.fillStyle = rgb(ink, 0.38 + 0.2 * (1 - l));
            ctx.fillText(SEA_RAMP[index], x + CW / 2, y + CH / 2 + 1);
          }
          if (flick > 0.992 && l > 0.5) {
            ctx.fillStyle = "rgba(255,251,228,0.65)";
            ctx.fillText("*", x + CW / 2, y + CH / 2 + 1);
          }
          continue;
        }

        // Fins and the soft rim: pale, sparse marks that read as membrane.
        const ink = l < 0.5 ? mix(c, [255, 246, 212], 0.58) : mix(c, [44, 88, 74], 0.4);
        ctx.fillStyle = rgb(ink, Math.min(0.82, 0.2 + a * 1.4));
        ctx.fillText(
          SEA_EDGE[(hash(i, j, Math.floor(t * 5)) * SEA_EDGE.length) | 0],
          x + CW / 2,
          y + CH / 2 + 1,
        );
      }
    }
  }

  // Fin rays drawn straight onto the cell grid so the fan reads as a fin, not
  // as a darker patch of body. The sampled membrane sits underneath.
  function seahorseFinRays(t: number, pose: SeaPose) {
    const phase = w * (t + pose.offset);
    const dorsal = Math.sin(48 * phase + 0.4);
    const cos = Math.cos(pose.angle);
    const sin = Math.sin(pose.angle);
    const toCell = (x: number, y: number): [number, number] => {
      const mx = pose.flip ? -x : x;
      const rx = mx * cos - y * sin;
      const ry = mx * sin + y * cos;
      return [
        Math.floor((pose.x + rx * pose.scale) / CW) * CW + CW / 2,
        Math.floor((pose.y + ry * pose.scale) / CH) * CH + CH / 2 + 1,
      ];
    };
    const dim = pose.haze ? 0.42 : 1;

    for (let k = 0; k < 8; k++) {
      const u = k / 7;
      const tipX = -38 - 146 * Math.sin(u * Math.PI) - 12 * dorsal - (k % 2 ? 16 : 0);
      const tipY = -322 + u * 310;
      const hubX = -8;
      const hubY = -296 + k * 33;
      for (let s = 0; s <= 17; s++) {
        const f = s / 17;
        const bow = -14 * Math.sin(f * Math.PI) * (k < 4 ? 1 : -1);
        const x = hubX + (tipX - hubX) * f + bow;
        const y = hubY + (tipY - hubY) * f;
        const [px, py] = toCell(x, y);
        ctx.fillStyle = `rgba(64,50,20,${(0.82 - f * 0.34) * dim})`;
        ctx.fillText(f > 0.82 ? "·" : ":", px, py);
      }
      const [ex, ey] = toCell(tipX, tipY);
      ctx.fillStyle = `rgba(255,248,214,${0.62 * dim})`;
      ctx.fillText("·", ex, ey);
    }
  }

  // Depth shade behind the animals plus a slow caustic net.
  function seahorseWater(t: number, fore: SeaPose, back: SeaPose) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    const shade = ctx.createRadialGradient(
      fore.x - 30,
      fore.y + 170,
      90,
      fore.x - 30,
      fore.y + 170,
      820,
    );
    shade.addColorStop(0, "rgba(12,72,80,0.2)");
    shade.addColorStop(1, "rgba(12,72,80,0)");
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(fore.x - 30, fore.y + 170, 820, 0, TAU);
    ctx.fill();

    const farShade = ctx.createRadialGradient(
      back.x - 16,
      back.y + 90,
      40,
      back.x - 16,
      back.y + 90,
      380,
    );
    farShade.addColorStop(0, "rgba(12,72,80,0.14)");
    farShade.addColorStop(1, "rgba(12,72,80,0)");
    ctx.fillStyle = farShade;
    ctx.beginPath();
    ctx.arc(back.x - 16, back.y + 90, 380, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Two slow light bands drifting across the shallows.
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let k = 0; k < 3; k++) {
      const off = ((t / T + k / 3) % 1) * (W + H) * 1.15 - H * 0.55;
      const band = ctx.createLinearGradient(off, 0, off + 300, 210);
      band.addColorStop(0, "rgba(255,250,220,0)");
      band.addColorStop(0.5, "rgba(255,248,206,0.05)");
      band.addColorStop(1, "rgba(255,250,220,0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    // Caustics: a dark net under a bright one, both sliding at integer
    // harmonics so the loop stays seamless.
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    for (let j = 0; j < ROWS; j += 4) {
      for (let i = 0; i < COLS; i += 3) {
        const x = i * CW;
        const y = j * CH;
        const v =
          Math.sin(x * 0.0075 + y * 0.006 - w * 2 * t + 1.8 * Math.sin(y * 0.007 + w * t)) +
          Math.sin(-x * 0.006 + y * 0.009 + w * 3 * t + 1.1 * Math.sin(x * 0.007 - w * 2 * t));
        if (v < 1.44) continue;
        const k = Math.min(1, (v - 1.44) / 0.9);
        ctx.fillStyle = `rgba(12,84,96,${0.08 + 0.16 * k})`;
        ctx.fillText(k > 0.6 ? "~" : "·", x + CW / 2, y + CH / 2);
      }
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let j = 0; j < ROWS; j += 4) {
      for (let i = 0; i < COLS; i += 3) {
        const x = i * CW;
        const y = j * CH;
        const v =
          Math.sin(x * 0.0085 + y * 0.005 + w * 2 * t + 1.6 * Math.sin(y * 0.0065 - w * 2 * t)) +
          Math.sin(-x * 0.0055 + y * 0.01 - w * 3 * t + 1.3 * Math.sin(x * 0.006 + w * t));
        if (v < 1.58) continue;
        const k = Math.min(1, (v - 1.58) / 0.82);
        ctx.fillStyle = `rgba(255,250,222,${0.09 + 0.26 * k})`;
        ctx.fillText(k > 0.56 ? "~" : "·", x + CW / 2, y + CH / 2);
      }
    }
    ctx.restore();
  }

  // Seagrass is drawn straight onto the cell grid so blades stay continuous
  // and can cross the animal without dissolving into the sampling pass.
  // Soft continuous strands sit behind the glyph blades. Three batched paths
  // fill in the bed at a fraction of the cost of thousands of glyphs.
  function seagrassStrands(t: number) {
    const buckets = [
      { color: "rgba(40,118,98,0.3)", width: 4 },
      { color: "rgba(92,134,66,0.28)", width: 4 },
      { color: "rgba(152,150,78,0.22)", width: 3 },
    ];
    ctx.save();
    ctx.lineCap = "round";
    for (let b = 0; b < buckets.length; b++) {
      ctx.beginPath();
      for (let k = b; k < 66; k += 3) {
        const x = ((k + 0.5) / 66) * W + (hash(k, 81, 5) - 0.5) * 130;
        const h = 320 + hash(k, 82, 7) * 1040;
        const lean = (hash(k, 83, 9) - 0.5) * 280;
        const phase = hash(k, 84, 11) * TAU;
        const sway = 0.6 * Math.sin(2 * w * t + phase) + 0.4 * Math.sin(3 * w * t + phase * 1.7);
        const steps = 8;
        ctx.moveTo(x, H + 12);
        for (let s = 1; s <= steps; s++) {
          const u = s / steps;
          ctx.lineTo(x + lean * u * u + sway * 34 * u * u, H + 12 - h * u);
        }
      }
      ctx.strokeStyle = buckets[b].color;
      ctx.lineWidth = buckets[b].width;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSeagrass(t: number, front: boolean) {
    for (const b of SEA_BLADES) {
      const isFront = !b.short && b.depth < 0.1;
      if (isFront !== front) continue;
      if (isFront && b.x > 500 && b.x < 1400 && b.h > 420) continue;
      const sway =
        0.58 * Math.sin(2 * w * t + b.phase) + 0.42 * Math.sin(3 * w * t + b.phase * 1.6);
      const amp = (34 + b.depth * 34) * (isFront ? 1.4 : 1);
      const base: RGB =
        b.tone < 0.38 ? [26, 92, 70] : b.tone < 0.7 ? [116, 132, 58] : [154, 158, 72];
      const c = front ? ([20, 58, 42] as RGB) : mix(base, [66, 150, 140], b.depth * 0.4);
      const alpha = front ? 0.9 : (b.short ? 0.5 : 0.6) + (1 - b.depth) * 0.24;
      const step = b.short ? 20 : 16;
      const steps = Math.max(4, Math.round(b.h / step));

      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const y = H + 14 - u * b.h;
        const x = b.x + b.lean * u * u + sway * amp * u * u;
        if (y < -20 || x < -20 || x > W + 20) continue;
        const i = Math.round(x / CW - 0.5);
        const j = Math.floor(y / CH);
        const slope = (b.lean * 2 * u + sway * amp * 2 * u) / -b.h;
        const glyph = slope > 0.14 ? "/" : slope < -0.14 ? "\\" : "|";
        const pulse = 0.86 + 0.14 * Math.sin(2 * w * t + b.phase + u * 2.4);
        const cols = u > 0.86 ? 1 : b.width;

        for (let col = 0; col < cols; col++) {
          ctx.fillStyle = rgb(c, alpha * pulse * (col === 0 ? 1 : 0.5));
          ctx.fillText(glyph, i * CW + CW / 2 + col * CW * 0.55, y + 4);
        }

        if (u > 0.9 && hash(i, j, 31) > 0.76) {
          ctx.fillStyle = `rgba(255,244,198,${0.36 * pulse})`;
          ctx.fillText("°", i * CW + CW / 2, y);
        }
      }
    }
  }

  // Bubbles and motes: the only things in front of the animal.
  function seahorseFront(t: number) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let k = 0; k < 30; k++) {
      const speed = 1 + ((hash(k, 11, 3) * 2) | 0);
      const u = ((t / T) * speed + hash(k, 12, 5)) % 1;
      const x = 90 + hash(k, 13, 7) * (W - 180) + 22 * Math.sin(u * TAU + hash(k, 14, 9) * TAU);
      const y = H - u * (H + 140);
      const a = (0.26 + hash(k, 15, 11) * 0.4) * (1 - u * 0.5);
      const glyph = ["·", "°", "o", "O"][(hash(k, 16, 13) * 4) | 0];
      ctx.fillStyle = `rgba(255,252,230,${a})`;
      ctx.fillText(glyph, Math.floor(x / CW) * CW + CW / 2, Math.floor(y / CH) * CH + CH / 2);
    }

    for (let k = 0; k < 52; k++) {
      const h1 = hash(k, 21, 3);
      const h2 = hash(k, 22, 5);
      const h3 = hash(k, 23, 7);
      const x = (((h1 * W + 26 * Math.sin(w * t + h3 * TAU)) % W) + W) % W;
      const y = (((h2 * H + 16 * Math.cos(2 * w * t + h3 * 17)) % H) + H) % H;
      ctx.fillStyle = `rgba(255,249,218,${0.06 + 0.22 * h3})`;
      ctx.fillText(h3 > 0.88 ? "°" : "·", x, y);
    }

    // Surface sparkle keeps the top of the frame alive.
    for (let j = 0; j < 5; j++) {
      for (let i = 0; i < COLS; i += 5) {
        const h = hash(i, j, Math.floor(t * 4) % 89);
        if (h < 0.82) continue;
        ctx.fillStyle = `rgba(255,255,238,${0.1 + h * 0.4})`;
        ctx.fillText(h > 0.94 ? "*" : "·", i * CW + CW / 2, j * CH + CH / 2 + 1);
      }
    }
    ctx.restore();
  }

  function drawSeahorseFrame(t: number) {
    ctx.drawImage(bgc, 0, 0);
    ctx.font = '500 15px "Geist Mono", ui-monospace, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Portrait crops need a little air around the pair; the wide embed card
    // needs the whole composition pulled in to survive its 16:10 crop.
    const stageAspect = stage ? stage.clientWidth / Math.max(1, stage.clientHeight) : W / H;
    const fit = stageAspect > 1.3 ? 0.8 : stageAspect < 0.58 ? 0.9 : 1;
    const [fore, back] = seaPoses(t, fit);

    seahorseWater(t, fore, back);
    seagrassStrands(t);
    drawSeagrass(t, false);

    const body = sample((g) => {
      // Background animal: cooler, softer, and set behind the grass.
      g.save();
      g.globalAlpha = 0.9;
      drawSeahorseAt(g, t, back);
      g.restore();
      g.save();
      g.globalCompositeOperation = "source-atop";
      g.fillStyle = "rgba(28,116,126,0.26)";
      g.fillRect(0, 0, W, H);
      g.restore();

      drawSeahorseAt(g, t, fore);
    });
    seahorseCells(body, t);
    seahorseFinRays(t, back);
    seahorseFinRays(t, fore);

    drawSeagrass(t, true);
    seahorseFront(t);
    compositeGlass(false, true);
  }

  // Pod cells keep the solid silhouette and let the glyphs read as skin, scar,
  // and sheen. Edge cells are pale marks so the flukes and dorsal fin survive.
  function podCells(L: Float32Array, t: number) {
    const alphaAt = (i: number, j: number) => {
      if (i < 0 || j < 0 || i >= COLS || j >= ROWS) return 0;
      return L[(j * COLS + i) * 4 + 3];
    };

    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const o = (j * COLS + i) * 4;
        const a = L[o + 3];
        if (a < 0.08) continue;
        const x = i * CW;
        const y = j * CH;
        const c: RGB = mix(
          [L[o], L[o + 1], L[o + 2]],
          water(x + CW / 2, y + CH / 2, "dolphin"),
          Math.min(0.36, Math.max(0, (1 - a) * 1.3)) * 0.3,
        );
        const l = lum(c);
        const flick = hash(i, j, Math.floor(t * 6));
        const rim =
          alphaAt(i - 1, j) < 0.4 ||
          alphaAt(i + 1, j) < 0.4 ||
          alphaAt(i, j - 1) < 0.4 ||
          alphaAt(i, j + 1) < 0.4;

        if (a > 0.4) {
          ctx.fillStyle = rgb(c, 0.94);
          ctx.fillRect(x + 1, y + 1, CW - 2, CH - 2);
          if (rim) {
            ctx.fillStyle = rgb(mix(c, [226, 252, 244], 0.58), 0.42 + 0.36 * a);
            ctx.fillText(POD_EDGE[(flick * POD_EDGE.length) | 0], x + CW / 2, y + CH / 2 + 1);
          } else {
            const index = Math.max(
              0,
              Math.min(
                POD_RAMP.length - 1,
                Math.floor((1 - l) * POD_RAMP.length * 0.94 + flick * 0.8),
              ),
            );
            const ink = l < 0.5 ? mix(c, [235, 253, 246], 0.66) : mix(c, [12, 52, 68], 0.68);
            ctx.fillStyle = rgb(ink, 0.3 + 0.2 * (1 - Math.abs(l - 0.44)));
            ctx.fillText(POD_RAMP[index], x + CW / 2, y + CH / 2 + 1);
          }
          if (flick > 0.992 && l > 0.34) {
            ctx.fillStyle = "rgba(244,255,250,0.62)";
            ctx.fillText("*", x + CW / 2, y + CH / 2 + 1);
          }
          continue;
        }

        const ink = l < 0.5 ? mix(c, [232, 253, 246], 0.58) : mix(c, [22, 88, 106], 0.42);
        ctx.fillStyle = rgb(ink, Math.min(0.76, 0.18 + a * 1.4));
        ctx.fillText(
          POD_EDGE[(hash(i, j, Math.floor(t * 5)) * POD_EDGE.length) | 0],
          x + CW / 2,
          y + CH / 2 + 1,
        );
      }
    }
  }

  // A few key marks are written straight to the cell grid: the eye, blowhole,
  // and beak line are too small to survive averaging, and they are what makes
  // the silhouettes read as dolphins rather than fish.
  function podDetails(t: number, camera: PodCamera) {
    const animals: Array<[PointPath, PodPalette, number, number, number]> = [
      [POD_SURFACE, POD_DOLPHIN_FAR, 0.58, 2.1, 0.2],
      [POD_DEEP, POD_DOLPHIN_FAR, 0.66, 4.4, -0.62],
      [POD_FORE, POD_DOLPHIN, 1.12, 0, 0.42],
    ];
    ctx.save();
    for (const [path, pal, scale, phase, bank] of animals) {
      const [x, y, a] = podPose(path, t, camera);
      const s = scale * camera.zoom;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const toCell = (lx: number, ly: number): [number, number] => {
        const px = x + (lx * ca - ly * sa) * s;
        const py = y + (lx * sa + ly * ca) * s;
        return [Math.floor(px / CW) * CW, Math.floor(py / CH) * CH];
      };
      const beat = bank * Math.sin(w * t + phase + 0.8);
      const squash = 1 - 0.15 * Math.abs(beat);
      const eye = toCell(190, 34 * squash);
      ctx.fillStyle = pal.eye;
      ctx.globalAlpha = 0.96;
      ctx.fillRect(eye[0] + 4, eye[1] + 5, CW - 8, CH - 10);
      ctx.fillStyle = pal.glint;
      ctx.fillRect(eye[0] + 6, eye[1] + 7, 3, 3);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = pal.eye;
      const blow = toCell(130, -25 * squash);
      ctx.fillRect(blow[0] + 5, blow[1] + 9, CW - 10, 4);
      ctx.globalAlpha = 0.46;
      for (let k = 0; k < 4; k++) {
        const u = k / 3;
        const mark = toCell(368 - u * 88, (4 + u * 11) * squash);
        ctx.fillRect(mark[0] + 5, mark[1] + 9, 6, 6);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function podWater(t: number, camera: PodCamera) {
    // Depth shade beneath each animal anchors the pod in the water column.
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    for (const [path, scale] of [
      [POD_SURFACE, 0.58],
      [POD_DEEP, 0.66],
      [POD_FORE, 1.12],
    ] as Array<[PointPath, number]>) {
      const [x, y, a] = podPose(path, t, camera);
      const radius = 420 * camera.zoom * scale;
      ctx.save();
      ctx.translate(x + 34, y + 62);
      ctx.rotate(a);
      ctx.scale(1.55, 0.52);
      const shade = ctx.createRadialGradient(0, 0, 20, 0, 0, radius);
      shade.addColorStop(0, "rgba(10,70,104,0.18)");
      shade.addColorStop(1, "rgba(10,70,104,0)");
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // Slow light bands, one set per loop.
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let k = 0; k < 3; k++) {
      const off = ((t / T + k / 3) % 1) * (W + H) * 1.16 - H * 0.58;
      const band = ctx.createLinearGradient(off, 0, off + 330, 230);
      band.addColorStop(0, "rgba(255,255,238,0)");
      band.addColorStop(0.5, "rgba(255,255,234,0.055)");
      band.addColorStop(1, "rgba(255,255,238,0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    // Caustics: a dark net, then a bright one, both loop-seamless.
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    for (let j = 0; j < ROWS; j += 4) {
      for (let i = 0; i < COLS; i += 3) {
        const x = i * CW;
        const y = j * CH;
        const v =
          Math.sin(x * 0.0072 + y * 0.0058 - w * 2 * t + 1.7 * Math.sin(y * 0.006 + w * t)) +
          Math.sin(-x * 0.0058 + y * 0.0088 + w * 3 * t + 1.2 * Math.sin(x * 0.006 - w * 2 * t));
        if (v < 1.44) continue;
        const k = Math.min(1, (v - 1.44) / 0.9);
        ctx.fillStyle = `rgba(10,86,104,${0.055 + 0.13 * k})`;
        ctx.fillText(k > 0.6 ? "~" : "·", x + CW / 2, y + CH / 2);
      }
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let j = 0; j < ROWS; j += 4) {
      for (let i = 0; i < COLS; i += 3) {
        const x = i * CW;
        const y = j * CH;
        const v =
          Math.sin(x * 0.0082 + y * 0.0048 + w * 2 * t + 1.5 * Math.sin(y * 0.0062 - w * 2 * t)) +
          Math.sin(-x * 0.0052 + y * 0.0096 - w * 3 * t + 1.4 * Math.sin(x * 0.0056 + w * t));
        if (v < 1.58) continue;
        const k = Math.min(1, (v - 1.58) / 0.8);
        ctx.fillStyle = `rgba(235,255,247,${0.08 + 0.26 * k})`;
        ctx.fillText(k > 0.56 ? "~" : "·", x + CW / 2, y + CH / 2);
      }
    }
    ctx.restore();

    // Surface shimmer skims the top of the frame and catches the near animal.
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let j = 0; j < 11; j++) {
      for (let i = 0; i < COLS; i += 2) {
        const x = i * CW + 10 * Math.sin(w * 2 * t + j * 1.7);
        const y = j * CH + 4 + 5 * Math.cos(w * 3 * t + i * 0.04);
        const v =
          Math.sin(x * 0.014 + y * 0.03 + w * 4 * t) +
          Math.sin(-x * 0.009 + y * 0.045 - w * 2 * t + 1.2);
        if (v < 1.22) continue;
        const k = Math.min(1, (v - 1.22) / 0.75);
        const fade = 1 - j / 13;
        ctx.fillStyle = `rgba(248,255,250,${(0.16 + 0.46 * k) * fade})`;
        ctx.fillText(k > 0.56 ? "~" : k > 0.24 ? "-" : "·", x + CW / 2, y + CH / 2);
      }
    }
    ctx.restore();
  }

  // Foam peeling off each fluke, drawn straight onto the cell grid so it stays
  // continuous instead of dissolving in the sampling pass.
  function podWakes(t: number, camera: PodCamera) {
    const trails: Array<[PointPath, number, number]> = [
      [POD_SURFACE, 0.58, 0.8],
      [POD_DEEP, 0.66, 0.58],
      [POD_FORE, 1.12, 1],
    ];
    for (const [path, scale, weight] of trails) {
      for (let k = 1; k <= 15; k++) {
        const [x, y, a] = podPose(path, t - k * 0.11, camera);
        const drift = (hash(k, scale * 100, 3) - 0.5) * k * 7 * camera.zoom;
        const spread = (22 + k * 5) * camera.zoom * scale;
        for (const side of [-1, 1]) {
          const px = x - Math.cos(a) * spread + -Math.sin(a) * drift * side;
          const py = y - Math.sin(a) * spread + Math.cos(a) * drift * side;
          if (px < -20 || px > W + 20 || py < -20 || py > H + 20) continue;
          ctx.fillStyle = `rgba(244,255,250,${0.36 * weight * (1 - k / 17)})`;
          ctx.fillText(
            k % 3 ? "·" : "~",
            Math.floor(px / CW) * CW + CW / 2,
            Math.floor(py / CH) * CH + CH / 2,
          );
        }
      }
    }

    // A near-surface ring and a few spray marks around the upper pod member.
    const [sx, sy, sa] = podPose(POD_SURFACE, t, camera);
    const ringScale = 0.58 * camera.zoom;
    const rx = 620 * ringScale;
    const ry = 180 * ringScale;
    const ca = Math.cos(sa);
    const sin = Math.sin(sa);
    for (let k = 0; k < 34; k++) {
      const u = k / 34;
      const angle = u * TAU;
      const wobble = 1 + 0.05 * Math.sin(w * 3 * t + k * 1.3);
      const lx = Math.cos(angle) * rx * wobble;
      const ly = Math.sin(angle) * ry * wobble;
      const px = sx + lx * ca - ly * sin;
      const py = sy + lx * sin + ly * ca;
      if (hash(k, 4, 8) < 0.16) continue;
      const sparkle = 0.5 + 0.5 * Math.sin(w * 4 * t + k * 0.9);
      ctx.fillStyle = `rgba(250,255,251,${0.16 + 0.3 * sparkle})`;
      ctx.fillText(
        sparkle > 0.72 ? "~" : "·",
        Math.floor(px / CW) * CW + CW / 2,
        Math.floor(py / CH) * CH + CH / 2,
      );
    }
    for (let k = 0; k < 10; k++) {
      const angle = -1.9 + k * 0.24 + 0.1 * Math.sin(w * 2 * t + k);
      const px = sx + Math.cos(angle) * rx * 0.82;
      const py = sy + Math.sin(angle) * ry * 1.45 - 10;
      ctx.fillStyle = `rgba(250,255,252,${0.26 + 0.2 * hash(k, 7, 11)})`;
      ctx.fillText(["·", "°", "*"][(hash(k, 8, 12) * 3) | 0], px, py);
    }
  }

  function podFront(t: number, camera: PodCamera) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let k = 0; k < 56; k++) {
      const speed = 1 + ((hash(k, 111, 3) * 2) | 0);
      const u = ((t / T) * speed + hash(k, 112, 5)) % 1;
      const x = 40 + hash(k, 113, 7) * (W - 80) + 30 * Math.sin(u * TAU + hash(k, 114, 9) * TAU);
      const y = H - u * (H + 160);
      const a = (0.26 + hash(k, 115, 11) * 0.38) * (1 - u * 0.4);
      const glyph = ["·", "°", "o", "O"][(hash(k, 116, 13) * 4) | 0];
      ctx.fillStyle = `rgba(247,255,249,${a})`;
      ctx.fillText(glyph, Math.floor(x / CW) * CW + CW / 2, Math.floor(y / CH) * CH + CH / 2);
    }

    for (let k = 0; k < 55; k++) {
      const h1 = hash(k, 121, 3);
      const h2 = hash(k, 122, 5);
      const h3 = hash(k, 123, 7);
      const x = (((h1 * W + 24 * Math.sin(w * t + h3 * TAU)) % W) + W) % W;
      const y = (((h2 * H + 15 * Math.cos(2 * w * t + h3 * 17)) % H) + H) % H;
      ctx.fillStyle = `rgba(240,255,248,${0.05 + 0.2 * h3})`;
      ctx.fillText(h3 > 0.9 ? "°" : h3 > 0.62 ? "+" : "·", x, y);
    }

    // A little air shaken loose in the foreground animal's wake.
    const [x, y, a] = podPose(POD_FORE, t, camera);
    for (let k = 0; k < 12; k++) {
      const u = ((t / T) * 2 + hash(k, 131, 3)) % 1;
      const px = x - Math.cos(a) * (110 + u * 260) + Math.sin(a) * (30 + u * 24);
      const py = y - Math.sin(a) * (110 + u * 260) - Math.cos(a) * (30 + u * 24);
      ctx.fillStyle = `rgba(250,255,251,${0.18 + 0.26 * (1 - u)})`;
      ctx.fillText(
        ["·", "°", "o"][(hash(k, 132, 5) * 3) | 0],
        Math.floor(px / CW) * CW + CW / 2,
        Math.floor(py / CH) * CH + CH / 2,
      );
    }
    ctx.restore();
  }

  function drawDolphinFrame(t: number) {
    ctx.drawImage(bgc, 0, 0);
    ctx.font = '500 15px "Geist Mono", ui-monospace, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const stageAspect = stage ? stage.clientWidth / Math.max(1, stage.clientHeight) : W / H;
    const camera = podCamera(stageAspect);
    podWater(t, camera);

    const layer = sample((g) => {
      const surface: [PointPath, PodPalette, number, number, number] = [
        POD_SURFACE,
        POD_DOLPHIN_FAR,
        0.58,
        2.1,
        0.2,
      ];
      const deep: [PointPath, PodPalette, number, number, number] = [
        POD_DEEP,
        POD_DOLPHIN_FAR,
        0.66,
        4.4,
        -0.62,
      ];
      const fore: [PointPath, PodPalette, number, number, number] = [
        POD_FORE,
        POD_DOLPHIN,
        1.12,
        0,
        0.42,
      ];
      // In the portrait crop the two lower animals can cross closely. Draw the
      // lower one last so its pale back stays visible instead of disappearing
      // under the foreground body.
      const animals = camera.narrow ? [surface, fore, deep] : [surface, deep, fore];
      for (const [path, pal, scale, phase, bank] of animals) {
        const [x, y, a] = podPose(path, t, camera);
        const beat = bank * Math.sin(w * t + phase + 0.8);
        put(g, x, y, a, scale * camera.zoom, (g) =>
          drawPodDolphin(g, t, pal, phase, scale < 0.7 ? 0.55 : 1, beat),
        );
      }
    });

    podCells(layer, t);
    podDetails(t, camera);
    podWakes(t, camera);
    podFront(t, camera);
  }

  // ---------- hammerhead pass ----------

  // Solid hammer cells keep the wide head and heterocercal tail intact; rim
  // cells turn pale so the silhouette survives the water behind it.
  function hammerCells(L: Float32Array, t: number) {
    const alphaAt = (i: number, j: number) => {
      if (i < 0 || j < 0 || i >= COLS || j >= ROWS) return 0;
      return L[(j * COLS + i) * 4 + 3];
    };

    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const o = (j * COLS + i) * 4;
        const a = L[o + 3];
        if (a < 0.08) continue;
        const x = i * CW;
        const y = j * CH;
        const c: RGB = mix(
          [L[o], L[o + 1], L[o + 2]],
          water(x + CW / 2, y + CH / 2, "hammer"),
          Math.min(0.34, Math.max(0, (1 - a) * 1.25)) * 0.28,
        );
        const l = lum(c);
        const flick = hash(i, j, Math.floor(t * 6));
        const rim =
          alphaAt(i - 1, j) < 0.4 ||
          alphaAt(i + 1, j) < 0.4 ||
          alphaAt(i, j - 1) < 0.4 ||
          alphaAt(i, j + 1) < 0.4;

        if (a > 0.4) {
          ctx.fillStyle = rgb(c, 0.95);
          ctx.fillRect(x + 1, y + 1, CW - 2, CH - 2);
          if (rim) {
            ctx.fillStyle = rgb(mix(c, [234, 255, 247], 0.72), 0.52 + 0.38 * a);
            ctx.fillText(HAMMER_EDGE[(flick * HAMMER_EDGE.length) | 0], x + CW / 2, y + CH / 2 + 1);
          } else {
            const index = Math.max(
              0,
              Math.min(
                HAMMER_RAMP.length - 1,
                Math.floor((1 - l) * HAMMER_RAMP.length * 0.94 + flick * 0.8),
              ),
            );
            const ink = l < 0.48 ? mix(c, [238, 252, 244], 0.64) : mix(c, [14, 48, 58], 0.66);
            ctx.fillStyle = rgb(ink, 0.3 + 0.2 * (1 - Math.abs(l - 0.44)));
            ctx.fillText(HAMMER_RAMP[index], x + CW / 2, y + CH / 2 + 1);
          }
          if (flick > 0.993 && l > 0.4) {
            ctx.fillStyle = "rgba(246,255,251,0.58)";
            ctx.fillText("*", x + CW / 2, y + CH / 2 + 1);
          }
          continue;
        }

        const ink = l < 0.5 ? mix(c, [236, 255, 248], 0.66) : mix(c, [20, 76, 96], 0.42);
        ctx.fillStyle = rgb(ink, Math.min(0.86, 0.24 + a * 1.5));
        ctx.fillText(
          HAMMER_EDGE[(hash(i, j, Math.floor(t * 5)) * HAMMER_EDGE.length) | 0],
          x + CW / 2,
          y + CH / 2 + 1,
        );
      }
    }
  }

  // Eyes, nostrils, mouth, and gill slits are too small for the averaged pass,
  // and they are exactly what makes the head read as a hammerhead.
  function hammerDetails(t: number, camera: HammerCamera) {
    const animals: Array<[PointPath, HammerPalette, number, number, number]> = [
      [HAMMER_FAR, HAMMER_SHARK_FAR, 0.58, 4.1, -0.5],
      [HAMMER_FORE, HAMMER_SHARK, 0.96, 0, 0.42],
    ];
    ctx.save();
    for (const [path, pal, scale, phase, bank] of animals) {
      const [x, y, a] = hammerPose(path, t, camera);
      const s = scale * camera.zoom;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const toCell = (lx: number, ly: number): [number, number] => {
        const px = x + (lx * ca - ly * sa) * s;
        const py = y + (lx * sa + ly * ca) * s;
        return [Math.floor(px / CW) * CW, Math.floor(py / CH) * CH];
      };
      const beat = bank * Math.sin(w * t + phase + 0.8);
      const squash = 1 - 0.12 * Math.abs(beat);
      const dim = scale < 0.52 ? 0.58 : 1;

      // Eyes at the outer ends of the cephalofoil. The near animal gets a
      // two-cell patch so the tips of the hammer stay unmistakable.
      const wide = s > 0.75 ? CW * 2 - 4 : CW - 6;
      for (const side of [-1, 1] as const) {
        const eye = toCell(378, side * 216 * squash);
        ctx.globalAlpha = 0.94 * dim;
        ctx.fillStyle = pal.eye;
        ctx.fillRect(eye[0] + (CW - wide) / 2, eye[1] + 4, wide, CH - 8);
        ctx.globalAlpha = 0.9 * dim;
        ctx.fillStyle = pal.glint;
        ctx.fillRect(eye[0] + CW / 2 - 2, eye[1] + 7, 4, 4);
        // A pale cap just beyond each eye makes the rounded lobe read.
        const cap = toCell(376, side * 252 * squash);
        ctx.globalAlpha = 0.5 * dim;
        ctx.fillStyle = "rgba(236,255,249,0.8)";
        ctx.fillRect(cap[0] + 4, cap[1] + 6, CW - 8, CH - 12);
      }

      // Scalloped mouth on the underside of the head bar.
      ctx.globalAlpha = 0.6 * dim;
      ctx.fillStyle = pal.mouth;
      for (let k = 0; k < 5; k++) {
        const u = k / 4;
        const lx = 368 + u * 34;
        const ly = 36 - u * 36;
        for (const side of [-1, 1]) {
          const mark = toCell(lx, side * ly);
          ctx.fillRect(mark[0] + 5, mark[1] + 9, 6, 4);
        }
      }

      // Nostrils and five gill slits on the near flank.
      ctx.globalAlpha = 0.46 * dim;
      for (const side of [-1, 1] as const) {
        const nose = toCell(396, side * 58);
        ctx.fillRect(nose[0] + 6, nose[1] + 10, 4, 3);
      }
      ctx.globalAlpha = 0.5 * dim;
      for (let k = 0; k < 5; k++) {
        const gillX = 300 + (248 - k * 12 - 300) * HAMMER_BODY_SCALE;
        const gill = toCell(gillX, 50);
        ctx.fillRect(gill[0] + 6, gill[1] + 3, 3, CH - 8);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function hammerWater(t: number, camera: HammerCamera) {
    // Depth shade beneath each animal anchors it in the water column.
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    for (const [path, scale] of [
      [HAMMER_FAR, 0.58],
      [HAMMER_FORE, 0.96],
    ] as Array<[PointPath, number]>) {
      const [x, y] = hammerPose(path, t, camera);
      const radius = 460 * camera.zoom * scale;
      ctx.save();
      ctx.translate(x + 30, y + 70);
      ctx.scale(1.7, 0.5);
      const shade = ctx.createRadialGradient(0, 0, 20, 0, 0, radius);
      shade.addColorStop(0, "rgba(8,60,96,0.16)");
      shade.addColorStop(1, "rgba(8,60,96,0)");
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // Slow light bands, one set per loop.
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let k = 0; k < 3; k++) {
      const off = ((t / T + k / 3) % 1) * (W + H) * 1.16 - H * 0.58;
      const band = ctx.createLinearGradient(off, 0, off + 350, 240);
      band.addColorStop(0, "rgba(255,255,240,0)");
      band.addColorStop(0.5, "rgba(255,255,238,0.06)");
      band.addColorStop(1, "rgba(255,255,240,0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    // Caustics: a dark net under a bright one, both loop-seamless.
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    for (let j = 0; j < ROWS; j += 4) {
      for (let i = 0; i < COLS; i += 3) {
        const x = i * CW;
        const y = j * CH;
        const v =
          Math.sin(x * 0.0074 + y * 0.006 - w * 2 * t + 1.8 * Math.sin(y * 0.0064 + w * t)) +
          Math.sin(-x * 0.0058 + y * 0.009 + w * 3 * t + 1.2 * Math.sin(x * 0.0062 - w * 2 * t));
        if (v < 1.44) continue;
        const k = Math.min(1, (v - 1.44) / 0.9);
        ctx.fillStyle = `rgba(10,80,102,${0.05 + 0.13 * k})`;
        ctx.fillText(k > 0.6 ? "~" : "·", x + CW / 2, y + CH / 2);
      }
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let j = 0; j < ROWS; j += 4) {
      for (let i = 0; i < COLS; i += 3) {
        const x = i * CW;
        const y = j * CH;
        const v =
          Math.sin(x * 0.0084 + y * 0.0049 + w * 2 * t + 1.5 * Math.sin(y * 0.0063 - w * 2 * t)) +
          Math.sin(-x * 0.0051 + y * 0.0098 - w * 3 * t + 1.4 * Math.sin(x * 0.0057 + w * t));
        if (v < 1.6) continue;
        const k = Math.min(1, (v - 1.6) / 0.8);
        ctx.fillStyle = `rgba(238,255,250,${0.09 + 0.27 * k})`;
        ctx.fillText(k > 0.56 ? "~" : "·", x + CW / 2, y + CH / 2);
      }
    }
    ctx.restore();

    // Surface shimmer across the top of the frame.
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let j = 0; j < 10; j++) {
      for (let i = 0; i < COLS; i += 2) {
        const x = i * CW + 12 * Math.sin(w * 2 * t + j * 1.6);
        const y = j * CH + 4 + 5 * Math.cos(w * 3 * t + i * 0.045);
        const v =
          Math.sin(x * 0.014 + y * 0.031 + w * 4 * t) +
          Math.sin(-x * 0.0092 + y * 0.044 - w * 2 * t + 1.1);
        if (v < 1.24) continue;
        const k = Math.min(1, (v - 1.24) / 0.72);
        const fade = 1 - j / 12;
        ctx.fillStyle = `rgba(250,255,252,${(0.16 + 0.44 * k) * fade})`;
        ctx.fillText(k > 0.56 ? "~" : k > 0.24 ? "-" : "·", x + CW / 2, y + CH / 2);
      }
    }
    ctx.restore();
  }

  // A thin wake peeling off each tail, written straight onto the cell grid so
  // it stays continuous at any scale.
  function hammerWakes(t: number, camera: HammerCamera) {
    const trails: Array<[PointPath, number, number]> = [
      [HAMMER_FAR, 0.58, 0.5],
      [HAMMER_FORE, 0.96, 1],
    ];
    for (const [path, scale, weight] of trails) {
      for (let k = 1; k <= 18; k++) {
        const [x, y, a] = hammerPose(path, t - k * 0.1, camera);
        const drift = (hash(k, scale * 100, 3) - 0.5) * k * 6 * camera.zoom;
        const spread = (28 + k * 5) * camera.zoom * scale;
        for (const side of [-1, 1]) {
          const px = x - Math.cos(a) * spread - Math.sin(a) * drift * side;
          const py = y - Math.sin(a) * spread + Math.cos(a) * drift * side;
          if (px < -20 || px > W + 20 || py < -20 || py > H + 20) continue;
          ctx.fillStyle = `rgba(244,255,250,${0.3 * weight * (1 - k / 20)})`;
          ctx.fillText(
            k % 3 ? "·" : "~",
            Math.floor(px / CW) * CW + CW / 2,
            Math.floor(py / CH) * CH + CH / 2,
          );
        }
      }
    }
  }

  // Bubbles and motes rise through the pass, with a short trail shaken loose
  // behind the near shark's tail.
  function hammerFront(t: number, camera: HammerCamera) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let k = 0; k < 58; k++) {
      const speed = 1 + ((hash(k, 161, 3) * 2) | 0);
      const u = ((t / T) * speed + hash(k, 162, 5)) % 1;
      const x = 40 + hash(k, 163, 7) * (W - 80) + 28 * Math.sin(u * TAU + hash(k, 164, 9) * TAU);
      const y = H - u * (H + 160);
      const a = (0.24 + hash(k, 165, 11) * 0.36) * (1 - u * 0.4);
      const glyph = ["·", "°", "o", "O"][(hash(k, 166, 13) * 4) | 0];
      ctx.fillStyle = `rgba(246,255,251,${a})`;
      ctx.fillText(glyph, Math.floor(x / CW) * CW + CW / 2, Math.floor(y / CH) * CH + CH / 2);
    }

    for (let k = 0; k < 52; k++) {
      const h1 = hash(k, 171, 3);
      const h2 = hash(k, 172, 5);
      const h3 = hash(k, 173, 7);
      const x = (((h1 * W + 24 * Math.sin(w * t + h3 * TAU)) % W) + W) % W;
      const y = (((h2 * H + 16 * Math.cos(2 * w * t + h3 * 17)) % H) + H) % H;
      ctx.fillStyle = `rgba(240,255,248,${0.05 + 0.18 * h3})`;
      ctx.fillText(h3 > 0.9 ? "°" : h3 > 0.62 ? "+" : "·", x, y);
    }

    // Air shaken loose in the foreground shark's wake.
    const [x, y, a] = hammerPose(HAMMER_FORE, t, camera);
    for (let k = 0; k < 14; k++) {
      const u = ((t / T) * 2 + hash(k, 181, 3)) % 1;
      const px = x - Math.cos(a) * (140 + u * 300) + Math.sin(a) * (36 + u * 30);
      const py = y - Math.sin(a) * (140 + u * 300) - Math.cos(a) * (36 + u * 30);
      ctx.fillStyle = `rgba(250,255,251,${0.16 + 0.26 * (1 - u)})`;
      ctx.fillText(
        ["·", "°", "o"][(hash(k, 182, 5) * 3) | 0],
        Math.floor(px / CW) * CW + CW / 2,
        Math.floor(py / CH) * CH + CH / 2,
      );
    }
    ctx.restore();
  }

  function drawHammerFrame(t: number) {
    ctx.drawImage(bgc, 0, 0);
    ctx.font = '500 15px "Geist Mono", ui-monospace, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const stageAspect = stage ? stage.clientWidth / Math.max(1, stage.clientHeight) : W / H;
    const camera = hammerCamera(stageAspect);
    hammerWater(t, camera);

    const layer = sample((g) => {
      // Far animal first: cooler, smaller, and on the opposite circuit.
      const [bx0, by0, ba] = pose(HAMMER_FAR, t);
      const [bx, by] = camera.map(bx0, by0);
      const farBank = -0.42 * Math.sin(w * t + 4.4);
      put(g, bx, by, ba, 0.58 * camera.zoom, (g) =>
        drawHammerShark(g, t, HAMMER_SHARK_FAR, 4.1, 0.5, farBank),
      );

      const [fx0, fy0, fa] = pose(HAMMER_FORE, t);
      const [fx, fy] = camera.map(fx0, fy0);
      const foreBank = 0.5 * Math.sin(w * t + 0.7);
      put(g, fx, fy, fa, 0.96 * camera.zoom, (g) =>
        drawHammerShark(g, t, HAMMER_SHARK, 0, 1, foreBank),
      );

      // Pilot fish ride the pressure wave around the near shark's head.
      const ca = Math.cos(fa);
      const sa = Math.sin(fa);
      g.save();
      g.globalAlpha = 0.86;
      for (const [dx, dy, s] of PILOT_FISH) {
        const px = fx + (dx * ca - dy * sa) * 0.96 * camera.zoom;
        const py = fy + (dx * sa + dy * ca) * 0.96 * camera.zoom;
        const wob = 8 * Math.sin(w * 11 * t + dx * 0.02);
        put(g, px, py + wob, fa + 0.16 * Math.sin(w * 9 * t + dy), s * 0.96 * camera.zoom, (g) =>
          tang(g, t, dx, HAMMER_PILOT),
        );
      }
      g.restore();
    });

    hammerCells(layer, t);
    hammerDetails(t, camera);
    hammerWakes(t, camera);
    hammerFront(t, camera);
    compositeGlass(false, false, true);
  }

  function drawTurtleFrame(t: number) {
    ctx.drawImage(bgc, 0, 0);
    ctx.font = '500 15px "Geist Mono", ui-monospace, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    turtleBackGlyphs(t);
    const body = sample((g) => drawHonu(g, t));
    macroCells(body, t);
    turtleFrontGlyphs(t);
    compositeGlass(false, true);
  }

  function tangCells(L: Float32Array, t: number) {
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const o = (j * COLS + i) * 4;
        const a = L[o + 3];
        if (a < 0.07) continue;
        const x = i * CW;
        const y = j * CH;
        const c: RGB = mix(
          [L[o], L[o + 1], L[o + 2]],
          water(x + CW / 2, y + CH / 2, "tang"),
          Math.max(0, (1 - a) * 0.5) * 0.2,
        );
        const l = lum(c);
        const flick = hash(i, j, Math.floor(t * 6));

        if (a > 0.5) {
          ctx.fillStyle = rgb(c, 0.95);
          ctx.fillRect(x + 1, y + 1, CW - 2, CH - 2);
          const index = Math.max(
            0,
            Math.min(
              TANG_RAMP.length - 1,
              Math.floor((1 - l) * TANG_RAMP.length * 0.9 + flick * 0.8),
            ),
          );
          const ink = l < 0.48 ? mix(c, [255, 255, 236], 0.66) : mix(c, [70, 38, 0], 0.58);
          ctx.fillStyle = rgb(ink, 0.22 + 0.16 * (1 - Math.abs(l - 0.56)));
          ctx.fillText(TANG_RAMP[index], x + CW / 2, y + CH / 2 + 1);
          if (flick > 0.994 && l > 0.56) {
            ctx.fillStyle = "rgba(255,255,238,0.66)";
            ctx.fillText("*", x + CW / 2, y + CH / 2 + 1);
          }
          continue;
        }

        // Fins are thinner than the body: tint the cell only faintly and let a
        // pale mark carry the membrane.
        ctx.fillStyle = rgb(mix(c, [255, 241, 168], 0.35), Math.min(0.42, a * 0.86));
        ctx.fillRect(x + 4, y + 5, CW - 8, CH - 10);
        ctx.fillStyle = rgb(mix(c, [255, 251, 216], 0.5), Math.min(0.82, a * 1.55));
        ctx.fillText(
          TANG_EDGE[(hash(i, j, Math.floor(t * 5)) * TANG_EDGE.length) | 0],
          x + CW / 2,
          y + CH / 2 + 1,
        );
      }
    }
  }

  // Eye marks and a snout glint are written straight to the cell grid: averaging
  // would swallow them on the smaller fish, and they are what makes each disc
  // read as a tang rather than a yellow blob.
  function tangDetails(placements: TangPlacement[]) {
    ctx.save();
    for (const p of placements) {
      const ca = Math.cos(p.a);
      const sa = Math.sin(p.a);
      const mirror = p.flip ? -1 : 1;
      const mapPoint = (lx: number, ly: number): [number, number] => {
        const my = ly * mirror;
        return [p.x + (lx * ca - my * sa) * p.s, p.y + (lx * sa + my * ca) * p.s];
      };

      const [ex, ey] = mapPoint(78, -19);
      const size = p.near ? 18 : Math.max(6, p.s * 7);
      ctx.globalAlpha = p.near ? 0.92 : 0.72;
      ctx.fillStyle = "#221a06";
      ctx.fillRect(ex - size / 2, ey - size / 2, size, size);
      if (p.near || p.s > 0.7) {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#fffbe4";
        const g = p.near ? 4 : 2;
        ctx.fillRect(ex + size * 0.16, ey - size * 0.34, g, g);
      }

      if (p.near) {
        const [sx, sy] = mapPoint(160, 0);
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "#fff8cf";
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Depth shade behind the school, slow sun bands, and a warm caustic net.
  function tangWater(t: number, camera: TangCamera) {
    const [gx, gy] = camera.map(...P_TANG_SCHOOL(t));
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    const shade = ctx.createRadialGradient(
      gx - 20,
      gy + 90,
      80,
      gx - 20,
      gy + 90,
      760 * camera.zoom,
    );
    shade.addColorStop(0, "rgba(4,92,94,0.16)");
    shade.addColorStop(0.62, "rgba(4,88,102,0.08)");
    shade.addColorStop(1, "rgba(4,80,110,0)");
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(gx - 20, gy + 90, 760 * camera.zoom, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let k = 0; k < 3; k++) {
      const off = ((t / T + k / 3) % 1) * (W + H) * 1.16 - H * 0.58;
      const band = ctx.createLinearGradient(off, 0, off + 320, 220);
      band.addColorStop(0, "rgba(255,255,224,0)");
      band.addColorStop(0.5, "rgba(255,253,214,0.06)");
      band.addColorStop(1, "rgba(255,255,224,0)");
      ctx.fillStyle = band;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    // Dark caustic net under the bright one.
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    for (let j = 0; j < ROWS; j += 4) {
      for (let i = 0; i < COLS; i += 3) {
        const x = i * CW;
        const y = j * CH;
        const v =
          Math.sin(x * 0.0078 + y * 0.0058 - w * 2 * t + 1.7 * Math.sin(y * 0.0065 + w * t)) +
          Math.sin(-x * 0.0056 + y * 0.0092 + w * 3 * t + 1.2 * Math.sin(x * 0.0062 - w * 2 * t));
        if (v < 1.46) continue;
        const k = Math.min(1, (v - 1.46) / 0.9);
        ctx.fillStyle = `rgba(8,96,88,${0.055 + 0.12 * k})`;
        ctx.fillText(k > 0.6 ? "~" : "·", x + CW / 2, y + CH / 2);
      }
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let j = 0; j < ROWS; j += 4) {
      for (let i = 0; i < COLS; i += 3) {
        const x = i * CW;
        const y = j * CH;
        const v =
          Math.sin(x * 0.0086 + y * 0.0049 + w * 2 * t + 1.5 * Math.sin(y * 0.0061 - w * 2 * t)) +
          Math.sin(-x * 0.0051 + y * 0.0098 - w * 3 * t + 1.4 * Math.sin(x * 0.0057 + w * t));
        if (v < 1.58) continue;
        const k = Math.min(1, (v - 1.58) / 0.8);
        ctx.fillStyle = `rgba(255,251,214,${0.08 + 0.24 * k})`;
        ctx.fillText(k > 0.56 ? "~" : "·", x + CW / 2, y + CH / 2);
      }
    }
    ctx.restore();

    // Surface shimmer across the top of the frame.
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let j = 0; j < 10; j++) {
      for (let i = 0; i < COLS; i += 2) {
        const x = i * CW + 12 * Math.sin(w * 2 * t + j * 1.7);
        const y = j * CH + 4 + 5 * Math.cos(w * 3 * t + i * 0.045);
        const v =
          Math.sin(x * 0.014 + y * 0.031 + w * 4 * t) +
          Math.sin(-x * 0.009 + y * 0.044 - w * 2 * t + 1.1);
        if (v < 1.24) continue;
        const k = Math.min(1, (v - 1.24) / 0.72);
        const fade = 1 - j / 12;
        ctx.fillStyle = `rgba(255,255,238,${(0.15 + 0.44 * k) * fade})`;
        ctx.fillText(k > 0.56 ? "~" : k > 0.24 ? "-" : "·", x + CW / 2, y + CH / 2);
      }
    }
    ctx.restore();
  }

  // Bubbles and drifting particles in front of the school.
  function tangFront(t: number, camera: TangCamera) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let k = 0; k < 48; k++) {
      const speed = 1 + ((hash(k, 241, 3) * 2) | 0);
      const u = ((t / T) * speed + hash(k, 242, 5)) % 1;
      const x = 40 + hash(k, 243, 7) * (W - 80) + 26 * Math.sin(u * TAU + hash(k, 244, 9) * TAU);
      const y = H - u * (H + 150);
      const a = (0.22 + hash(k, 245, 11) * 0.34) * (1 - u * 0.35);
      const glyph = ["·", "°", "o", "O"][(hash(k, 246, 13) * 4) | 0];
      ctx.fillStyle = `rgba(255,252,222,${a})`;
      ctx.fillText(glyph, Math.floor(x / CW) * CW + CW / 2, Math.floor(y / CH) * CH + CH / 2);
    }

    for (let k = 0; k < 58; k++) {
      const h1 = hash(k, 251, 3);
      const h2 = hash(k, 252, 5);
      const h3 = hash(k, 253, 7);
      const x = (((h1 * W + 28 * Math.sin(w * t + h3 * TAU)) % W) + W) % W;
      const y = (((h2 * H + 18 * Math.cos(2 * w * t + h3 * 17)) % H) + H) % H;
      ctx.fillStyle = `rgba(255,251,216,${0.05 + 0.2 * h3})`;
      ctx.fillText(h3 > 0.9 ? "°" : h3 > 0.62 ? "+" : "·", x, y);
    }

    // Brighter motes drift right through the near fish's path.
    const [nx, ny] = camera.map(...P_TANG_NEAR_A(t));
    for (let k = 0; k < 14; k++) {
      const u = ((t / T) * 2 + hash(k, 261, 3)) % 1;
      const x = nx - 160 + u * 420 + 22 * Math.sin(u * TAU + k);
      const y = ny - 120 + hash(k, 262, 5) * 240 + 14 * Math.cos(w * 2 * t + k);
      ctx.fillStyle = `rgba(255,249,194,${0.14 + 0.24 * (0.5 + 0.5 * Math.sin(w * 2 * t + k))})`;
      ctx.fillText(
        k % 3 ? "·" : "°",
        Math.floor(x / CW) * CW + CW / 2,
        Math.floor(y / CH) * CH + CH / 2,
      );
    }

    ctx.restore();
  }

  function drawTangFrame(t: number) {
    ctx.drawImage(bgc, 0, 0);
    ctx.font = '500 15px "Geist Mono", ui-monospace, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const stageAspect = stage ? stage.clientWidth / Math.max(1, stage.clientHeight) : W / H;
    const camera = tangCamera(stageAspect);
    const placements = tangPlacements(t, camera);

    tangWater(t, camera);

    const layer = sample((g) => {
      for (const p of placements) {
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.a);
        if (p.flip) g.scale(1, -1);
        g.scale(p.s, p.s);
        drawSchoolTang(g, t, p.ph, p.pal, p.near);
        g.restore();
      }
    });

    tangCells(layer, t);
    tangDetails(placements);
    tangFront(t, camera);
    compositeGlass(false, false, true);
  }

  function draw(t: number) {
    t = ((t % T) + T) % T;
    if (scene === "turtle") {
      drawTurtleFrame(t);
      return;
    }
    if (scene === "manta") {
      drawMantaFrame(t);
      return;
    }
    if (scene === "seahorse") {
      drawSeahorseFrame(t);
      return;
    }
    if (scene === "dolphin") {
      drawDolphinFrame(t);
      return;
    }
    if (scene === "hammer") {
      drawHammerFrame(t);
      return;
    }
    if (scene === "tang") {
      drawTangFrame(t);
      return;
    }
    const night = scene === "night";
    ctx.drawImage(bgc, 0, 0);

    if (!night) {
      // sun bands drifting over the lagoon
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let k = 0; k < 4; k++) {
        const off = ((t / T + k / 4) % 1) * (W + H) * 1.2 - H * 0.6;
        const g = ctx.createLinearGradient(off, 0, off + 260, 160);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.5, "rgba(255,255,240,0.10)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    }

    ctx.font = '500 15px "Geist Mono", ui-monospace, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (!night) {
      // caustic net + surface glints
      for (let j = 0; j < ROWS; j++) {
        for (let i = 0; i < COLS; i++) {
          const x = i * CW;
          const y = j * CH;
          const v =
            Math.sin(x * 0.011 + y * 0.004 + w * 2 * t + 1.6 * Math.sin(y * 0.007 - w * 3 * t)) +
            Math.sin(-x * 0.006 + y * 0.012 - w * 3 * t + 1.6 * Math.sin(x * 0.008 + w * 2 * t)) +
            Math.sin(x * 0.009 - y * 0.009 + w * 4 * t + 1.2 * Math.sin((x + y) * 0.005 + w * t));
          if (v > 1.55) {
            const k = Math.min(1, (v - 1.55) / 1.2);
            ctx.fillStyle = `rgba(255,255,255,${0.16 + 0.42 * k})`;
            ctx.fillText(k > 0.6 ? "~" : k > 0.3 ? "-" : "·", x + CW / 2, y + CH / 2);
          }
          const gl = hash(i, j, Math.floor(t * 6) % 147);
          if (gl > 0.9988) {
            const f = Math.sin(((t * 6) % 1) * Math.PI);
            ctx.fillStyle = `rgba(255,255,255,${0.95 * f})`;
            ctx.fillText(gl > 0.9995 ? "*" : "+", x + CW / 2, y + CH / 2);
          }
        }
      }
    }

    cells(night ? reefNight : reef, night ? 0.6 : 0.62, t, true, night);

    const whalePath = night ? P_NIGHT.whale : P.whale;
    const deep = sample((g) => {
      const [x, y, a] = pose(whalePath, t);
      put(g, x, y, a, 1, (g) => whale(g, t, night ? NIGHT_WHALE : DAY_WHALE));
    });
    cells(deep, night ? 0.38 : 0.4, t, true, night);

    if (night) nightSurface(t);

    const main = sample((g) => {
      const mantaPath = night ? P_NIGHT.manta : P.manta;
      const dolphinPath = night ? P_NIGHT.dolphin : P.dolphin;
      const mantaPal = night ? NIGHT_MANTA : DAY_MANTA;
      const dolphinPal = night ? NIGHT_DOLPHIN : DAY_DOLPHIN;
      const turtlePal = night ? NIGHT_TURTLE : DAY_TURTLE;
      const tangPal = night ? NIGHT_TANG : DAY_TANG;
      let [x, y, a] = pose(mantaPath, t);
      put(g, x, y, a, 1.2, (g) => manta(g, t, mantaPal));
      for (const [dx, ph] of [
        [0, 0],
        [1, 1.3],
      ]) {
        [x, y, a] = pose(dolphinPath, t - dx * 0.18);
        put(g, x + dx * 120 * Math.sin(a), y - dx * 120 * Math.cos(a), a, 1.25, (g) =>
          dolphin(g, t, ph, dolphinPal),
        );
      }
      [x, y, a] = pose(P.turtleA, t);
      put(g, x, y, a, 1.55, (g) => turtle(g, t, 0, turtlePal));
      [x, y, a] = pose(P.turtleB, t);
      put(g, x, y, a, night ? 1.15 : 1.3, (g) => turtle(g, t, 2, turtlePal));
      [x, y, a] = pose(P.turtleC, t);
      put(g, x, y, a, 1.1, (g) => turtle(g, t, 4, turtlePal));
      [x, y, a] = pose(P.school, t);
      FISH.forEach(([fx, fy], k) => {
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        const wob = 14 * Math.sin(w * 7 * t + k);
        put(
          g,
          x + fx * ca - (fy + wob) * sa,
          y + fx * sa + (fy + wob) * ca,
          a + 0.15 * Math.sin(w * 9 * t + k),
          night ? 1.5 : 1.35,
          (g) => tang(g, t, k, tangPal),
        );
      });
      for (const [kind, p0, y0, s, dir] of FLOWERS) {
        const u = (p0 + t / T) % 1;
        const fx = -220 + u * (W + 440);
        const fy = y0 + u * 420 + 30 * Math.sin(w * 3 * t + p0 * 9);
        if (night) g.globalAlpha = 0.5;
        put(g, fx, fy, dir * w * t + p0 * 6, 1, (g) =>
          kind === "h"
            ? hibiscus(g, s, night ? NIGHT_HIBISCUS : DAY_HIBISCUS)
            : plumeria(g, s, night ? NIGHT_PLUMERIA : DAY_PLUMERIA),
        );
        if (night) g.globalAlpha = 1;
      }
    });

    if (!night) {
      // shadows on the sand, offset down-right from the sun
      ctx.fillStyle = "rgba(4,60,84,0.16)";
      for (let j = 0; j < ROWS - 2; j++) {
        for (let i = 0; i < COLS - 2; i++) {
          const a = main[(j * COLS + i) * 4 + 3];
          if (a > 0.3) ctx.fillRect((i + 2) * CW, (j + 2) * CH, CW, CH);
        }
      }
    }

    // foam wakes behind the swimmers
    const wakes: Array<[PointPath, number]> = night
      ? [
          [P.turtleA, 1.5],
          [P.turtleB, 1.15],
          [P.turtleC, 1.1],
          [P_NIGHT.manta, 1.6],
          [P_NIGHT.dolphin, 1.4],
        ]
      : [
          [P.turtleA, 1.5],
          [P.turtleB, 1.3],
          [P.turtleC, 1.1],
          [P.manta, 1.6],
          [P.dolphin, 1.4],
        ];
    for (const [fn, len] of wakes) {
      for (let k = 1; k <= 16; k++) {
        const [x, y, a] = pose(fn, t - k * 0.09 - 0.35 * len);
        const side = (hash(k, len, 3) - 0.5) * k * 9;
        const px = x + side * -Math.sin(a);
        const py = y + side * Math.cos(a);
        ctx.fillStyle = night
          ? `rgba(104,226,238,${0.3 * (1 - k / 17)})`
          : `rgba(255,255,255,${0.55 * (1 - k / 17)})`;
        const wakeGlyphs = night ? "·°*" : ".·o°";
        ctx.fillText(
          wakeGlyphs[(hash(k, len, Math.floor(t * 5)) * wakeGlyphs.length) | 0],
          Math.floor(px / CW) * CW + CW / 2,
          Math.floor(py / CH) * CH + CH / 2,
        );
      }
    }

    cells(main, 0, t, true, night);

    if (night) moonPath(t);

    compositeGlass(night, false);
  }

  // Frosted glass under the UI: a blurred copy masked by a soft ellipse. The
  // blur is the most expensive pass, so refresh it at a third of the scene
  // rate and keep compositing the last one in between. Macro uses a smaller,
  // warmer mask so the eye and crown stay crisp above the frosted band.
  function compositeGlass(night: boolean, macro: boolean, soft = false) {
    const gy = macro ? 985 : 860;
    const squash = macro ? 0.27 : soft ? 0.3 : 0.46;
    const radius = macro ? 680 : soft ? 640 : 800;
    glassFrame++;
    if (glassFrame === 1 || glassFrame % 3 === 0) {
      blx.globalCompositeOperation = "source-over";
      blx.clearRect(0, 0, W, H);
      blx.filter = night ? "blur(7px)" : macro ? "blur(9px)" : soft ? "blur(6px)" : "blur(11px)";
      blx.drawImage(canvas, 0, 0);
      blx.filter = "none";
      blx.globalCompositeOperation = "destination-in";
      blx.save();
      blx.translate(958, gy);
      blx.scale(1, squash);
      const m = blx.createRadialGradient(0, 0, 0, 0, 0, radius);
      m.addColorStop(0, "#000");
      m.addColorStop(0.62, "#000");
      m.addColorStop(1, "rgba(0,0,0,0)");
      blx.fillStyle = m;
      blx.fillRect(-1000, -1000, 2000, 2000);
      blx.restore();
    }
    ctx.globalAlpha = night ? 0.62 : macro ? 0.58 : soft ? 0.5 : 1;
    ctx.drawImage(blc, 0, 0);
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(958, gy);
    ctx.scale(1, squash);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, macro ? 720 : soft ? 660 : 820);
    if (night) {
      glow.addColorStop(0, "rgba(104,196,226,0.12)");
      glow.addColorStop(0.55, "rgba(52,120,178,0.07)");
      glow.addColorStop(1, "rgba(20,50,90,0)");
    } else if (macro) {
      glow.addColorStop(0, "rgba(255,246,214,0.42)");
      glow.addColorStop(0.55, "rgba(255,235,184,0.26)");
      glow.addColorStop(1, "rgba(255,226,164,0)");
    } else if (soft) {
      glow.addColorStop(0, "rgba(240,255,252,0.4)");
      glow.addColorStop(0.55, "rgba(230,252,250,0.22)");
      glow.addColorStop(1, "rgba(220,250,250,0)");
    } else {
      glow.addColorStop(0, "rgba(240,255,252,0.62)");
      glow.addColorStop(0.55, "rgba(230,252,250,0.38)");
      glow.addColorStop(1, "rgba(220,250,250,0)");
    }
    ctx.fillStyle = glow;
    ctx.fillRect(-1000, -1000, 2000, 2000);
    ctx.restore();
  }

  let running = false;
  let visible = true;
  let raf = 0;
  let lastNow = 0;
  let time = 0;
  let frames = 0;
  let glassFrame = 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function publish(state: "idle" | "running" | "paused" | "static") {
    if (!stage) return;
    stage.dataset.lagoonState = state;
    stage.dataset.lagoonFrames = String(frames);
  }

  function paint(t: number) {
    draw(t);
    frames++;
    if (stage) {
      stage.dataset.lagoonFrames = String(frames);
      stage.dataset.lagoonTime = t.toFixed(2);
    }
  }

  function loop(now: number) {
    if (!running) return;
    if (!lastNow) lastNow = now;
    const delta = now - lastNow;
    if (delta >= FRAME_MS) {
      time += Math.min(delta, 250) / 1000;
      lastNow = now;
      paint(time);
    }
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (reduced.matches || running) return;
    running = true;
    lastNow = 0;
    publish("running");
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (!running) {
      if (stage && reduced.matches) publish("static");
      return;
    }
    running = false;
    cancelAnimationFrame(raf);
    lastNow = 0;
    publish("paused");
  }

  function drawStatic() {
    running = false;
    cancelAnimationFrame(raf);
    lastNow = 0;
    time = STATIC_TIME;
    paint(time);
    publish("static");
  }

  if (reduced.matches) {
    drawStatic();
  } else {
    paint(STATIC_TIME);
    publish("idle");
  }

  const onVisibility = () => {
    if (document.hidden) stop();
    else if (visible) start();
  };

  const onMotionChange = () => {
    if (reduced.matches) drawStatic();
    else if (visible) start();
  };

  document.addEventListener("visibilitychange", onVisibility);
  reduced.addEventListener("change", onMotionChange);

  let observer: IntersectionObserver | undefined;
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
        if (reduced.matches) return;
        if (visible) start();
        else stop();
      },
      { rootMargin: "180px 0px" },
    );
    observer.observe(canvas);
  } else if (visible) {
    start();
  }

  document.fonts?.ready.then(() => {
    if (!running) paint(reduced.matches ? STATIC_TIME : time);
  });

  function setScene(next: LagoonScene) {
    const normalized = normalizeScene(next);
    if (normalized === scene) return;
    scene = normalized;
    if (stage) stage.dataset.lagoonScene = scene;
    paintBackground();
    glassFrame = 0;
    if (reduced.matches) {
      drawStatic();
      return;
    }
    paint(time);
    if (!running && visible && !document.hidden) start();
  }

  return {
    start,
    stop,
    setScene,
    destroy: () => {
      running = false;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onMotionChange);
    },
  };
}

export function mountLagoons(scene: LagoonScene = "day") {
  return [...document.querySelectorAll<HTMLCanvasElement>("[data-lagoon-canvas]")].map((canvas) =>
    createLagoonPainter(canvas, { scene }),
  );
}
