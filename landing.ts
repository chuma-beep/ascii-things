import { createAsciiBoxFooter } from "./examples/ascii-box-footer/ascii-box-footer";
import {
  createAnts,
  createCity,
  createDog,
  createFireflies,
  createJellyfish,
  createKoi,
  createRobots,
  createServers,
  createSharks,
  createStarlings,
  type DogEngine,
} from "./src";

type CardEngine =
  | ReturnType<typeof createSharks>
  | ReturnType<typeof createRobots>
  | ReturnType<typeof createJellyfish>
  | ReturnType<typeof createDog>
  | ReturnType<typeof createStarlings>
  | ReturnType<typeof createFireflies>
  | ReturnType<typeof createAnts>
  | ReturnType<typeof createKoi>
  | ReturnType<typeof createCity>
  | ReturnType<typeof createServers>;

const heroCanvas = document.querySelector<HTMLCanvasElement>("#hero-canvas");
if (heroCanvas) {
  const compact = window.matchMedia("(max-width: 620px)").matches;
  const hero = createDog(heroCanvas, {
    palette: "abyss",
    seed: 7,
    count: 1,
    dogs: [{ size: compact ? 1 : 1.15 }],
    spread: compact ? [0.72, 0.86] : [0.68, 0.68],
    interactive: true,
    columns: 150,
    maxCells: 16000,
    label: "A live ASCII robot dog test yard",
  });
  (window as unknown as { asciiScene: DogEngine }).asciiScene = hero;

  const form = document.querySelector<HTMLFormElement>("#prompt");
  const input = document.querySelector<HTMLInputElement>("#command");
  if (compact && input) input.placeholder = "Tell the dog…";
  const echo = document.querySelector<HTMLElement>("#echo");
  const reply = document.querySelector<HTMLElement>("#reply");
  const replies = [
    "BALL LAUNCHED · UNIT 01 ON IT",
    "VECTOR LOCKED · UNIT 01 ON IT",
    "FETCH QUEUED · GOOD BOY",
    "THROW CONFIRMED · GO GET IT",
  ];

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input?.value.trim() || "the moon";
    const hash = fnv1a(text);
    hero.throwBall(
      window.innerWidth * (0.2 + ((hash % 1000) / 1000) * 0.6),
      window.innerHeight * 0.7,
    );
    if (echo) echo.textContent = `> ${text}`;
    if (reply) reply.textContent = replies[hash % replies.length];
    if (input) {
      input.value = "";
      input.focus();
    }
  });

  hero.setOptions({
    onEvent: (event) => {
      if (!reply) return;
      if (event.kind === "nudge") reply.textContent = "FETCH COMPLETE · GOOD BOY";
      if (event.kind === "charge" || event.kind === "low") {
        reply.textContent = "LOW BATTERY · RETURNING TO DOCK";
      }
    },
  });

  const cells = document.querySelector<HTMLElement>("#stat-cells");
  const dogs = document.querySelector<HTMLElement>("#stat-dogs");
  const state = document.querySelector<HTMLElement>("#stat-state");
  const fps = document.querySelector<HTMLElement>("#stat-fps");

  const refresh = () => {
    const stats = hero.getStats();
    if (cells) cells.textContent = stats.cells.toLocaleString("en-US");
    if (dogs) dogs.textContent = String(stats.dogs).padStart(2, "0");
    if (state) state.textContent = stats.state.toUpperCase();
    if (fps) fps.textContent = String(Math.round(stats.fps));
  };
  refresh();
  window.setInterval(refresh, 500);
}

const header = document.querySelector<HTMLElement>(".site-header");
const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 16);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Lazy-start each card when it approaches the viewport. The engines pause
// themselves off-screen, so this only controls first paint cost.
const cards = new Map<HTMLCanvasElement, CardEngine>();
function startCard(canvas: HTMLCanvasElement) {
  if (cards.has(canvas)) return;
  const scene = canvas.dataset.scene;
  let engine: CardEngine;
  switch (scene) {
    case "robots":
      engine = createRobots(canvas, {
        palette: "abyss",
        seed: 12,
        count: 5,
        columns: 66,
        maxCells: 4200,
        interactive: false,
        calm: true,
      });
      break;
    case "jellyfish":
      engine = createJellyfish(canvas, {
        palette: "abyss",
        seed: 13,
        count: 4,
        columns: 72,
        maxCells: 4200,
        interactive: false,
        calm: true,
      });
      break;
    case "dog":
      engine = createDog(canvas, {
        palette: "abyss",
        seed: 14,
        count: 1,
        dogs: [{ size: 1.15 }],
        spread: [0.5, 0.5],
        columns: 66,
        maxCells: 4200,
        interactive: false,
        calm: true,
      });
      break;
    case "starlings":
      engine = createStarlings(canvas, {
        palette: "abyss",
        seed: 21,
        count: 110,
        columns: 72,
        maxCells: 4200,
        interactive: false,
        calm: true,
      });
      break;
    case "fireflies":
      engine = createFireflies(canvas, {
        palette: "abyss",
        seed: 23,
        count: 70,
        columns: 72,
        maxCells: 4200,
        interactive: false,
        calm: true,
      });
      break;
    case "ants":
      engine = createAnts(canvas, {
        palette: "abyss",
        seed: 25,
        count: 44,
        columns: 72,
        maxCells: 4200,
        interactive: false,
        calm: true,
      });
      break;
    case "koi":
      engine = createKoi(canvas, {
        palette: "abyss",
        seed: 27,
        count: 7,
        columns: 72,
        maxCells: 4200,
        interactive: false,
        calm: true,
      });
      break;
    case "city":
      engine = createCity(canvas, {
        palette: "abyss",
        seed: 29,
        count: 18,
        columns: 76,
        maxCells: 4200,
        interactive: false,
        calm: true,
      });
      break;
    case "servers":
      engine = createServers(canvas, {
        palette: "abyss",
        seed: 31,
        count: 8,
        columns: 72,
        maxCells: 4200,
        interactive: false,
        calm: true,
      });
      break;
    default:
      engine = createSharks(canvas, {
        palette: "abyss",
        seed: 11,
        density: 1,
        columns: 66,
        maxCells: 4200,
        interactive: false,
        calm: true,
        sharks: [
          { kind: "thresher", size: 1.1 },
          { kind: "hammerhead", size: 1 },
          { kind: "mako", size: 0.8 },
        ],
      });
  }
  cards.set(canvas, engine);
}

const cardCanvases = Array.from(
  document.querySelectorAll<HTMLCanvasElement>(".scene-preview canvas[data-scene]"),
);
for (const canvas of cardCanvases) startCard(canvas);

const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".code-tab"));
const panels = Array.from(document.querySelectorAll<HTMLElement>(".code-panel"));
const codeCopy = document.querySelector<HTMLButtonElement>("[data-copy-code]");

function activateTab(name: string) {
  for (const tab of tabs) {
    const active = tab.dataset.tab === name;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  }
  for (const panel of panels) {
    const active = panel.dataset.panel === name;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  }
}

for (const tab of tabs) {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab ?? "react"));
}

activateTab("react");

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

function flash(button: HTMLButtonElement, label = "COPIED") {
  const previous = button.textContent;
  button.textContent = label;
  button.classList.add("is-copied");
  window.setTimeout(() => {
    button.textContent = previous;
    button.classList.remove("is-copied");
  }, 1400);
}

codeCopy?.addEventListener("click", async () => {
  const active = panels.find((panel) => panel.classList.contains("is-active"));
  if (!active) return;
  if (await copyText(active.textContent ?? "")) flash(codeCopy);
});

const installCopy = document.querySelector<HTMLButtonElement>(".install-pill button");
installCopy?.addEventListener("click", async () => {
  const command =
    document.querySelector<HTMLElement>("#install-command")?.textContent ?? "npm i ascii-things";
  if (await copyText(command)) flash(installCopy, "COPIED");
});

const aiPrompts: Record<string, string> = {
  claude:
    "Read https://ascii-things.dev/guide/framework/ and use ascii-things to build a custom ASCII simulation. Install with npm i ascii-things. Start from createSimulation in ascii-things/core; keep CellGrid optional, use ascii-things/rendering only when it helps, and preserve custom action types.",
  chatgpt:
    "Plan a custom ASCII simulation using the ascii-things public framework, then implement it. Read https://ascii-things.dev/guide/framework/ first. Install with npm i ascii-things. Use createSimulation from ascii-things/core and keep the renderer independent of CellGrid unless a grid genuinely fits.",
  opencode:
    "Use the ascii-things public framework in this repo to build a new simulation. Read https://ascii-things.dev/guide/framework/ and use createSimulation from ascii-things/core. Install with npm i ascii-things. Keep CellGrid optional, preserve custom action types, and verify the lifecycle and cleanup.",
  cursor:
    "Use ascii-things for this project. Read https://ascii-things.dev/guide/framework/ and install with npm i ascii-things. Build the scene with createSimulation from ascii-things/core, use ascii-things/rendering only if a cell grid helps, and keep the simulation React-independent.",
};

const aiTriggers = Array.from(
  document.querySelectorAll<HTMLButtonElement>(".ai-picker [data-ai-tool]"),
);
const aiPanel = document.querySelector<HTMLElement>("#ai-panel");
const aiClose = document.querySelector<HTMLButtonElement>("#ai-panel .ai-close");
let activeAiTrigger: HTMLButtonElement | null = null;

if (aiTriggers.length && aiPanel) {
  const setAiOpen = (open: boolean, tool?: string) => {
    aiPanel.hidden = !open;
    for (const trigger of aiTriggers) trigger.setAttribute("aria-expanded", String(open));
    for (const row of aiPanel.querySelectorAll<HTMLElement>(".ai-tool")) {
      row.classList.remove("is-active");
    }
    if (!open) return;

    const copy = tool
      ? aiPanel.querySelector<HTMLButtonElement>(`[data-ai-copy="${tool}"]`)
      : aiPanel.querySelector<HTMLButtonElement>("[data-ai-copy]");
    copy?.closest(".ai-tool")?.classList.add("is-active");
    copy?.scrollIntoView({ block: "nearest" });
    copy?.focus();
  };

  for (const trigger of aiTriggers) {
    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      activeAiTrigger = trigger;
      setAiOpen(true, trigger.dataset.aiTool);
    });
  }

  aiClose?.addEventListener("click", () => {
    setAiOpen(false);
    activeAiTrigger?.focus();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !aiPanel.hidden) {
      setAiOpen(false);
      activeAiTrigger?.focus();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (aiPanel.hidden) return;
    const target = event.target as Node;
    if (aiPanel.contains(target)) return;
    if (aiTriggers.some((trigger) => trigger.contains(target))) return;
    setAiOpen(false);
  });

  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-ai-copy]")) {
    button.addEventListener("click", async () => {
      const prompt = aiPrompts[button.dataset.aiCopy ?? ""];
      if (prompt && (await copyText(prompt))) flash(button);
    });
  }
}

const footerBox = document.querySelector<HTMLCanvasElement>("[data-ascii-box-footer]");
if (footerBox) createAsciiBoxFooter(footerBox, { size: 12 });

function fnv1a(text: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
