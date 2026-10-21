const root = document.documentElement;
root.classList.add("js");

/*==================== THEME ====================*/
const themeToggle = document.getElementById("theme-toggle");

function syncThemeLabel() {
  const isDark = root.dataset.theme === "dark";
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light theme" : "Switch to dark theme"
  );
}

themeToggle.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  localStorage.setItem("theme", next);
  syncThemeLabel();
});

syncThemeLabel();

/*==================== MOBILE NAV ====================*/
const nav = document.getElementById("nav");
const navToggle = document.getElementById("nav-toggle");

function setNavOpen(open) {
  nav.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

navToggle.addEventListener("click", () => {
  setNavOpen(!nav.classList.contains("is-open"));
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setNavOpen(false);
});

/*==================== HEADER ON SCROLL ====================*/
const header = document.getElementById("header");

function onScroll() {
  header.classList.toggle("is-scrolled", window.scrollY > 8);
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/*==================== ACTIVE NAV LINK ====================*/
const navLinks = document.querySelectorAll(".nav__link");
const linkBySection = new Map();

navLinks.forEach((link) => {
  const section = document.querySelector(link.getAttribute("href"));
  if (section) linkBySection.set(section, link);
});

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.remove("is-active"));
      linkBySection.get(entry.target).classList.add("is-active");
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);

linkBySection.forEach((_, section) => sectionObserver.observe(section));

/*==================== REVEAL ON SCROLL ====================*/
const revealTargets = document.querySelectorAll(
  ".timeline__item, .card, .skills__group, .cert, .award, .education__item, .stat"
);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.1 }
);

revealTargets.forEach((el) => {
  el.classList.add("reveal");
  revealObserver.observe(el);
});

/*==================== FOOTER YEAR ====================*/
document.getElementById("year").textContent = new Date().getFullYear();
