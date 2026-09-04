export type PhotoFillSuggestion = {
  name: string;
  manufacturer: string;
  category: string;
  confidence: "high" | "medium" | "low";
  notes: string;
};

const XAI_CHAT = "https://api.x.ai/v1/chat/completions";
const XAI_RESPONSES = "https://api.x.ai/v1/responses";
const AI_TIMEOUT_MS = 20_000;

export function getAiApiKey() {
  return (
    process.env.XAI_API_KEY?.trim() || process.env.GROK_API_KEY?.trim() || ""
  );
}

export function aiEnabled() {
  return Boolean(getAiApiKey());
}

export function chatModels() {
  const models: string[] = [];
  const add = (value?: string) => {
    const model = value?.trim();
    if (!model) return;
    if (/imagine/i.test(model)) return;
    if (!models.includes(model)) models.push(model);
  };
  add(process.env.XAI_VISION_MODEL);
  add("grok-4.6");
  add("grok-4.3");
  return models;
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

async function postXai(
  key: string,
  url: string,
  body: unknown,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return "";
  return extractOutputText(await res.json()).trim();
}

async function tryModels(
  key: string,
  run: (model: string, signal: AbortSignal) => Promise<string>,
) {
  for (const model of chatModels()) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    try {
      const text = await run(model, controller.signal);
      if (text) return text;
    } catch {
      // timeout or network — try the next model
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export async function xaiTextComplete(messages: unknown[]): Promise<string | null> {
  const key = getAiApiKey();
  if (!key) return null;
  return tryModels(key, (model, signal) =>
    postXai(key, XAI_CHAT, { model, temperature: 0, messages }, signal),
  );
}

export async function xaiVisionComplete(
  dataUrl: string,
  prompt: string,
): Promise<string | null> {
  const key = getAiApiKey();
  if (!key) return null;
  const chatMessages = [
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
        { type: "text", text: prompt },
      ],
    },
  ];
  const responsesInput = [
    {
      role: "user",
      content: [
        { type: "input_image", image_url: dataUrl },
        { type: "input_text", text: prompt },
      ],
    },
  ];
  const fromChat = await tryModels(key, (model, signal) =>
    postXai(
      key,
      XAI_CHAT,
      { model, temperature: 0, messages: chatMessages },
      signal,
    ),
  );
  if (fromChat) return fromChat;
  return tryModels(key, (model, signal) =>
    postXai(key, XAI_RESPONSES, { model, input: responsesInput }, signal),
  );
}

export function parseSuggestion(raw: string): PhotoFillSuggestion | null {
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
