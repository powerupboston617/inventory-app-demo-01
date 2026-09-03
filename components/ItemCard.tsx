import Link from "next/link";
import { Package } from "lucide-react";
import { LocationStatusBadge } from "@/components/LocationStatusBadge";
import { CONDITION_LABEL, isLowStock } from "@/lib/labels";
import type { ConditionValue, ItemStatusValue, LocationValue } from "@/lib/constants";

export type ItemCardData = {
  id: string;
  name: string;
  quantity: number;
  reorderPoint: number;
  location: LocationValue;
  status: ItemStatusValue;
  condition: ConditionValue;
  photoUrl: string | null;
  manufacturer: string | null;
  serialNumber: string | null;
};

export function ItemCard({ item }: { item: ItemCardData }) {
  const low = isLowStock(item.quantity, item.reorderPoint);

  return (
    <Link
      href={`/items/${item.id}`}
      className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-page">
        {item.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photoUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-mute">
            <Package className="h-7 w-7" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-navy">{item.name}</h3>
          <span
            className={`shrink-0 rounded-lg px-2 py-0.5 text-sm font-bold tabular-nums ${
              low ? "bg-orange/15 text-orange" : "bg-page text-navy"
            }`}
          >
            ×{item.quantity}
          </span>
        </div>
        {item.manufacturer ? (
          <p className="truncate text-xs text-mute">{item.manufacturer}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <LocationStatusBadge status={item.status} location={item.location} />
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-navy">
            {CONDITION_LABEL[item.condition]}
          </span>
          {low ? (
            <span className="rounded-full bg-orange px-2.5 py-1 text-xs font-semibold text-white">
              Low stock
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
