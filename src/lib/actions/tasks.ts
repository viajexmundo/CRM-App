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

const taskCreateSchema = z.object({
  title: z
    .string()
    .min(1, "El título es obligatorio")
    .max(300, "El título no puede exceder 300 caracteres"),
  description: z.string().optional().or(z.literal("")),
  type: z.string().default("FOLLOW_UP"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.coerce.date().optional().nullable(),
  userId: z.string().optional(),
  opportunityId: z.string().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurringRule: z.string().optional().or(z.literal("")),
});

const taskUpdateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().optional().or(z.literal("")),
  type: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  dueDate: z.coerce.date().optional().nullable(),
  userId: z.string().optional(),
  opportunityId: z.string().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurringRule: z.string().optional().or(z.literal("")),
});

export async function createTask(formData: unknown): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const parsed = taskCreateSchema.safeParse(formData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Datos inválidos" };
    }

    const data = parsed.data;

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        type: data.type,
        status: "PENDING",
        priority: data.priority,
        dueDate: data.dueDate ?? null,
        userId: data.userId ?? session.user.id,
        opportunityId: data.opportunityId ?? null,
        isRecurring: data.isRecurring,
        recurringRule: data.recurringRule || null,
      },
    });

    // Log activity if tied to an opportunity
    if (data.opportunityId) {
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: data.opportunityId },
        select: { contactId: true },
      });

      if (opportunity) {
        await prisma.activity.create({
          data: {
            type: "TASK",
            description: `Tarea creada: ${data.title}`,
            userId: session.user.id,
            contactId: opportunity.contactId,
            opportunityId: data.opportunityId,
          },
        });
      }
    }

    revalidatePath("/dashboard");
    if (data.opportunityId) {
      revalidatePath(`/oportunidades/${data.opportunityId}`);
    }

    return { success: true, data: { id: task.id } };
  } catch (error) {
    console.error("Error creating task:", error);
    return { success: false, error: "Error al crear la tarea" };
  }
}

export async function completeTask(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        opportunityId: true,
        opportunity: {
          select: { contactId: true },
        },
      },
    });

    if (!task) {
      return { success: false, error: "Tarea no encontrada" };
    }

    if (task.status === "COMPLETED") {
      return { success: false, error: "Esta tarea ya fue completada" };
    }

    await prisma.task.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Log activity if tied to an opportunity
    if (task.opportunityId && task.opportunity) {
      await prisma.activity.create({
        data: {
          type: "TASK",
          description: `Tarea completada: ${task.title}`,
          userId: session.user.id,
          contactId: task.opportunity.contactId,
          opportunityId: task.opportunityId,
        },
      });
    }

    revalidatePath("/dashboard");
    if (task.opportunityId) {
      revalidatePath(`/oportunidades/${task.opportunityId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error completing task:", error);
    return { success: false, error: "Error al completar la tarea" };
  }
}

export async function updateTask(
  id: string,
  formData: unknown
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const parsed = taskUpdateSchema.safeParse(formData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Datos inválidos" };
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = { ...data };

    // Convert empty strings to null
    for (const key of ["description", "recurringRule"] as const) {
      if (key in updateData && updateData[key] === "") {
        updateData[key] = null;
      }
    }

    // Set completedAt if marking as completed
    if (data.status === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    await prisma.task.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/dashboard");

    // Revalidate opportunity page if task is tied to one
    const task = await prisma.task.findUnique({
      where: { id },
      select: { opportunityId: true },
    });
    if (task?.opportunityId) {
      revalidatePath(`/oportunidades/${task.opportunityId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating task:", error);
    return { success: false, error: "Error al actualizar la tarea" };
  }
}
