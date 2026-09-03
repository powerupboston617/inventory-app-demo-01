import type {
  ConditionValue,
  ItemStatusValue,
  LocationValue,
} from "@/lib/constants";

export const STATUS_LABEL: Record<ItemStatusValue, string> = {
  InStock: "In Stock",
  OutOfStock: "Out of Stock",
  InTransit: "In Transit",
  AtLocation: "At Location",
};

export const CONDITION_LABEL: Record<ConditionValue, string> = {
  New: "New",
  Used: "Used",
  ShopRefurbished: "Shop Refurbished",
};

export function formatLocationStatus(
  status: ItemStatusValue,
  location: LocationValue,
) {
  return `${STATUS_LABEL[status]} | ${location}`;
}

export function isLowStock(quantity: number, reorderPoint: number) {
  return reorderPoint > 0 && quantity <= reorderPoint;
}

export function formatPrice(price: number | null | undefined) {
  if (price == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (Number.isNaN(seconds)) return "";
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
