/**
 * Client-side image optimisation used before uploads to the images/avatars
 * buckets. Pure browser canvas work — no backend, no dependencies.
 */
const MAX_EDGE = 2400;
const JPEG_QUALITY = 0.82;
const WEBP_QUALITY = 0.8;

function canEncode(type: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL(type).startsWith(`data:${type}`);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    image.src = url;
  });
}

export interface OptimizeResult {
  file: File;
  originalSize: number;
  optimized: boolean;
}

/**
 * Resizes oversized photos (aspect ratio preserved) and re-encodes them.
 * PNGs keep transparency: they are only re-encoded to WebP (lossless-ish, alpha
 * preserved) when the browser supports it, never to JPEG. SVG/GIF are skipped.
 */
export async function optimizeImage(file: File): Promise<OptimizeResult> {
  const original = { file, originalSize: file.size, optimized: false };
  if (!file.type.startsWith("image/")) return original;
  if (file.type === "image/svg+xml" || file.type === "image/gif") return original;
  if (typeof document === "undefined") return original;

  let image: HTMLImageElement;
  try {
    image = await loadImage(file);
  } catch {
    return original;
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return original;
  context.drawImage(image, 0, 0, width, height);

  const hasAlpha = file.type === "image/png" || file.type === "image/webp";
  const webpOk = canEncode("image/webp");
  const targetType = webpOk ? "image/webp" : hasAlpha ? "image/png" : "image/jpeg";
  const quality = targetType === "image/webp" ? WEBP_QUALITY : JPEG_QUALITY;

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, targetType, quality),
  );
  if (!blob || blob.size >= file.size) return original;

  const extension = targetType === "image/webp" ? "webp" : targetType === "image/png" ? "png" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "");
  return {
    file: new File([blob], `${base}.${extension}`, { type: targetType, lastModified: Date.now() }),
    originalSize: file.size,
    optimized: true,
  };
}
