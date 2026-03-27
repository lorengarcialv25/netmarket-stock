const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const QUALITY = 0.7;
const MAX_SIZE_KB = 500;

export async function compressImage(file: File): Promise<File> {
  // If already small enough and is jpeg/webp, skip
  if (file.size <= MAX_SIZE_KB * 1024 && /\/(jpeg|webp)/.test(file.type)) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  // Scale down if needed
  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
    const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: "image/webp", quality: QUALITY });
  const name = file.name.replace(/\.[^.]+$/, ".webp");
  return new File([blob], name, { type: "image/webp" });
}
