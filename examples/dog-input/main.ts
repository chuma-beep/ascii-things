import { createDog } from "../../src/dog";
import type { DogEngine } from "../../src/dog";

const canvas = document.querySelector<HTMLCanvasElement>("#yard");
if (!canvas) throw new Error("Missing #yard canvas");

const scene = createDog(canvas, {
  palette: "abyss",
  seed: 7,
  count: 1,
  dogs: [{ size: 1.15 }],
  spread: [0.68, 0.68],
  interactive: true,
  columns: 150,
  maxCells: 16000,
  label: "A live ASCII robot dog test yard",
});

// Handy for poking at the scene from the console.
declare global {
  interface Window {
    asciiScene: DogEngine;
  }
}
window.asciiScene = scene;

const form = document.querySelector<HTMLFormElement>("#prompt");
const input = document.querySelector<HTMLInputElement>("#command");
const echo = document.querySelector<HTMLElement>("#echo");
const reply = document.querySelector<HTMLElement>("#reply");
const statCells = document.querySelector<HTMLElement>("#stat-cells");
const statDogs = document.querySelector<HTMLElement>("#stat-dogs");
const statState = document.querySelector<HTMLElement>("#stat-state");
const statFps = document.querySelector<HTMLElement>("#stat-fps");

const replies = [
  "BALL DEPLOYED · FETCHING",
  "VECTOR LOCKED · UNIT 01 ON IT",
  "THROW ACCEPTED · GOOD BOY PROTOCOL",
  "TARGET ACQUIRED · TAIL WAG ENABLED",
];

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input?.value.trim();
  if (!text) return;

  const h = hash(text);
  const rect = canvas.getBoundingClientRect();
  // Same phrase, same throw. The input chooses where the ball lands.
  const x = rect.width * (0.2 + ((h % 1000) / 1000) * 0.6);
  const y = rect.height * 0.7;
  scene.throwBall(x, y);

  if (echo) echo.textContent = `> ${text}`;
  if (reply) reply.textContent = replies[h % replies.length];
  if (input) {
    input.value = "";
    input.focus();
  }
});

scene.setOptions({
  onEvent: (event) => {
    if (event.kind === "nudge") {
      if (reply) reply.textContent = "FETCH COMPLETE · GOOD BOY";
    } else if (event.kind === "charge" || event.kind === "low") {
      if (reply) reply.textContent = "LOW BATTERY · RETURNING TO DOCK";
    }
  },
});

function refreshStats() {
  const stats = scene.getStats();
  if (statCells) statCells.textContent = stats.cells.toLocaleString("en-US");
  if (statDogs) statDogs.textContent = String(stats.dogs).padStart(2, "0");
  if (statState) statState.textContent = stats.state.toUpperCase();
  if (statFps) statFps.textContent = String(Math.round(stats.fps));
}

refreshStats();
setInterval(refreshStats, 500);
