"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/guards";
import {
  findCategoryByLabel,
  findItemNameByLabel,
  findManufacturerByLabel,
  getOrCreateCategory,
  getOrCreateItemName,
  getOrCreateManufacturer,
} from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

export type CatalogResult =
  | { ok: true; id: string; name: string }
  | { ok: false; error: string };

function refresh() {
  revalidatePath("/", "layout");
}

export async function createItemName(name: string): Promise<CatalogResult> {
  await requireUser();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Enter an item name." };
  const existing = await findItemNameByLabel(trimmed);
  if (existing) return { ok: true, id: existing.id, name: existing.name };
  const row = await getOrCreateItemName(trimmed);
  refresh();
  return { ok: true, id: row.id, name: row.name };
}

export async function createManufacturer(name: string): Promise<CatalogResult> {
  await requireUser();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Enter a manufacturer." };
  const existing = await findManufacturerByLabel(trimmed);
  if (existing) return { ok: true, id: existing.id, name: existing.name };
  const row = await getOrCreateManufacturer(trimmed);
  refresh();
  return { ok: true, id: row.id, name: row.name };
}

export async function addCatalogCategory(name: string): Promise<CatalogResult> {
  await requireUser();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Enter a category name." };
  const existing = await findCategoryByLabel(trimmed);
  if (existing) return { ok: false, error: "That category already exists." };
  const row = await getOrCreateCategory(trimmed);
  refresh();
  return { ok: true, id: row.id, name: row.name };
}

export async function renameItemName(
  id: string,
  name: string,
): Promise<CatalogResult> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Enter an item name." };
  const current = await prisma.itemName.findUnique({ where: { id } });
  if (!current) return { ok: false, error: "Item name not found." };
  const clash = await findItemNameByLabel(trimmed);
  if (clash && clash.id !== id) {
    return { ok: false, error: "That item name already exists." };
  }
  const row = await prisma.itemName.update({
    where: { id },
    data: { name: trimmed },
  });
  await prisma.item.updateMany({
    where: { itemNameId: id },
    data: { name: trimmed },
  });
  await prisma.activityLog.create({
    data: {
      action: "Updated",
      details: `Renamed item name “${current.name}” → “${trimmed}”`,
    },
  });
  refresh();
  return { ok: true, id: row.id, name: row.name };
}

export async function renameManufacturer(
  id: string,
  name: string,
): Promise<CatalogResult> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Enter a manufacturer." };
  const current = await prisma.manufacturer.findUnique({ where: { id } });
  if (!current) return { ok: false, error: "Manufacturer not found." };
  const clash = await findManufacturerByLabel(trimmed);
  if (clash && clash.id !== id) {
    return { ok: false, error: "That manufacturer already exists." };
  }
  const row = await prisma.manufacturer.update({
    where: { id },
    data: { name: trimmed },
  });
  await prisma.item.updateMany({
    where: { manufacturerId: id },
    data: { manufacturer: trimmed },
  });
  await prisma.activityLog.create({
    data: {
      action: "Updated",
      details: `Renamed manufacturer “${current.name}” → “${trimmed}”`,
    },
  });
  refresh();
  return { ok: true, id: row.id, name: row.name };
}

export async function renameCategory(
  id: string,
  name: string,
): Promise<CatalogResult> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Enter a category name." };
  const current = await prisma.category.findUnique({ where: { id } });
  if (!current) return { ok: false, error: "Category not found." };
  const clash = await findCategoryByLabel(trimmed);
  if (clash && clash.id !== id) {
    return { ok: false, error: "That category already exists." };
  }
  const row = await prisma.category.update({
    where: { id },
    data: { name: trimmed },
  });
  await prisma.activityLog.create({
    data: {
      action: "Updated",
      details: `Renamed category “${current.name}” → “${trimmed}”`,
    },
  });
  refresh();
  return { ok: true, id: row.id, name: row.name };
}

export async function deleteItemName(id: string): Promise<CatalogResult> {
  await requireAdmin();
  const current = await prisma.itemName.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  });
  if (!current) return { ok: false, error: "Item name not found." };
  if (current._count.items > 0) {
    return {
      ok: false,
      error: `Used by ${current._count.items} ${current._count.items === 1 ? "item" : "items"} — reassign or delete those items first.`,
    };
  }
  await prisma.itemName.delete({ where: { id } });
  await prisma.activityLog.create({
    data: {
      action: "Deleted",
      details: `Deleted item name “${current.name}”`,
    },
  });
  refresh();
  return { ok: true, id, name: current.name };
}

export async function deleteManufacturer(id: string): Promise<CatalogResult> {
  await requireAdmin();
  const current = await prisma.manufacturer.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  });
  if (!current) return { ok: false, error: "Manufacturer not found." };
  if (current._count.items > 0) {
    return {
      ok: false,
      error: `Used by ${current._count.items} ${current._count.items === 1 ? "item" : "items"} — reassign or delete those items first.`,
    };
  }
  await prisma.manufacturer.delete({ where: { id } });
  await prisma.activityLog.create({
    data: {
      action: "Deleted",
      details: `Deleted manufacturer “${current.name}”`,
    },
  });
  refresh();
  return { ok: true, id, name: current.name };
}

export async function deleteCategory(id: string): Promise<CatalogResult> {
  await requireAdmin();
  const current = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  });
  if (!current) return { ok: false, error: "Category not found." };
  if (current._count.items > 0) {
    return {
      ok: false,
      error: `Used by ${current._count.items} ${current._count.items === 1 ? "item" : "items"} — reassign or delete those items first.`,
    };
  }
  await prisma.category.delete({ where: { id } });
  await prisma.activityLog.create({
    data: {
      action: "Deleted",
      details: `Deleted category “${current.name}”`,
    },
  });
  refresh();
  return { ok: true, id, name: current.name };
}
