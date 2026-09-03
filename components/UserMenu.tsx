"use client";

import { useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, List, LogOut, Mail, Settings, UserRound } from "lucide-react";
import { signOutAction } from "@/lib/actions-auth";

export function UserMenu({
  name,
  role,
}: {
  name: string;
  role: "Admin" | "Tech";
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-10 max-w-[10rem] items-center gap-2 rounded-lg px-2 text-left text-sm text-white hover:bg-white/10"
        aria-expanded={open}
      >
        <UserRound className="h-4 w-4 shrink-0 text-sky" />
        <span className="truncate">
          <span className="block truncate font-medium leading-tight">{name}</span>
          <span className="block text-[10px] uppercase tracking-wide text-sky">
            {role}
          </span>
        </span>
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-1 w-48 rounded-xl bg-white py-1 text-navy shadow-lg ring-1 ring-black/10">
            {role === "Admin" ? (
              <>
                <Link
                  href="/items/import"
                  className="flex min-h-11 items-center gap-2 px-3 text-sm hover:bg-page"
                  onClick={() => setOpen(false)}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Import CSV
                </Link>
                <Link
                  href="/reports"
                  className="flex min-h-11 items-center gap-2 px-3 text-sm hover:bg-page"
                  onClick={() => setOpen(false)}
                >
                  <Mail className="h-4 w-4" />
                  Reports
                </Link>
                <Link
                  href="/lists"
                  className="flex min-h-11 items-center gap-2 px-3 text-sm hover:bg-page"
                  onClick={() => setOpen(false)}
                >
                  <List className="h-4 w-4" />
                  Lists
                </Link>
                <Link
                  href="/settings"
                  className="flex min-h-11 items-center gap-2 px-3 text-sm hover:bg-page"
                  onClick={() => setOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Users
                </Link>
              </>
            ) : null}
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex min-h-11 w-full items-center gap-2 px-3 text-sm hover:bg-page"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}
