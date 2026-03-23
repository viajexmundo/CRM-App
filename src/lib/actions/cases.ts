"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

interface ActionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

const caseCreateSchema = z.object({
  opportunityId: z.string().optional().nullable(),
  contactId: z.string().min(1, "El contacto es obligatorio"),
  assignedToId: z.string().min(1, "El agente asignado es obligatorio"),
  type: z
    .enum([
      "GENERAL",
      "COMPLAINT",
      "CHANGE_REQUEST",
      "CANCELLATION",
      "REFUND",
      "EMERGENCY",
      "FEEDBACK",
    ])
    .default("GENERAL"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  subject: z
    .string()
    .min(1, "El asunto es obligatorio")
    .max(300, "El asunto no puede exceder 300 caracteres"),
  description: z.string().min(1, "La descripción es obligatoria"),
});

const caseUpdateSchema = z.object({
  assignedToId: z.string().min(1).optional(),
  type: z
    .enum([
      "GENERAL",
      "COMPLAINT",
      "CHANGE_REQUEST",
      "CANCELLATION",
      "REFUND",
      "EMERGENCY",
      "FEEDBACK",
    ])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z
    .enum([
      "OPEN",
      "IN_PROGRESS",
      "WAITING_CLIENT",
      "WAITING_SUPPLIER",
      "RESOLVED",
      "CLOSED",
    ])
    .optional(),
  subject: z.string().min(1).max(300).optional(),
  description: z.string().min(1).optional(),
});

/**
 * Calculate SLA deadline based on priority.
 * URGENT: 4 hours, HIGH: 8 hours, MEDIUM: 24 hours, LOW: 48 hours
 */
function calculateSlaDeadline(
  priority: string,
  from: Date = new Date()
): { slaHours: number; slaDeadline: Date } {
  const slaMap: Record<string, number> = {
    URGENT: 4,
    HIGH: 8,
    MEDIUM: 24,
    LOW: 48,
  };

  const slaHours = slaMap[priority] ?? 24;
  const slaDeadline = new Date(from.getTime() + slaHours * 60 * 60 * 1000);

  return { slaHours, slaDeadline };
}

export async function createCase(formData: unknown): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const parsed = caseCreateSchema.safeParse(formData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Datos inválidos" };
    }

    const data = parsed.data;

    // Verify contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: data.contactId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!contact) {
      return { success: false, error: "Contacto no encontrado" };
    }

    const { slaHours, slaDeadline } = calculateSlaDeadline(data.priority);

    const caseRecord = await prisma.case.create({
      data: {
        opportunityId: data.opportunityId ?? null,
        contactId: data.contactId,
        assignedToId: data.assignedToId,
        type: data.type,
        priority: data.priority,
        status: "OPEN",
        subject: data.subject,
        description: data.description,
        slaHours,
        slaDeadline,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "SYSTEM",
        description: `Caso creado: ${data.subject} (Prioridad: ${data.priority})`,
        userId: session.user.id,
        contactId: data.contactId,
        opportunityId: data.opportunityId ?? undefined,
        caseId: caseRecord.id,
      },
    });

    revalidatePath("/casos");

    return { success: true, data: { id: caseRecord.id } };
  } catch (error) {
    console.error("Error creating case:", error);
    return { success: false, error: "Error al crear el caso" };
  }
}

export async function updateCase(
  id: string,
  formData: unknown
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const parsed = caseUpdateSchema.safeParse(formData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Datos inválidos" };
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = { ...data };

    // Recalculate SLA if priority changed
    if (data.priority) {
      const existing = await prisma.case.findUnique({
        where: { id },
        select: { createdAt: true },
      });
      if (existing) {
        const { slaHours, slaDeadline } = calculateSlaDeadline(
          data.priority,
          existing.createdAt
        );
        updateData.slaHours = slaHours;
        updateData.slaDeadline = slaDeadline;
      }
    }

    await prisma.case.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/casos");
    revalidatePath(`/casos/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating case:", error);
    return { success: false, error: "Error al actualizar el caso" };
  }
}

export async function resolveCase(
  id: string,
  resolution: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    if (!resolution || resolution.trim().length === 0) {
      return {
        success: false,
        error: "Debe proporcionar una resolución",
      };
    }

    const caseRecord = await prisma.case.findUnique({
      where: { id },
      select: {
        id: true,
        subject: true,
        contactId: true,
        opportunityId: true,
        slaDeadline: true,
      },
    });

    if (!caseRecord) {
      return { success: false, error: "Caso no encontrado" };
    }

    const now = new Date();
    const slaBreached = caseRecord.slaDeadline < now;

    await prisma.case.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolution,
        resolvedAt: now,
        slaBreached,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "SYSTEM",
        description: `Caso resuelto: ${caseRecord.subject}${slaBreached ? " (SLA excedido)" : ""}`,
        userId: session.user.id,
        contactId: caseRecord.contactId,
        opportunityId: caseRecord.opportunityId ?? undefined,
        caseId: id,
      },
    });

    revalidatePath("/casos");
    revalidatePath(`/casos/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error resolving case:", error);
    return { success: false, error: "Error al resolver el caso" };
  }
}

export async function closeCase(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const caseRecord = await prisma.case.findUnique({
      where: { id },
      select: {
        id: true,
        subject: true,
        status: true,
        contactId: true,
        opportunityId: true,
      },
    });

    if (!caseRecord) {
      return { success: false, error: "Caso no encontrado" };
    }

    if (caseRecord.status !== "RESOLVED") {
      return {
        success: false,
        error: "Solo se pueden cerrar casos que ya fueron resueltos",
      };
    }

    await prisma.case.update({
      where: { id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "SYSTEM",
        description: `Caso cerrado: ${caseRecord.subject}`,
        userId: session.user.id,
        contactId: caseRecord.contactId,
        opportunityId: caseRecord.opportunityId ?? undefined,
        caseId: id,
      },
    });

    revalidatePath("/casos");
    revalidatePath(`/casos/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error closing case:", error);
    return { success: false, error: "Error al cerrar el caso" };
  }
}
