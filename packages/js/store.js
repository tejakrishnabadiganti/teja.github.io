// Files chosen in the editor but not published yet: repo path -> { dataUrl, base64 }.
export const pendingFiles = new Map();

// Content paths may carry a "?v=" cache-busting suffix.
export const stripVersion = (path) => String(path ?? "").split("?")[0];

export const assetUrl = (path) =>
  pendingFiles.get(stripVersion(path))?.dataUrl ?? path;
