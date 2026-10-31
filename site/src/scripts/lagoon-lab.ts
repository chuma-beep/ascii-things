import { createLagoon, type LagoonVariant } from "ascii-things/lagoon";

type LagoonScene =
  | "day"
  | "night"
  | "turtle"
  | "manta"
  | "seahorse"
  | "dolphin"
  | "hammer"
  | "tang";

const PUBLIC_VARIANT: Record<LagoonScene, LagoonVariant> = {
  day: "reef",
  night: "night",
  turtle: "turtle",
  manta: "manta",
  seahorse: "seahorse",
  dolphin: "dolphin",
  hammer: "hammerhead",
  tang: "tang",
};

type Mode = "ambient" | "search" | "chat" | "embed";

const MODES: Mode[] = ["ambient", "search", "chat", "embed"];
const SCENE_LABELS: Record<LagoonScene, string> = {
  day: "Day lagoon",
  night: "Night reef",
  turtle: "Turtle close-up",
  manta: "Manta flyby",
  seahorse: "Seahorse",
  dolphin: "Dolphin pod",
  hammer: "Hammerhead pass",
  tang: "Tang school",
};
const root = document.querySelector<HTMLElement>("[data-lagoon-lab]");
const tabs = [...document.querySelectorAll<HTMLButtonElement>("[data-mode-tab]")];
const panels = [...document.querySelectorAll<HTMLElement>("[data-panel]")];
const sceneInputs = [...document.querySelectorAll<HTMLInputElement>("[data-scene-input]")];

const railIndex = document.querySelector<HTMLElement>("[data-rail-index]");
const railTitle = document.querySelector<HTMLElement>("[data-rail-title]");
const railDesc = document.querySelector<HTMLElement>("[data-rail-desc]");
const railUse = document.querySelector<HTMLElement>("[data-rail-use]");
const railState = document.querySelector<HTMLElement>("[data-rail-state]");
const railScene = document.querySelector<HTMLElement>("[data-rail-scene]");

const searchInput = document.querySelector<HTMLInputElement>("[data-search-input]");
const searchForm = document.querySelector<HTMLFormElement>("[data-search-form]");
const searchCount = document.querySelector<HTMLElement>("[data-search-count]");
const searchResults = document.querySelector<HTMLElement>("[data-search-results]");
const searchItems = [...document.querySelectorAll<HTMLElement>("[data-search-item]")];
const searchEmpty = document.querySelector<HTMLElement>("[data-search-empty]");
const searchTerm = document.querySelector<HTMLElement>("[data-search-term]");
const searchClear = document.querySelector<HTMLButtonElement>("[data-search-clear]");

const chatForm = document.querySelector<HTMLFormElement>("[data-chat-form]");
const chatInput = document.querySelector<HTMLTextAreaElement>("[data-chat-input]");
const chatReply = document.querySelector<HTMLElement>("[data-chat-reply]");

function modeFromHash(): Mode {
  const id = window.location.hash.replace("#", "");
  return MODES.includes(id as Mode) ? (id as Mode) : "ambient";
}

function currentMode(): Mode {
  return (root?.dataset.mode as Mode | undefined) ?? "ambient";
}

function selectMode(mode: Mode, options: { focusTab?: boolean; updateHash?: boolean } = {}) {
  const tab = tabs.find((item) => item.dataset.modeTab === mode);
  if (!root || !tab) return;

  root.dataset.mode = mode;

  for (const item of tabs) {
    const active = item === tab;
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
  }

  for (const panel of panels) {
    panel.hidden = panel.dataset.panel !== mode;
  }

  if (railIndex) railIndex.textContent = tab.dataset.index ?? "";
  if (railTitle) railTitle.textContent = tab.dataset.name ?? "";
  if (railDesc) railDesc.textContent = tab.dataset.desc ?? "";
  if (railUse) railUse.textContent = tab.dataset.use ?? "";

  if (options.updateHash !== false) {
    const next = `#${mode}`;
    if (window.location.hash !== next) {
      window.history.replaceState(null, "", next);
    }
  }

  if (options.focusTab) tab.focus({ preventScroll: true });
}

function visibleResults() {
  return searchItems.filter((item) => !item.hidden);
}

function filterSearch() {
  if (!searchInput || !searchCount || !searchEmpty) return;
  const query = searchInput.value.trim().toLocaleLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);

  let matches = 0;
  for (const item of searchItems) {
    const haystack = item.dataset.searchText ?? "";
    const hit = terms.every((term) => haystack.includes(term));
    item.hidden = !hit;
    if (hit) matches++;
  }

  searchCount.textContent = matches === 1 ? "1 result" : `${matches} results`;
  if (searchResults) searchResults.hidden = matches === 0;
  searchEmpty.hidden = matches !== 0;
  if (searchTerm) {
    searchTerm.textContent = `“${searchInput.value.trim()}”`;
  }
}

function resetSearch() {
  if (!searchInput) return;
  searchInput.value = "";
  filterSearch();
  searchInput.focus({ preventScroll: true });
}

function replyFor(text: string) {
  const lower = text.toLocaleLowerCase();
  if (/(turtle|honu|shell)/.test(lower)) {
    return `Honu surfaces. “Three turtles are circling the reef — they heard you.”`;
  }
  if (/(flower|plumeria|hibiscus|bloom)/.test(lower)) {
    return `A plumeria drifts past. “The lagoon is always in bloom.”`;
  }
  if (/(search|find|look)/.test(lower)) {
    return `“Try the Search tab — the reef index is local and instant.”`;
  }
  return `Honu is listening. You said: “${text}”`;
}

function sendChat() {
  if (!chatForm || !chatInput || !chatReply) return;
  const text = chatInput.value.trim();
  if (!text) {
    chatInput.focus();
    return;
  }

  chatReply.textContent = replyFor(text);
  chatReply.classList.add("is-visible");
  chatInput.value = "";
  chatInput.focus();
}

function focusMode(mode: Mode) {
  if (mode === "search") searchInput?.focus({ preventScroll: true });
  else if (mode === "chat") chatInput?.focus({ preventScroll: true });
  else tabs.find((item) => item.dataset.modeTab === mode)?.focus({ preventScroll: true });
}

function focusOnCard(card: HTMLElement | null, input: HTMLElement | null) {
  if (!card || !input) return;

  const focusInput = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("button, a, input, textarea, select")) return;
    input.focus({ preventScroll: true });
  };

  card.addEventListener("pointerdown", (event) => {
    // Mouse users expect the whole frosted panel to act like the input.
    // Touch users get the same behaviour on click so a swipe still scrolls.
    if (event.pointerType !== "mouse") return;
    event.preventDefault();
    focusInput(event);
  });

  card.addEventListener("click", focusInput);
}

let lagoons: ReturnType<typeof createLagoon>[] = [];

function sceneFromValue(value: string | undefined): LagoonScene {
  return value === "night" ||
    value === "turtle" ||
    value === "manta" ||
    value === "seahorse" ||
    value === "dolphin" ||
    value === "hammer" ||
    value === "tang"
    ? value
    : "day";
}

function sceneFromInputs(): LagoonScene {
  const checked = sceneInputs.find((input) => input.checked);
  return sceneFromValue(checked?.value);
}

function paintScene(scene: LagoonScene) {
  if (root) root.dataset.scene = scene;
  if (railScene) railScene.textContent = SCENE_LABELS[scene];
  for (const input of sceneInputs) input.checked = input.value === scene;
  for (const lagoon of lagoons) lagoon.setOptions({ variant: PUBLIC_VARIANT[scene] });
}

function mountScene() {
  const initial = sceneFromInputs();
  lagoons = [...document.querySelectorAll<HTMLCanvasElement>("[data-lagoon-canvas]")].map(
    (canvas) => createLagoon(canvas, { variant: PUBLIC_VARIANT[initial] }),
  );
  paintScene(initial);

  for (const input of sceneInputs) {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      paintScene(sceneFromValue(input.value));
    });
  }
}

if (root) {
  selectMode(modeFromHash(), { updateHash: false });

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      selectMode(tab.dataset.modeTab as Mode);
    });

    tab.addEventListener("keydown", (event) => {
      const index = tabs.indexOf(tab);
      let next = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        next = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectMode(tabs[next].dataset.modeTab as Mode, { focusTab: true });
    });
  }

  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-go-mode]")) {
    button.addEventListener("click", () => {
      const mode = button.dataset.goMode as Mode | undefined;
      if (mode && MODES.includes(mode)) {
        selectMode(mode);
        requestAnimationFrame(() => focusMode(mode));
      }
    });
  }

  window.addEventListener("hashchange", () => {
    selectMode(modeFromHash(), { updateHash: false });
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("input, textarea, select, [contenteditable='true']")
    ) {
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key >= "1" && event.key <= "4") {
      event.preventDefault();
      selectMode(MODES[Number(event.key) - 1], { focusTab: true });
      return;
    }

    if (event.key === "/") {
      event.preventDefault();
      const active = currentMode();
      const next: Mode = active === "chat" ? "chat" : "search";
      selectMode(next);
      requestAnimationFrame(() => {
        if (next === "search") searchInput?.focus({ preventScroll: true });
        else chatInput?.focus({ preventScroll: true });
      });
    }
  });

  focusOnCard(searchForm, searchInput);
  focusOnCard(chatForm, chatInput);

  if (searchForm && searchInput) {
    filterSearch();
    searchInput.addEventListener("input", filterSearch);
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && searchInput.value) {
        event.preventDefault();
        resetSearch();
      }
    });
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const first = visibleResults()[0]?.querySelector<HTMLAnchorElement>("a");
      first?.focus({ preventScroll: true });
    });
  }

  searchClear?.addEventListener("click", resetSearch);

  if (chatForm && chatInput) {
    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      sendChat();
    });
    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        chatForm.requestSubmit();
      }
    });
  }

  const stage = document.querySelector<HTMLElement>("[data-lagoon-stage]");
  if (stage && railState) {
    const paintState = () => {
      const state = stage.dataset.lagoonState ?? "idle";
      railState.textContent = state === "static" ? "still (reduced motion)" : state;
    };
    paintState();
    new MutationObserver(paintState).observe(stage, {
      attributes: true,
      attributeFilter: ["data-lagoon-state"],
    });
  }

  mountScene();
}
