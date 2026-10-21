// Anonymous visit counter: one small record per browser tab, no names, emails or IP addresses.
import { getContent } from "./site.js";
import { OWNER_KEY } from "./store.js";

const VISITOR_KEY = "portfolio-visitor";
const COUNTED_KEY = "portfolio-visit-counted";
const ENDPOINT_PREFIX = "https://script.google.com/macros/s/";
const LOCAL_HOSTS = ["localhost", "127.0.0.1"];
const BOT_PATTERN = /bot|crawl|spider|headless|preview/i;

function visitor() {
  const existing = localStorage.getItem(VISITOR_KEY);
  if (existing) return { id: existing, returning: true };
  const id = crypto.randomUUID();
  localStorage.setItem(VISITOR_KEY, id);
  return { id, returning: false };
}

function deviceType() {
  if (/iPad|Tablet/i.test(navigator.userAgent)) return "Tablet";
  return /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "Mobile" : "Desktop";
}

function shouldCount() {
  return !(
    LOCAL_HOSTS.includes(location.hostname) ||
    BOT_PATTERN.test(navigator.userAgent) ||
    navigator.doNotTrack === "1" ||
    localStorage.getItem(OWNER_KEY) ||
    sessionStorage.getItem(COUNTED_KEY)
  );
}

export function initVisitCounter() {
  const endpoint = getContent()?.contact?.formEndpoint ?? "";
  if (!endpoint.startsWith(ENDPOINT_PREFIX) || !shouldCount()) return;

  sessionStorage.setItem(COUNTED_KEY, "1");
  const { id, returning } = visitor();
  const body = new URLSearchParams({
    type: "visit",
    visitor: id,
    returning: returning ? "yes" : "no",
    referrer: document.referrer ? new URL(document.referrer).hostname : "",
    device: deviceType(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
    language: navigator.language ?? "",
    page: location.pathname,
  });
  fetch(endpoint, { method: "POST", body, mode: "no-cors", keepalive: true }).catch(() => {});
}
