/**
 * HTML5 Canvas image compression (per Nomad-Go storage standards).
 * Targets 200–300KB to protect bandwidth and IndexedDB allocation.
 */

export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png"] as const;
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME)[number];

/** Hard ceiling enforced before compression (mirrors backend 1MB rule input). */
const MAX_INPUT_BYTES = 10 * 1024 * 1024; // raw camera photos can exceed 1MB pre-compression
const TARGET_MAX_BYTES = 300 * 1024;
const TARGET_MIN_BYTES = 200 * 1024;
const MAX_DIMENSION = 1600;

export type CompressResult = {
  blob: Blob;
  mime: AllowedImageMime;
  width: number;
  height: number;
  bytes: number;
  extension: "jpg" | "png";
};

export class ImageCompressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageCompressionError";
  }
}

function isAllowedMime(mime: string): mime is AllowedImageMime {
  return (ALLOWED_IMAGE_MIME as readonly string[]).includes(mime);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageCompressionError("Image could not be decoded."));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
}

function scaledDimensions(width: number, height: number) {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { width, height };
  }
  const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Compress an image File via Canvas. PNG inputs stay PNG (lossless);
 * everything else is encoded to JPEG with adaptive quality search.
 */
export async function compressImage(file: File): Promise<CompressResult> {
  if (typeof document === "undefined") {
    throw new ImageCompressionError("Compression must run in the browser.");
  }
  if (!isAllowedMime(file.type)) {
    throw new ImageCompressionError("Only JPEG and PNG images are allowed.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageCompressionError("Image is too large (max 10MB before compression).");
  }

  const img = await loadImage(file);
  const { width, height } = scaledDimensions(img.naturalWidth, img.naturalHeight);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new ImageCompressionError("Canvas 2D context unavailable.");
  }
  ctx.drawImage(img, 0, 0, width, height);

  const outputMime: AllowedImageMime = file.type === "image/png" ? "image/png" : "image/jpeg";

  // PNG: lossless single pass (quality is ignored by encoders for PNG).
  if (outputMime === "image/png") {
    const blob = await canvasToBlob(canvas, "image/png", 1);
    if (!blob) throw new ImageCompressionError("PNG encoding failed.");
    return {
      blob,
      mime: "image/png",
      width,
      height,
      bytes: blob.size,
      extension: "png",
    };
  }

  // JPEG: binary-search quality to land within target band.
  let low = 0.4;
  let high = 0.92;
  let best: Blob | null = null;

  for (let i = 0; i < 7; i += 1) {
    const quality = (low + high) / 2;
    const blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (!blob) break;
    best = blob;

    if (blob.size > TARGET_MAX_BYTES) {
      high = quality;
    } else if (blob.size < TARGET_MIN_BYTES) {
      low = quality;
    } else {
      break;
    }
  }

  if (!best) {
    throw new ImageCompressionError("JPEG encoding failed.");
  }

  return {
    blob: best,
    mime: "image/jpeg",
    width,
    height,
    bytes: best.size,
    extension: "jpg",
  };
}
