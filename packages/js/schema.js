export const slug = (text) =>
  String(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// "Microsoft · AZ-900" + "Microsoft Azure Fundamentals" -> "microsoft-az-900-azure-fundamentals"
const mergedSlug = (...parts) => {
  const seen = new Set();
  return parts
    .flatMap((part) => slug(part).split("-"))
    .filter((word) => word && !seen.has(word) && seen.add(word))
    .join("-");
};

const certificateFileName = (item) => mergedSlug(item.issuer, item.name) || "certificate";

const unique = (values) => [...new Set(values.filter(Boolean))];

// Each section describes what the editor shows. `kind: "list"` sections edit an array.
export const SECTIONS = [
  {
    id: "profile",
    label: "Profile, photo & resume",
    kind: "object",
    path: "profile",
    fields: [
      { key: "name", label: "Full name", type: "text" },
      { key: "initials", label: "Initials (logo)", type: "text" },
      { key: "role", label: "Job title", type: "text" },
      { key: "headline", label: "Headline", type: "text" },
      { key: "headlineEmphasis", label: "Headline (highlighted part)", type: "text" },
      { key: "lead", label: "Intro paragraph", type: "textarea" },
      {
        key: "photo",
        label: "Profile photo",
        type: "image",
        dir: "packages/images/profile",
        maxPx: 960,
        format: "jpeg",
        fileName: (_item, content) => `${slug(content.profile.name)}-profile`,
      },
      { key: "photoAlt", label: "Photo description (for screen readers)", type: "text" },
      {
        key: "resume",
        label: "Resume (PDF)",
        type: "file",
        dir: "packages/documents",
        fileName: (_item, content) => `${content.profile.name.trim().replace(/\s+/g, "_")}_Resume`,
      },
    ],
  },
  {
    id: "contact",
    label: "Contact & social links",
    kind: "object",
    path: "contact",
    fields: [
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "locationShort", label: "Location (short, shown in the top section)", type: "text" },
      { key: "location", label: "Location (full, shown in Contact)", type: "text" },
      { key: "linkedin", label: "LinkedIn link", type: "url" },
      { key: "github", label: "GitHub link", type: "url" },
      { key: "heading", label: "Contact heading", type: "text" },
      { key: "lead", label: "Contact text", type: "textarea", rows: 3 },
    ],
  },
  {
    id: "stats",
    label: "Highlights (numbers)",
    kind: "list",
    path: "stats",
    itemName: "highlight",
    hint: "Use {certifications} as the value to show the number of certifications automatically.",
    itemLabel: (item) => `${item.value} ${item.label}`,
    blank: () => ({ value: "", label: "" }),
    fields: [
      { key: "value", label: "Value", type: "text" },
      { key: "label", label: "Label", type: "text" },
    ],
  },
  {
    id: "about",
    label: "About",
    kind: "object",
    path: "about",
    fields: [
      {
        key: "paragraphs",
        label: "About text",
        type: "paragraphs",
        rows: 12,
        help: "Separate paragraphs with a blank line.",
      },
    ],
  },
  {
    id: "experience",
    label: "Experience",
    kind: "list",
    path: "experience",
    itemName: "job",
    itemLabel: (item) => [item.role, item.company].filter(Boolean).join(" — "),
    blank: () => ({ role: "", company: "", client: "", period: "", place: "", bullets: [] }),
    fields: [
      { key: "role", label: "Job title", type: "text" },
      { key: "company", label: "Company", type: "text" },
      { key: "client", label: "Client / project (optional)", type: "text" },
      { key: "period", label: "Dates (e.g. May 2022 – Dec 2025)", type: "text" },
      { key: "place", label: "Location", type: "text" },
      { key: "bullets", label: "Achievements", type: "lines", rows: 10, help: "One achievement per line." },
    ],
  },
  {
    id: "work",
    label: "Selected work",
    kind: "list",
    path: "work",
    itemName: "project",
    itemLabel: (item) => item.title,
    blank: () => ({ tag: "", title: "", text: "" }),
    fields: [
      { key: "tag", label: "Category", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "text", label: "Description", type: "textarea" },
    ],
  },
  {
    id: "skills",
    label: "Skills",
    kind: "list",
    path: "skills",
    itemName: "skill group",
    itemLabel: (item) => item.title,
    blank: () => ({ title: "", items: [] }),
    fields: [
      { key: "title", label: "Group name", type: "text" },
      { key: "items", label: "Skills", type: "lines", rows: 8, help: "One skill per line." },
    ],
  },
  {
    id: "awards",
    label: "Awards",
    kind: "list",
    path: "awards",
    itemName: "award",
    itemLabel: (item) => item.title,
    blank: () => ({ title: "", text: "" }),
    fields: [
      { key: "title", label: "Award", type: "text" },
      { key: "text", label: "Description", type: "textarea", rows: 3 },
    ],
  },
  {
    id: "certifications",
    label: "Certifications",
    kind: "list",
    path: "certifications.items",
    itemName: "certification",
    headerPath: "certifications",
    headerFields: [{ key: "credly", label: "Credly profile link", type: "url" }],
    itemLabel: (item) => item.name,
    blank: () => ({ name: "", issuer: "", group: "Cloud & Infrastructure" }),
    fields: [
      { key: "name", label: "Certification name", type: "text" },
      { key: "issuer", label: "Issuer and code (e.g. Microsoft · AZ-900)", type: "text" },
      {
        key: "group",
        label: "Group",
        type: "text",
        help: "Pick an existing group or type a new one.",
        suggest: (content) => unique(content.certifications.items.map((item) => item.group)),
      },
      {
        key: "certificate",
        label: "Certificate image",
        type: "image",
        dir: "packages/images/certificates",
        maxPx: 1600,
        fileName: certificateFileName,
        help: "Name the issuer and certification first; the file is named from them.",
      },
      {
        key: "badge",
        label: "Digital badge image (optional)",
        type: "image",
        dir: "packages/images/badges",
        maxPx: 600,
        optional: true,
        fileName: certificateFileName,
      },
      { key: "verifyUrl", label: "Verification link (optional, e.g. Credly)", type: "url" },
    ],
  },
  {
    id: "education",
    label: "Education",
    kind: "list",
    path: "education",
    itemName: "education entry",
    itemLabel: (item) => item.title,
    blank: () => ({ title: "", place: "", period: "", score: "" }),
    fields: [
      { key: "title", label: "Degree", type: "text" },
      { key: "place", label: "Institution", type: "text" },
      { key: "period", label: "Dates", type: "text" },
      { key: "score", label: "Score / grade", type: "text" },
    ],
  },
  {
    id: "theme",
    label: "Theme & colors",
    kind: "object",
    path: "theme",
    fields: [
      {
        key: "default",
        label: "Default theme for new visitors",
        type: "select",
        options: [
          { value: "system", label: "Follow the visitor's device" },
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ],
      },
      { key: "accent", label: "Accent color (light theme)", type: "color" },
      { key: "gold", label: "Highlight color (light theme)", type: "color" },
      { key: "accentDark", label: "Accent color (dark theme)", type: "color" },
      { key: "goldDark", label: "Highlight color (dark theme)", type: "color" },
    ],
  },
];
