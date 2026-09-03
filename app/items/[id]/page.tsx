import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderKanban, Package, Pencil, Tag } from "lucide-react";
import { ActivityList } from "@/components/ActivityList";
import { DeleteButton } from "@/components/DeleteButton";
import { LocationStatusBadge } from "@/components/LocationStatusBadge";
import { QuantityAdjust } from "@/components/QuantityAdjust";
import { CONDITION_LABEL, formatDate, formatPrice, isLowStock } from "@/lib/labels";
import { getCurrentUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.item.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: item?.name ?? "Item" };
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      category: true,
      project: true,
      activityLogs: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!item) notFound();

  const low = isLowStock(item.quantity, item.reorderPoint);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/items"
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-blue"
      >
        <ArrowLeft className="h-4 w-4" />
        All items
      </Link>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="aspect-[16/9] bg-page sm:aspect-[2/1]">
          {item.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.photoUrl}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-mute">
              <Package className="h-12 w-12" />
            </div>
          )}
        </div>

        <div className="space-y-5 p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-navy">{item.name}</h1>
              {item.manufacturer ? (
                <p className="mt-0.5 text-sm text-mute">{item.manufacturer}</p>
              ) : null}
            </div>
            <LocationStatusBadge status={item.status} location={item.location} />
          </div>

          {low ? (
            <p className="rounded-xl bg-orange/15 px-4 py-3 text-sm font-semibold text-orange">
              Low stock — {item.quantity} on hand, reorder at {item.reorderPoint}.
            </p>
          ) : null}

          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-page p-4 sm:flex-row sm:items-center">
            <QuantityAdjust itemId={item.id} quantity={item.quantity} />
            <p className="text-sm text-mute">
              Reorder at <span className="font-medium text-navy">{item.reorderPoint}</span>
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-page px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-mute">Condition</dt>
              <dd className="mt-0.5 font-medium">{CONDITION_LABEL[item.condition]}</dd>
            </div>
            <div className="rounded-xl bg-page px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-mute">Serial</dt>
              <dd className="mt-0.5 font-medium">{item.serialNumber || "—"}</dd>
            </div>
            <div className="rounded-xl bg-page px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-mute">Price</dt>
              <dd className="mt-0.5 font-medium">{formatPrice(item.price) || "—"}</dd>
            </div>
            <div className="rounded-xl bg-page px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-mute">Updated</dt>
              <dd className="mt-0.5 font-medium">{formatDate(item.updatedAt)}</dd>
            </div>
          </dl>

          {item.category ? (
            <p className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-mute" />
              <span>{item.category.name}</span>
            </p>
          ) : null}

          {item.project ? (
            <p className="flex items-center gap-2 text-sm">
              <FolderKanban className="h-4 w-4 text-mute" />
              <Link href={`/projects/${item.project.id}`} className="font-medium text-blue">
                {item.project.name}
                {item.project.client ? ` · ${item.project.client}` : ""}
              </Link>
            </p>
          ) : null}

          {item.notes ? (
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wide text-mute">
                Notes
              </h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-navy">{item.notes}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/items/${item.id}/edit`}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
            {user?.role === "Admin" ? (
              <DeleteButton id={item.id} name={item.name} />
            ) : null}
          </div>
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-5">
        <h2 className="mb-1 text-base font-semibold text-navy">Activity</h2>
        <ActivityList
          entries={item.activityLogs}
          empty="No activity on this item yet."
        />
      </section>
    </div>
  );
}
