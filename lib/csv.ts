import Papa from "papaparse";
import type { Condition, ItemStatus, Location } from "@prisma/client";
import {
  CONDITIONS,
  ITEM_STATUSES,
  LOCATIONS,
  type ConditionValue,
  type ItemStatusValue,
  type LocationValue,
} from "@/lib/constants";
import { CONDITION_LABEL, STATUS_LABEL } from "@/lib/labels";

export const CSV_MAX_ROWS = 500;

export const CSV_HEADERS = [
  "name",
  "manufacturer",
  "serialNumber",
  "quantity",
  "reorderPoint",
  "location",
  "status",
  "condition",
  "price",
  "notes",
  "category",
  "project",
] as const;

export const CSV_TEMPLATE = `${CSV_HEADERS.join(",")}
UniFi 24-port PoE switch,Ubiquiti,UBNT-24POE-001,1,0,Van,In Transit,New,399,For Friday closet,Network & Security,Harborview clinic
HDMI 6ft cable,Generic,,12,5,Shop,In Stock,New,8.5,Bulk parts,Accessory Part,
`;

export type CsvItemRow = {
  name: string;
  manufacturer?: string;
  serialNumber?: string;
  quantity: number;
  reorderPoint: number;
  location: Location;
  status: ItemStatus;
  condition: Condition;
  price?: number;
  notes?: string;
  category?: string;
  project?: string;
};

export type CsvRowError = { row: number; message: string };

export type ImportResult = {
  created: number;
  skipped: number;
  errors: CsvRowError[];
  truncated?: boolean;
};

function norm(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function opt(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed.length ? trimmed : undefined;
}

function parseLocation(raw: string): LocationValue | null {
  const n = norm(raw);
  return LOCATIONS.find((loc) => loc.toLowerCase() === n) ?? null;
}

function parseStatus(raw: string): ItemStatusValue | null {
  const n = norm(raw);
  for (const key of ITEM_STATUSES) {
    if (n === key.toLowerCase() || n === STATUS_LABEL[key].toLowerCase()) {
      return key;
    }
  }
  return null;
}

function parseCondition(raw: string): ConditionValue | null {
  const n = norm(raw);
  for (const key of CONDITIONS) {
    if (n === key.toLowerCase() || n === CONDITION_LABEL[key].toLowerCase()) {
      return key;
    }
  }
  return null;
}

export function parseItemCsv(text: string): {
  rows: Array<{ line: number; data: CsvItemRow }>;
  errors: CsvRowError[];
  truncated: boolean;
} {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  const errors: CsvRowError[] = [];
  if (parsed.errors.length) {
    for (const err of parsed.errors) {
      errors.push({
        row: (err.row ?? 0) + 2,
        message: err.message,
      });
    }
  }

  const headers = parsed.meta.fields ?? [];
  if (!headers.includes("name") || !headers.includes("quantity")) {
    return {
      rows: [],
      errors: [
        {
          row: 1,
          message: "CSV must include a header row with at least name and quantity.",
        },
      ],
      truncated: false,
    };
  }

  const all = parsed.data;
  const truncated = all.length > CSV_MAX_ROWS;
  const slice = all.slice(0, CSV_MAX_ROWS);
  const rows: Array<{ line: number; data: CsvItemRow }> = [];

  slice.forEach((raw, index) => {
    const line = index + 2;
    const name = opt(raw.name);
    if (!name) {
      errors.push({ row: line, message: "Name is required." });
      return;
    }
    const qtyRaw = opt(raw.quantity);
    if (!qtyRaw) {
      errors.push({ row: line, message: "Quantity is required." });
      return;
    }
    const quantity = Number.parseInt(qtyRaw, 10);
    if (!Number.isFinite(quantity) || quantity < 0) {
      errors.push({ row: line, message: "Quantity must be a whole number 0 or more." });
      return;
    }

    const locationRaw = opt(raw.location) ?? "Shop";
    const location = parseLocation(locationRaw);
    if (!location) {
      errors.push({
        row: line,
        message: `Location must be Shop, Van, Shipping, Jobsite, or Other (got “${locationRaw}”).`,
      });
      return;
    }

    const statusRaw = opt(raw.status) ?? "In Stock";
    const status = parseStatus(statusRaw);
    if (!status) {
      errors.push({
        row: line,
        message: `Status must be In Stock, Out of Stock, In Transit, or At Location (got “${statusRaw}”).`,
      });
      return;
    }

    const conditionRaw = opt(raw.condition) ?? "New";
    const condition = parseCondition(conditionRaw);
    if (!condition) {
      errors.push({
        row: line,
        message: `Condition must be New, Used, or Shop Refurbished (got “${conditionRaw}”).`,
      });
      return;
    }

    let reorderPoint = 0;
    const reorderRaw = opt(raw.reorderPoint);
    if (reorderRaw) {
      const n = Number.parseInt(reorderRaw, 10);
      if (!Number.isFinite(n) || n < 0) {
        errors.push({ row: line, message: "Reorder point must be a whole number 0 or more." });
        return;
      }
      reorderPoint = n;
    }

    let price: number | undefined;
    const priceRaw = opt(raw.price);
    if (priceRaw) {
      const n = Number.parseFloat(priceRaw);
      if (!Number.isFinite(n) || n < 0) {
        errors.push({ row: line, message: "Price must be a number 0 or more." });
        return;
      }
      price = n;
    }

    rows.push({
      line,
      data: {
        name,
        manufacturer: opt(raw.manufacturer),
        serialNumber: opt(raw.serialNumber),
        quantity,
        reorderPoint,
        location,
        status,
        condition,
        price,
        notes: opt(raw.notes),
        category: opt(raw.category),
        project: opt(raw.project),
      },
    });
  });

  return { rows, errors, truncated };
}
