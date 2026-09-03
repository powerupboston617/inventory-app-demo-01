import { Clock, Package } from "lucide-react";
import { ActiveJobs } from "@/components/ActiveJobs";
import { ActivityList } from "@/components/ActivityList";
import { EmptyState } from "@/components/EmptyState";
import { HomeFilter } from "@/components/HomeFilter";
import { ItemCard } from "@/components/ItemCard";
import { LowStockBanner } from "@/components/LowStockBanner";
import { ScanLookupButton } from "@/components/ScanLookupButton";
import { isLowStock } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { hasActiveFilters, parseItemFilters, itemWhere } from "@/lib/utils";

export const metadata = { title: "Home" };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseItemFilters(sp);

  const [rawItems, categories, projects, activity, totalAll, activeJobs, allStock] =
    await Promise.all([
      prisma.item.findMany({
        where: itemWhere(filters),
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.project.findMany({ orderBy: { name: "asc" } }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      prisma.item.count(),
      prisma.project.findMany({
        where: { status: "Active" },
        orderBy: { name: "asc" },
      }),
      prisma.item.findMany({
        select: { quantity: true, reorderPoint: true },
      }),
    ]);

  const items =
    filters.low === "1"
      ? rawItems.filter((item) => isLowStock(item.quantity, item.reorderPoint))
      : rawItems;

  const filtered = hasActiveFilters(filters);
  const lowStockCount = allStock.filter((item) =>
    isLowStock(item.quantity, item.reorderPoint),
  ).length;

  return (
    <div className="space-y-4">
      {filters.low !== "1" ? <LowStockBanner count={lowStockCount} /> : null}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Items</h1>
          <p className="mt-1 text-sm text-mute">
            {items.length} {items.length === 1 ? "item" : "items"}
            {filters.low === "1" ? " · Low stock" : filtered ? " match" : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <HomeFilter
            filters={filters}
            categories={categories}
            projects={projects}
            lowStockCount={lowStockCount}
          />
          <ScanLookupButton />
        </div>
      </div>

      <ActiveJobs jobs={activeJobs} activeId={filters.project} />

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={totalAll === 0 ? "No items yet" : "No matches"}
          description={
            totalAll === 0
              ? "Add gear from the shop, van, or a job so the team can find it fast."
              : "Try a different search or clear the filters."
          }
          actionHref={totalAll === 0 ? "/items/new" : "/"}
          actionLabel={totalAll === 0 ? "Add first item" : "Clear filters"}
        />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-navy">Recent activity</h2>
          <Clock className="h-4 w-4 text-mute" />
        </div>
        <ActivityList compact entries={activity} />
      </section>
    </div>
  );
}
