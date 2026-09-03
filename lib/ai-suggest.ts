export function aiEnabled() {
  return Boolean(process.env.XAI_API_KEY);
}

export type PhotoFillSuggestion = {
  name: string;
  manufacturer: string;
  category: string;
  confidence: "high" | "medium" | "low";
  notes: string;
};
