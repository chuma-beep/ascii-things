// Animated favicon: one orange cell scans the 3x3 grid.
// Browsers do not reliably animate SVG/GIF favicons, so swap the icon
// ourselves. The static favicon is the first frame and the no-JS fallback.

(() => {
  const link = document.querySelector('link[rel~="icon"]');
  if (!link) return;

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches) return;

  const fallback = link.getAttribute("href") || "/favicon.svg";

  const BACKGROUND = "#070809";
  const DIM = "#5b5750";
  const ORANGE = "#ff7a1a";
  const CELL = 6;
  const positions = [
    [5, 5],
    [13, 5],
    [21, 5],
    [21, 13],
    [21, 21],
    [13, 21],
    [5, 21],
    [5, 13],
  ];

  const cell = (x, y, fill) =>
    `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="${fill}" />`;

  const grid = positions.map(([x, y]) => cell(x, y, DIM)).join("");
  const frames = positions.map(([x, y]) => {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
      `<rect width="32" height="32" fill="${BACKGROUND}" />` +
      grid +
      cell(x, y, ORANGE) +
      `</svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  });

  let frame = 0;
  let timer = 0;

  const paint = () => {
    link.href = frames[frame];
  };

  const stop = () => {
    if (!timer) return;
    window.clearInterval(timer);
    timer = 0;
  };

  const start = () => {
    if (timer || document.hidden) return;
    paint();
    timer = window.setInterval(() => {
      frame = (frame + 1) % frames.length;
      paint();
    }, 650);
  };

  paint();
  start();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  motion.addEventListener?.("change", (event) => {
    if (event.matches) {
      stop();
      frame = 0;
      link.href = fallback;
    } else {
      start();
    }
  });
})();
