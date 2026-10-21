// Builds DOM nodes without innerHTML so content can never inject markup.
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child);
  }
  return node;
}

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

export function safeUrl(url) {
  try {
    const { protocol } = new URL(url, document.baseURI);
    return ALLOWED_PROTOCOLS.has(protocol) ? url : "#";
  } catch {
    return "#";
  }
}

// Unpublished uploads are previewed from data: URLs.
export function safeAsset(url) {
  return /^data:(image\/|application\/pdf)/.test(url) ? url : safeUrl(url);
}
