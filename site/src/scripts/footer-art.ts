const WORD = "ASCII-THINGS";
const FONT_STACK = '"Geist Mono", ui-monospace, "SFMono-Regular", Menlo, monospace';
const ORANGE = "rgba(255, 122, 26, 0.9)";
const IVORY = "rgba(236, 232, 223, 0.7)";
const FIELD = "rgba(236, 232, 223, 0.15)";
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const canvas = document.querySelector<HTMLCanvasElement>(".footer-canvas");

if (canvas) {
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motionQuery.matches;
    let width = 0;
    let height = 0;
    let mask: Uint8ClampedArray | null = null;
    let frameId = 0;
    let running = false;
    let onScreen = false;
    let visible = !document.hidden;
    let last = 0;

    const buildMask = () => {
      if (width < 1 || height < 1) return;

      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
      if (!offCtx) return;

      offCtx.fillStyle = "#000";
      offCtx.fillRect(0, 0, width, height);
      offCtx.fillStyle = "#fff";

      let fontSize = height * 0.62;
      offCtx.font = `700 ${fontSize}px ${FONT_STACK}`;
      const maxWidth = width * 0.84;

      while (offCtx.measureText(WORD).width > maxWidth && fontSize > 8) {
        fontSize *= 0.92;
        offCtx.font = `700 ${fontSize}px ${FONT_STACK}`;
      }

      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";
      offCtx.fillText(WORD, width / 2, height * 0.66);
      mask = offCtx.getImageData(0, 0, width, height).data;
    };

    const brightness = (x: number, y: number) => {
      if (!mask) return 0;

      const px = Math.max(0, Math.min(width - 1, Math.floor(x)));
      const py = Math.max(0, Math.min(height - 1, Math.floor(y)));
      return mask[(py * width + px) * 4] / 255;
    };

    const drawField = (time: number) => {
      if (!mask) return;

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "butt";

      const step = Math.max(2.2, width / 240);
      const scanX = time === 0 ? width * 0.18 : ((time * 0.055) % (width + 260)) - 130;

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const bx = Math.floor(x / step) % 4;
          const by = Math.floor(y / step) % 4;
          const pattern = BAYER[by * 4 + bx] / 16;
          const value = brightness(x + step / 2, y + step / 2);
          const isWord = value > 0.42;
          const wave = 0.5 + 0.5 * Math.sin(x * 0.012 + y * 0.009 + time * 0.0007);
          const density = isWord ? 0.78 : 0.08 + 0.15 * wave;

          if (pattern > density) continue;

          const nearScan = Math.abs(x + step / 2 - scanX) < 58;
          const dot = step * (isWord ? (nearScan ? 0.92 : 0.62) : nearScan ? 0.58 : 0.34);

          ctx.fillStyle = nearScan ? ORANGE : isWord ? IVORY : FIELD;
          ctx.fillRect(x + (step - dot) / 2, y + (step - dot) / 2, dot, dot);
        }
      }
    };

    const draw = (time: number) => {
      drawField(time);
    };

    const loop = (now: number) => {
      if (!running) return;
      if (now - last > 1000 / 30) {
        draw(now);
        last = now;
      }
      frameId = window.requestAnimationFrame(loop);
    };

    const start = () => {
      if (reduced || running || !visible || !onScreen) return;
      running = true;
      last = 0;
      frameId = window.requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      window.cancelAnimationFrame(frameId);
      frameId = 0;
      draw(0);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      buildMask();
      if (!running) draw(0);
    };

    resize();

    if (reduced) draw(0);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        ([entry]) => {
          onScreen = entry?.isIntersecting ?? false;
          if (onScreen) start();
          else stop();
        },
        { rootMargin: "240px 0px" },
      ).observe(canvas);
    } else {
      onScreen = true;
      start();
    }

    document.addEventListener("visibilitychange", () => {
      visible = !document.hidden;
      if (visible) start();
      else stop();
    });

    motionQuery.addEventListener("change", () => {
      reduced = motionQuery.matches;
      if (reduced) {
        stop();
        draw(0);
      } else {
        start();
      }
    });

    if ("ResizeObserver" in window) {
      new ResizeObserver(resize).observe(canvas);
    } else {
      window.addEventListener("resize", resize, { passive: true });
    }

    document.fonts?.ready.then(resize);
  }
}
