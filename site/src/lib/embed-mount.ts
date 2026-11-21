import "ascii-things/element";
import { EMBED_SCENE_BY_ID, embedLabel, parseEmbedParams, type EmbedConfig } from "./embed";

/**
 * Creates the custom element for a configuration. All state is written as
 * attributes before the element is connected, so the scene mounts once.
 */
export function createEmbedScene(config: EmbedConfig): HTMLElement {
  const meta = EMBED_SCENE_BY_ID[config.scene];
  const element = document.createElement(meta.tag);

  element.id = "embed-scene";
  element.dataset.embedScene = config.scene;
  element.dataset.embedPalette = config.palette;
  element.setAttribute("label", embedLabel(config));
  element.setAttribute("palette", config.palette);
  element.setAttribute("seed", String(config.seed));
  element.setAttribute("speed", String(config.speed));

  if (meta.supportsColumns) element.setAttribute("columns", String(config.columns));
  if (config.variant && meta.variantAttribute) {
    element.setAttribute(meta.variantAttribute, config.variant);
  }
  if (config.paused) element.setAttribute("paused", "true");
  if (!config.interactive) element.setAttribute("interactive", "false");
  if (config.calm) element.setAttribute("calm", "true");

  return element;
}

/** Mounts `/embed/` from the current URL. */
export function mountEmbed(root: HTMLElement | null = document.getElementById("embed-stage")) {
  if (!root) return;

  const config = parseEmbedParams(window.location.search);
  const element = createEmbedScene(config);

  root.dataset.scene = config.scene;
  root.dataset.palette = config.palette;
  root.dataset.ready = "false";
  document.documentElement.dataset.embedScene = config.scene;

  element.addEventListener(
    "ascii-ready",
    () => {
      root.dataset.ready = "true";
    },
    { once: true },
  );

  root.replaceChildren(element);
  document.title = `${embedLabel(config)} — ascii-things embed`;
}
