"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function startOfTodayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function toggleCheckInItem(itemId: string, completed: boolean) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return { success: false, error: "No autorizado" };

  const item = await prisma.checkInItem.findUnique({
    where: { id: itemId },
    select: { id: true, userId: true },
  });
  if (!item || item.userId !== userId) {
    return { success: false, error: "No autorizado" };
  }

  await prisma.checkInItem.update({
    where: { id: itemId },
    data: {
      isCompleted: completed,
      completedAt: completed ? new Date() : null,
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function addCustomCheckInItem(title: string) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return { success: false, error: "No autorizado" };

  const cleanTitle = title.trim();
  if (!cleanTitle) return { success: false, error: "Título requerido" };

  const dayStart = startOfTodayLocal();

  await prisma.checkInItem.create({
    data: {
      userId,
      date: dayStart,
      title: cleanTitle,
      source: "CUSTOM",
      sortOrder: 99,
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function removeCheckInItem(itemId: string) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return { success: false, error: "No autorizado" };

  const item = await prisma.checkInItem.findUnique({
    where: { id: itemId },
    select: { id: true, userId: true, source: true },
  });

  if (!item || item.userId !== userId) {
    return { success: false, error: "No autorizado" };
  }

  if (item.source !== "CUSTOM") {
    return { success: false, error: "Solo puedes eliminar tareas personalizadas" };
  }

  await prisma.checkInItem.delete({ where: { id: itemId } });

  revalidatePath("/dashboard");
  return { success: true };
}

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "ADMIN") return null;
  return session;
}

export async function createCheckInTemplate(title: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Solo admin" };

  const cleanTitle = title.trim();
  if (!cleanTitle) return { success: false, error: "Título requerido" };

  const last = await prisma.checkInTemplate.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.checkInTemplate.create({
    data: {
      title: cleanTitle,
      sortOrder: (last?.sortOrder ?? 0) + 1,
      createdBy: (admin.user as { id?: string })?.id ?? null,
    },
  });

  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateCheckInTemplate(templateId: string, title: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Solo admin" };
  const cleanTitle = title.trim();
  if (!cleanTitle) return { success: false, error: "Título requerido" };

  await prisma.checkInTemplate.update({
    where: { id: templateId },
    data: { title: cleanTitle },
  });

  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleCheckInTemplate(templateId: string, isActive: boolean) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Solo admin" };

  await prisma.checkInTemplate.update({
    where: { id: templateId },
    data: { isActive },
  });

  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteCheckInTemplate(templateId: string) {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Solo admin" };

  await prisma.checkInTemplate.delete({ where: { id: templateId } });

  revalidatePath("/configuracion");
  revalidatePath("/dashboard");
  return { success: true };
}
