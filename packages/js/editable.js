// Page edit mode: elements carrying data-edit="content.path" become directly editable text.
const MODE = (() => {
  const probe = document.createElement("div");
  probe.contentEditable = "plaintext-only";
  return probe.contentEditable === "plaintext-only" ? "plaintext-only" : "true";
})();

let editing = false;

export const isEditing = () => editing;

export function syncEditable() {
  for (const node of document.querySelectorAll("[data-edit]")) {
    if (editing) node.setAttribute("contenteditable", MODE);
    else node.removeAttribute("contenteditable");
  }
}

export function setEditing(on) {
  editing = on;
  document.documentElement.classList.toggle("is-editing", on);
  syncEditable();
}
