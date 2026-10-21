const INTERVAL_MS = 3200;
const FADE_MS = 350;

let timer = 0;

export function startRoleRotation(node, roles) {
  clearInterval(timer);
  node.classList.remove("is-fading");
  node.textContent = roles[0];

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (roles.length < 2 || reducedMotion) return;

  let index = 0;
  timer = setInterval(() => {
    node.classList.add("is-fading");
    setTimeout(() => {
      index = (index + 1) % roles.length;
      node.textContent = roles[index];
      node.classList.remove("is-fading");
    }, FADE_MS);
  }, INTERVAL_MS);
}
