import { prisma } from "@/lib/prisma";

function norm(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export async function findItemNameByLabel(label: string) {
  const trimmed = norm(label);
  if (!trimmed) return null;
  const rows = await prisma.itemName.findMany();
  return (
    rows.find((row) => row.name.toLowerCase() === trimmed.toLowerCase()) ?? null
  );
}

export async function findManufacturerByLabel(label: string) {
  const trimmed = norm(label);
  if (!trimmed) return null;
  const rows = await prisma.manufacturer.findMany();
  return (
    rows.find((row) => row.name.toLowerCase() === trimmed.toLowerCase()) ?? null
  );
}

export async function findCategoryByLabel(label: string) {
  const trimmed = norm(label);
  if (!trimmed) return null;
  const rows = await prisma.category.findMany();
  return (
    rows.find((row) => row.name.toLowerCase() === trimmed.toLowerCase()) ?? null
  );
}

export async function getOrCreateItemName(label: string) {
  const trimmed = norm(label);
  const existing = await findItemNameByLabel(trimmed);
  if (existing) return existing;
  try {
    return await prisma.itemName.create({ data: { name: trimmed } });
  } catch {
    const again = await findItemNameByLabel(trimmed);
    if (again) return again;
    throw new Error("Could not save item name.");
  }
}

export async function getOrCreateManufacturer(label: string) {
  const trimmed = norm(label);
  const existing = await findManufacturerByLabel(trimmed);
  if (existing) return existing;
  try {
    return await prisma.manufacturer.create({ data: { name: trimmed } });
  } catch {
    const again = await findManufacturerByLabel(trimmed);
    if (again) return again;
    throw new Error("Could not save manufacturer.");
  }
}

export async function getOrCreateCategory(label: string) {
  const trimmed = norm(label);
  const existing = await findCategoryByLabel(trimmed);
  if (existing) return existing;
  try {
    return await prisma.category.create({ data: { name: trimmed } });
  } catch {
    const again = await findCategoryByLabel(trimmed);
    if (again) return again;
    throw new Error("Could not save category.");
  }
}

export async function backfillItemCatalogs() {
  const items = await prisma.item.findMany();
  let linked = 0;
  for (const item of items) {
    if (item.itemNameId && (item.manufacturerId || !item.manufacturer?.trim())) {
      continue;
    }
    const itemName = await getOrCreateItemName(item.name);
    let manufacturerId: string | null = item.manufacturerId;
    let manufacturerText = item.manufacturer;
    if (!manufacturerId && item.manufacturer?.trim()) {
      const maker = await getOrCreateManufacturer(item.manufacturer);
      manufacturerId = maker.id;
      manufacturerText = maker.name;
    }
    await prisma.item.update({
      where: { id: item.id },
      data: {
        itemNameId: itemName.id,
        name: itemName.name,
        manufacturerId,
        manufacturer: manufacturerText?.trim() || null,
      },
    });
    linked += 1;
  }
  return linked;
}
