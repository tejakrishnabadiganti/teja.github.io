import { el, safeAsset } from "./dom.js";
import { verifyCredentials } from "./auth.js";
import { getContent, refreshSite } from "./site.js";
import { setEditing } from "./editable.js";
import { SECTIONS } from "./schema.js";
import { assetUrl, pendingFiles, stripVersion } from "./store.js";
import { processImage, processPdf } from "./files.js";
import { publish } from "./github.js";

const SESSION_KEY = "portfolio-admin";
const LOCK_KEY = "portfolio-admin-lock";
const GITHUB_KEY = "portfolio-admin-github";
const TOKEN_EXAMPLE = "github_pat_11XXXXXXX0xxxxxxxxxxxx_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;

const ui = { panel: null, body: null, picker: null, status: null, fab: null, bar: null, barStatus: null };
const state = { dirty: false, editing: false, openItems: new WeakSet() };
let fieldCounter = 0;
let refreshTimer;

const isSignedIn = () => sessionStorage.getItem(SESSION_KEY) === "1";
const byPath = (object, path) => path.split(".").reduce((value, key) => value[key], object);

function setByPath(object, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  byPath(object, keys.join("."))[last] = value;
}

/* ---------- Login ---------- */

function readLock() {
  try {
    return JSON.parse(sessionStorage.getItem(LOCK_KEY)) ?? { fails: 0, until: 0 };
  } catch {
    return { fails: 0, until: 0 };
  }
}

function promptLogin() {
  return new Promise((resolve) => {
    const error = el("p", { class: "admin-error", role: "alert" });
    const username = el("input", {
      type: "text",
      id: "admin-user",
      autocomplete: "username",
      autocapitalize: "none",
      spellcheck: "false",
      required: true,
    });
    const password = el("input", {
      type: "password",
      id: "admin-pass",
      autocomplete: "current-password",
      required: true,
    });
    const cancel = el("button", { class: "button button--ghost", type: "button" }, "Cancel");
    const submit = el("button", { class: "button button--primary", type: "submit" }, "Sign in");
    const form = el(
      "form",
      { class: "admin-login__form" },
      el("h2", { class: "admin-login__title" }, "Admin login"),
      el("div", { class: "admin-field" }, el("label", { for: "admin-user", class: "admin-label" }, "Username"), username),
      el("div", { class: "admin-field" }, el("label", { for: "admin-pass", class: "admin-label" }, "Password"), password),
      error,
      el("div", { class: "admin-login__actions" }, cancel, submit)
    );
    const dialog = el("dialog", { class: "admin-login" }, form);
    let signedIn = false;

    cancel.addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => {
      dialog.remove();
      resolve(signedIn);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const lock = readLock();
      if (Date.now() < lock.until) {
        error.textContent = "Too many attempts. Please wait a minute and try again.";
        return;
      }

      submit.disabled = true;
      const ok = await verifyCredentials(username.value, password.value);
      submit.disabled = false;

      if (ok) {
        sessionStorage.removeItem(LOCK_KEY);
        signedIn = true;
        dialog.close();
        return;
      }

      const fails = lock.fails + 1;
      const until = fails >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0;
      sessionStorage.setItem(LOCK_KEY, JSON.stringify({ fails: until ? 0 : fails, until }));
      password.value = "";
      error.textContent = until
        ? "Too many attempts. Please wait a minute and try again."
        : "Incorrect username or password.";
    });

    document.body.append(dialog);
    dialog.showModal();
    username.focus();
  });
}

/* ---------- Editor shell ---------- */

function setStatus(text, dirty) {
  for (const node of [ui.status, ui.barStatus]) {
    node.textContent = text;
    node.dataset.state = dirty ? "dirty" : "";
  }
}

function markDirty() {
  state.dirty = true;
  setStatus("Unpublished changes", true);
}

function changed() {
  markDirty();
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => refreshSite(), 150);
}

// While editing, disabled sections stay visible (marked) so they can be reviewed and re-enabled.
function updatePreview() {
  document.documentElement.classList.toggle("admin-editing", state.editing || !ui.panel.hidden);
}

function showPanel(visible) {
  ui.panel.hidden = !visible;
  updatePreview();
}

function setPageEditing(on) {
  state.editing = on;
  setEditing(on);
  ui.fab.hidden = on;
  ui.bar.hidden = !on;
  if (!on) ui.panel.hidden = true;
  updatePreview();
  clearTimeout(refreshTimer);
  refreshSite();
}

const editableTarget = (event) => (event.target instanceof Element ? event.target.closest("[data-edit]") : null);

function onInlineInput(event) {
  const node = state.editing && editableTarget(event);
  if (!node) return;
  setByPath(getContent(), node.dataset.edit, node.textContent.replace(/\u00a0/g, " "));
  markDirty();
}

function onInlineKeydown(event) {
  if (state.editing && event.key === "Enter" && editableTarget(event)) event.preventDefault();
}

function onInlinePaste(event) {
  if (!state.editing || !editableTarget(event)) return;
  event.preventDefault();
  const text = event.clipboardData.getData("text/plain").replace(/\s*\n\s*/g, " ");
  document.execCommand("insertText", false, text);
}

// While editing, clicking text must place the cursor instead of following links or opening dialogs.
function onInlineClick(event) {
  if (!state.editing || !(event.target instanceof Element)) return;
  const control = event.target.closest("a, button");
  if (!control || !(control.closest("#main") || editableTarget(event))) return;
  event.preventDefault();
  event.stopPropagation();
}

function logout() {
  if (state.dirty && !confirm("You have unpublished changes. Log out and discard them?")) return;
  state.dirty = false;
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
}

function mountEditor() {
  if (ui.panel) return;

  ui.fab = el("button", { class: "admin-fab button button--primary", type: "button" }, "Edit site");
  ui.fab.addEventListener("click", () => setPageEditing(true));

  ui.picker = el(
    "select",
    { class: "admin-select", "aria-label": "Section to edit" },
    SECTIONS.map((section) => el("option", { value: section.id }, section.label)),
    el("option", { value: "publish" }, "Publish & settings")
  );
  ui.picker.addEventListener("change", () => renderTab(ui.picker.value));

  ui.status = el("span", { class: "admin-status" }, "No changes yet");
  ui.barStatus = el("span", { class: "admin-status" }, "No changes yet");

  const close = el("button", { class: "icon-button", type: "button", "aria-label": "Close editor" }, "×");
  close.addEventListener("click", () => showPanel(false));
  const signOut = el("button", { class: "button button--ghost admin-small", type: "button" }, "Log out");
  signOut.addEventListener("click", logout);

  const review = el("button", { class: "button button--primary", type: "button" }, "Review & publish");
  review.addEventListener("click", () => {
    ui.picker.value = "publish";
    renderTab("publish");
  });

  const barButton = (label, className, handler) => {
    const button = el("button", { class: `button ${className} admin-small`, type: "button" }, label);
    button.addEventListener("click", handler);
    return button;
  };
  ui.bar = el(
    "div",
    { class: "admin-bar", role: "toolbar", "aria-label": "Page editing", hidden: true },
    el("span", { class: "admin-bar__hint" }, "Click any text on the page to edit it"),
    ui.barStatus,
    barButton("Settings", "button--ghost", () => showPanel(true)),
    barButton("Publish", "button--primary", () => {
      ui.picker.value = "publish";
      renderTab("publish");
      showPanel(true);
    }),
    barButton("Done", "button--ghost", () => setPageEditing(false))
  );

  ui.body = el("div", { class: "admin-panel__body" });
  ui.panel = el(
    "aside",
    { class: "admin-panel", "aria-label": "Site editor", hidden: true },
    el(
      "header",
      { class: "admin-panel__bar" },
      el("div", {}, el("h2", { class: "admin-panel__title" }, "Edit site"), ui.status),
      el("div", { class: "admin-panel__actions" }, signOut, close)
    ),
    el("div", { class: "admin-panel__picker" }, ui.picker),
    ui.body,
    el("div", { class: "admin-panel__foot" }, review)
  );

  document.body.append(ui.panel, ui.bar, ui.fab);
  document.addEventListener("input", onInlineInput);
  document.addEventListener("keydown", onInlineKeydown);
  document.addEventListener("paste", onInlinePaste);
  document.addEventListener("click", onInlineClick, true);
  window.addEventListener("beforeunload", (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
  renderTab(SECTIONS[0].id);
}

export async function openAdmin() {
  if (!isSignedIn()) {
    if (!(await promptLogin())) return;
    sessionStorage.setItem(SESSION_KEY, "1");
  }
  mountEditor();
  setPageEditing(true);
}

export function restoreSession() {
  if (!isSignedIn()) return;
  mountEditor();
}

/* ---------- Forms ---------- */

function renderTab(id) {
  ui.body.replaceChildren(
    id === "publish" ? publishView() : sectionView(SECTIONS.find((section) => section.id === id))
  );
  ui.body.scrollTop = 0;
}

function sectionView(section) {
  const content = getContent();
  const wrap = el("div", { class: "admin-section" });
  const pageSection = content.sections.find((entry) => entry.id === section.sectionId);
  if (pageSection) {
    wrap.append(
      el(
        "div",
        { class: "admin-visibility" },
        fieldGroup(
          [
            {
              key: "visible",
              label: "Show this section on the public site",
              type: "checkbox",
              help: "Turn off to hide it from visitors. You still see it here, marked as hidden, and can turn it back on any time.",
            },
          ],
          pageSection,
          changed
        )
      )
    );
  }
  if (section.hint) wrap.append(el("p", { class: "admin-hint" }, section.hint));
  if (section.headerFields) {
    wrap.append(fieldGroup(section.headerFields, byPath(content, section.headerPath), changed));
  }
  wrap.append(
    section.kind === "object"
      ? fieldGroup(section.fields, byPath(content, section.path), changed)
      : listView(section)
  );
  return wrap;
}

const fieldGroup = (fields, target, onChange) =>
  el(
    "div",
    { class: "admin-fields" },
    fields.filter((field) => field.when?.(target) ?? true).map((field) => fieldControl(field, target, onChange))
  );

function listView(section) {
  const items = byPath(getContent(), section.path);
  const rerender = () => renderTab(section.id);

  const add = el("button", { class: "button button--ghost", type: "button" }, `Add ${section.itemName}`);
  add.addEventListener("click", () => {
    const item = section.blank();
    items.push(item);
    state.openItems.add(item);
    changed();
    rerender();
  });

  return el(
    "div",
    {},
    el("div", { class: "admin-list" }, items.map((item, index) => itemCard(section, items, item, index, rerender))),
    section.fixed ? "" : add
  );
}

function itemCard(section, items, item, index, rerender) {
  const labelText = () => section.itemLabel(item) || `New ${section.itemName}`;
  const label = el("span", {}, labelText());
  const toggle = el(
    "button",
    { class: "admin-item__toggle", type: "button", "aria-expanded": String(state.openItems.has(item)) },
    label
  );
  const body = el(
    "div",
    { class: "admin-item__body", hidden: !state.openItems.has(item) },
    fieldGroup(section.fields, item, () => {
      label.textContent = labelText();
      changed();
    })
  );

  toggle.addEventListener("click", () => {
    body.hidden = !body.hidden;
    toggle.setAttribute("aria-expanded", String(!body.hidden));
    if (body.hidden) state.openItems.delete(item);
    else state.openItems.add(item);
  });

  const tool = (text, title, handler, disabled = false) => {
    const button = el("button", { class: "admin-item__tool", type: "button", title, "aria-label": title, disabled }, text);
    button.addEventListener("click", handler);
    return button;
  };
  const move = (offset) => () => {
    [items[index], items[index + offset]] = [items[index + offset], items[index]];
    changed();
    rerender();
  };

  return el(
    "div",
    { class: "admin-item" },
    el(
      "div",
      { class: "admin-item__bar" },
      toggle,
      tool("↑", "Move up", move(-1), index === 0),
      tool("↓", "Move down", move(1), index === items.length - 1),
      section.fixed
        ? ""
        : tool("✕", "Delete", () => {
            if (!confirm(`Delete this ${section.itemName}?`)) return;
            items.splice(index, 1);
            changed();
            rerender();
          })
    ),
    body
  );
}

function fieldControl(field, target, onChange) {
  fieldCounter += 1;
  const id = `field-${fieldCounter}`;
  const wrap = el("div", { class: "admin-field" }, el("label", { class: "admin-label", for: id }, field.label));
  let control;

  if (field.type === "image" || field.type === "file") {
    control = uploadControl(field, target, onChange, id);
  } else if (field.type === "checkbox") {
    control = el("input", { id, type: "checkbox" });
    control.checked = target[field.key] !== false;
    control.addEventListener("change", () => {
      target[field.key] = control.checked;
      onChange();
    });
    wrap.classList.add("admin-field--check");
  } else if (field.type === "select") {
    control = el(
      "select",
      { id },
      field.options.map((option) => el("option", { value: option.value }, option.label))
    );
    control.value = target[field.key] ?? field.options[0].value;
    control.addEventListener("change", () => {
      target[field.key] = control.value;
      onChange();
    });
  } else if (["textarea", "lines", "paragraphs"].includes(field.type)) {
    control = el("textarea", { id, rows: field.rows ?? 4 });
    const read = {
      textarea: (text) => text,
      lines: (text) => text.split("\n").map((line) => line.trim()).filter(Boolean),
      paragraphs: (text) => text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean),
    }[field.type];
    const write = {
      textarea: (value) => value ?? "",
      lines: (value) => (value ?? []).join("\n"),
      paragraphs: (value) => (value ?? []).join("\n\n"),
    }[field.type];
    control.value = write(target[field.key]);
    control.addEventListener("input", () => {
      target[field.key] = read(control.value);
      onChange();
    });
  } else {
    control = el("input", { id, type: field.type === "color" ? "color" : "text" });
    control.value = target[field.key] ?? (field.type === "color" ? "#000000" : "");
    control.addEventListener("input", () => {
      target[field.key] = control.value;
      onChange();
    });
    if (field.suggest) {
      const listId = `${id}-options`;
      control.setAttribute("list", listId);
      wrap.append(
        el("datalist", { id: listId }, field.suggest(getContent()).map((value) => el("option", { value })))
      );
    }
  }

  wrap.append(control);
  if (field.help) wrap.append(el("p", { class: "admin-help" }, field.help));
  return wrap;
}

function uploadControl(field, target, onChange, id) {
  const isImage = field.type === "image";
  const preview = isImage
    ? el("img", { class: "admin-preview", alt: "" })
    : el("p", { class: "admin-help" });
  const status = el("p", { class: "admin-help", role: "status" });
  const input = el("input", {
    id,
    type: "file",
    accept: isImage ? "image/png,image/jpeg,image/webp" : "application/pdf",
  });
  const remove = field.optional
    ? el("button", { class: "button button--ghost admin-small", type: "button" }, "Remove")
    : null;

  const refreshPreview = () => {
    const value = target[field.key];
    if (isImage) {
      preview.hidden = !value;
      if (value) preview.setAttribute("src", safeAsset(assetUrl(value)));
    } else {
      preview.textContent = value ? `Current file: ${stripVersion(value).split("/").pop()}` : "No file yet";
    }
    if (remove) remove.hidden = !value;
  };

  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;
    status.textContent = "Processing…";
    try {
      const processed = isImage ? await processImage(file, field) : await processPdf(file);
      const path = `${field.dir}/${field.fileName(target, getContent())}.${processed.ext}`;
      pendingFiles.set(path, { dataUrl: processed.dataUrl, base64: processed.base64 });
      target[field.key] = `${path}?v=${Date.now().toString(36)}`;
      status.textContent = "Ready. Publish to save it to your site.";
      refreshPreview();
      onChange();
    } catch (error) {
      status.textContent = error.message;
    }
    input.value = "";
  });

  remove?.addEventListener("click", () => {
    delete target[field.key];
    refreshPreview();
    onChange();
  });

  refreshPreview();
  return el("div", { class: "admin-upload" }, preview, input, remove, status);
}

/* ---------- Publish ---------- */

function savedGithub() {
  try {
    return JSON.parse(localStorage.getItem(GITHUB_KEY)) ?? {};
  } catch {
    return {};
  }
}

function referencedUploads() {
  const json = JSON.stringify(getContent());
  return [...pendingFiles]
    .filter(([path]) => json.includes(path))
    .map(([path, file]) => ({ path, base64: file.base64 }));
}

function publishView() {
  const content = getContent();
  const saved = savedGithub();
  const textInput = (id, value, type = "text") => {
    const input = el("input", { id, type, autocomplete: "off", spellcheck: "false" });
    input.value = value;
    return input;
  };
  const row = (id, label, input, help) =>
    el(
      "div",
      { class: "admin-field" },
      el("label", { class: "admin-label", for: id }, label),
      input,
      help && el("p", { class: "admin-help" }, help)
    );

  const repo = textInput("pub-repo", saved.repo ?? content.site.repo);
  const branch = textInput("pub-branch", saved.branch ?? content.site.branch);
  const token = textInput("pub-token", saved.token ?? "", "password");
  const message = textInput("pub-message", "Update portfolio content");
  const remember = el("input", { type: "checkbox", id: "pub-remember" });
  remember.checked = Boolean(saved.token);

  const log = el("ul", { class: "admin-log", "aria-live": "polite" });
  const addLog = (text, kind = "info") => log.append(el("li", { "data-kind": kind }, text));

  const publishButton = el("button", { class: "button button--primary", type: "button" }, "Publish to GitHub");
  publishButton.addEventListener("click", async () => {
    log.replaceChildren();
    if (!token.value.trim()) {
      addLog("Enter your GitHub token first.", "error");
      return;
    }
    publishButton.disabled = true;
    content.site.repo = repo.value.trim();
    content.site.branch = branch.value.trim();
    try {
      await publish({
        token: token.value.trim(),
        repo: content.site.repo,
        branch: content.site.branch,
        message: message.value.trim() || "Update portfolio content",
        content,
        files: referencedUploads(),
        onProgress: (text) => addLog(text),
      });
      localStorage.setItem(
        GITHUB_KEY,
        JSON.stringify({
          repo: content.site.repo,
          branch: content.site.branch,
          ...(remember.checked ? { token: token.value.trim() } : {}),
        })
      );
      state.dirty = false;
      setStatus("All changes published", false);
      addLog("Published. Your live site updates in about 1–2 minutes.", "success");
    } catch (error) {
      addLog(error.message, "error");
    } finally {
      publishButton.disabled = false;
    }
  });

  const backup = el("button", { class: "button button--ghost", type: "button" }, "Download backup (content.json)");
  backup.addEventListener("click", () => {
    const url = URL.createObjectURL(
      new Blob([`${JSON.stringify(getContent(), null, 2)}\n`], { type: "application/json" })
    );
    const link = el("a", { href: url, download: "content.json" });
    link.click();
    URL.revokeObjectURL(url);
  });

  const uploads = referencedUploads().length;
  return el(
    "div",
    { class: "admin-section" },
    el(
      "p",
      { class: "admin-hint" },
      state.dirty ? "You have unpublished changes." : "No unpublished changes.",
      uploads ? ` ${uploads} new file${uploads > 1 ? "s" : ""} will be uploaded.` : ""
    ),
    row("pub-repo", "Repository (owner/name)", repo),
    row("pub-branch", "Branch", branch),
    row("pub-message", "Change description", message),
    row(
      "pub-token",
      "GitHub token",
      token,
      "Needed to save to GitHub. Use a fine-grained token limited to this repository with Contents: Read and write."
    ),
    el("label", { class: "admin-check" }, remember, " Remember the token on this device"),
    el("div", { class: "admin-actions" }, publishButton, backup),
    log,
    el(
      "details",
      { class: "admin-help-box", open: true },
      el("summary", {}, "How do I create a token?"),
      el(
        "ol",
        {},
        el("li", {}, "Open github.com and sign in to the account that owns this site."),
        el("li", {}, "Click your profile picture → Settings → Developer settings → Personal access tokens → Fine-grained tokens."),
        el("li", {}, "Click Generate new token and give it a name, for example “portfolio-editor”."),
        el("li", {}, "Set an expiry date (90 days is a good choice; you can make a new token later)."),
        el("li", {}, "Under Repository access, choose Only select repositories and pick this site's repository."),
        el("li", {}, "Under Repository permissions, set Contents to Read and write. Leave everything else as it is."),
        el("li", {}, "Click Generate token, then copy it right away. GitHub shows it only once."),
        el("li", {}, "Paste it into the GitHub token box above and press Publish to GitHub.")
      ),
      el("p", { class: "admin-help" }, "A token looks like this (example only, not a real token):"),
      el("code", { class: "admin-token-example" }, TOKEN_EXAMPLE),
      el("p", { class: "admin-help" }, "Keep it private. Never share it or save it in the site files.")
    )
  );
}
