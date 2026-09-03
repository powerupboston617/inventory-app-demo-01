"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActivityAction, Condition, ItemStatus, Location } from "@prisma/client";
import {
  CONDITIONS,
  ITEM_STATUSES,
  LOCATIONS,
  PROJECT_STATUSES,
  type ProjectStatusValue,
} from "@/lib/constants";
import { findCategoryByLabel } from "@/lib/catalog";
import { requireAdmin, requireUser } from "@/lib/guards";
import { isLowStock } from "@/lib/labels";
import { notifyIfNewlyLow } from "@/lib/low-stock";
import { savePhoto } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { field, floatField, intField } from "@/lib/utils";

function refresh() {
  revalidatePath("/", "layout");
}

async function log(
  action: ActivityAction,
  details: string,
  itemId?: string | null,
) {
  await prisma.activityLog.create({
    data: { action, details, itemId: itemId ?? undefined },
  });
}

function asLocation(value: string | undefined): Location {
  if (value && (LOCATIONS as readonly string[]).includes(value)) {
    return value as Location;
  }
  return "Shop";
}

function asStatus(value: string | undefined): ItemStatus {
  if (value && (ITEM_STATUSES as readonly string[]).includes(value)) {
    return value as ItemStatus;
  }
  return "InStock";
}

function asCondition(value: string | undefined): Condition {
  if (value && (CONDITIONS as readonly string[]).includes(value)) {
    return value as Condition;
  }
  return "New";
}

function syncStockStatus(quantity: number, status: ItemStatus): ItemStatus {
  if (quantity <= 0 && status === "InStock") return "OutOfStock";
  if (quantity > 0 && status === "OutOfStock") return "InStock";
  return status;
}

function changedFields(
  before: Record<string, string | number | null | undefined>,
  after: Record<string, string | number | null | undefined>,
) {
  const names: string[] = [];
  for (const key of Object.keys(after)) {
    if (before[key] !== after[key]) names.push(key);
  }
  return names;
}

export type ActionResult = { error: string } | void;

export type CreateNamedResult =
  | { ok: true; id: string; name: string; client?: string | null }
  | { ok: false; error: string };

export async function createItem(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const itemNameId = field(formData, "itemNameId");
  if (!itemNameId) return { error: "Name is required." };
  const itemName = await prisma.itemName.findUnique({ where: { id: itemNameId } });
  if (!itemName) return { error: "Pick an item name from the list." };

  const manufacturerId = field(formData, "manufacturerId");
  const maker = manufacturerId
    ? await prisma.manufacturer.findUnique({ where: { id: manufacturerId } })
    : null;

  const quantity = Math.max(0, intField(formData, "quantity", 1));
  const reorderPoint = Math.max(0, intField(formData, "reorderPoint", 0));
  let status = asStatus(field(formData, "status"));
  status = syncStockStatus(quantity, status);
  const location = asLocation(field(formData, "location"));

  let photoUrl: string | undefined;
  try {
    photoUrl = await savePhoto(formData.get("photo") as File | null);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Photo upload failed." };
  }

  const item = await prisma.item.create({
    data: {
      name: itemName.name,
      itemNameId: itemName.id,
      manufacturer: maker?.name ?? null,
      manufacturerId: maker?.id ?? null,
      serialNumber: field(formData, "serialNumber"),
      quantity,
      reorderPoint,
      location,
      status,
      condition: asCondition(field(formData, "condition")),
      price: floatField(formData, "price"),
      photoUrl,
      notes: field(formData, "notes"),
      categoryId: field(formData, "categoryId") ?? null,
      projectId: field(formData, "projectId") ?? null,
    },
  });

  await log("Created", `Created “${item.name}” (${quantity} · ${location})`, item.id);
  await notifyIfNewlyLow(false, item);
  refresh();
  redirect(`/items/${item.id}`);
}

export async function updateItem(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) return { error: "Item not found." };

  const itemNameId = field(formData, "itemNameId");
  if (!itemNameId) return { error: "Name is required." };
  const itemName = await prisma.itemName.findUnique({ where: { id: itemNameId } });
  if (!itemName) return { error: "Pick an item name from the list." };
  const name = itemName.name;

  const manufacturerId = field(formData, "manufacturerId");
  const maker = manufacturerId
    ? await prisma.manufacturer.findUnique({ where: { id: manufacturerId } })
    : null;

  const quantity = Math.max(0, intField(formData, "quantity", existing.quantity));
  const reorderPoint = Math.max(0, intField(formData, "reorderPoint", existing.reorderPoint));
  const location = asLocation(field(formData, "location"));
  let status = asStatus(field(formData, "status"));
  status = syncStockStatus(quantity, status);

  let photoUrl = existing.photoUrl;
  try {
    const uploaded = await savePhoto(formData.get("photo") as File | null);
    if (uploaded) photoUrl = uploaded;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Photo upload failed." };
  }

  const data = {
    name,
    itemNameId: itemName.id,
    manufacturer: maker?.name ?? null,
    manufacturerId: maker?.id ?? null,
    serialNumber: field(formData, "serialNumber") ?? null,
    quantity,
    reorderPoint,
    location,
    status,
    condition: asCondition(field(formData, "condition")),
    price: floatField(formData, "price") ?? null,
    photoUrl,
    notes: field(formData, "notes") ?? null,
    categoryId: field(formData, "categoryId") ?? null,
    projectId: field(formData, "projectId") ?? null,
  };

  await prisma.item.update({ where: { id }, data });

  if (existing.quantity !== quantity) {
    await log(
      "QuantityChanged",
      `“${name}” quantity ${existing.quantity} → ${quantity}`,
      id,
    );
  }
  if (existing.location !== location) {
    await log(
      "LocationChanged",
      `“${name}” location ${existing.location} → ${location}`,
      id,
    );
  }

  const other = changedFields(
    {
      name: existing.name,
      itemNameId: existing.itemNameId,
      manufacturer: existing.manufacturer,
      manufacturerId: existing.manufacturerId,
      serialNumber: existing.serialNumber,
      reorderPoint: existing.reorderPoint,
      status: existing.status,
      condition: existing.condition,
      price: existing.price,
      notes: existing.notes,
      categoryId: existing.categoryId,
      projectId: existing.projectId,
      photoUrl: existing.photoUrl,
    },
    {
      name: data.name,
      itemNameId: data.itemNameId,
      manufacturer: data.manufacturer,
      manufacturerId: data.manufacturerId,
      serialNumber: data.serialNumber,
      reorderPoint: data.reorderPoint,
      status: data.status,
      condition: data.condition,
      price: data.price,
      notes: data.notes,
      categoryId: data.categoryId,
      projectId: data.projectId,
      photoUrl: data.photoUrl,
    },
  );

  if (other.length) {
    await log("Updated", `Updated “${name}” (${other.join(", ")})`, id);
  }

  await notifyIfNewlyLow(
    isLowStock(existing.quantity, existing.reorderPoint),
    { id, name, quantity, reorderPoint, location },
  );

  refresh();
  redirect(`/items/${id}`);
}

export async function deleteItem(id: string): Promise<ActionResult> {
  await requireAdmin();
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) return { error: "Item not found." };

  await log(
    "Deleted",
    `Deleted “${existing.name}” (${existing.quantity} · ${existing.location})`,
    id,
  );
  await prisma.item.delete({ where: { id } });
  refresh();
  redirect("/items");
}

export async function adjustQuantity(
  id: string,
  delta: number,
): Promise<ActionResult> {
  await requireUser();
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) return { error: "Item not found." };

  const quantity = Math.max(0, existing.quantity + delta);
  const status = syncStockStatus(quantity, existing.status);

  await prisma.item.update({
    where: { id },
    data: { quantity, status },
  });
  await log(
    "QuantityChanged",
    `“${existing.name}” quantity ${existing.quantity} → ${quantity}`,
    id,
  );
  await notifyIfNewlyLow(
    isLowStock(existing.quantity, existing.reorderPoint),
    {
      id,
      name: existing.name,
      quantity,
      reorderPoint: existing.reorderPoint,
      location: existing.location,
    },
  );
  refresh();
}

export async function createCategory(name: string): Promise<CreateNamedResult> {
  await requireUser();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Enter a category name." };
  const existing = await findCategoryByLabel(trimmed);
  if (existing) return { ok: false, error: "That category already exists." };
  try {
    const category = await prisma.category.create({ data: { name: trimmed } });
    refresh();
    return { ok: true, id: category.id, name: category.name };
  } catch {
    return { ok: false, error: "That category already exists." };
  }
}

export async function createProjectQuick(
  name: string,
  client?: string,
): Promise<CreateNamedResult> {
  await requireUser();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Enter a project name." };
  const project = await prisma.project.create({
    data: {
      name: trimmed,
      client: client?.trim() || undefined,
    },
  });
  refresh();
  return {
    ok: true,
    id: project.id,
    name: project.name,
    client: project.client,
  };
}

export async function createProject(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const name = field(formData, "name");
  if (!name) return { error: "Name is required." };
  const statusRaw = field(formData, "status");
  const status =
    statusRaw && (PROJECT_STATUSES as readonly string[]).includes(statusRaw)
      ? (statusRaw as ProjectStatusValue)
      : "Active";

  const project = await prisma.project.create({
    data: {
      name,
      client: field(formData, "client"),
      notes: field(formData, "notes"),
      status,
    },
  });
  refresh();
  redirect(`/projects/${project.id}`);
}

export async function updateProject(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return { error: "Project not found." };
  const name = field(formData, "name");
  if (!name) return { error: "Name is required." };
  const statusRaw = field(formData, "status");
  const status =
    statusRaw && (PROJECT_STATUSES as readonly string[]).includes(statusRaw)
      ? (statusRaw as ProjectStatusValue)
      : existing.status;

  await prisma.project.update({
    where: { id },
    data: {
      name,
      client: field(formData, "client") ?? null,
      notes: field(formData, "notes") ?? null,
      status,
    },
  });
  refresh();
  redirect(`/projects/${id}`);
}

export async function deleteProject(id: string): Promise<ActionResult> {
  await requireAdmin();
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return { error: "Project not found." };
  await prisma.item.updateMany({
    where: { projectId: id },
    data: { projectId: null },
  });
  await prisma.project.delete({ where: { id } });
  refresh();
  redirect("/projects");
}
