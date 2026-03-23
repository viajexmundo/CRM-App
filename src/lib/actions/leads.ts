"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/actions/resolve-user";
import { leadCreateSchema, leadUpdateSchema } from "@/lib/validations/lead";
import { PIPELINE_STAGE_CONFIG } from "@/lib/constants/pipeline";
import type { PipelineStage } from "@/types";
import { z } from "zod";

interface ActionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

function mapPipelineToLeadStatus(stage: PipelineStage): "NUEVO" | "CONTACTADO" | "CALIFICADO" | "DESCALIFICADO" {
  if (stage === "LEAD_NUEVO") return "NUEVO";
  if (stage === "PERFILADO") return "CONTACTADO";
  if (stage === "CERRADO_PERDIDO") return "DESCALIFICADO";
  return "CALIFICADO";
}

const createLeadFromContactSchema = z.object({
  contactId: z.string().min(1, "Contacto inválido"),
  source: z
    .enum([
      "REFERRAL",
      "WEBSITE",
      "SOCIAL_MEDIA",
      "PHONE",
      "EMAIL",
      "EVENT",
      "WALK_IN",
      "PARTNER",
      "OTHER",
    ])
    .optional()
    .default("OTHER"),
  assignedToId: z.string().optional().nullable(),
  passengers: z.number().int().min(1).optional().nullable(),
  destination: z.string().max(200).optional().or(z.literal("")),
  travelDateFrom: z.string().optional().or(z.literal("")),
  travelDateTo: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function createLead(formData: unknown): Promise<ActionResult> {
  try {
    const resolved = await resolveCurrentUser();
    if (resolved.error) {
      return { success: false, error: resolved.error };
    }
    const currentUserId = resolved.userId!;

    const fromContactParsed = createLeadFromContactSchema.safeParse(formData);
    if (fromContactParsed.success) {
      const data = fromContactParsed.data;

      // Resolve assignedToId — verify it exists, otherwise fall back to current user
      let assignedToId = currentUserId;
      if (data.assignedToId) {
        const assignee = await prisma.user.findUnique({
          where: { id: data.assignedToId },
          select: { id: true },
        });
        if (assignee) {
          assignedToId = assignee.id;
        }
      }

      const contact = await prisma.contact.findUnique({
        where: { id: data.contactId },
        select: { id: true, firstName: true, lastName: true },
      });

      if (!contact) {
        return { success: false, error: "Contacto no encontrado" };
      }

      const existingOpenLead = await prisma.lead.findFirst({
        where: {
          contactId: data.contactId,
          status: { in: ["NUEVO", "CONTACTADO", "CALIFICADO"] },
        },
        select: { id: true, status: true },
      });

      if (existingOpenLead) {
        return {
          success: false,
          error:
            "Este contacto ya tiene un lead activo. Actualiza el existente o conviértelo a oportunidad.",
        };
      }

      const travelDates =
        data.travelDateFrom || data.travelDateTo
          ? JSON.stringify({
              from: data.travelDateFrom || undefined,
              to: data.travelDateTo || undefined,
              flexible: false,
            })
          : null;

      const lead = await prisma.lead.create({
        data: {
          contactId: data.contactId,
          assignedToId,
          status: "NUEVO",
          source: data.source,
          passengers: data.passengers ?? null,
          destination: data.destination || null,
          travelDates,
          notes: data.notes || null,
        },
      });

      try {
        await prisma.activity.create({
          data: {
            type: "SYSTEM",
            description: `Lead creado para ${contact.firstName} ${contact.lastName}`,
            userId: currentUserId,
            contactId: contact.id,
            leadId: lead.id,
          },
        });
      } catch (activityError) {
        console.warn("No se pudo registrar la actividad:", activityError);
      }

      revalidatePath("/leads");
      revalidatePath("/contactos");
      revalidatePath(`/contactos/${contact.id}`);
      revalidatePath("/dashboard");

      return { success: true, data: { id: lead.id } };
    }

    const parsed = leadCreateSchema.safeParse(formData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Datos inválidos" };
    }

    const data = parsed.data;

    // Split name into firstName + lastName
    const nameParts = data.firstName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    // Resolve assignedToId — verify it exists, otherwise fall back to current user
    let assignedToId = currentUserId;
    if (data.assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: data.assignedToId },
        select: { id: true },
      });
      if (assignee) {
        assignedToId = assignee.id;
      }
    }

    // Build travelDates JSON if provided
    const travelDates =
      data.travelDateFrom || data.travelDateTo
        ? JSON.stringify({
            from: data.travelDateFrom || undefined,
            to: data.travelDateTo || undefined,
            flexible: false,
          })
        : null;

    // Create Contact + Lead in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      const contact = await tx.contact.create({
        data: {
          firstName,
          lastName,
          phone: data.phone,
          passportOrDpi: data.passportOrDpi || null,
          source: data.source,
        },
      });

      const lead = await tx.lead.create({
        data: {
          contactId: contact.id,
          assignedToId,
          status: "NUEVO",
          source: data.source,
          passengers: data.passengers ?? null,
          destination: data.destination || null,
          travelDates,
          notes: data.notes || null,
        },
      });

      return { contact, lead };
    });

    // Log activity (non-blocking)
    try {
      await prisma.activity.create({
        data: {
          type: "SYSTEM",
          description: `Lead creado para ${firstName} ${lastName}`,
          userId: currentUserId,
          contactId: result.contact.id,
          leadId: result.lead.id,
        },
      });
    } catch (activityError) {
      console.warn("No se pudo registrar la actividad:", activityError);
    }

    revalidatePath("/leads");
    revalidatePath("/contactos");
    revalidatePath("/dashboard");

    return { success: true, data: { id: result.lead.id } };
  } catch (error) {
    console.error("Error creating lead:", error);
    return { success: false, error: "Error al crear el lead" };
  }
}

export async function updateLead(
  id: string,
  formData: unknown
): Promise<ActionResult> {
  try {
    const resolved = await resolveCurrentUser();
    if (resolved.error) {
      return { success: false, error: resolved.error };
    }

    const parsed = leadUpdateSchema.safeParse(formData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Datos inválidos" };
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = { ...data };

    if (data.assignedToId !== undefined && data.assignedToId !== null) {
      const assignee = await prisma.user.findUnique({
        where: { id: data.assignedToId },
        select: { id: true },
      });
      if (!assignee) {
        return { success: false, error: "El agente asignado no existe" };
      }
    }

    // Serialize travelDates if present
    if (data.travelDates !== undefined) {
      updateData.travelDates = data.travelDates
        ? JSON.stringify(data.travelDates)
        : null;
    }

    // Handle qualified/converted timestamps
    if (data.status === "CALIFICADO") {
      updateData.qualifiedAt = new Date();
    }
    if (data.status === "CONVERTIDO") {
      updateData.convertedAt = new Date();
    }

    // Convert empty strings to null
    for (const key of [
      "interest",
      "destination",
      "travelMotif",
      "notes",
    ] as const) {
      if (key in updateData && updateData[key] === "") {
        updateData[key] = null;
      }
    }

    await prisma.lead.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating lead:", error);
    return { success: false, error: "Error al actualizar el lead" };
  }
}

export async function convertLeadToOpportunity(
  leadId: string
): Promise<ActionResult> {
  try {
    const resolved = await resolveCurrentUser();
    if (resolved.error) {
      return { success: false, error: resolved.error };
    }
    const currentUserId = resolved.userId!;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        contact: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!lead) {
      return { success: false, error: "Lead no encontrado" };
    }

    const existingOpportunity = await prisma.opportunity.findFirst({
      where: { leadId },
      select: { id: true },
    });

    if (existingOpportunity) {
      return { success: false, error: "Este lead ya fue convertido" };
    }

    if (lead.status === "DESCALIFICADO") {
      return {
        success: false,
        error: "No se puede convertir un lead descalificado",
      };
    }

    const initialStage = "LEAD_NUEVO";
    const config = PIPELINE_STAGE_CONFIG[initialStage];

    // Create opportunity from lead data
    const opportunity = await prisma.opportunity.create({
      data: {
        title: `${lead.destination || "Viaje"} - ${lead.contact.firstName} ${lead.contact.lastName}`,
        contactId: lead.contactId,
        leadId: lead.id,
        assignedToId: lead.assignedToId ?? currentUserId,
        stage: initialStage,
        probability: config.probability,
        estimatedValue: lead.budget ?? 0,
        currency: lead.budgetCurrency,
        destination: lead.destination,
        travelMotif: lead.travelMotif,
        passengers: lead.passengers,
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: mapPipelineToLeadStatus(initialStage),
        convertedAt: new Date(),
      },
    });

    // Create initial stage transition
    await prisma.stageTransition.create({
      data: {
        opportunityId: opportunity.id,
        fromStage: "",
        toStage: initialStage,
        reason: "Conversión desde lead",
        changedById: currentUserId,
      },
    });

    // Log activity on lead
    await prisma.activity.create({
      data: {
        type: "STAGE_CHANGE",
        description: `Lead convertido a oportunidad: ${opportunity.title}`,
        userId: currentUserId,
        contactId: lead.contactId,
        leadId: lead.id,
        opportunityId: opportunity.id,
      },
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/oportunidades");

    return { success: true, data: { opportunityId: opportunity.id } };
  } catch (error) {
    console.error("Error converting lead:", error);
    return { success: false, error: "Error al convertir el lead" };
  }
}
