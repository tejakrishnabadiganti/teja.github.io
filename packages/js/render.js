import { el, safeUrl, safeAsset } from "./dom.js";
import { assetUrl, stripVersion } from "./store.js";
import { isEditing } from "./editable.js";

const $ = (id) => document.getElementById(id);

// Fills a static element and marks it as editable at the given content path.
const setText = (id, path, value) => {
  const node = $(id);
  node.dataset.edit = path;
  node.textContent = value;
  return node;
};
const asset = (path) => (path ? safeAsset(assetUrl(path)) : "#");
const baseName = (path) => stripVersion(path).split("/").pop();
const externalLink = (href, label) =>
  el("a", { href: safeUrl(href), target: "_blank", rel: "noopener noreferrer" }, label);

export function renderPage(content) {
  document.title = content.site.title;
  document
    .querySelector('meta[name="description"]')
    .setAttribute("content", content.site.description);

  renderChrome(content);
  renderSections(content);
  renderHero(content);
  renderStats(content);
  renderBadges(content);
  renderAbout(content);
  renderExperience(content);
  renderWork(content);
  renderSkills(content);
  renderAwards(content);
  renderCertifications(content);
  renderEducation(content);
  renderContact(content);
}

function renderChrome({ profile }) {
  $("brand").setAttribute("aria-label", `${profile.name}, home`);
  setText("brand-mark", "profile.initials", profile.initials);
  setText("brand-name", "profile.name", profile.name);
  $("footer-name").textContent = profile.name;
  $("year").textContent = new Date().getFullYear();
}

function renderSections({ sections }) {
  const main = $("main");
  const menu = [];
  let alternate = false;

  for (const [index, section] of sections.entries()) {
    const node = document.getElementById(section.id);
    if (!node) continue;

    main.append(node); // moves the section to match the saved order
    const enabled = section.visible !== false;
    node.hidden = !enabled;
    node.classList.toggle("is-disabled", !enabled);

    const eyebrow = node.querySelector("[data-eyebrow]");
    if (!eyebrow) continue; // highlights and badge strip have no heading, menu entry or background
    const title = node.querySelector("[data-title]");
    eyebrow.dataset.edit = `sections.${index}.eyebrow`;
    eyebrow.textContent = section.eyebrow;
    title.dataset.edit = `sections.${index}.title`;
    title.textContent = section.title;

    if (!enabled) continue;
    node.classList.toggle("section--alt", alternate);
    alternate = !alternate;
    if (section.nav) menu.push(section);
  }

  $("nav-list").replaceChildren(
    ...menu.map((section) => {
      const isContact = section.id === "contact";
      return el(
        "li",
        {},
        el("a", { class: isContact ? "nav__link nav__link--cta" : "nav__link", href: `#${section.id}` }, section.nav)
      );
    })
  );
}

function renderHero({ profile, contact }) {
  setText("hero-eyebrow", "profile.role", profile.role);
  $("hero-title").replaceChildren(
    el("span", { "data-edit": "profile.headline" }, profile.headline),
    " ",
    el("em", { "data-edit": "profile.headlineEmphasis" }, profile.headlineEmphasis)
  );
  setText("hero-lead", "profile.lead", profile.lead);
  setText("hero-cta-primary", "profile.ctaPrimary", profile.ctaPrimary);

  const resume = setText("hero-resume", "profile.ctaSecondary", profile.ctaSecondary);
  resume.setAttribute("href", asset(profile.resume));
  resume.setAttribute("download", baseName(profile.resume));

  $("hero-meta").replaceChildren(
    el("li", { "data-edit": "contact.locationShort" }, contact.locationShort),
    el("li", {}, externalLink(contact.linkedin, "LinkedIn")),
    el("li", {}, externalLink(contact.github, "GitHub"))
  );

  const photo = $("hero-photo");
  photo.setAttribute("src", asset(profile.photo));
  photo.setAttribute("alt", profile.photoAlt);
}

function renderStats(content) {
  const counts = { certifications: content.certifications.items.length, awards: content.awards.length };
  const resolve = (value) => String(value).replace(/\{(certifications|awards)\}/g, (_, key) => counts[key]);
  $("stats").replaceChildren(
    ...content.stats.map((stat, index) =>
      el(
        "div",
        { class: "stat" },
        el(
          "span",
          { class: "stat__value", "data-edit": `stats.${index}.value` },
          // Editors see the raw {certifications} placeholder so it survives editing.
          isEditing() ? stat.value : resolve(stat.value)
        ),
        el("span", { class: "stat__label", "data-edit": `stats.${index}.label` }, stat.label)
      )
    )
  );
}

function renderBadges({ certifications }) {
  const badged = certifications.items.filter((item) => item.badge);
  const badge = (item, decorative) =>
    el("img", { loading: "lazy", decoding: "async", src: asset(item.badge), alt: decorative ? "" : item.name, height: "64" });

  // The list is rendered twice so the strip can scroll in a seamless loop.
  const strip = $("badge-strip");
  strip.replaceChildren(
    ...badged.map((item) => el("li", {}, badge(item, false))),
    ...badged.map((item) => el("li", { "aria-hidden": "true" }, badge(item, true)))
  );
  $("badges").hidden ||= badged.length === 0;
}

function renderAbout({ about }) {
  $("about-body").replaceChildren(
    ...about.paragraphs.map((text, index) => text && el("p", { "data-edit": `about.paragraphs.${index}` }, text))
  );
}

function renderExperience({ experience }) {
  $("timeline").replaceChildren(
    ...experience.map((job, index) => {
      const at = (key) => `experience.${index}.${key}`;
      return el(
        "li",
        { class: "timeline__item" },
        el(
          "div",
          { class: "timeline__meta" },
          el("p", { class: "timeline__date", "data-edit": at("period") }, job.period),
          el("p", { class: "timeline__place", "data-edit": at("place") }, job.place)
        ),
        el(
          "article",
          { class: "timeline__body" },
          el("h3", { class: "timeline__role", "data-edit": at("role") }, job.role),
          el(
            "p",
            { class: "timeline__company" },
            el("span", { class: "timeline__company-name", "data-edit": at("company") }, job.company),
            (job.client || isEditing()) && el("span", { class: "timeline__client", "data-edit": at("client") }, job.client)
          ),
          el(
            "ul",
            { class: "checklist" },
            job.bullets.map((bullet, line) => bullet && el("li", { "data-edit": at(`bullets.${line}`) }, bullet))
          )
        )
      );
    })
  );
}

function renderWork({ work }) {
  $("work-cards").replaceChildren(
    ...work.map((card, index) =>
      el(
        "article",
        { class: "card" },
        el("p", { class: "card__tag", "data-edit": `work.${index}.tag` }, card.tag),
        el("h3", { class: "card__title", "data-edit": `work.${index}.title` }, card.title),
        el("p", { class: "card__text", "data-edit": `work.${index}.text` }, card.text)
      )
    )
  );
}

function renderSkills({ skills }) {
  $("skills-grid").replaceChildren(
    ...skills.map((group, index) =>
      el(
        "section",
        { class: "skills__group" },
        el("h3", { class: "skills__title", "data-edit": `skills.${index}.title` }, group.title),
        el(
          "ul",
          { class: "tags" },
          group.items.map((item, tag) => item && el("li", { "data-edit": `skills.${index}.items.${tag}` }, item))
        )
      )
    )
  );
}

function renderAwards({ awards }) {
  $("awards-list").replaceChildren(
    ...awards.map((award, index) =>
      el(
        "li",
        { class: "award" },
        el("h3", { class: "award__title", "data-edit": `awards.${index}.title` }, award.title),
        el("p", { class: "award__text", "data-edit": `awards.${index}.text` }, award.text)
      )
    )
  );
}

function certificateCard(item, index) {
  const href = item.verifyUrl ? safeUrl(item.verifyUrl) : asset(item.certificate);
  return el(
    "li",
    { class: "cert" },
    el(
      "a",
      {
        class: "cert__link",
        href,
        target: "_blank",
        rel: "noopener noreferrer",
        "data-file": item.certificate ? baseName(item.certificate) : null,
      },
      item.certificate &&
        el("img", { loading: "lazy", decoding: "async", src: asset(item.certificate), alt: `${item.name} certificate` }),
      item.badge &&
        el("img", { class: "cert__badge", loading: "lazy", decoding: "async", src: asset(item.badge), alt: "" }),
      el("span", { class: "cert__name", "data-edit": `certifications.items.${index}.name` }, item.name),
      el("span", { class: "cert__issuer", "data-edit": `certifications.items.${index}.issuer` }, item.issuer)
    )
  );
}

function renderCertifications({ certifications }) {
  const groups = new Map();
  certifications.items.forEach((item, index) => {
    const name = item.group || "Other";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push({ item, index });
  });

  $("cert-groups").replaceChildren(
    ...[...groups].map(([name, entries]) =>
      el(
        "div",
        { class: "certs__section" },
        el("h3", { class: "certs__group" }, name),
        el("ul", { class: "certs" }, entries.map(({ item, index }) => certificateCard(item, index)))
      )
    )
  );
  setText("cert-note", "certifications.note", certifications.note);
  const credly = setText("cert-credly", "certifications.credlyLabel", certifications.credlyLabel);
  credly.setAttribute("href", safeUrl(certifications.credly));
}

function renderEducation({ education }) {
  $("education-list").replaceChildren(
    ...education.map((entry, index) =>
      el(
        "li",
        { class: "education__item" },
        el(
          "div",
          {},
          el("h3", { class: "education__title", "data-edit": `education.${index}.title` }, entry.title),
          el("p", { class: "education__place", "data-edit": `education.${index}.place` }, entry.place)
        ),
        el(
          "p",
          { class: "education__meta" },
          el("span", { "data-edit": `education.${index}.period` }, entry.period),
          (entry.score || isEditing()) && [el("br"), el("span", { "data-edit": `education.${index}.score` }, entry.score)]
        )
      )
    )
  );
}

function renderContact({ contact }) {
  setText("contact-lead", "contact.lead", contact.lead);
  $("contact-form-open").textContent = contact.formButton;

  const email = setText("contact-email", "contact.email", contact.email);
  email.setAttribute("href", safeUrl(`mailto:${contact.email.trim()}`));

  $("contact-links").replaceChildren(
    el(
      "li",
      {},
      el("a", { href: safeUrl(`tel:${contact.phone.replace(/[^+\d]/g, "")}`), "data-edit": "contact.phone" }, contact.phone)
    ),
    el("li", {}, externalLink(contact.linkedin, "LinkedIn")),
    el("li", {}, externalLink(contact.github, "GitHub")),
    el("li", { "data-edit": "contact.location" }, contact.location)
  );
}
