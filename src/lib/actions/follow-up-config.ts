"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function updateFollowUpConfig(
  stepKey: string,
  data: {
    label?: string;
    description?: string;
    dayOffset?: number;
    hourOffset?: number;
    isActive?: boolean;
  }
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    // Only ADMIN can modify follow-up config
    if (session.user.role !== "ADMIN") {
      return { success: false, error: "Solo administradores pueden modificar la configuración de seguimiento" };
    }

    await prisma.followUpConfig.update({
      where: { stepKey },
      data,
    });

    revalidatePath("/configuracion");
    return { success: true };
  } catch (error) {
    console.error("Error updating follow-up config:", error);
    return { success: false, error: "Error al actualizar la configuración" };
  }
}

export async function resetFollowUpDefaults(): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    if (session.user.role !== "ADMIN") {
      return { success: false, error: "Solo administradores pueden restablecer la configuración" };
    }

    const defaults = [
      { stepKey: "CONFIRMACION", label: "Seguimiento de Confirmación", dayOffset: 0, hourOffset: 4, sortOrder: 1 },
      { stepKey: "CORTO", label: "Seguimiento corto", dayOffset: 1, hourOffset: 0, sortOrder: 2 },
      { stepKey: "VALOR", label: "Seguimiento de valor", dayOffset: 3, hourOffset: 0, sortOrder: 3 },
      { stepKey: "URGENCIA", label: "Seguimiento de urgencia", dayOffset: 5, hourOffset: 0, sortOrder: 4 },
      { stepKey: "CIERRE", label: "Seguimiento de cierre", dayOffset: 7, hourOffset: 0, sortOrder: 5 },
      { stepKey: "FINAL", label: "Seguimiento final", dayOffset: 14, hourOffset: 0, sortOrder: 6 },
    ];

    for (const d of defaults) {
      await prisma.followUpConfig.upsert({
        where: { stepKey: d.stepKey },
        update: { label: d.label, dayOffset: d.dayOffset, hourOffset: d.hourOffset, sortOrder: d.sortOrder, isActive: true },
        create: { ...d, isActive: true },
      });
    }

    revalidatePath("/configuracion");
    return { success: true };
  } catch (error) {
    console.error("Error resetting follow-up defaults:", error);
    return { success: false, error: "Error al restablecer valores por defecto" };
  }
}
