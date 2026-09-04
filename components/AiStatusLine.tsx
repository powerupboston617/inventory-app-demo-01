"use client";

import { useEffect, useState } from "react";

export function AiStatusLine() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai-status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { enabled: false }))
      .then((data: { enabled?: unknown }) => {
        if (cancelled) return;
        setLabel(
          data.enabled === true
            ? "AI: on"
            : "AI: off (add XAI_API_KEY and restart)",
        );
      })
      .catch(() => {
        if (!cancelled) setLabel("AI: off (add XAI_API_KEY and restart)");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!label) return null;
  return <p className="mt-2 text-sm text-mute">{label}</p>;
}
