import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center",
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky/20 text-navy">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-3 text-base font-semibold text-navy">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-mute">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-orange px-5 text-sm font-semibold text-white hover:bg-orange/90"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
