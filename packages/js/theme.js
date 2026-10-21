const HEX = /^#[0-9a-f]{6}$/i;

// Picks readable text for buttons that use the accent color as background.
function contrastOn(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.35 ? "#14171f" : "#ffffff";
}

function block(selector, accent, gold) {
  const rules = [];
  if (HEX.test(accent)) {
    rules.push(`--accent:${accent}`, `--accent-contrast:${contrastOn(accent)}`);
  }
  if (HEX.test(gold)) rules.push(`--gold:${gold}`);
  return rules.length ? `${selector}{${rules.join(";")}}` : "";
}

export function applyTheme(theme) {
  let style = document.getElementById("theme-overrides");
  if (!style) {
    style = document.createElement("style");
    style.id = "theme-overrides";
    document.head.append(style);
  }
  style.textContent =
    block(":root", theme.accent, theme.gold) +
    block('[data-theme="dark"]', theme.accentDark, theme.goldDark);

  // A visitor's own choice always wins over the site default.
  if (!localStorage.getItem("theme") && ["light", "dark"].includes(theme.default)) {
    document.documentElement.dataset.theme = theme.default;
  }
}
