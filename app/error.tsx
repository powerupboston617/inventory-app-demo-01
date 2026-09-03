"use client";

import { EmptyState } from "@/components/EmptyState";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description="Try again. If it keeps happening, restart the app with npm run dev."
        actionHref="/"
        actionLabel="Go to dashboard"
      />
      <div className="text-center">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-blue"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
