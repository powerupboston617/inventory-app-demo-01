"use server";

import { revalidatePath } from "next/cache";
import { isLowStock } from "@/lib/labels";
import { requireAdmin } from "@/lib/guards";
import {
  getOrCreateCategory,
  getOrCreateItemName,
  getOrCreateManufacturer,
} from "@/lib/catalog";
import { parseItemCsv, type ImportResult } from "@/lib/csv";
import { prisma } from "@/lib/prisma";

export async function importItemsCsv(formData: FormData): Promise<ImportResult | { error: string }> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file." };
  }
  const text = await file.text();
  const parsed = parseItemCsv(text);
  if (parsed.rows.length === 0 && parsed.errors.length === 0) {
    return { error: "That file has no data rows." };
  }

  const projects = await prisma.project.findMany();
  const projByName = new Map(projects.map((p) => [p.name.toLowerCase(), p]));

  let created = 0;
  const errors = [...parsed.errors];

  for (const { line, data } of parsed.rows) {
    try {
      const itemName = await getOrCreateItemName(data.name);
      const maker = data.manufacturer
        ? await getOrCreateManufacturer(data.manufacturer)
        : null;

      let categoryId: string | undefined;
      if (data.category) {
        const cat = await getOrCreateCategory(data.category);
        categoryId = cat.id;
      }

      let projectId: string | undefined;
      if (data.project) {
        const key = data.project.toLowerCase();
        let proj = projByName.get(key);
        if (!proj) {
          proj = await prisma.project.create({
            data: { name: data.project, status: "Active" },
          });
          projByName.set(key, proj);
        }
        projectId = proj.id;
      }

      const item = await prisma.item.create({
        data: {
          name: itemName.name,
          itemNameId: itemName.id,
          manufacturer: maker?.name ?? null,
          manufacturerId: maker?.id ?? null,
          serialNumber: data.serialNumber,
          quantity: data.quantity,
          reorderPoint: data.reorderPoint,
          location: data.location,
          status: data.status,
          condition: data.condition,
          price: data.price,
          notes: data.notes,
          categoryId,
          projectId,
        },
      });

      await prisma.activityLog.create({
        data: {
          action: "Created",
          details: `Created via CSV “${item.name}” (${item.quantity} · ${item.location})`,
          itemId: item.id,
        },
      });

      if (isLowStock(item.quantity, item.reorderPoint)) {
        await prisma.activityLog.create({
          data: {
            action: "LowStock",
            details: `Low stock: ${item.name} (${item.quantity})`,
            itemId: item.id,
          },
        });
      }

      created += 1;
    } catch {
      errors.push({ row: line, message: "Could not save this row." });
    }
  }

  revalidatePath("/", "layout");
  return {
    created,
    skipped: errors.length,
    errors,
    truncated: parsed.truncated,
  };
}
