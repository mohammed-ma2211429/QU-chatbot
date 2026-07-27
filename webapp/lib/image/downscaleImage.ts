const MAX_DIMENSION = 1600;

/** Downscales an image file client-side (via canvas) before base64-encoding,
 * to stay under Vercel's request body limit and reduce vision-call token
 * cost for large phone photos. Returns the original data URL unchanged if
 * the image is already small enough or isn't decodable as an image. */
export async function fileToDownscaledDataUrl(file: File): Promise<string> {
  const originalDataUrl = await readAsDataUrl(file);

  const img = await loadImage(originalDataUrl).catch(() => null);
  if (!img) return originalDataUrl;

  if (img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) {
    return originalDataUrl;
  }

  const scale = MAX_DIMENSION / Math.max(img.width, img.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return originalDataUrl;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}
