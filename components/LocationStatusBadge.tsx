import { formatLocationStatus } from "@/lib/labels";
import type { ItemStatusValue, LocationValue } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  status: ItemStatusValue;
  location: LocationValue;
  className?: string;
};

export function LocationStatusBadge({ status, location, className }: Props) {
  const tone =
    status === "OutOfStock"
      ? "bg-orange/15 text-orange"
      : status === "InTransit"
        ? "bg-sky/25 text-navy"
        : status === "AtLocation"
          ? "bg-blue/10 text-blue"
          : "bg-gray-100 text-navy";

  return (
    <span
      className={cn(
        "inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-xs font-medium",
        tone,
        className,
      )}
    >
      {formatLocationStatus(status, location)}
    </span>
  );
}
