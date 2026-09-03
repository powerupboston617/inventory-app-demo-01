"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Logo } from "@/components/Logo";
import { UserMenu } from "@/components/UserMenu";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/items", label: "Items" },
  { href: "/projects", label: "Projects" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({
  user,
}: {
  user: { name: string; role: "Admin" | "Tech" };
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-navy text-white shadow-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:h-16 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Logo className="h-8 w-8 shrink-0 md:h-9 md:w-9" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold leading-tight md:text-base">
              Power Up Boston
            </span>
            <span className="block text-[11px] font-medium tracking-wide text-sky md:text-xs">
              Inventory
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(pathname, item.href)
                  ? "bg-white/15 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
          {user.role === "Admin" ? (
            <>
              <Link
                href="/items/import"
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(pathname, "/items/import")
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                Import
              </Link>
              <Link
                href="/reports"
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(pathname, "/reports")
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                Reports
              </Link>
              <Link
                href="/lists"
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(pathname, "/lists")
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                Lists
              </Link>
              <Link
                href="/settings"
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(pathname, "/settings")
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                Users
              </Link>
            </>
          ) : null}
          <Link
            href="/items/new"
            className="ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-orange px-4 text-sm font-semibold text-white hover:bg-orange/90"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Link>
        </nav>

        <div className="ml-auto md:ml-0">
          <UserMenu name={user.name} role={user.role} />
        </div>
      </div>
    </header>
  );
}
