"use server";

import { readFile } from "fs/promises";
import path from "path";
import { requireUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import type { PhotoFillSuggestion } from "@/lib/ai-suggest";

export async function suggestCategory(input: {
  name: string;
  manufacturer?: string;
  notes?: string;
}): Promise<{ name?: string; error?: string }> {
  await requireUser();
  const key = process.env.XAI_API_KEY;
  if (!key) return { error: "off" };

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  const list = categories.map((c) => c.name);
  const name = input.name.trim();
  if (!name) return { error: "Enter a name first." };

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You pick one inventory category. Reply with only the category name, nothing else.",
          },
          {
            role: "user",
            content: `Existing categories:\n${list.join("\n") || "(none)"}\n\nItem name: ${name}\nManufacturer: ${input.manufacturer ?? ""}\nNotes: ${input.notes ?? ""}\n\nPick the best existing category, or a short new category name if none fit.`,
          },
        ],
      }),
    });
    if (!res.ok) return {};
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const suggested = json.choices?.[0]?.message?.content?.trim().split("\n")[0];
    if (!suggested) return {};
    const cleaned = suggested.replace(/^["']|["']$/g, "").trim();
    const match = list.find(
      (cat) => cat.toLowerCase() === cleaned.toLowerCase(),
    );
    return { name: match ?? cleaned };
  } catch {
    return {};
  }
}

const PHOTO_FAIL = "Couldn’t read this photo. Enter the name manually.";

function parseSuggestion(raw: string): PhotoFillSuggestion | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const json = JSON.parse(cleaned.slice(start, end + 1)) as Record<
      string,
      unknown
    >;
    const name = typeof json.name === "string" ? json.name.trim() : "";
    if (!name) return null;
    const conf = String(json.confidence ?? "medium").toLowerCase();
    const confidence: PhotoFillSuggestion["confidence"] =
      conf === "high" || conf === "low" ? conf : "medium";
    return {
      name,
      manufacturer:
        typeof json.manufacturer === "string" ? json.manufacturer.trim() : "",
      category: typeof json.category === "string" ? json.category.trim() : "",
      confidence,
      notes: typeof json.notes === "string" ? json.notes.trim() : "",
    };
  } catch {
    return null;
  }
}

function extractOutputText(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const obj = json as Record<string, unknown>;
  if (typeof obj.output_text === "string") return obj.output_text;
  const choices = obj.choices as
    | Array<{ message?: { content?: unknown } }>
    | undefined;
  const choice = choices?.[0]?.message?.content;
  if (typeof choice === "string") return choice;
  const output = obj.output as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(output)) {
    for (const item of output) {
      const content = item.content;
      if (Array.isArray(content)) {
        for (const part of content) {
          const p = part as Record<string, unknown>;
          if (typeof p.text === "string") return p.text;
        }
      }
    }
  }
  return "";
}

async function fileToDataUrl(file: File) {
  const mime = file.type || "image/jpeg";
  const buf = Buffer.from(await file.arrayBuffer());
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function savedPhotoToDataUrl(photoUrl: string) {
  if (!photoUrl.startsWith("/uploads/")) return null;
  const filename = path.basename(photoUrl);
  const full = path.join(process.cwd(), "public", "uploads", filename);
  const buf = await readFile(full);
  const ext = path.extname(filename).toLowerCase();
  const mime = ext === ".png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export async function fillFromPhoto(
  formData: FormData,
): Promise<{ suggestion?: PhotoFillSuggestion; error?: string }> {
  await requireUser();
  const key = process.env.XAI_API_KEY;
  if (!key) return { error: "off" };

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

  const model = process.env.XAI_VISION_MODEL || "grok-4.6";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return { error: PHOTO_FAIL };
    const json = await res.json();
    const suggestion = parseSuggestion(extractOutputText(json));
    if (!suggestion) return { error: PHOTO_FAIL };
    return { suggestion };
  } catch {
    return { error: PHOTO_FAIL };
  } finally {
    clearTimeout(timer);
  }
}
