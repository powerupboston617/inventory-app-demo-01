"use server";

import { requireUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function findItemBySerial(serial: string) {
  await requireUser();
  const trimmed = serial.trim();
  if (!trimmed) return { found: false as const };
  const item = await prisma.item.findFirst({
    where: { serialNumber: trimmed },
    select: { id: true, name: true, serialNumber: true },
  });
  if (item) {
    return { found: true as const, id: item.id, name: item.name };
  }
  return { found: false as const, serial: trimmed };
}
