import { Package, Plus } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { ItemCard } from "@/components/ItemCard";
import { ScanLookupButton } from "@/components/ScanLookupButton";
import { getCurrentUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { hasActiveFilters, itemWhere, parseItemFilters } from "@/lib/utils";
import { isLowStock } from "@/lib/labels";

export const metadata = { title: "Items" };

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const filters = parseItemFilters(sp);

  const [rawItems, categories, projects, totalAll] = await Promise.all([
    prisma.item.findMany({
      where: itemWhere(filters),
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    prisma.item.count(),
  ]);

  const items =
    filters.low === "1"
      ? rawItems.filter((item) => isLowStock(item.quantity, item.reorderPoint))
      : rawItems;

  const filtered = hasActiveFilters(filters);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Items</h1>
          <p className="mt-1 text-sm text-mute">
            {items.length} {items.length === 1 ? "item" : "items"}
            {filtered ? " match" : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ScanLookupButton />
          {user?.role === "Admin" ? (
            <Link
              href="/items/import"
              className="inline-flex min-h-11 items-center rounded-xl border border-navy px-4 text-sm font-semibold text-navy"
            >
              Import CSV
            </Link>
          ) : null}
          <Link
            href="/items/new"
            className="hidden min-h-11 items-center gap-1.5 rounded-xl bg-orange px-4 text-sm font-semibold text-white md:inline-flex"
          >
            <Plus className="h-4 w-4" />
            Add item
          </Link>
        </div>
      </div>

      <FilterBar
        action="/items"
        filters={filters}
        categories={categories}
        projects={projects}
        extra
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={totalAll === 0 ? "No items yet" : "No matches"}
          description={
            totalAll === 0
              ? "Add your first item — a switch, a camera, a spool of cable. Whatever is on the shelf."
              : "Try a different search or clear the filters."
          }
          actionHref={totalAll === 0 ? "/items/new" : "/items"}
          actionLabel={totalAll === 0 ? "Add item" : "Clear filters"}
        />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
