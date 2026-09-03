import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: boolean;
  href?: string;
};

export function StatCard({ label, value, icon: Icon, accent, href }: Props) {
  const card = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-mute">
          {label}
        </p>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            accent && value > 0 ? "bg-orange/15 text-orange" : "bg-sky/20 text-navy",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tabular-nums",
          accent && value > 0 ? "text-orange" : "text-navy",
        )}
      >
        {value}
      </p>
    </>
  );

  const className = cn(
    "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5",
    accent && value > 0 && "ring-2 ring-orange",
    href && "block transition-shadow hover:shadow-md",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {card}
      </Link>
    );
  }

  return <div className={className}>{card}</div>;
}
