import Link from "next/link";
import {
  AlertTriangle,
  ArrowRightLeft,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { timeAgo } from "@/lib/labels";
import { cn } from "@/lib/utils";

export type ActivityEntry = {
  id: string;
  action:
    | "Created"
    | "Updated"
    | "QuantityChanged"
    | "LocationChanged"
    | "Deleted"
    | "LowStock";
  details: string;
  itemId: string | null;
  createdAt: Date;
};

const ICONS = {
  Created: Plus,
  Updated: Pencil,
  QuantityChanged: ArrowRightLeft,
  LocationChanged: MapPin,
  Deleted: Trash2,
  LowStock: AlertTriangle,
};

export function ActivityList({
  entries,
  empty = "Nothing logged yet. Add or edit an item to see activity here.",
  compact = false,
}: {
  entries: ActivityEntry[];
  empty?: string;
  compact?: boolean;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-mute">{empty}</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {entries.map((entry) => {
        const Icon = ICONS[entry.action];
        const body = (
          <div className="flex gap-3 py-3">
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                entry.action === "Deleted" || entry.action === "LowStock"
                  ? "bg-orange/15 text-orange"
                  : "bg-sky/20 text-navy",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              {compact ? (
                <p className="text-sm text-navy">
                  {entry.details}
                  <span className="text-mute"> · {timeAgo(entry.createdAt)}</span>
                </p>
              ) : (
                <>
                  <p className="text-sm text-navy">{entry.details}</p>
                  <p className="mt-0.5 text-xs text-mute">
                    {timeAgo(entry.createdAt)}
                  </p>
                </>
              )}
            </div>
          </div>
        );

        if (entry.itemId && entry.action !== "Deleted") {
          return (
            <li key={entry.id}>
              <Link href={`/items/${entry.itemId}`} className="block hover:bg-page/80">
                {body}
              </Link>
            </li>
          );
        }

        return <li key={entry.id}>{body}</li>;
      })}
    </ul>
  );
}
