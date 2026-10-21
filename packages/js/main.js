import { el } from "./dom.js";
import { loadSite } from "./site.js";
import { initUi } from "./ui.js";

document.documentElement.classList.add("js");

try {
  await loadSite();
} catch (error) {
  console.error(error);
  document
    .getElementById("main")
    .prepend(el("p", { class: "container load-error" }, "The page content could not be loaded. Please refresh."));
}

initUi();
