import { el, safeUrl, safeAsset } from "./dom.js";
import { assetUrl, stripVersion } from "./store.js";

const $ = (id) => document.getElementById(id);
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
  renderHero(content);
  renderStats(content);
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
  $("brand-mark").textContent = profile.initials;
  $("brand-name").textContent = profile.name;
  $("footer-name").textContent = profile.name;
  $("year").textContent = new Date().getFullYear();
}

function renderHero({ profile, contact }) {
  $("hero-eyebrow").textContent = profile.role;
  $("hero-title").replaceChildren(
    `${profile.headline} `,
    el("em", {}, profile.headlineEmphasis)
  );
  $("hero-lead").textContent = profile.lead;

  const resume = $("hero-resume");
  resume.setAttribute("href", asset(profile.resume));
  resume.setAttribute("download", baseName(profile.resume));

  $("hero-meta").replaceChildren(
    el("li", {}, contact.locationShort),
    el("li", {}, externalLink(contact.linkedin, "LinkedIn")),
    el("li", {}, externalLink(contact.github, "GitHub"))
  );

  const photo = $("hero-photo");
  photo.setAttribute("src", asset(profile.photo));
  photo.setAttribute("alt", profile.photoAlt);
}

function renderStats(content) {
  const total = content.certifications.items.length;
  $("stats").replaceChildren(
    ...content.stats.map((stat) =>
      el(
        "div",
        { class: "stat" },
        el("span", { class: "stat__value" }, String(stat.value).replaceAll("{certifications}", total)),
        el("span", { class: "stat__label" }, stat.label)
      )
    )
  );
}

function renderAbout({ about }) {
  $("about-body").replaceChildren(...about.paragraphs.map((text) => el("p", {}, text)));
}

function renderExperience({ experience }) {
  $("timeline").replaceChildren(
    ...experience.map((job) =>
      el(
        "li",
        { class: "timeline__item" },
        el(
          "div",
          { class: "timeline__meta" },
          el("p", { class: "timeline__date" }, job.period),
          el("p", { class: "timeline__place" }, job.place)
        ),
        el(
          "article",
          { class: "timeline__body" },
          el("h3", { class: "timeline__role" }, job.role),
          el(
            "p",
            { class: "timeline__company" },
            `${job.company} `,
            job.client && el("span", {}, job.client)
          ),
          el("ul", { class: "checklist" }, job.bullets.map((bullet) => el("li", {}, bullet)))
        )
      )
    )
  );
}

function renderWork({ work }) {
  $("work-cards").replaceChildren(
    ...work.map((card) =>
      el(
        "article",
        { class: "card" },
        el("p", { class: "card__tag" }, card.tag),
        el("h3", { class: "card__title" }, card.title),
        el("p", { class: "card__text" }, card.text)
      )
    )
  );
}

function renderSkills({ skills }) {
  $("skills-grid").replaceChildren(
    ...skills.map((group) =>
      el(
        "section",
        { class: "skills__group" },
        el("h3", { class: "skills__title" }, group.title),
        el("ul", { class: "tags" }, group.items.map((item) => el("li", {}, item)))
      )
    )
  );
}

function renderAwards({ awards }) {
  $("awards-list").replaceChildren(
    ...awards.map((award) =>
      el(
        "li",
        { class: "award" },
        el("h3", { class: "award__title" }, award.title),
        el("p", { class: "award__text" }, award.text)
      )
    )
  );
}

function certificateCard(item) {
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
        el("img", { src: asset(item.certificate), alt: `${item.name} certificate`, loading: "lazy" }),
      item.badge &&
        el("img", { class: "cert__badge", src: asset(item.badge), alt: "", loading: "lazy" }),
      el("span", { class: "cert__name" }, item.name),
      el("span", { class: "cert__issuer" }, item.issuer)
    )
  );
}

function renderCertifications({ certifications }) {
  const groups = new Map();
  for (const item of certifications.items) {
    const name = item.group || "Other";
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(item);
  }

  $("cert-groups").replaceChildren(
    ...[...groups].map(([name, items]) =>
      el(
        "div",
        { class: "certs__section" },
        el("h3", { class: "certs__group" }, name),
        el("ul", { class: "certs" }, items.map(certificateCard))
      )
    )
  );
  $("cert-credly").setAttribute("href", safeUrl(certifications.credly));
}

function renderEducation({ education }) {
  $("education-list").replaceChildren(
    ...education.map((entry) =>
      el(
        "li",
        { class: "education__item" },
        el(
          "div",
          {},
          el("h3", { class: "education__title" }, entry.title),
          el("p", { class: "education__place" }, entry.place)
        ),
        el("p", { class: "education__meta" }, entry.period, entry.score && [el("br"), entry.score])
      )
    )
  );
}

function renderContact({ contact }) {
  $("contact-heading").textContent = contact.heading;
  $("contact-lead").textContent = contact.lead;

  const email = $("contact-email");
  email.setAttribute("href", safeUrl(`mailto:${contact.email.trim()}`));
  email.textContent = contact.email;

  $("contact-links").replaceChildren(
    el(
      "li",
      {},
      el("a", { href: safeUrl(`tel:${contact.phone.replace(/[^+\d]/g, "")}`) }, contact.phone)
    ),
    el("li", {}, externalLink(contact.linkedin, "LinkedIn")),
    el("li", {}, externalLink(contact.github, "GitHub")),
    el("li", {}, contact.location)
  );
}
