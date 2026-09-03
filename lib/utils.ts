import { Prisma } from "@prisma/client";
import {
  CONDITIONS,
  ITEM_STATUSES,
  LOCATIONS,
  type ConditionValue,
  type ItemStatusValue,
  type LocationValue,
} from "@/lib/constants";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0] || undefined;
  return value || undefined;
}

function isLocation(value: string): value is LocationValue {
  return (LOCATIONS as readonly string[]).includes(value);
}

function isStatus(value: string): value is ItemStatusValue {
  return (ITEM_STATUSES as readonly string[]).includes(value);
}

function isCondition(value: string): value is ConditionValue {
  return (CONDITIONS as readonly string[]).includes(value);
}

export type ItemFilterParams = {
  q?: string;
  category?: string;
  location?: string;
  status?: string;
  condition?: string;
  project?: string;
  low?: string;
};

export function parseItemFilters(
  sp: Record<string, string | string[] | undefined>,
): ItemFilterParams {
  return {
    q: firstParam(sp.q),
    category: firstParam(sp.category),
    location: firstParam(sp.location),
    status: firstParam(sp.status),
    condition: firstParam(sp.condition),
    project: firstParam(sp.project),
    low: firstParam(sp.low) === "1" ? "1" : undefined,
  };
}

export function itemWhere(filters: ItemFilterParams): Prisma.ItemWhereInput {
  const where: Prisma.ItemWhereInput = {};

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { manufacturer: { contains: q } },
      { serialNumber: { contains: q } },
      { notes: { contains: q } },
      { itemName: { name: { contains: q } } },
      { maker: { name: { contains: q } } },
    ];
  }

  if (filters.category) where.categoryId = filters.category;
  if (filters.location && isLocation(filters.location)) {
    where.location = filters.location;
  }
  if (filters.status && isStatus(filters.status)) {
    where.status = filters.status;
  }
  if (filters.condition && isCondition(filters.condition)) {
    where.condition = filters.condition;
  }
  if (filters.project) where.projectId = filters.project;

  return where;
}

export function hasActiveFilters(filters: ItemFilterParams) {
  return Boolean(
    filters.q ||
      filters.category ||
      filters.location ||
      filters.status ||
      filters.condition ||
      filters.project ||
      filters.low,
  );
}

export function field(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function intField(
  formData: FormData,
  key: string,
  fallback: number,
): number {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function floatField(
  formData: FormData,
  key: string,
): number | undefined {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}
