import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function LowStockBanner({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-orange px-4 py-3 text-white shadow-sm">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {count} {count === 1 ? "item is" : "items are"} low on stock
        </p>
        <Link
          href="/?low=1"
          className="mt-1 inline-flex min-h-10 items-center text-sm font-medium underline decoration-white/60 underline-offset-2"
        >
          View low stock
        </Link>
      </div>
    </div>
  );
}
