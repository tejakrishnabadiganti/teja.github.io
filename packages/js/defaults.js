// Fills in anything missing, so data saved by an older editor session never breaks the page.
const DEFAULT_SECTIONS = [
  { id: "highlights", nav: "", eyebrow: "Highlights", title: "", visible: true },
  { id: "badges", nav: "", eyebrow: "Certification badges", title: "", visible: true },
  { id: "about", nav: "About", eyebrow: "About", title: "Engineering with clarity and craft", visible: true },
  { id: "experience", nav: "Experience", eyebrow: "Experience", title: "Where I have worked", visible: true },
  { id: "work", nav: "Work", eyebrow: "Selected work", title: "Projects and initiatives", visible: true },
  { id: "skills", nav: "Skills", eyebrow: "Skills", title: "Technical expertise", visible: true },
  { id: "awards", nav: "Awards", eyebrow: "Awards & Achievements", title: "Recognition for impact", visible: true },
  { id: "testimonials", nav: "", eyebrow: "Recommendations", title: "Kind words from people I have worked with", visible: false },
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

const DEFAULT_THEME = {
  default: "system",
  accent: "#14305a",
  accentDark: "#a9c1ee",
  gold: "#8f6a2a",
  goldDark: "#d9b47a",
  ink: "#0f1a2b",
  inkDark: "#f4f1ea",
  muted: "#44505f",
  mutedDark: "#b9c1cf",
  fontHeading: "Playfair Display",
  fontBody: "Inter",
};

const DEFAULT_CONTACT_FORM = {
  formEndpoint: "",
  bookingUrl: "",
  formButton: "Send a message",
  formTitle: "Get in touch",
  formIntro: "Tell me a little about yourself and why you would like to connect. I will get back to you soon.",
  formReasons: [
    "Hiring: I have a job opportunity for you",
    "Job seeker: I am looking for a job or a referral at your company",
    "Career guidance", "Knowledge sharing", "Collaboration or project", "Other"],
  formThanks: "Thank you! Your message has been sent and I will reply to you soon.",
};

export function withDefaults(content) {
  content.theme = { ...DEFAULT_THEME, ...content.theme };
  content.contact = { ...DEFAULT_CONTACT_FORM, ...content.contact };
  content.sections ??= structuredClone(DEFAULT_SECTIONS);
  for (const [index, section] of DEFAULT_SECTIONS.entries()) {
    if (!content.sections.some((existing) => existing.id === section.id)) {
      const added = structuredClone(section);
      if (added.id === "contact" && content.contact.heading) added.title = content.contact.heading;
      content.sections.splice(Math.min(index, content.sections.length), 0, added);
    }
  }

  content.testimonials ??= [];
  content.profile.ctaPrimary ??= "Get in touch";
  content.profile.ctaSecondary ??= "Download resume";
  content.certifications.note ??= "Verified digital badges on";
  content.certifications.credlyLabel ??= "Credly";
  return content;
}
