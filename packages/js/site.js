import { renderPage } from "./render.js";
import { applyTheme } from "./theme.js";
import { observeReveal } from "./reveal.js";
import { withDefaults } from "./defaults.js";
import { syncEditable } from "./editable.js";

let content = null;

export const getContent = () => content;

export function refreshSite({ animate = false } = {}) {
  renderPage(content);
  applyTheme(content.theme);
  syncEditable();
  if (animate) observeReveal();
}

export async function loadSite() {
  const request = window.contentRequest ?? fetch(`data/content.json?t=${Date.now()}`, { cache: "no-store" });
  window.contentRequest = null;
  const response = await request;
  if (!response.ok) throw new Error(`Could not load content (${response.status})`);
  content = withDefaults(await response.json());
  refreshSite({ animate: true });
}
