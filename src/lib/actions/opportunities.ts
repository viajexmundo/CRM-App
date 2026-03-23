"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { resolveCurrentUser } from "@/lib/actions/resolve-user";
import {
  opportunityCreateSchema,
  opportunityUpdateSchema,
} from "@/lib/validations/opportunity";
import {
  PIPELINE_STAGE_CONFIG,
  ALLOWED_TRANSITIONS,
  DEFAULT_FOLLOW_UP_STEPS,
  APARTADO_FOLLOW_UP_STEPS,
} from "@/lib/constants/pipeline";
import {
  syncFollowUpCalendarEvent,
  syncOpportunityActionCalendarEvent,
  syncOpportunityCalendar,
} from "@/lib/google-calendar";
import type { PipelineStage } from "@/types";

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

export async function createOpportunity(
  formData: unknown
): Promise<ActionResult> {
  try {
    const resolved = await resolveCurrentUser();
    if (resolved.error) {
      return { success: false, error: resolved.error };
    }
    const currentUserId = resolved.userId!;

    const parsed = opportunityCreateSchema.safeParse(formData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Datos inválidos" };
    }

    const data = parsed.data;
    const initialStage = data.stage || "LEAD_NUEVO";
    const config = PIPELINE_STAGE_CONFIG[initialStage];

    const opportunity = await prisma.opportunity.create({
      data: {
        title: data.title,
        contactId: data.contactId,
        leadId: data.leadId ?? null,
        assignedToId: data.assignedToId,
        stage: initialStage,
        probability: config.probability,
        estimatedValue: data.estimatedValue,
        currency: data.currency,
        nextStepType: data.nextStepType || null,
        nextStepAction: data.nextStepAction || null,
        nextStepDate: data.nextStepDate ?? null,
        nextStepChannel: data.nextStepChannel ?? null,
        segment: data.segment || null,
        travelMotif: data.travelMotif || null,
        destination: data.destination || null,
        departureDate: data.departureDate ?? null,
        returnDate: data.returnDate ?? null,
        passengers: data.passengers ?? null,
        priorities: JSON.stringify(data.priorities),
        restrictions: JSON.stringify(data.restrictions),
        budgetMin: data.budgetMin ?? null,
        budgetMax: data.budgetMax ?? null,
        budgetCurrency: data.budgetCurrency,
        decisionMaker: data.decisionMaker || null,
        decisionCriteria: data.decisionCriteria || null,
        specialRequests: data.specialRequests || null,
      },
    });

    // Create initial stage transition record
    await prisma.stageTransition.create({
      data: {
        opportunityId: opportunity.id,
        fromStage: "",
        toStage: initialStage,
        reason: "Oportunidad creada",
        changedById: currentUserId,
      },
    });

    // Log activity (non-blocking)
    try {
      await prisma.activity.create({
        data: {
          type: "SYSTEM",
          title: "Oportunidad creada",
          description: `Oportunidad creada: ${data.title}`,
          userId: currentUserId,
          contactId: data.contactId,
          opportunityId: opportunity.id,
        },
      });
    } catch (activityError) {
      console.warn("No se pudo registrar la actividad:", activityError);
    }

    revalidatePath("/oportunidades");

    return { success: true, data: { id: opportunity.id } };
  } catch (error) {
    console.error("Error creating opportunity:", error);
    return { success: false, error: "Error al crear la oportunidad" };
  }
}

export async function updateOpportunity(
  id: string,
  formData: unknown
): Promise<ActionResult> {
  try {
    const resolved = await resolveCurrentUser();
    if (resolved.error) {
      return { success: false, error: resolved.error };
    }

    const parsed = opportunityUpdateSchema.safeParse(formData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { success: false, error: firstError?.message ?? "Datos inválidos" };
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = { ...data };

    if (data.assignedToId !== undefined) {
      const assignee = await prisma.user.findUnique({
        where: { id: data.assignedToId },
        select: { id: true },
      });
      if (!assignee) {
        return { success: false, error: "El agente asignado no existe" };
      }
    }

    // Serialize arrays if present
    if (data.priorities !== undefined) {
      updateData.priorities = JSON.stringify(data.priorities);
    }
    if (data.restrictions !== undefined) {
      updateData.restrictions = JSON.stringify(data.restrictions);
    }

    // Convert empty strings to null for optional string fields
    for (const key of [
      "nextStepType",
      "nextStepAction",
      "segment",
      "travelMotif",
      "destination",
      "decisionMaker",
      "decisionCriteria",
      "specialRequests",
      "closeReason",
      "lostReason",
      "diagnosisAnswers",
    ] as const) {
      if (key in updateData && updateData[key] === "") {
        updateData[key] = null;
      }
    }

    const updatedOpportunity = await prisma.opportunity.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        leadId: true,
        stage: true,
      },
    });

    if (data.assignedToId !== undefined) {
      try {
        await syncOpportunityCalendar(id);
      } catch (calendarError) {
        console.warn("No se pudo resincronizar calendario de la oportunidad:", calendarError);
      }
    }

    if (updatedOpportunity.leadId && data.stage) {
      await prisma.lead.update({
        where: { id: updatedOpportunity.leadId },
        data: {
          status: mapPipelineToLeadStatus(updatedOpportunity.stage as PipelineStage),
        },
      });
      revalidatePath("/leads");
      revalidatePath(`/leads/${updatedOpportunity.leadId}`);
    }

    revalidatePath("/oportunidades");
    revalidatePath(`/oportunidades/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating opportunity:", error);
    return { success: false, error: "Error al actualizar la oportunidad" };
  }
}

export async function transitionStage(
  id: string,
  targetStage: PipelineStage,
  reason?: string
): Promise<ActionResult> {
  try {
    const resolved = await resolveCurrentUser();
    if (resolved.error) {
      return { success: false, error: resolved.error };
    }
    const currentUserId = resolved.userId!;

    // Load opportunity
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      return { success: false, error: "Oportunidad no encontrada" };
    }

    const currentStage = opportunity.stage as PipelineStage;

    // Check if transition is allowed
    const allowedTargets = ALLOWED_TRANSITIONS[currentStage];
    if (!allowedTargets || !allowedTargets.includes(targetStage)) {
      const currentLabel = PIPELINE_STAGE_CONFIG[currentStage]?.label ?? currentStage;
      const targetLabel = PIPELINE_STAGE_CONFIG[targetStage]?.label ?? targetStage;
      return {
        success: false,
        error: `No se permite la transición de "${currentLabel}" a "${targetLabel}".`,
      };
    }

    const targetConfig = PIPELINE_STAGE_CONFIG[targetStage];

    // Prepare close fields
    const closeData: Record<string, unknown> = {};
    if (targetStage === "CLIENTE_GANADO" || targetStage === "CERRADO_PERDIDO") {
      closeData.closedAt = new Date();
      if (targetStage === "CERRADO_PERDIDO" && reason) {
        closeData.lostReason = reason;
      }
      if (reason) {
        closeData.closeReason = reason;
      }
    }

    // Update opportunity
    await prisma.opportunity.update({
      where: { id },
      data: {
        stage: targetStage,
        previousStage: currentStage,
        probability: targetConfig.probability,
        stageChangedAt: new Date(),
        ...closeData,
      },
    });

    if (opportunity.leadId) {
      await prisma.lead.update({
        where: { id: opportunity.leadId },
        data: {
          status: mapPipelineToLeadStatus(targetStage),
        },
      });
      revalidatePath("/leads");
      revalidatePath(`/leads/${opportunity.leadId}`);
    }

    // Create stage transition record
    await prisma.stageTransition.create({
      data: {
        opportunityId: id,
        fromStage: currentStage,
        toStage: targetStage,
        reason: reason || null,
        changedById: currentUserId,
      },
    });

    // Log activity (non-blocking — FK errors with stale JWT tokens should not block transitions)
    const fromLabel = PIPELINE_STAGE_CONFIG[currentStage]?.label ?? currentStage;
    const toLabel = targetConfig.label;

    try {
      await prisma.activity.create({
        data: {
          type: "STAGE_CHANGE",
          title: "Cambio de etapa",
          description: `Etapa cambiada de "${fromLabel}" a "${toLabel}"${reason ? `: ${reason}` : ""}`,
          userId: currentUserId,
          contactId: opportunity.contactId,
          opportunityId: id,
        },
      });
    } catch (activityError) {
      console.warn("No se pudo registrar la actividad de cambio de etapa:", activityError);
    }

    // Auto-create follow-up schedule when entering COTIZACION_EN_SEGUIMIENTO or APARTADO
    if (targetStage === "COTIZACION_EN_SEGUIMIENTO") {
      await createFollowUpSchedule(id, "COTIZACION");
    } else if (targetStage === "APARTADO") {
      await createFollowUpSchedule(id, "APARTADO");
    }

    // Clean up pending follow-ups when moving past follow-up stages
    if (
      targetStage !== "COTIZACION_EN_SEGUIMIENTO" &&
      targetStage !== "APARTADO" &&
      (currentStage === "COTIZACION_EN_SEGUIMIENTO" || currentStage === "APARTADO")
    ) {
      await prisma.followUp.updateMany({
        where: {
          opportunityId: id,
          status: "PENDING",
        },
        data: {
          status: "SKIPPED",
          notes: "Omitido automáticamente al cambiar de etapa",
        },
      });

      try {
        await syncOpportunityCalendar(id);
      } catch (calendarError) {
        console.warn("No se pudo limpiar calendario tras cambio de etapa:", calendarError);
      }
    }

    revalidatePath("/oportunidades");
    revalidatePath(`/oportunidades/${id}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error transitioning stage:", error);
    return { success: false, error: "Error al cambiar la etapa" };
  }
}

/**
 * Creates follow-up schedule entries for an opportunity.
 * - "COTIZACION" uses the full 6-step schedule
 * - "APARTADO" uses a shorter 2-step schedule about reservations
 */
async function createFollowUpSchedule(
  opportunityId: string,
  type: "COTIZACION" | "APARTADO" = "COTIZACION"
) {
  const now = new Date();

  let steps: Array<{ stepKey: string; label: string; dayOffset: number; hourOffset: number }>;

  if (type === "APARTADO") {
    steps = APARTADO_FOLLOW_UP_STEPS.map((s) => ({
      stepKey: s.key,
      label: s.label,
      dayOffset: s.defaultDayOffset,
      hourOffset: s.defaultHourOffset,
    }));
  } else {
    // Try to get admin-configured intervals
    const configs = await prisma.followUpConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // Use DB configs if available, otherwise use defaults
    steps =
      configs.length > 0
        ? configs.map((c) => ({
            stepKey: c.stepKey,
            label: c.label,
            dayOffset: c.dayOffset,
            hourOffset: c.hourOffset,
          }))
        : DEFAULT_FOLLOW_UP_STEPS.map((s) => ({
            stepKey: s.key,
            label: s.label,
            dayOffset: s.defaultDayOffset,
            hourOffset: s.defaultHourOffset,
          }));
  }

  // Delete any existing follow-ups for this opportunity (in case of re-entry)
  const existingPending = await prisma.followUp.findMany({
    where: {
      opportunityId,
      status: "PENDING",
    },
    select: { id: true },
  });
  for (const pending of existingPending) {
    try {
      await prisma.followUp.update({
        where: { id: pending.id },
        data: { status: "SKIPPED", notes: "Reprogramado automáticamente" },
      });
      await syncFollowUpCalendarEvent(pending.id);
    } catch (calendarError) {
      console.warn("No se pudo limpiar evento calendario de seguimiento:", calendarError);
    }
  }
  if (existingPending.length > 0) {
    await prisma.followUp.deleteMany({
      where: {
        id: {
          in: existingPending.map((item) => item.id),
        },
      },
    });
  }

  // Create follow-up entries
  for (const step of steps) {
    const scheduledAt = new Date(now);
    scheduledAt.setDate(scheduledAt.getDate() + step.dayOffset);
    scheduledAt.setHours(scheduledAt.getHours() + step.hourOffset);

    const created = await prisma.followUp.create({
      data: {
        opportunityId,
        stepKey: step.stepKey,
        label: step.label,
        scheduledAt,
        status: "PENDING",
      },
    });

    try {
      await syncFollowUpCalendarEvent(created.id);
    } catch (calendarError) {
      console.warn("No se pudo sincronizar seguimiento a calendario:", calendarError);
    }
  }
}

export async function completeFollowUp(
  followUpId: string,
  notes?: string
): Promise<ActionResult> {
  try {
    const resolved = await resolveCurrentUser();
    if (resolved.error) {
      return { success: false, error: resolved.error };
    }
    const currentUserId = resolved.userId!;

    const followUp = await prisma.followUp.findUnique({
      where: { id: followUpId },
      include: { opportunity: { select: { id: true, contactId: true } } },
    });

    if (!followUp) {
      return { success: false, error: "Seguimiento no encontrado" };
    }

    await prisma.followUp.update({
      where: { id: followUpId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        completedById: currentUserId,
        notes: notes || null,
      },
    });

    try {
      await syncFollowUpCalendarEvent(followUpId);
    } catch (calendarError) {
      console.warn("No se pudo actualizar calendario al completar seguimiento:", calendarError);
    }

    // Log activity (non-blocking — FK errors should not block the follow-up completion)
    try {
      await prisma.activity.create({
        data: {
          type: "NOTE",
          title: `${followUp.label} completado`,
          description: notes || `Se completó: ${followUp.label}`,
          userId: currentUserId,
          contactId: followUp.opportunity.contactId,
          opportunityId: followUp.opportunityId,
        },
      });
    } catch (activityError) {
      console.warn("No se pudo registrar la actividad de seguimiento:", activityError);
    }

    revalidatePath(`/oportunidades/${followUp.opportunityId}`);
    revalidatePath("/oportunidades");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error completing follow-up:", error);
    return { success: false, error: "Error al completar el seguimiento" };
  }
}

export async function skipFollowUp(
  followUpId: string,
  reason?: string
): Promise<ActionResult> {
  try {
    const resolved = await resolveCurrentUser();
    if (resolved.error) {
      return { success: false, error: resolved.error };
    }

    const followUp = await prisma.followUp.findUnique({
      where: { id: followUpId },
    });

    if (!followUp) {
      return { success: false, error: "Seguimiento no encontrado" };
    }

    await prisma.followUp.update({
      where: { id: followUpId },
      data: {
        status: "SKIPPED",
        notes: reason || "Omitido",
      },
    });

    try {
      await syncFollowUpCalendarEvent(followUpId);
    } catch (calendarError) {
      console.warn("No se pudo actualizar calendario al omitir seguimiento:", calendarError);
    }

    revalidatePath(`/oportunidades/${followUp.opportunityId}`);

    return { success: true };
  } catch (error) {
    console.error("Error skipping follow-up:", error);
    return { success: false, error: "Error al omitir el seguimiento" };
  }
}

// ==================== OPPORTUNITY ACTIONS ====================

export async function createAction(
  opportunityId: string,
  data: {
    type: string;
    action: string;
    channel?: string;
    scheduledAt?: Date | string | null;
  }
): Promise<ActionResult> {
  try {
    const resolved = await resolveCurrentUser();
    if (resolved.error) {
      return { success: false, error: resolved.error };
    }

    const createdAction = await prisma.opportunityAction.create({
      data: {
        opportunityId,
        type: data.type,
        action: data.action,
        channel: data.channel || null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt as string) : null,
        status: "PENDING",
      },
    });

    try {
      await syncOpportunityActionCalendarEvent(createdAction.id);
    } catch (calendarError) {
      console.warn("No se pudo sincronizar acción a calendario:", calendarError);
    }

    // Also update the opportunity's nextStep fields (latest action)
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        nextStepType: data.type,
        nextStepAction: data.action,
        nextStepDate: data.scheduledAt ? new Date(data.scheduledAt as string) : null,
        nextStepChannel: data.channel || null,
      },
    });

    revalidatePath(`/oportunidades/${opportunityId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error creating action:", error);
    return { success: false, error: "Error al crear la acción" };
  }
}

export async function completeAction(
  actionId: string,
  notes?: string
): Promise<ActionResult> {
  try {
    const resolved = await resolveCurrentUser();
    if (resolved.error) {
      return { success: false, error: resolved.error };
    }
    const currentUserId = resolved.userId!;

    const action = await prisma.opportunityAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      return { success: false, error: "Acción no encontrada" };
    }

    await prisma.opportunityAction.update({
      where: { id: actionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        completedById: currentUserId,
        notes: notes || null,
      },
    });

    try {
      await syncOpportunityActionCalendarEvent(actionId);
    } catch (calendarError) {
      console.warn("No se pudo actualizar calendario al completar acción:", calendarError);
    }

    // Check if there's a next pending action to set as the opportunity's nextStep
    const nextPending = await prisma.opportunityAction.findFirst({
      where: {
        opportunityId: action.opportunityId,
        status: "PENDING",
      },
      orderBy: { scheduledAt: "asc" },
    });

    if (nextPending) {
      await prisma.opportunity.update({
        where: { id: action.opportunityId },
        data: {
          nextStepType: nextPending.type,
          nextStepAction: nextPending.action,
          nextStepDate: nextPending.scheduledAt,
          nextStepChannel: nextPending.channel,
        },
      });
    } else {
      // Clear next step if no more pending actions
      await prisma.opportunity.update({
        where: { id: action.opportunityId },
        data: {
          nextStepType: null,
          nextStepAction: null,
          nextStepDate: null,
          nextStepChannel: null,
        },
      });
    }

    // Log activity (non-blocking)
    try {
      const opp = await prisma.opportunity.findUnique({
        where: { id: action.opportunityId },
        select: { contactId: true },
      });
      if (opp) {
        await prisma.activity.create({
          data: {
            type: action.type,
            title: `Acción completada: ${action.action}`,
            description: notes || `Se completó: ${action.action}`,
            userId: currentUserId,
            contactId: opp.contactId,
            opportunityId: action.opportunityId,
          },
        });
      }
    } catch (activityError) {
      console.warn("No se pudo registrar la actividad:", activityError);
    }

    revalidatePath(`/oportunidades/${action.opportunityId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error completing action:", error);
    return { success: false, error: "Error al completar la acción" };
  }
}
