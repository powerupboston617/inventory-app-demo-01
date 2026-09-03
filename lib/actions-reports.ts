"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/guards";
import { isMailConfigured } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { field } from "@/lib/utils";
import {
  sendInventoryReport,
  type ReportFrequency,
} from "@/lib/reports";

async function getOrCreateSettings() {
  return prisma.reportSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", frequency: "Off" },
  });
}

export async function saveReportSettings(formData: FormData) {
  await requireAdmin();
  const frequencyRaw = field(formData, "frequency") ?? "Off";
  const frequency: ReportFrequency =
    frequencyRaw === "Daily" || frequencyRaw === "Weekly" ? frequencyRaw : "Off";
  const extraEmail = field(formData, "extraEmail") ?? null;
  await prisma.reportSettings.upsert({
    where: { id: "default" },
    update: { frequency, extraEmail },
    create: { id: "default", frequency, extraEmail },
  });
  revalidatePath("/reports");
  return { ok: true as const, mail: isMailConfigured() };
}

export async function sendTestReport() {
  await requireAdmin();
  const settings = await getOrCreateSettings();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await sendInventoryReport({
    since,
    extraEmail: settings.extraEmail,
    test: true,
  });
  if (!result.sent) {
    if (result.reason === "not-configured") {
      return { error: "Email is not configured — reports will not send." };
    }
    if (result.reason === "no-recipients") {
      return { error: "No admin emails to send to." };
    }
    return { error: "Could not send the test report." };
  }
  return { ok: true as const };
}

export async function loadReportSettings() {
  return getOrCreateSettings();
}
