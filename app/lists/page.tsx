import { redirect } from "next/navigation";
import { ListsEditor } from "@/components/ListsEditor";
import { getCurrentUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Lists" };

export default async function ListsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "Admin") redirect("/");

  const [itemNames, manufacturers, categories] = await Promise.all([
    prisma.itemName.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    prisma.manufacturer.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-navy">Lists</h1>
        <p className="mt-1 text-sm text-mute">
          Item names, manufacturers, and categories used on Add Item.
        </p>
      </div>
      <ListsEditor
        itemNames={itemNames.map((row) => ({
          id: row.id,
          name: row.name,
          count: row._count.items,
        }))}
        manufacturers={manufacturers.map((row) => ({
          id: row.id,
          name: row.name,
          count: row._count.items,
        }))}
        categories={categories.map((row) => ({
          id: row.id,
          name: row.name,
          count: row._count.items,
        }))}
      />
    </div>
  );
}
