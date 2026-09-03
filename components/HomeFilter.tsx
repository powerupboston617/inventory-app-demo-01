"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { CONDITIONS, ITEM_STATUSES, LOCATIONS } from "@/lib/constants";
import { CONDITION_LABEL, STATUS_LABEL } from "@/lib/labels";
import type { ItemFilterParams } from "@/lib/utils";
import { cn, hasActiveFilters } from "@/lib/utils";

const fieldClass =
  "min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-base text-navy placeholder:text-mute focus:border-blue focus:outline-none focus:ring-2 focus:ring-sky";

type Option = { id: string; name: string };

export function HomeFilter({
  filters,
  categories,
  projects,
  lowStockCount = 0,
}: {
  filters: ItemFilterParams;
  categories: Option[];
  projects: Option[];
  lowStockCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const active = hasActiveFilters(filters);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex min-h-10 items-center gap-1.5 rounded-full bg-orange px-4 text-sm font-semibold text-white hover:bg-orange/90"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filter
        {lowStockCount > 0 ? (
          <span className="rounded-full bg-white px-1.5 py-0.5 text-[11px] font-bold text-orange">
            {lowStockCount}
          </span>
        ) : active ? (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-white ring-2 ring-orange" />
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-navy/50"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-title"
            className="relative z-10 max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="filter-title" className="text-lg font-semibold text-navy">
                Filter
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-mute hover:bg-page hover:text-navy"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action="/" method="get" className="space-y-3">
              {filters.low ? (
                <input type="hidden" name="low" value="1" />
              ) : null}
              <input
                type="search"
                name="q"
                defaultValue={filters.q ?? ""}
                placeholder="Search name, manufacturer, serial, notes"
                autoFocus
                className={fieldClass}
              />
              <select
                name="location"
                defaultValue={filters.location ?? ""}
                className={fieldClass}
                aria-label="Location"
              >
                <option value="">All locations</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <select
                name="category"
                defaultValue={filters.category ?? ""}
                className={fieldClass}
                aria-label="Category"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                name="status"
                defaultValue={filters.status ?? ""}
                className={fieldClass}
                aria-label="Status"
              >
                <option value="">All statuses</option>
                {ITEM_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
              <select
                name="condition"
                defaultValue={filters.condition ?? ""}
                className={fieldClass}
                aria-label="Condition"
              >
                <option value="">All conditions</option>
                {CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {CONDITION_LABEL[condition]}
                  </option>
                ))}
              </select>
              <select
                name="project"
                defaultValue={filters.project ?? ""}
                className={fieldClass}
                aria-label="Project"
              >
                <option value="">All projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-navy text-base font-semibold text-white"
              >
                Apply
              </button>
              {active ? (
                <Link
                  href="/"
                  className={cn(
                    "flex min-h-11 items-center justify-center text-sm font-semibold text-mute hover:text-navy",
                  )}
                >
                  Clear
                </Link>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
