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
  createLagoon,
} from "ascii-things";

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
  | ReturnType<typeof createServers>
  | ReturnType<typeof createLagoon>;

const initialTheme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
const heroCanvas = document.querySelector<HTMLCanvasElement>("#hero-canvas");
const statCells = document.querySelector<HTMLElement>("#stat-cells");
const statMode = document.querySelector<HTMLElement>("#stat-mode");
const statColumns = document.querySelector<HTMLElement>("#stat-columns");
const statRows = document.querySelector<HTMLElement>("#stat-rows");
const tryMode = document.querySelector<HTMLElement>("#try-mode");
const echo = document.querySelector<HTMLElement>("#echo");
const reply = document.querySelector<HTMLElement>("#reply");
let hero: ReturnType<typeof createLagoon> | null = null;

if (heroCanvas) {
  hero = createLagoon(heroCanvas, {
    variant: initialTheme === "light" ? "reef" : "night",
    label: initialTheme === "light" ? "A live ASCII day lagoon" : "A live ASCII night lagoon",
  });
  (window as unknown as { asciiScene: ReturnType<typeof createLagoon> }).asciiScene = hero;

  const refresh = () => {
    if (!hero) return;
    const stats = hero.getStats();
    if (statCells) statCells.textContent = stats.cells.toLocaleString("en-US");
    if (statMode) statMode.textContent = stats.variant === "reef" ? "DAY" : "NIGHT";
    if (statColumns) statColumns.textContent = String(stats.columns);
    if (statRows) statRows.textContent = String(stats.rows);
  };
  refresh();
  window.setInterval(refresh, 500);
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("ascii-things-theme", theme);
  } catch {
    // Storage can be unavailable in private or restricted contexts.
  }

  const day = theme === "light";
  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute("content", day ? "#f3eee4" : "#070809");
  themeToggle?.setAttribute("aria-label", day ? "Switch to dark mode" : "Switch to light mode");

  hero?.setOptions({
    variant: day ? "reef" : "night",
    label: day ? "A live ASCII day lagoon" : "A live ASCII night lagoon",
  });
  if (statMode) statMode.textContent = day ? "DAY" : "NIGHT";
  if (tryMode) tryMode.textContent = day ? "LIVE DAY REEF" : "LIVE NIGHT REEF";
  if (echo) echo.textContent = day ? "lagoon@day · sun current" : "lagoon@night · moon current";
  if (reply) {
    reply.textContent = day
      ? "DAY REEF · TURTLE · MANTA · DOLPHIN"
      : "NIGHT REEF · TURTLE · MANTA · DOLPHIN";
  }
}

const themeToggle = document.querySelector<HTMLButtonElement>("#theme-toggle");
themeToggle?.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  applyTheme(next);
});
applyTheme(initialTheme);

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
        count: 6,
        columns: 110,
        interactive: false,
        calm: false,
      });
      break;
    case "jellyfish":
      engine = createJellyfish(canvas, {
        palette: "abyss",
        seed: 13,
        count: 5,
        columns: 110,
        interactive: false,
        calm: false,
      });
      break;
    case "dog": {
      const isComposition = canvas.dataset.composition === "true";
      const surface = canvas.closest<HTMLElement>(".composition-mini")?.dataset.surface;
      engine = createDog(canvas, {
        palette: isComposition && surface === "paper" ? "paper" : "abyss",
        seed: isComposition ? 7 : 14,
        count: 1,
        dogs: isComposition ? [{ size: 1.35 }] : undefined,
        spread: isComposition ? [0.68, 0.68] : undefined,
        columns: isComposition ? 72 : 110,
        maxCells: isComposition ? 5200 : undefined,
        interactive: false,
        calm: isComposition,
      });
      break;
    }
    case "starlings":
      engine = createStarlings(canvas, {
        palette: "abyss",
        seed: 21,
        count: 120,
        columns: 110,
        interactive: false,
        calm: false,
      });
      break;
    case "fireflies":
      engine = createFireflies(canvas, {
        palette: "abyss",
        seed: 23,
        count: 70,
        columns: 110,
        interactive: false,
        calm: false,
      });
      break;
    case "ants":
      engine = createAnts(canvas, {
        palette: "abyss",
        seed: 25,
        count: 45,
        columns: 110,
        interactive: false,
        calm: false,
      });
      break;
    case "koi": {
      const isComposition = canvas.dataset.composition === "true";
      const surface = canvas.closest<HTMLElement>(".composition-mini")?.dataset.surface;
      engine = createKoi(canvas, {
        palette: isComposition && surface === "paper" ? "paper" : "abyss",
        seed: isComposition ? 4 : 27,
        count: isComposition ? 4 : 6,
        columns: isComposition ? 72 : 110,
        maxCells: isComposition ? 4600 : undefined,
        interactive: false,
        calm: isComposition,
      });
      break;
    }
    case "city":
      engine = createCity(canvas, {
        palette: "abyss",
        seed: 29,
        count: 18,
        columns: 110,
        interactive: false,
        calm: false,
      });
      break;
    case "servers":
      engine = createServers(canvas, {
        palette: "abyss",
        seed: 31,
        count: 8,
        columns: 110,
        interactive: false,
        calm: false,
      });
      break;
    case "lagoon":
      engine = createLagoon(canvas, {
        variant: "reef",
        interactive: false,
        label: "A live ASCII day lagoon",
      });
      break;
    default:
      engine = createSharks(canvas, {
        palette: "abyss",
        seed: 11,
        density: 0.85,
        columns: 110,
        interactive: false,
        calm: false,
      });
  }
  cards.set(canvas, engine);
}

const cardCanvases = Array.from(
  document.querySelectorAll<HTMLCanvasElement>(
    ".scene-preview canvas[data-scene], .composition-mini canvas[data-scene]",
  ),
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
  musecode:
    "Use Muse Code in this project to build a custom ASCII simulation with ascii-things. Read https://ascii-things.dev/guide/framework/ and install with npm i ascii-things. Start from createSimulation in ascii-things/core, keep CellGrid optional, preserve custom action types, and verify the lifecycle and cleanup.",
  antigravity:
    "Use Google Antigravity in this project to build a custom ASCII simulation with ascii-things. Read https://ascii-things.dev/guide/framework/ and install with npm i ascii-things. Start from createSimulation in ascii-things/core, keep CellGrid optional, preserve custom action types, and verify the lifecycle and cleanup.",
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
