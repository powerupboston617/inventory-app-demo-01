export const LOCATIONS = [
  "Shop",
  "Van",
  "Shipping",
  "Jobsite",
  "Other",
] as const;

export const ITEM_STATUSES = [
  "InStock",
  "OutOfStock",
  "InTransit",
  "AtLocation",
] as const;

export const CONDITIONS = ["New", "Used", "ShopRefurbished"] as const;

export const PROJECT_STATUSES = ["Active", "Completed"] as const;

export type LocationValue = (typeof LOCATIONS)[number];
export type ItemStatusValue = (typeof ITEM_STATUSES)[number];
export type ConditionValue = (typeof CONDITIONS)[number];
export type ProjectStatusValue = (typeof PROJECT_STATUSES)[number];
