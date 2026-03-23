"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/actions/resolve-user";

interface ActionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export async function createTemplate(data: {
  name: string;
  category: string;
  purpose?: string;
  stage?: string | null;
  targetRole?: string | null;
  body: string;
}): Promise<ActionResult> {
  try {
    const resolved = await resolveCurrentUser();
    if (resolved.error) {
      return { success: false, error: resolved.error };
    }
    const currentUserId = resolved.userId!;

    if (!data.name.trim() || !data.body.trim()) {
      return { success: false, error: "Nombre y mensaje son requeridos" };
    }

    // Extract variables from template body (e.g., {nombre}, {destino})
    const variables = Array.from(data.body.matchAll(/\{(\w+)\}/g)).map(
      (m) => m[1]
    );

    const template = await prisma.template.create({
      data: {
        name: data.name.trim(),
        channel: "WHATSAPP",
        category: data.category || "GENERAL",
        purpose: data.purpose || "GENERAL",
        stage: data.stage || null,
        targetRole: data.targetRole || null,
        body: data.body.trim(),
        variables: JSON.stringify([...new Set(variables)]),
        createdBy: currentUserId,
      },
    });

    revalidatePath("/plantillas");

    return { success: true, data: { id: template.id } };
  } catch (error) {
    console.error("Error creating template:", error);
    return { success: false, error: "Error al crear la plantilla" };
  }
}

export async function updateTemplate(
  id: string,
  data: {
    name?: string;
    category?: string;
    purpose?: string;
    stage?: string | null;
    targetRole?: string | null;
    body?: string;
    isActive?: boolean;
  }
): Promise<ActionResult> {
  try {
    const resolved = await resolveCurrentUser();
    if (resolved.error) {
      return { success: false, error: resolved.error };
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.category !== undefined) updateData.category = data.category;
    if (data.purpose !== undefined) updateData.purpose = data.purpose;
    if (data.stage !== undefined) updateData.stage = data.stage || null;
    if (data.targetRole !== undefined) updateData.targetRole = data.targetRole || null;
    if (data.body !== undefined) {
      updateData.body = data.body.trim();
      // Re-extract variables
      const variables = Array.from(data.body.matchAll(/\{(\w+)\}/g)).map(
        (m) => m[1]
      );
      updateData.variables = JSON.stringify([...new Set(variables)]);
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.template.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/plantillas");

    return { success: true };
  } catch (error) {
    console.error("Error updating template:", error);
    return { success: false, error: "Error al actualizar la plantilla" };
  }
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  try {
    const resolved = await resolveCurrentUser();
    if (resolved.error) {
      return { success: false, error: resolved.error };
    }

    await prisma.template.delete({
      where: { id },
    });

    revalidatePath("/plantillas");

    return { success: true };
  } catch (error) {
    console.error("Error deleting template:", error);
    return { success: false, error: "Error al eliminar la plantilla" };
  }
}
