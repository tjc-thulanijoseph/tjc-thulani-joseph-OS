/**
 * Client-side image optimisation used before uploads.
 * Resizes oversized images (aspect ratio preserved), compresses intelligently,
 * keeps PNG transparency and prefers WebP when the browser can encode it.
 * Videos, audio and documents are never touched.
 */

const MAX_EDGE = 2560;
const AVATAR_MAX_EDGE = 1024;
const QUALITY = 0.82;
/** Files below this size are already small enough to leave alone. */
const MIN_BYTES = 120 * 1024;

let webpSupport: boolean | null = null;

function supportsWebp() {
  if (webpSupport !== null) return webpSupport;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    webpSupport = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    webpSupport = false;
  }
  return webpSupport;
}

async function hasAlpha(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const { width, height } = canvas;
  const step = Math.max(1, Math.floor(Math.min(width, height) / 64));
  const data = ctx.getImageData(0, 0, width, height).data;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (data[(y * width + x) * 4 + 3]! < 255) return true;
    }
  }
  return false;
}

function replaceExtension(name: string, extension: string) {
  return `${name.replace(/\.[^./\\]+$/, "")}.${extension}`;
}

export interface OptimizeResult {
  file: File;
  originalSize: number;
  optimized: boolean;
}

export async function optimizeImage(file: File, options: { avatar?: boolean } = {}): Promise<OptimizeResult> {
  const original = { file, originalSize: file.size, optimized: false };
  if (typeof document === "undefined") return original;
  if (!file.type.startsWith("image/")) return original;
  // Vector and animated formats must pass through untouched.
  if (/svg|gif|avif|heic/i.test(file.type)) return original;
  if (file.size < MIN_BYTES) return original;

  try {
    const bitmap = await createImageBitmap(file);
    const maxEdge = options.avatar ? AVATAR_MAX_EDGE : MAX_EDGE;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return original;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const transparent = file.type === "image/png" && (await hasAlpha(canvas, ctx));
    const mime = supportsWebp() ? "image/webp" : transparent ? "image/png" : "image/jpeg";
    const extension = mime === "image/webp" ? "webp" : mime === "image/png" ? "png" : "jpg";

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mime, mime === "image/png" ? undefined : QUALITY),
    );
    if (!blob || blob.size >= file.size) return original;

    return {
      file: new File([blob], replaceExtension(file.name, extension), { type: mime, lastModified: Date.now() }),
      originalSize: file.size,
      optimized: true,
    };
  } catch {
    return original;
  }
}