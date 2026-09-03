"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { field } from "@/lib/utils";

export type UserActionResult = { error?: string; ok?: boolean };

export async function createUser(formData: FormData): Promise<UserActionResult> {
  await requireAdmin();
  const name = field(formData, "name");
  const email = field(formData, "email")?.toLowerCase();
  const password =
    typeof formData.get("password") === "string"
      ? (formData.get("password") as string)
      : "";
  const roleRaw = field(formData, "role");
  const role = roleRaw === "Admin" ? "Admin" : "Tech";

  if (!name || !email) return { error: "Name and email are required." };
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "That email is already in the app." };

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function setUserDisabled(
  id: string,
  disabled: boolean,
): Promise<UserActionResult> {
  const admin = await requireAdmin();
  if (id === admin.id) return { error: "You cannot disable your own account." };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "User not found." };

  if (disabled && target.role === "Admin") {
    const otherAdmins = await prisma.user.count({
      where: { role: "Admin", disabled: false, id: { not: id } },
    });
    if (otherAdmins === 0) {
      return { error: "Keep at least one active admin." };
    }
  }

  await prisma.user.update({ where: { id }, data: { disabled } });
  revalidatePath("/settings");
  return { ok: true };
}

async function otherActiveAdminCount(id: string) {
  return prisma.user.count({
    where: { role: "Admin", disabled: false, id: { not: id } },
  });
}

export async function updateUser(
  id: string,
  formData: FormData,
): Promise<UserActionResult> {
  await requireAdmin();
  const name = field(formData, "name");
  const email = field(formData, "email")?.toLowerCase();
  const password =
    typeof formData.get("password") === "string"
      ? (formData.get("password") as string)
      : "";
  const confirm =
    typeof formData.get("confirmPassword") === "string"
      ? (formData.get("confirmPassword") as string)
      : "";
  const roleRaw = field(formData, "role");
  const role = roleRaw === "Admin" ? "Admin" : "Tech";

  if (!name || !email) return { error: "Name and email are required." };
  if (password) {
    if (password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }
    if (password !== confirm) {
      return { error: "New password and confirm do not match." };
    }
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "User not found." };

  if (target.role === "Admin" && role !== "Admin") {
    const others = await otherActiveAdminCount(id);
    if (others === 0) {
      return { error: "Keep at least one active admin." };
    }
  }

  const taken = await prisma.user.findFirst({
    where: { email, NOT: { id } },
    select: { id: true },
  });
  if (taken) return { error: "That email is already in the app." };

  await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      role,
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setUserRole(
  id: string,
  role: "Admin" | "Tech",
): Promise<UserActionResult> {
  await requireAdmin();
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "User not found." };
  if (target.role === "Admin" && role === "Tech") {
    const otherAdmins = await otherActiveAdminCount(id);
    if (otherAdmins === 0) {
      return { error: "Keep at least one active admin." };
    }
  }
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/settings");
  return { ok: true };
}
