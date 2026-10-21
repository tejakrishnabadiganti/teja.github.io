// Files chosen in the editor but not published yet: repo path -> { dataUrl, base64 }.
export const pendingFiles = new Map();

// Set on a device after the owner signs in, so their own visits are not counted.
export const OWNER_KEY = "portfolio-owner";

// Content paths may carry a "?v=" cache-busting suffix.
export const stripVersion = (path) => String(path ?? "").split("?")[0];

export const assetUrl = (path) =>
  pendingFiles.get(stripVersion(path))?.dataUrl ?? path;
