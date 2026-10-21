const HEX = /^#[0-9a-f]{6}$/i;

// Only these families can be chosen, so a name from the editor can never inject CSS or a URL.
export const HEADING_FONTS = {
  "Playfair Display": "Playfair+Display:ital,wght@0,500;0,600;0,700;1,500",
  "Cormorant Garamond": "Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500",
  Fraunces: "Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500",
  "Libre Baskerville": "Libre+Baskerville:ital,wght@0,400;0,700;1,400",
  Lora: "Lora:ital,wght@0,500;0,600;0,700;1,500",
  Merriweather: "Merriweather:ital,wght@0,400;0,700;1,400",
};

export const BODY_FONTS = {
  Inter: "Inter:wght@400;500;600",
  "Source Sans 3": "Source+Sans+3:wght@400;500;600",
  Lato: "Lato:wght@400;700",
  "Nunito Sans": "Nunito+Sans:wght@400;600;700",
  "Open Sans": "Open+Sans:wght@400;500;600",
};

// These two are already loaded by index.html, so choosing them costs no extra request.
const PRELOADED = { heading: "Playfair Display", body: "Inter" };
const SERIF_FALLBACK = 'Georgia, "Times New Roman", serif';
const SANS_FALLBACK = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

// Picks readable text for buttons that use the accent color as background.
function contrastOn(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.35 ? "#14171f" : "#ffffff";
}

function block(selector, { accent, gold, ink, muted }) {
  const rules = [];
  if (HEX.test(accent)) {
    rules.push(`--accent:${accent}`, `--accent-contrast:${contrastOn(accent)}`);
  }
  if (HEX.test(gold)) rules.push(`--gold:${gold}`);
  if (HEX.test(ink)) rules.push(`--ink:${ink}`);
  if (HEX.test(muted)) rules.push(`--muted:${muted}`);
  return rules.length ? `${selector}{${rules.join(";")}}` : "";
}

function fontRules({ fontHeading, fontBody }) {
  const heading = fontHeading in HEADING_FONTS ? fontHeading : PRELOADED.heading;
  const body = fontBody in BODY_FONTS ? fontBody : PRELOADED.body;

  const families = [];
  if (heading !== PRELOADED.heading) families.push(HEADING_FONTS[heading]);
  if (body !== PRELOADED.body) families.push(BODY_FONTS[body]);

  let link = document.getElementById("theme-fonts");
  if (!families.length) {
    link?.remove();
  } else {
    const href = `https://fonts.googleapis.com/css2?${families.map((family) => `family=${family}`).join("&")}&display=swap`;
    if (!link) {
      link = document.createElement("link");
      link.id = "theme-fonts";
      link.rel = "stylesheet";
      document.head.append(link);
    }
    if (link.getAttribute("href") !== href) link.setAttribute("href", href);
  }

  return `:root{--font-serif:"${heading}",${SERIF_FALLBACK};--font-sans:"${body}",${SANS_FALLBACK}}`;
}

export function applyTheme(theme) {
  let style = document.getElementById("theme-overrides");
  if (!style) {
    style = document.createElement("style");
    style.id = "theme-overrides";
    document.head.append(style);
  }
  style.textContent =
    block(":root", theme) +
    block('[data-theme="dark"]', {
      accent: theme.accentDark,
      gold: theme.goldDark,
      ink: theme.inkDark,
      muted: theme.mutedDark,
    }) +
    fontRules(theme);

  // A visitor's own choice always wins over the site default.
  if (!localStorage.getItem("theme") && ["light", "dark"].includes(theme.default)) {
    document.documentElement.dataset.theme = theme.default;
  }
}
