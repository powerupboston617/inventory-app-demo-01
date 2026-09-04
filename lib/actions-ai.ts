"use server";

import { readFile } from "fs/promises";
import path from "path";
import { requireUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import {
  aiEnabled,
  parseSuggestion,
  xaiTextComplete,
  xaiVisionComplete,
  type PhotoFillSuggestion,
} from "@/lib/ai-suggest";

const PHOTO_FAIL = "Couldn’t read this photo. Enter the name manually.";

function closestCategory(list: string[], label: string) {
  const n = label.trim().toLowerCase();
  if (!n) return "";
  const exact = list.find((cat) => cat.toLowerCase() === n);
  if (exact) return exact;
  return (
    list.find(
      (cat) => n.includes(cat.toLowerCase()) || cat.toLowerCase().includes(n),
    ) ?? ""
  );
}

function visionMime(mime: string, filename = "") {
  const fromName = path.extname(filename).toLowerCase();
  const type = (mime || "").toLowerCase();
  if (type === "image/png" || fromName === ".png") return "image/png";
  if (type === "image/webp" || fromName === ".webp") return "image/webp";
  return "image/jpeg";
}

async function fileToDataUrl(file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = visionMime(file.type, file.name);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function savedPhotoToDataUrl(photoUrl: string) {
  if (!photoUrl.startsWith("/uploads/")) return null;
  const filename = path.basename(photoUrl);
  const full = path.join(process.cwd(), "public", "uploads", filename);
  const buf = await readFile(full);
  const mime = visionMime("", filename);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export async function suggestCategory(input: {
  name: string;
  manufacturer?: string;
  notes?: string;
}): Promise<{ name?: string; error?: string }> {
  await requireUser();
  if (!aiEnabled()) return { error: "off" };

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  const list = categories.map((c) => c.name);
  const name = input.name.trim();
  if (!name) return { error: "Enter a name first." };
  if (!list.length) return {};

  const raw = await xaiTextComplete([
    {
      role: "system",
      content:
        "You pick one inventory category from the provided list. Reply with only that category name, nothing else.",
    },
    {
      role: "user",
      content: `Existing categories:\n${list.join("\n")}\n\nItem name: ${name}\nManufacturer: ${input.manufacturer ?? ""}\nNotes: ${input.notes ?? ""}\n\nPick the closest existing category.`,
    },
  ]);
  if (!raw) return {};
  const cleaned = raw.trim().split("\n")[0]?.replace(/^["']|["']$/g, "").trim() ?? "";
  const match = closestCategory(list, cleaned);
  if (!match) return {};
  return { name: match };
}

export async function fillFromPhoto(
  formData: FormData,
): Promise<{ suggestion?: PhotoFillSuggestion; error?: string }> {
  await requireUser();
  if (!aiEnabled()) return { error: "off" };

  const file = formData.get("photo");
  const photoUrl =
    typeof formData.get("photoUrl") === "string"
      ? (formData.get("photoUrl") as string)
      : "";

  let dataUrl: string | null = null;
  try {
    if (file instanceof File && file.size > 0) {
      if (file.size > 8 * 1024 * 1024) {
        return { error: PHOTO_FAIL };
      }
      dataUrl = await fileToDataUrl(file);
    } else if (photoUrl) {
      dataUrl = await savedPhotoToDataUrl(photoUrl);
    }
  } catch {
    return { error: PHOTO_FAIL };
  }
  if (!dataUrl) return { error: PHOTO_FAIL };

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  const list = categories.map((c) => c.name);
  const prompt = `Identify this hardware for an IT / MSP shop inventory (cameras, routers, switches, cable, NVRs, docks, APs, computers, door access, parts).
Prefer an existing category when possible:
${list.join("\n") || "(none)"}

Reply with JSON only, no markdown:
{"name":"short product-style name","manufacturer":"brand or empty","category":"existing category if possible","confidence":"high|medium|low","notes":"optional model number if readable"}`;

  const raw = await xaiVisionComplete(dataUrl, prompt);
  if (!raw) return { error: PHOTO_FAIL };
  const suggestion = parseSuggestion(raw);
  if (!suggestion) return { error: PHOTO_FAIL };
  const category = closestCategory(list, suggestion.category);
  return {
    suggestion: {
      ...suggestion,
      category,
    },
  };
}
