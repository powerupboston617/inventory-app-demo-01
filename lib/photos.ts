import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function savePhoto(
  file: File | null | undefined,
): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined;
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Please upload a JPG, PNG, WebP, or GIF photo.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Photo must be under 8MB.");
  }

  const ext =
    file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1] || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${filename}`;
}
