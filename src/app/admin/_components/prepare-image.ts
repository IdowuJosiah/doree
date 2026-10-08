"use client";

// Turns any photo Dorée picks into one every browser and the image resizer can
// read: HEIC (iPhone) is converted, the picture is turned upright, and it is
// scaled to at most MAX_EDGE pixels as a JPEG. The original file is uploaded
// untouched alongside it.

const MAX_EDGE = 2400;
const QUALITY = 0.88;
const CREAM = "#FFF8E8";

const isHeic = (file: File) => /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

export const looksLikeImage = (file: File) => file.type.startsWith("image/") || isHeic(file);

async function decodable(file: File): Promise<Blob> {
  if (!isHeic(file)) return file;
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: QUALITY });
  return Array.isArray(out) ? out[0] : out;
}

export async function webVersion(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(await decodable(file), { imageOrientation: "from-image" });
  } catch {
    throw new Error(`We could not read ${file.name}. Please save it as a JPEG or PNG and try again.`);
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot prepare images. Please try another browser.");
  ctx.fillStyle = CREAM; // transparent PNG areas become the page colour, not black
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(`We could not prepare ${file.name}.`))), "image/jpeg", QUALITY),
  );
}
