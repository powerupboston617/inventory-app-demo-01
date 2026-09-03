"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, Home, Package, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", icon: Home, match: "exact" as const },
  { href: "/items", label: "Items", icon: Package, match: "prefix" as const },
  { href: "/items/new", label: "Add", icon: Plus, match: "exact" as const },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderKanban,
    match: "prefix" as const,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-navy pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Main"
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const active =
            item.href === "/items"
              ? pathname.startsWith("/items") && pathname !== "/items/new"
              : item.match === "exact"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const isAdd = item.href === "/items/new";

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active && !isAdd ? "text-sky" : "text-white/70",
                  isAdd && "text-orange",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    isAdd && "bg-orange text-white",
                    active && !isAdd && "text-sky",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
