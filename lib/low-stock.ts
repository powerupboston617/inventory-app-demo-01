import { isLowStock } from "@/lib/labels";
import { appUrl, isMailConfigured, sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

type StockItem = {
  id: string;
  name: string;
  quantity: number;
  reorderPoint: number;
  location: string;
};

export async function notifyIfNewlyLow(
  wasLow: boolean,
  item: StockItem,
) {
  const nowLow = isLowStock(item.quantity, item.reorderPoint);
  if (wasLow || !nowLow) return;

  await prisma.activityLog.create({
    data: {
      action: "LowStock",
      details: `Low stock: ${item.name} (${item.quantity})`,
      itemId: item.id,
    },
  });

  if (!isMailConfigured()) return;

  const admins = await prisma.user.findMany({
    where: { role: "Admin", disabled: false },
    select: { email: true },
  });
  const to = admins.map((admin) => admin.email).filter(Boolean);
  if (to.length === 0) return;

  const open = appUrl();
  await sendMail({
    to,
    subject: `PUB Inventory: ${item.name} is low (${item.quantity} left)`,
    text: `${item.name} is low on stock.\n\nQuantity: ${item.quantity}\nReorder at: ${item.reorderPoint}\nLocation: ${item.location}\n\nOpen the app: ${open}/?low=1`,
  });
}
