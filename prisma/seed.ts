import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  backfillItemCatalogs,
  getOrCreateItemName,
  getOrCreateManufacturer,
} from "@/lib/catalog";

const prisma = new PrismaClient();

const CATEGORIES = [
  "AV/Cameras",
  "Network & Security",
  "Computer Systems",
  "Components & Parts",
  "Door Access",
  "Accessory Part",
  "Tools",
  "Others",
];

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
  const techPassword = process.env.SEED_TECH_PASSWORD || "Tech123!";

  await prisma.user.upsert({
    where: { email: "admin@pub.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@pub.local",
      role: "Admin",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });
  await prisma.user.upsert({
    where: { email: "tech@pub.local" },
    update: {},
    create: {
      name: "Tech",
      email: "tech@pub.local",
      role: "Tech",
      passwordHash: await bcrypt.hash(techPassword, 10),
    },
  });
  console.log("Seeded Admin (admin@pub.local) and Tech (tech@pub.local).");

  const categories: Record<string, string> = {};
  for (const name of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories[name] = category.id;
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`);

  const linked = await backfillItemCatalogs();
  if (linked > 0) {
    console.log(`Linked ${linked} existing items to name/manufacturer lists.`);
  }

  if ((await prisma.item.count()) > 0) {
    console.log("Items already exist — skipping sample inventory.");
    return;
  }

  const project = await prisma.project.create({
    data: {
      name: "Harborview clinic",
      client: "Harborview",
      notes: "Network and camera refresh. Gear staged in the van.",
    },
  });

  const switchName = await getOrCreateItemName("UniFi 24-port PoE switch");
  const ubiquiti = await getOrCreateManufacturer("Ubiquiti");
  const switchItem = await prisma.item.create({
    data: {
      name: switchName.name,
      itemNameId: switchName.id,
      manufacturer: ubiquiti.name,
      manufacturerId: ubiquiti.id,
      serialNumber: "UBNT-24POE-001",
      quantity: 1,
      reorderPoint: 0,
      location: "Van",
      status: "InTransit",
      condition: "New",
      price: 399,
      notes: "For Friday closet install.",
      categoryId: categories["Network & Security"],
      projectId: project.id,
    },
  });

  const cableName = await getOrCreateItemName("Cat6 plenum cable (box)");
  const generic = await getOrCreateManufacturer("Generic");
  const cable = await prisma.item.create({
    data: {
      name: cableName.name,
      itemNameId: cableName.id,
      manufacturer: generic.name,
      manufacturerId: generic.id,
      quantity: 4,
      reorderPoint: 2,
      location: "Shop",
      status: "InStock",
      condition: "New",
      price: 189,
      notes: "Blue. Bulk — not serialized.",
      categoryId: categories["Components & Parts"],
    },
  });

  const cameraName = await getOrCreateItemName("Hikvision turret camera");
  const hikvision = await getOrCreateManufacturer("Hikvision");
  const camera = await prisma.item.create({
    data: {
      name: cameraName.name,
      itemNameId: cameraName.id,
      manufacturer: hikvision.name,
      manufacturerId: hikvision.id,
      serialNumber: "HK-TUR-4481",
      quantity: 3,
      reorderPoint: 1,
      location: "Jobsite",
      status: "AtLocation",
      condition: "New",
      price: 129,
      categoryId: categories["AV/Cameras"],
      projectId: project.id,
    },
  });

  const hdmiName = await getOrCreateItemName("HDMI 6ft cable");
  const hdmi = await prisma.item.create({
    data: {
      name: hdmiName.name,
      itemNameId: hdmiName.id,
      manufacturer: generic.name,
      manufacturerId: generic.id,
      quantity: 2,
      reorderPoint: 5,
      location: "Shop",
      status: "InStock",
      condition: "New",
      price: 8.5,
      notes: "Low — grab more on the next parts run.",
      categoryId: categories["Accessory Part"],
    },
  });

  await prisma.activityLog.createMany({
    data: [
      {
        action: "Created",
        details: `Created “${switchItem.name}” (1 · Van)`,
        itemId: switchItem.id,
      },
      {
        action: "Created",
        details: `Created “${cable.name}” (4 · Shop)`,
        itemId: cable.id,
      },
      {
        action: "Created",
        details: `Created “${camera.name}” (3 · Jobsite)`,
        itemId: camera.id,
      },
      {
        action: "Created",
        details: `Created “${hdmi.name}” (2 · Shop)`,
        itemId: hdmi.id,
      },
    ],
  });

  console.log("Seeded sample project and 4 items.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
