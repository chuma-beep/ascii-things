type Mark = "ink" | "murmuration";

const KANJI_FONT = "'Noto Serif CJK JP', 'Yu Mincho', 'Hiragino Mincho ProN', serif";
const INK_CHARS = ["永", "風", "水", "空", "光", "雲"];
const FLOCK_CHARS = ["羽", "飛", "鳥", "風", "空", "光"];

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

interface InkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  speed: number;
  size: number;
  char: string;
  ember: boolean;
  history: number[];
}

interface InkFieldState {
  particles: InkParticle[];
}

interface FlockParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  phase: number;
  size: number;
  char: string;
  accent: boolean;
}

interface FlockState {
  particles: FlockParticle[];
}

function drawPaper(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const paper = ctx.createLinearGradient(0, 0, width, height);
  paper.addColorStop(0, "#f4eee1");
  paper.addColorStop(0.55, "#eee4d2");
  paper.addColorStop(1, "#dfd2bd");
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, width, height);

  const rng = random(31);
  for (let i = 0; i < 180; i += 1) {
    const x = rng() * width;
    const y = rng() * height;
    ctx.globalAlpha = 0.02 + rng() * 0.05;
    ctx.fillStyle = rng() > 0.5 ? "#4e3b2b" : "#fffaf0";
    ctx.fillRect(x, y, 1 + rng() * 2, 1);
  }
  ctx.globalAlpha = 1;
}

function resetInk(width: number, height: number, state: InkFieldState, reduced: boolean) {
  const rng = random(41);
  state.particles = Array.from({ length: 52 }, (_, index) => {
    const x = rng() * width;
    const y = rng() * height;
    const angle = rng() * Math.PI * 2;
    const trail = 10 + Math.floor(rng() * 7);
    const history: number[] = [];
    for (let i = trail; i >= 0; i -= 1) {
      history.push(x - Math.cos(angle) * i * 2.4, y - Math.sin(angle) * i * 2.4);
    }
    return {
      x,
      y,
      vx: reduced ? 0 : (rng() - 0.5) * 0.4,
      vy: reduced ? 0 : (rng() - 0.5) * 0.4,
      phase: rng() * Math.PI * 2,
      speed: 0.35 + rng() * 1.1,
      size: 1.0 + rng() * 1.4,
      char: index % 9 === 0 ? INK_CHARS[index % INK_CHARS.length] : "",
      ember: index % 31 === 0,
      history,
    };
  });
}

function drawInkField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  delta: number,
  state: InkFieldState,
  animate: boolean,
) {
  drawPaper(ctx, width, height);

  const washes = [
    [0.26, 0.34, 0.25],
    [0.66, 0.28, 0.2],
    [0.5, 0.68, 0.28],
  ];
  for (let i = 0; i < washes.length; i += 1) {
    const [x, y, r] = washes[i];
    const radius = Math.min(width, height) * r;
    const glow = ctx.createRadialGradient(width * x, height * y, 0, width * x, height * y, radius);
    glow.addColorStop(0, `rgba(28, 24, 20, ${0.045 + 0.02 * Math.sin(time * 0.35 + i)})`);
    glow.addColorStop(1, "rgba(28, 24, 20, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const ribbonBase = Math.max(1.5, Math.min(width, height) * 0.006);
  for (let r = 0; r < 7; r += 1) {
    const ribbonRng = random(101 + r * 37);
    let x = width * (0.06 + ribbonRng() * 0.88);
    let y = height * (0.08 + ribbonRng() * 0.84);
    const points: Array<[number, number]> = [];

    for (let step = 0; step < 38; step += 1) {
      const angle =
        Math.sin(x * 0.006 + time * 0.28 + r) * 1.25 + Math.cos(y * 0.008 - time * 0.22) * 1.05;
      x += Math.cos(angle) * Math.max(4, width * 0.026);
      y += Math.sin(angle) * Math.max(4, width * 0.02);
      points.push([x, y]);
      if (x < -40 || x > width + 40 || y < -40 || y > height + 40) break;
    }

    if (points.length > 2) {
      const left: Array<[number, number]> = [];
      const right: Array<[number, number]> = [];
      for (let j = 0; j < points.length; j += 1) {
        const prev = points[Math.max(0, j - 1)];
        const next = points[Math.min(points.length - 1, j + 1)];
        const dx = next[0] - prev[0];
        const dy = next[1] - prev[1];
        const length = Math.hypot(dx, dy) || 1;
        const nx = -dy / length;
        const ny = dx / length;
        const t = j / (points.length - 1);
        const widthScale = 1.6 + (r % 3) * 0.7;
        const w = ribbonBase * (0.45 + Math.sin(Math.PI * t) * widthScale);
        left.push([points[j][0] + nx * w, points[j][1] + ny * w]);
        right.push([points[j][0] - nx * w, points[j][1] - ny * w]);
      }

      ctx.beginPath();
      ctx.moveTo(left[0][0], left[0][1]);
      for (let j = 1; j < left.length; j += 1) ctx.lineTo(left[j][0], left[j][1]);
      for (let j = right.length - 1; j >= 0; j -= 1) ctx.lineTo(right[j][0], right[j][1]);
      ctx.closePath();
      ctx.fillStyle = `rgba(26, 22, 18, ${0.09 + (r % 3) * 0.02})`;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let j = 1; j < points.length; j += 1) ctx.lineTo(points[j][0], points[j][1]);
      ctx.strokeStyle = "rgba(26, 22, 18, 0.07)";
      ctx.lineWidth = ribbonBase * 0.5;
      ctx.stroke();
    }

    if (r % 2 === 0 && points.length > 0) {
      const end = points[points.length - 1];
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = "#241d18";
      ctx.font = `${8 + ribbonBase * 2}px ${KANJI_FONT}`;
      ctx.fillText(INK_CHARS[r % INK_CHARS.length], end[0], end[1]);
      ctx.globalAlpha = 1;
    }
  }

  ctx.fillStyle = "rgba(28, 24, 20, 0.045)";
  ctx.font = `500 ${Math.min(width, height) * 0.56}px ${KANJI_FONT}`;
  ctx.fillText("永", width * 0.5, height * 0.53);
  ctx.font = `500 ${Math.min(width, height) * 0.19}px ${KANJI_FONT}`;
  ctx.fillText("風", width * 0.2, height * 0.28);
  ctx.fillText("空", width * 0.81, height * 0.3);

  const step = animate ? Math.min(delta, 0.05) * 60 : 0;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < state.particles.length; i += 1) {
    const p = state.particles[i];

    if (animate) {
      const angle =
        Math.sin(p.x * 0.006 + time * 0.33 + p.phase) * 1.25 +
        Math.cos(p.y * 0.007 - time * 0.27) * 1.05;
      p.vx += Math.cos(angle) * 0.06 * p.speed;
      p.vy += Math.sin(angle) * 0.06 * p.speed;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.x += p.vx * step;
      p.y += p.vy * step;

      if (p.x < -30) p.x = width + 20;
      else if (p.x > width + 30) p.x = -20;
      if (p.y < -30) p.y = height + 20;
      else if (p.y > height + 30) p.y = -20;

      p.history.push(p.x, p.y);
      if (p.history.length > 26) p.history.splice(0, 2);
    }

    const points = p.history.length / 2;
    for (let j = 1; j < points; j += 1) {
      const t = j / points;
      const x0 = p.history[(j - 1) * 2];
      const y0 = p.history[(j - 1) * 2 + 1];
      const x1 = p.history[j * 2];
      const y1 = p.history[j * 2 + 1];
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = p.ember
        ? `rgba(184, 74, 18, ${0.045 + t * 0.18})`
        : `rgba(26, 22, 18, ${0.035 + t * 0.18})`;
      ctx.lineWidth = p.size * (0.3 + t * 0.9);
      ctx.stroke();
    }

    if (i % 4 === 0) {
      const radius = p.size * 5.5;
      const bleed = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      bleed.addColorStop(0, p.ember ? "rgba(184, 74, 18, 0.08)" : "rgba(26, 22, 18, 0.05)");
      bleed.addColorStop(1, "rgba(26, 22, 18, 0)");
      ctx.fillStyle = bleed;
      ctx.fillRect(p.x - radius, p.y - radius, radius * 2, radius * 2);
    }

    if (p.char) {
      ctx.globalAlpha = 0.11 + 0.08 * Math.sin(time * 0.7 + p.phase);
      ctx.fillStyle = p.ember ? "#a43e14" : "#241d18";
      ctx.font = `${7 + p.size * 2.4}px ${KANJI_FONT}`;
      ctx.fillText(p.char, p.x, p.y);
    }
  }

  for (let i = 0; i < 24; i += 1) {
    const x = (width * ((i * 37) % 100)) / 100;
    const y = (height * ((i * 61) % 100)) / 100;
    ctx.globalAlpha = 0.06 + ((i * 7) % 8) / 100;
    ctx.fillStyle = "#3a2d22";
    ctx.beginPath();
    ctx.arc(x, y, 0.7 + (i % 3) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function buildTargets(
  text: string,
  width: number,
  height: number,
  count: number,
): Array<{ x: number; y: number }> {
  const size = Math.round(Math.min(width, height) * 0.75);
  const off = document.createElement("canvas");
  off.width = size;
  off.height = size;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${size * 0.86}px ${KANJI_FONT}`;
  ctx.fillText(text, size / 2, size * 0.54);

  const data = ctx.getImageData(0, 0, size, size).data;
  const points: Array<{ x: number; y: number }> = [];
  const step = Math.max(3, Math.round(size / 64));
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      if (data[(y * size + x) * 4] < 110) continue;
      points.push({
        x: width / 2 + (x - size / 2) * 0.9,
        y: height / 2 + (y - size / 2) * 0.9,
      });
    }
  }

  if (points.length === 0) return [{ x: width / 2, y: height / 2 }];
  const rng = random(53);
  for (let i = points.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }
  return points.slice(0, count);
}

function resetFlock(width: number, height: number, state: FlockState, reduced: boolean) {
  const targets = buildTargets("鳥", width, height, 300);
  const rng = random(67);
  state.particles = Array.from({ length: 300 }, (_, index) => {
    const target = targets[index % targets.length];
    const size = 6 + rng() * 8;
    return {
      x: reduced ? target.x : rng() * width,
      y: reduced ? target.y : rng() * height,
      vx: 0,
      vy: 0,
      tx: target.x,
      ty: target.y,
      phase: rng() * Math.PI * 2,
      size,
      char: FLOCK_CHARS[index % FLOCK_CHARS.length],
      accent: index % 11 === 0,
    };
  });
}

function drawMurmuration(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  delta: number,
  state: FlockState,
  animate: boolean,
) {
  ctx.fillStyle = "rgba(5, 6, 7, 0.22)";
  ctx.fillRect(0, 0, width, height);

  const px = width / 2 + Math.cos(time * 0.46) * width * 0.44;
  const py = height / 2 + Math.sin(time * 0.61) * height * 0.34;

  for (const p of state.particles) {
    if (animate) {
      p.vx += (p.tx - p.x) * 0.075;
      p.vy += (p.ty - p.y) * 0.075;
      p.vx += Math.sin(time * 0.9 + p.phase) * 0.05;
      p.vy += Math.cos(time * 0.8 + p.phase * 1.2) * 0.05;

      const dx = p.x - px;
      const dy = p.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 92 && dist > 0.1) {
        const push = ((92 - dist) / 92) * 0.55;
        p.vx += (dx / dist) * push;
        p.vy += (dy / dist) * push;
      }

      p.vx *= 0.9;
      p.vy *= 0.9;
      p.x += p.vx * delta * 60;
      p.y += p.vy * delta * 60;
    }

    ctx.globalAlpha = p.accent ? 0.9 : 0.45 + 0.35 * Math.sin(p.phase + time * 0.8);
    ctx.fillStyle = p.accent ? "#ff9a4d" : "#d9f3f0";
    ctx.font = `${p.size}px ${KANJI_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(p.char, p.x, p.y);
  }
  ctx.globalAlpha = 1;
}

export function mountKanjiMarks() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvases = Array.from(
    document.querySelectorAll<HTMLCanvasElement>("canvas[data-kanji-mark]"),
  );

  for (const canvas of canvases) {
    if (canvas.dataset.kanjiMounted === "true") continue;
    canvas.dataset.kanjiMounted = "true";

    const mark = canvas.dataset.kanjiMark as Mark;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    const ink: InkFieldState = { particles: [] };
    const flock: FlockState = { particles: [] };

    let width = 1;
    let height = 1;
    let frame = 0;
    let last = 0;
    let onScreen = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (mark === "ink") resetInk(width, height, ink, reduced);
      else resetFlock(width, height, flock, reduced);
      draw(reduced ? 2.4 : performance.now() / 1000, 1 / 60);
    };

    const draw = (time: number, delta: number) => {
      if (mark === "ink") drawInkField(ctx, width, height, time, delta, ink, !reduced);
      else drawMurmuration(ctx, width, height, time, delta, flock, !reduced);
    };

    const tick = (now: number) => {
      if (!onScreen) return;
      const delta = Math.min(0.05, (now - last) / 1000 || 1 / 60);
      last = now;
      draw(now / 1000, delta);
      frame = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (reduced || frame) return;
      frame = window.requestAnimationFrame(tick);
    };

    const stop = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        onScreen = entry?.isIntersecting ?? true;
        if (onScreen) start();
        else stop();
      }).observe(canvas);
    } else {
      start();
    }

    if (reduced) draw(2.4, 1 / 60);
  }
}
