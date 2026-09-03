import { isLowStock } from "@/lib/labels";
import { isMailConfigured, sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

export const REPORT_TZ = "America/New_York";

export type ReportFrequency = "Off" | "Daily" | "Weekly";

function nyStamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TZ,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    weekday: get("weekday"),
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: Number.parseInt(get("hour") || "0", 10),
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

export function reportIsDue(
  frequency: string,
  lastSentAt: Date | null,
  now = new Date(),
) {
  if (frequency !== "Daily" && frequency !== "Weekly") return false;
  const ny = nyStamp(now);
  if (ny.hour < 6) return false;
  if (frequency === "Weekly" && ny.weekday !== "Mon") return false;
  if (!lastSentAt) return true;
  const last = nyStamp(lastSentAt);
  if (frequency === "Daily") return last.dateKey !== ny.dateKey;
  return last.dateKey !== ny.dateKey;
}

export async function buildReportText(since: Date) {
  const [items, activeProjects, added] = await Promise.all([
    prisma.item.findMany({
      select: {
        name: true,
        quantity: true,
        reorderPoint: true,
        location: true,
      },
    }),
    prisma.project.count({ where: { status: "Active" } }),
    prisma.item.findMany({
      where: { createdAt: { gte: since } },
      select: { name: true, quantity: true, location: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const low = items.filter((item) =>
    isLowStock(item.quantity, item.reorderPoint),
  );

  const lines = [
    "PUB Inventory report",
    `Timezone: ${REPORT_TZ}`,
    "",
    `Total items: ${items.length}`,
    `Total units: ${totalUnits}`,
    `Active projects: ${activeProjects}`,
    "",
    `Low stock (${low.length})`,
  ];

  if (low.length === 0) {
    lines.push("None.");
  } else {
    for (const item of low) {
      lines.push(
        `- ${item.name} · qty ${item.quantity} · reorder ${item.reorderPoint} · ${item.location}`,
      );
    }
  }

  lines.push("", `Items added since ${since.toLocaleDateString("en-US")} (${added.length})`);
  if (added.length === 0) {
    lines.push("None.");
  } else {
    for (const item of added.slice(0, 40)) {
      lines.push(`- ${item.name} · ${item.quantity} · ${item.location}`);
    }
    if (added.length > 40) {
      lines.push(`…and ${added.length - 40} more`);
    }
  }

  return lines.join("\n");
}

export async function reportRecipients(extraEmail?: string | null) {
  const admins = await prisma.user.findMany({
    where: { role: "Admin", disabled: false },
    select: { email: true },
  });
  const emails = new Set(admins.map((a) => a.email.toLowerCase()));
  const extra = extraEmail?.trim().toLowerCase();
  if (extra) emails.add(extra);
  return [...emails];
}

export async function sendInventoryReport(options: {
  since: Date;
  extraEmail?: string | null;
  test?: boolean;
}) {
  if (!isMailConfigured()) return { sent: false as const, reason: "not-configured" as const };
  const to = await reportRecipients(options.extraEmail);
  if (to.length === 0) return { sent: false as const, reason: "no-recipients" as const };
  const body = await buildReportText(options.since);
  const subject = options.test
    ? "PUB Inventory: test report"
    : "PUB Inventory: stock report";
  const ok = await sendMail({ to, subject, text: body });
  return ok
    ? { sent: true as const }
    : { sent: false as const, reason: "send-failed" as const };
}
