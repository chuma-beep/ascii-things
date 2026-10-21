const WORD = "ASCII-THINGS";
const FONT_STACK = '"Geist Mono", ui-monospace, "SFMono-Regular", Menlo, monospace';
const IVORY = "rgba(236, 232, 223, 0.42)";
const ORANGE = "#ff7a1a";

const canvas = document.querySelector<HTMLCanvasElement>(".footer-canvas");

if (canvas) {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motionQuery.matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let mask = new Float32Array(0);
    let maskWidth = 0;
    let maskHeight = 0;
    let frameId = 0;
    let visible = !document.hidden;
    let onScreen = false;
    let pointerX = -1000;
    let pointerActive = false;

    const sampleAt = (x: number, y: number) => {
      const px = Math.max(0, Math.min(maskWidth - 1, Math.round(x * dpr)));
      const py = Math.max(0, Math.min(maskHeight - 1, Math.round(y * dpr)));
      return mask[py * maskWidth + px] ?? 0;
    };

    const buildMask = () => {
      if (width < 1 || height < 1) return;

      const offscreen = document.createElement("canvas");
      offscreen.width = Math.round(width * dpr);
      offscreen.height = Math.round(height * dpr);
      const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
      if (!offCtx) return;

      offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      offCtx.clearRect(0, 0, width, height);

      let fontSize = height * 0.72;
      offCtx.font = `700 ${fontSize}px ${FONT_STACK}`;
      const initialMeasure = offCtx.measureText(WORD);
      const maxWidth = width * 0.9;
      if (initialMeasure.width > maxWidth) {
        fontSize *= maxWidth / initialMeasure.width;
      }

      offCtx.font = `700 ${fontSize}px ${FONT_STACK}`;
      const metrics = offCtx.measureText(WORD);
      offCtx.fillStyle = "#fff";
      offCtx.textAlign = "left";
      offCtx.textBaseline = "middle";
      offCtx.fillText(WORD, (width - metrics.width) / 2, height / 2);

      const image = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
      maskWidth = offscreen.width;
      maskHeight = offscreen.height;
      mask = new Float32Array(maskWidth * maskHeight);

      for (let i = 0, cell = 0; i < image.data.length; i += 4, cell += 1) {
        mask[cell] = (image.data[i + 3] / 255) * (image.data[i] / 255);
      }
    };

    const draw = (time: number, still = false) => {
      if (maskWidth < 1 || maskHeight < 1) return;

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "butt";

      const gap = Math.max(3.2, width / 190);
      const yStep = Math.max(2.4, height / 78);
      const lineCount = Math.ceil(width / gap);
      const weight = Math.min(1, Math.max(0.58, width / 1100));
      const widths = [0.6, 1.08, 1.7, 2.5].map((value) => value * weight);
      const ivoryPaths = Array.from({ length: 4 }, () => new Path2D());
      const orangePaths = Array.from({ length: 4 }, () => new Path2D());
      const scanX = still ? width * 0.18 : ((time * 0.055) % (width + 220)) - 110;

      ctx.strokeStyle = "rgba(236, 232, 223, 0.035)";
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      for (let i = 0; i < lineCount; i += 1) {
        const x = i * gap + gap / 2;
        ctx.moveTo(x, height * 0.14);
        ctx.lineTo(x, height * 0.86);
      }
      ctx.stroke();

      for (let i = 0; i < lineCount; i += 1) {
        const baseX = i * gap + gap / 2;
        const distance = pointerActive ? Math.abs(baseX - pointerX) : Number.POSITIVE_INFINITY;
        const influence = pointerActive ? Math.max(0, 1 - distance / 110) : 0;

        for (let y = 0; y <= height; y += yStep) {
          let brightness = sampleAt(baseX, y);
          if (brightness <= 0.015) continue;

          brightness += Math.sin(time * 0.0011 + baseX * 0.055 + y * 0.042) * (still ? 0 : 0.055);
          brightness = Math.max(0, Math.min(1, brightness));
          if (brightness < 0.035) continue;

          const level = brightness > 0.74 ? 3 : brightness > 0.49 ? 2 : brightness > 0.23 ? 1 : 0;
          const bend = influence > 0 ? Math.sin(time * 0.006 + y * 0.03) * influence * 17 : 0;
          const x = baseX + bend;
          const isOrange = Math.abs(baseX - scanX) < 13;
          const path = isOrange ? orangePaths[level] : ivoryPaths[level];

          path.moveTo(x, y);
          path.lineTo(x, y + yStep + 0.7);
        }
      }

      ctx.strokeStyle = IVORY;
      for (let i = 0; i < widths.length; i += 1) {
        ctx.lineWidth = widths[i];
        ctx.stroke(ivoryPaths[i]);
      }

      ctx.save();
      ctx.strokeStyle = ORANGE;
      ctx.shadowColor = "rgba(255, 122, 26, 0.55)";
      ctx.shadowBlur = 9;
      for (let i = 0; i < widths.length; i += 1) {
        ctx.lineWidth = widths[i];
        ctx.stroke(orangePaths[i]);
      }
      ctx.restore();

      if (!still && pointerActive) {
        const points: { x: number; y: number; brightness: number }[] = [];
        const step = Math.max(18, width / 70);

        for (let y = height * 0.28; y <= height * 0.72; y += step) {
          for (let x = 0; x <= width; x += step) {
            const brightness = sampleAt(x, y);
            if (brightness > 0.55) points.push({ x, y, brightness });
          }
        }

        points.sort((a, b) => b.brightness - a.brightness);
        const detected: { x: number; y: number }[] = [];
        for (const point of points) {
          const separated = detected.every(
            (other) => Math.hypot(other.x - point.x, other.y - point.y) > width * 0.17,
          );
          if (separated) detected.push(point);
          if (detected.length === 3) break;
        }

        if (detected.length > 0) {
          ctx.save();
          ctx.strokeStyle = "rgba(255, 122, 26, 0.7)";
          ctx.fillStyle = "rgba(255, 122, 26, 0.9)";
          ctx.lineWidth = 0.8;
          ctx.font = '8px "Geist Mono", ui-monospace, monospace';

          detected.forEach((point, index) => {
            const size = 22;
            ctx.strokeRect(point.x - size / 2, point.y - size / 2, size, size);
            ctx.fillText(
              `${Math.round(point.x)},${Math.round(point.y)}`,
              point.x - size / 2,
              point.y - size / 2 - 4,
            );

            if (index > 0) {
              const previous = detected[index - 1];
              ctx.beginPath();
              ctx.moveTo(previous.x, previous.y);
              ctx.lineTo(point.x, point.y);
              ctx.stroke();
            }
          });

          ctx.restore();
        }
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildMask();
      draw(reduced ? 0 : performance.now(), reduced);
    };

    const frame = (time: number) => {
      if (reduced || !visible || !onScreen) {
        frameId = 0;
        return;
      }
      draw(time);
      frameId = window.requestAnimationFrame(frame);
    };

    const start = () => {
      if (frameId || reduced || !visible || !onScreen) return;
      frameId = window.requestAnimationFrame(frame);
    };

    const stop = () => {
      if (!frameId) return;
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    };

    canvas.addEventListener(
      "pointermove",
      (event) => {
        if (reduced || event.pointerType === "touch") return;
        const rect = canvas.getBoundingClientRect();
        pointerX = event.clientX - rect.left;
        pointerActive = true;
      },
      { passive: true },
    );

    canvas.addEventListener("pointerleave", () => {
      pointerActive = false;
    });

    document.addEventListener("visibilitychange", () => {
      visible = !document.hidden;
      if (visible) {
        draw(performance.now(), reduced);
        start();
      } else {
        stop();
      }
    });

    motionQuery.addEventListener("change", () => {
      reduced = motionQuery.matches;
      if (reduced) {
        stop();
        draw(0, true);
      } else {
        start();
      }
    });

    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) {
          draw(performance.now(), reduced);
          start();
        } else {
          stop();
        }
      },
      { rootMargin: "240px 0px" },
    ).observe(canvas);
    document.fonts.ready.then(() => {
      buildMask();
      draw(reduced ? 0 : performance.now(), reduced);
    });

    resize();
  }
}
