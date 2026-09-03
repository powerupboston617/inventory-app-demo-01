import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reportIsDue, sendInventoryReport } from "@/lib/reports";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret") ?? "";
  if (!secret || (token !== secret && querySecret !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.reportSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", frequency: "Off" },
  });

  if (!reportIsDue(settings.frequency, settings.lastSentAt)) {
    return NextResponse.json({ ok: true, sent: false, reason: "not-due" });
  }

  const sinceMs =
    settings.frequency === "Weekly"
      ? 7 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;
  const since = settings.lastSentAt ?? new Date(Date.now() - sinceMs);
  const result = await sendInventoryReport({
    since,
    extraEmail: settings.extraEmail,
  });

  if (!result.sent) {
    return NextResponse.json({ ok: true, sent: false, reason: result.reason });
  }

  await prisma.reportSettings.update({
    where: { id: "default" },
    data: { lastSentAt: new Date() },
  });

  return NextResponse.json({ ok: true, sent: true });
}
