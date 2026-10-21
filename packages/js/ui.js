const root = document.documentElement;
const SESSION_KEY = "portfolio-admin";

function initTheme() {
  const toggle = document.getElementById("theme-toggle");
  const syncLabel = () =>
    toggle.setAttribute(
      "aria-label",
      root.dataset.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );

  toggle.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("theme", next);
    syncLabel();
  });
  syncLabel();
}

function initNav() {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("nav-toggle");
  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
}

function initHeaderShadow() {
  const header = document.getElementById("header");
  const update = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", update, { passive: true });
  update();
}

function initActiveLink() {
  const links = document.querySelectorAll(".nav__link");
  const linkBySection = new Map();
  links.forEach((link) => {
    const section = document.querySelector(link.getAttribute("href"));
    if (section) linkBySection.set(section, link);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.classList.remove("is-active"));
        linkBySection.get(entry.target).classList.add("is-active");
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  linkBySection.forEach((_, section) => observer.observe(section));
}

function initCertificatePopup() {
  const dialog = document.getElementById("cert-dialog");
  const image = document.getElementById("cert-image");
  const badge = document.getElementById("cert-badge");
  const title = document.getElementById("cert-dialog-title");
  const issuer = document.getElementById("cert-issuer");
  const download = document.getElementById("cert-download");
  const verify = document.getElementById("cert-verify");

  function open(link) {
    const certificate = link.querySelector("img:not(.cert__badge)");
    const badgeImage = link.querySelector(".cert__badge");
    const href = link.getAttribute("href");
    const verifyUrl = href.startsWith("http") ? href : null;

    image.src = certificate.src;
    image.alt = certificate.alt;
    title.textContent = link.querySelector(".cert__name").textContent;
    issuer.textContent = link.querySelector(".cert__issuer").textContent;
    download.href = certificate.src;
    download.download = link.dataset.file || "certificate";
    verify.hidden = !verifyUrl;
    if (verifyUrl) verify.href = verifyUrl;
    badge.hidden = !badgeImage;
    if (badgeImage) badge.src = badgeImage.src;

    dialog.showModal();
  }

  // Cards are rebuilt when content changes, so listen on the document.
  document.addEventListener("click", (event) => {
    const link = event.target.closest(".cert__link");
    if (!link || !link.querySelector("img:not(.cert__badge)")) return;
    event.preventDefault();
    open(link);
  });

  document.getElementById("cert-close").addEventListener("click", () => dialog.close());
  // A click on the backdrop targets the dialog element itself.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

// The editor is hidden: it is only loaded after a secret trigger, never for ordinary visitors.
function initAdminAccess() {
  const loginButton = document.getElementById("admin-login");
  const open = async () => {
    loginButton.hidden = false;
    const admin = await import("./admin.js");
    if (location.hash === "#admin") history.replaceState(null, "", location.pathname + location.search);
    admin.openAdmin();
  };

  loginButton.addEventListener("click", open);

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      open();
    }
  });

  const copyright = document.getElementById("year").parentElement;
  let taps = 0;
  let timer;
  copyright.addEventListener("click", () => {
    taps += 1;
    clearTimeout(timer);
    timer = setTimeout(() => (taps = 0), 2500);
    if (taps >= 5) {
      taps = 0;
      open();
    }
  });

  if (location.hash === "#admin") open();
  window.addEventListener("hashchange", () => {
    if (location.hash === "#admin") open();
  });

  if (sessionStorage.getItem(SESSION_KEY)) {
    import("./admin.js").then((admin) => admin.restoreSession());
  }
}

export function initUi() {
  initTheme();
  initNav();
  initHeaderShadow();
  initActiveLink();
  initCertificatePopup();
  initAdminAccess();
}
