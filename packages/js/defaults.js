// Fills in anything missing, so data saved by an older editor session never breaks the page.
const DEFAULT_SECTIONS = [
  { id: "about", nav: "About", eyebrow: "About", title: "Engineering with clarity and craft", visible: true },
  { id: "experience", nav: "Experience", eyebrow: "Experience", title: "Where I have worked", visible: true },
  { id: "work", nav: "Work", eyebrow: "Selected work", title: "Projects and initiatives", visible: true },
  { id: "skills", nav: "Skills", eyebrow: "Skills", title: "Technical expertise", visible: true },
  { id: "awards", nav: "Awards", eyebrow: "Awards & Achievements", title: "Recognition for impact", visible: true },
  {
    id: "certifications",
    nav: "Certifications",
    eyebrow: "Certifications",
    title: "Validated cloud and platform knowledge",
    visible: true,
  },
  { id: "education", nav: "", eyebrow: "Education", title: "Academic background", visible: true },
  { id: "contact", nav: "Contact", eyebrow: "Contact", title: "Let's get in touch.", visible: true },
];

export function withDefaults(content) {
  content.sections ??= structuredClone(DEFAULT_SECTIONS);
  for (const section of DEFAULT_SECTIONS) {
    if (!content.sections.some((existing) => existing.id === section.id)) {
      const added = structuredClone(section);
      if (added.id === "contact" && content.contact.heading) added.title = content.contact.heading;
      content.sections.push(added);
    }
  }

  content.profile.ctaPrimary ??= "Get in touch";
  content.profile.ctaSecondary ??= "Download resume";
  content.certifications.note ??= "Verified digital badges on";
  content.certifications.credlyLabel ??= "Credly";
  return content;
}
