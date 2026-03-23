"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  contactCreateSchema,
  contactUpdateSchema,
} from "@/lib/validations/contact";
import { normalizeEmail, normalizePhone } from "@/lib/utils/format";
import { checkDuplicateContact } from "@/lib/queries/contacts";

interface ActionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export async function createContact(formData: unknown): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const parsed = contactCreateSchema.safeParse(formData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Datos inválidos" };
    }

    const data = parsed.data;

    // Normalize and check for duplicates
    const normEmail = data.email ? normalizeEmail(data.email) : null;
    const normPhone = data.phone ? normalizePhone(data.phone) : null;

    const duplicate = await checkDuplicateContact(data.email, data.phone);
    if (duplicate) {
      return {
        success: false,
        error: `Ya existe un contacto con datos similares: ${duplicate.firstName} ${duplicate.lastName} (ID: ${duplicate.id})`,
      };
    }

    const contact = await prisma.contact.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        secondaryPhone: data.secondaryPhone || null,
        type: data.type,
        company: data.company || null,
        position: data.position || null,
        preferredChannel: data.preferredChannel ?? null,
        source: data.source,
        consentStatus: data.consentStatus,
        consentDate: data.consentDate ?? null,
        country: data.country || null,
        timezone: data.timezone || null,
        language: data.language,
        tags: JSON.stringify(data.tags),
        notes: data.notes || null,
        normalizedEmail: normEmail,
        normalizedPhone: normPhone,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "SYSTEM",
        description: `Contacto creado: ${data.firstName} ${data.lastName}`,
        userId: session.user.id,
        contactId: contact.id,
      },
    });

    revalidatePath("/contactos");

    return { success: true, data: { id: contact.id } };
  } catch (error) {
    console.error("Error creating contact:", error);
    return { success: false, error: "Error al crear el contacto" };
  }
}

export async function updateContact(
  id: string,
  formData: unknown
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    const parsed = contactUpdateSchema.safeParse(formData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Datos inválidos" };
    }

    const data = parsed.data;

    // Check for duplicates if email or phone changed
    if (data.email || data.phone) {
      const duplicate = await checkDuplicateContact(
        data.email,
        data.phone,
        id
      );
      if (duplicate) {
        return {
          success: false,
          error: `Ya existe un contacto con datos similares: ${duplicate.firstName} ${duplicate.lastName}`,
        };
      }
    }

    const updateData: Record<string, unknown> = { ...data };

    // Handle normalized fields
    if (data.email !== undefined) {
      updateData.normalizedEmail = data.email
        ? normalizeEmail(data.email)
        : null;
    }
    if (data.phone !== undefined) {
      updateData.normalizedPhone = data.phone
        ? normalizePhone(data.phone)
        : null;
    }

    // Serialize tags if present
    if (data.tags !== undefined) {
      updateData.tags = JSON.stringify(data.tags);
    }

    // Convert empty strings to null for optional fields
    for (const key of [
      "email",
      "phone",
      "secondaryPhone",
      "company",
      "position",
      "country",
      "timezone",
      "notes",
    ] as const) {
      if (key in updateData && updateData[key] === "") {
        updateData[key] = null;
      }
    }

    await prisma.contact.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/contactos");
    revalidatePath(`/contactos/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating contact:", error);
    return { success: false, error: "Error al actualizar el contacto" };
  }
}

export async function deleteContact(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    // Check for related opportunities before deleting
    const opportunityCount = await prisma.opportunity.count({
      where: { contactId: id },
    });

    if (opportunityCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar el contacto porque tiene ${opportunityCount} oportunidad(es) asociada(s). Primero elimine o reasigne las oportunidades.`,
      };
    }

    // Check for related leads
    const leadCount = await prisma.lead.count({
      where: { contactId: id },
    });

    if (leadCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar el contacto porque tiene ${leadCount} lead(s) asociado(s). Primero elimine o reasigne los leads.`,
      };
    }

    await prisma.contact.delete({
      where: { id },
    });

    revalidatePath("/contactos");

    return { success: true };
  } catch (error) {
    console.error("Error deleting contact:", error);
    return { success: false, error: "Error al eliminar el contacto" };
  }
}
