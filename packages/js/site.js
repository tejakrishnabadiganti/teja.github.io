import { renderPage } from "./render.js";
import { applyTheme } from "./theme.js";
import { observeReveal } from "./reveal.js";

let content = null;

export const getContent = () => content;

export function refreshSite({ animate = false } = {}) {
  renderPage(content);
  applyTheme(content.theme);
  if (animate) observeReveal();
}

export async function loadSite() {
  const response = await fetch(`data/content.json?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load content (${response.status})`);
  content = await response.json();
  refreshSite({ animate: true });
}
