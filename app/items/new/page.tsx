import { ItemForm } from "@/components/ItemForm";
import { firstParam } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Add item" };

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const [itemNames, manufacturers, categories, projects] = await Promise.all([
    prisma.itemName.findMany({ orderBy: { name: "asc" } }),
    prisma.manufacturer.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany({
      where: { status: "Active" },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-navy">Add item</h1>
        <p className="mt-1 text-sm text-mute">
          Snap a photo if you can — it makes the van and jobsite a lot easier.
        </p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-6">
        <ItemForm
          itemNames={itemNames}
          manufacturers={manufacturers}
          categories={categories}
          projects={projects}
          initialSerial={firstParam(sp.serial)}
        />
      </div>
    </div>
  );
}
