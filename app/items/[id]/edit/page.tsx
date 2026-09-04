import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ItemForm } from "@/components/ItemForm";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Edit item" };

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, itemNames, manufacturers, categories, projects] = await Promise.all([
    prisma.item.findUnique({ where: { id } }),
    prisma.itemName.findMany({ orderBy: { name: "asc" } }),
    prisma.manufacturer.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!item) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href={`/items/${item.id}`}
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-blue"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to item
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-navy">Edit item</h1>
        <p className="mt-1 text-sm text-mute">{item.name}</p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-6">
        <ItemForm
          item={item}
          itemNames={itemNames}
          manufacturers={manufacturers}
          categories={categories}
          projects={projects}
        />
      </div>
    </div>
  );
}
