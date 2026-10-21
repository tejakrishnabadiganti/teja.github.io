const MAX_BYTES = 10 * 1024 * 1024;
const EXTENSIONS = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

const readDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });

const base64Of = (dataUrl) => dataUrl.slice(dataUrl.indexOf(",") + 1);

// Shrinks large images so the site stays fast. PNGs stay PNG (badges need transparency).
export async function processImage(file, { maxPx = 1600, format } = {}) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (PNG, JPG or WebP).");
  }
  if (file.size > MAX_BYTES) throw new Error("The image is larger than 10 MB.");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const keepPng = file.type === "image/png" && format !== "jpeg";
  const keepOriginal =
    scale === 1 && EXTENSIONS[file.type] && (keepPng || file.type === "image/jpeg");

  if (keepOriginal) {
    const dataUrl = await readDataUrl(file);
    return { dataUrl, base64: base64Of(dataUrl), ext: EXTENSIONS[file.type] };
  }

  const type = keepPng ? "image/png" : "image/jpeg";
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (type === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL(type, 0.9);
  return { dataUrl, base64: base64Of(dataUrl), ext: EXTENSIONS[type] };
}

export async function processPdf(file) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Please choose a PDF file.");
  }
  if (file.size > MAX_BYTES) throw new Error("The PDF is larger than 10 MB.");

  const dataUrl = await readDataUrl(file);
  return {
    dataUrl: dataUrl.replace(/^data:[^;]*;/, "data:application/pdf;"),
    base64: base64Of(dataUrl),
    ext: "pdf",
  };
}
