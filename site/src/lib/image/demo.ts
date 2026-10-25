/**
 * A small, homegrown demo image. It is drawn in the browser so the studio never
 * needs a bundled photograph or a third-party asset.
 */
export function createDemoCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 960;
  canvas.height = 680;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("A 2D canvas context is required.");

  const sky = context.createLinearGradient(0, 0, 0, 500);
  sky.addColorStop(0, "#080a0d");
  sky.addColorStop(0.46, "#23211e");
  sky.addColorStop(0.7, "#a64b18");
  sky.addColorStop(0.83, "#ff9a52");
  sky.addColorStop(1, "#f7d6a5");
  context.fillStyle = sky;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(236, 232, 223, 0.65)";
  for (let i = 0; i < 42; i += 1) {
    const x = (((i * 197 + 71) % 92) / 100) * canvas.width;
    const y = (((i * 83 + 19) % 38) / 100) * 360;
    const radius = i % 5 === 0 ? 1.5 : 0.8;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  const glow = context.createRadialGradient(678, 378, 18, 678, 378, 170);
  glow.addColorStop(0, "rgba(255, 236, 190, 0.9)");
  glow.addColorStop(0.45, "rgba(255, 154, 82, 0.38)");
  glow.addColorStop(1, "rgba(255, 122, 26, 0)");
  context.fillStyle = glow;
  context.fillRect(460, 160, 440, 440);

  context.fillStyle = "#ffe0a8";
  context.beginPath();
  context.arc(678, 378, 56, 0, Math.PI * 2);
  context.fill();

  const far = context.createLinearGradient(0, 340, 0, 570);
  far.addColorStop(0, "#5d3929");
  far.addColorStop(1, "#1a1716");
  context.fillStyle = far;
  context.beginPath();
  context.moveTo(0, 510);
  context.lineTo(110, 372);
  context.lineTo(208, 452);
  context.lineTo(316, 318);
  context.lineTo(446, 468);
  context.lineTo(558, 374);
  context.lineTo(702, 492);
  context.lineTo(808, 410);
  context.lineTo(960, 522);
  context.lineTo(960, 680);
  context.lineTo(0, 680);
  context.closePath();
  context.fill();

  const near = context.createLinearGradient(0, 450, 0, 680);
  near.addColorStop(0, "#31251f");
  near.addColorStop(1, "#08090a");
  context.fillStyle = near;
  context.beginPath();
  context.moveTo(0, 592);
  context.lineTo(124, 506);
  context.lineTo(248, 566);
  context.lineTo(378, 480);
  context.lineTo(532, 574);
  context.lineTo(684, 520);
  context.lineTo(824, 594);
  context.lineTo(960, 548);
  context.lineTo(960, 680);
  context.lineTo(0, 680);
  context.closePath();
  context.fill();

  context.fillStyle = "#101113";
  context.fillRect(0, 620, 960, 60);

  // A small robot-dog silhouette, built from simple solid parts.
  context.save();
  context.translate(356, 512);
  context.fillStyle = "#0b0c0e";
  context.strokeStyle = "rgba(255, 196, 154, 0.5)";
  context.lineWidth = 3;

  context.beginPath();
  context.roundRect(120, 36, 140, 62, 14);
  context.fill();
  context.stroke();

  context.beginPath();
  context.roundRect(236, 8, 68, 58, 12);
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(248, 12);
  context.lineTo(238, -24);
  context.lineTo(266, 8);
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(286, 10);
  context.lineTo(304, -22);
  context.lineTo(300, 14);
  context.fill();
  context.stroke();

  context.fillStyle = "#ff9a52";
  context.beginPath();
  context.arc(286, 34, 5, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#0b0c0e";
  context.fillRect(138, 92, 18, 64);
  context.fillRect(206, 92, 18, 64);
  context.fillRect(108, 92, 18, 50);
  context.fillRect(230, 92, 18, 50);
  context.strokeRect(138, 92, 18, 64);
  context.strokeRect(206, 92, 18, 64);

  context.beginPath();
  context.moveTo(120, 46);
  context.lineTo(82, 22);
  context.lineTo(72, 40);
  context.lineTo(116, 64);
  context.fill();
  context.stroke();

  context.restore();

  context.fillStyle = "rgba(236, 232, 223, 0.78)";
  context.font = '600 22px "Geist Mono", ui-monospace, monospace';
  context.letterSpacing = "4px";
  context.fillText("ASCII-THINGS / IMAGE LAB", 40, 654);

  context.fillStyle = "rgba(255, 122, 26, 0.9)";
  context.fillRect(40, 664, 180, 2);

  return canvas;
}
