import { prisma } from "@/lib/prisma";
import {
  PIPELINE_STAGE_CONFIG,
  PIPELINE_STAGE_ORDER,
} from "@/lib/constants/pipeline";

type ViewerScope = { id?: string; role?: string };

function getOpportunityScope(viewer?: ViewerScope) {
  if (viewer?.role === "ADMIN") return {};
  return { assignedToId: viewer?.id ?? "__no_access__" };
}

export async function getDashboardStats() {
  const [
    totalContacts,
    totalLeads,
    totalOpportunities,
    openCases,
    wonOpportunities,
    conversionData,
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.lead.count(),
    prisma.opportunity.count({
      where: { stage: { notIn: ["CLIENTE_GANADO", "CERRADO_PERDIDO", "DORMIDO"] } },
    }),
    prisma.case.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "WAITING_SUPPLIER"] } },
    }),
    prisma.opportunity.count({
      where: { stage: "CLIENTE_GANADO" },
    }),
    Promise.all([
      prisma.lead.count({
        where: { status: { in: ["NUEVO", "CONTACTADO", "CALIFICADO", "CONVERTIDO"] } },
      }),
      prisma.lead.count({ where: { status: "CONVERTIDO" } }),
    ]),
  ]);

  const [totalConvertable, converted] = conversionData;
  const conversionRate =
    totalConvertable > 0 ? Math.round((converted / totalConvertable) * 100) : 0;

  return {
    totalContacts,
    totalLeads,
    totalOpportunities,
    openCases,
    wonOpportunities,
    conversionRate,
  };
}

export async function getRecentActivities(
  limit: number = 20,
  viewer?: ViewerScope
) {
  const isAdmin = viewer?.role === "ADMIN";
  const activities = await prisma.activity.findMany({
    where: isAdmin
      ? undefined
      : {
          OR: [
            { userId: viewer?.id ?? "__no_access__" },
            { opportunity: { assignedToId: viewer?.id ?? "__no_access__" } },
            { lead: { assignedToId: viewer?.id ?? "__no_access__" } },
          ],
        },
    include: {
      user: { select: { id: true, name: true } },
      contact: {
        select: { id: true, firstName: true, lastName: true },
      },
      lead: {
        select: { id: true, destination: true },
      },
      opportunity: {
        select: { id: true, title: true },
      },
      case: {
        select: { id: true, subject: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return activities;
}

export async function getUpcomingTasks(userId: string, limit: number = 10) {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      dueDate: { gte: new Date() },
    },
    include: {
      opportunity: {
        select: { id: true, title: true },
      },
    },
    orderBy: { dueDate: "asc" },
    take: limit,
  });

  return tasks;
}

export async function getPipelineSummary() {
  const grouped = await prisma.opportunity.groupBy({
    by: ["stage"],
    _count: { _all: true },
    _sum: { estimatedValue: true },
  });

  const byStage = new Map(
    grouped.map((row) => [
      row.stage,
      {
        count: row._count._all,
        totalValue: row._sum.estimatedValue ?? 0,
      },
    ])
  );

  const summary = PIPELINE_STAGE_ORDER.map((stage) => {
    const config = PIPELINE_STAGE_CONFIG[stage];
    const found = byStage.get(stage) ?? { count: 0, totalValue: 0 };
    const totalValue = found.totalValue;

    return {
      stage,
      label: config.label,
      color: config.color,
      count: found.count,
      totalValue,
      weightedValue: totalValue * (config.probability / 100),
    };
  });

  return summary;
}

// ==================== UPCOMING SCHEDULED ACTIONS ====================

export interface UpcomingAction {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  contactName: string;
  action: string;
  type: string | null;
  channel: string | null;
  scheduledAt: Date;
  isOverdue: boolean;
}

/**
 * Returns upcoming scheduled actions (nextStepDate) from opportunities.
 * Shows actions from active pipeline stages ordered by date.
 */
export async function getUpcomingActions(
  limit: number = 10,
  viewer?: ViewerScope
): Promise<UpcomingAction[]> {
  const now = new Date();

  const opportunityScope = getOpportunityScope(viewer);

  const opportunities = await prisma.opportunity.findMany({
    where: {
      nextStepDate: { not: null },
      stage: {
        notIn: ["CLIENTE_GANADO", "CERRADO_PERDIDO"],
      },
      ...opportunityScope,
    },
    include: {
      contact: { select: { firstName: true, lastName: true } },
    },
    orderBy: { nextStepDate: "asc" },
    take: limit + 10, // Fetch a bit more to filter
  });

  return opportunities
    .filter((opp) => opp.nextStepDate != null)
    .slice(0, limit)
    .map((opp) => ({
      id: opp.id,
      opportunityId: opp.id,
      opportunityTitle: opp.title,
      contactName: `${opp.contact.firstName} ${opp.contact.lastName}`,
      action: opp.nextStepAction ?? "Acción programada",
      type: opp.nextStepType,
      channel: opp.nextStepChannel,
      scheduledAt: opp.nextStepDate!,
      isOverdue: opp.nextStepDate! < now,
    }));
}

// ==================== ACTION-ORIENTED PENDING ITEMS ====================

export interface PendingAction {
  id: string;
  category: "PERFILAR" | "PROPUESTA" | "SEGUIMIENTO" | "CONTACTAR" | "DORMIDO_REVISAR";
  title: string;
  description: string;
  opportunityId: string;
  opportunityTitle: string;
  contactName: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  staleHours: number;
}

/**
 * Returns action-oriented items the user needs to handle.
 * Categories:
 * - CONTACTAR: Leads nuevos sin contactar (>4hrs)
 * - PERFILAR: Oportunidades en PERFILADO sin diagnóstico (>24hrs)
 * - PROPUESTA: Oportunidades en PROPUESTA_EN_PREPARACION estancadas (>24hrs)
 * - SEGUIMIENTO: Follow-ups vencidos o próximos
 * - DORMIDO_REVISAR: Oportunidades dormidas por más de 7 días
 */
export async function getPendingActions(viewer?: ViewerScope): Promise<PendingAction[]> {
  const now = new Date();
  const actions: PendingAction[] = [];
  const opportunityScope = getOpportunityScope(viewer);

  const [
    newLeads,
    perfiladoOpps,
    propuestaOpps,
    overdueFollowUps,
    dormidos,
  ] = await Promise.all([
    prisma.opportunity.findMany({
      where: {
        stage: "LEAD_NUEVO",
        ...opportunityScope,
      },
      include: {
        contact: { select: { firstName: true, lastName: true } },
      },
      orderBy: { stageChangedAt: "asc" },
    }),
    prisma.opportunity.findMany({
      where: {
        stage: "PERFILADO",
        ...opportunityScope,
      },
      include: {
        contact: { select: { firstName: true, lastName: true } },
      },
      orderBy: { stageChangedAt: "asc" },
    }),
    prisma.opportunity.findMany({
      where: {
        stage: "PROPUESTA_EN_PREPARACION",
        ...opportunityScope,
      },
      include: {
        contact: { select: { firstName: true, lastName: true } },
      },
      orderBy: { stageChangedAt: "asc" },
    }),
    prisma.followUp.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lt: now },
        opportunity: opportunityScope,
      },
      include: {
        opportunity: {
          include: {
            contact: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.opportunity.findMany({
      where: {
        stage: "DORMIDO",
        ...opportunityScope,
      },
      include: {
        contact: { select: { firstName: true, lastName: true } },
      },
      orderBy: { stageChangedAt: "asc" },
    }),
  ]);

  // 1. Leads nuevos sin contactar — stale >4hrs
  for (const opp of newLeads) {
    const staleMs = now.getTime() - new Date(opp.stageChangedAt).getTime();
    const staleHours = Math.floor(staleMs / (1000 * 60 * 60));
    if (staleHours >= 4) {
      actions.push({
        id: `contactar-${opp.id}`,
        category: "CONTACTAR",
        title: `Contactar a ${opp.contact.firstName} ${opp.contact.lastName}`,
        description: staleHours >= 24
          ? `Lleva ${Math.floor(staleHours / 24)} día(s) sin contactar`
          : `Lleva ${staleHours} horas sin contactar`,
        opportunityId: opp.id,
        opportunityTitle: opp.title,
        contactName: `${opp.contact.firstName} ${opp.contact.lastName}`,
        urgency: staleHours >= 48 ? "HIGH" : staleHours >= 24 ? "MEDIUM" : "LOW",
        staleHours,
      });
    }
  }

  // 2. PERFILADO sin diagnóstico — need to complete questionnaire
  for (const opp of perfiladoOpps) {
    const staleMs = now.getTime() - new Date(opp.stageChangedAt).getTime();
    const staleHours = Math.floor(staleMs / (1000 * 60 * 60));
    const hasDiagnosis = opp.diagnosisScore != null && opp.diagnosisScore > 0;
    if (!hasDiagnosis) {
      actions.push({
        id: `perfilar-${opp.id}`,
        category: "PERFILAR",
        title: `Completar diagnóstico de ${opp.contact.firstName} ${opp.contact.lastName}`,
        description: staleHours >= 24
          ? `Lleva ${Math.floor(staleHours / 24)} día(s) sin perfilar`
          : `Lleva ${staleHours} horas en perfilado`,
        opportunityId: opp.id,
        opportunityTitle: opp.title,
        contactName: `${opp.contact.firstName} ${opp.contact.lastName}`,
        urgency: staleHours >= 48 ? "HIGH" : staleHours >= 24 ? "MEDIUM" : "LOW",
        staleHours,
      });
    }
  }

  // 3. PROPUESTA_EN_PREPARACION estancada >24hrs
  for (const opp of propuestaOpps) {
    const staleMs = now.getTime() - new Date(opp.stageChangedAt).getTime();
    const staleHours = Math.floor(staleMs / (1000 * 60 * 60));
    if (staleHours >= 24) {
      actions.push({
        id: `propuesta-${opp.id}`,
        category: "PROPUESTA",
        title: `Preparar propuesta para ${opp.contact.firstName} ${opp.contact.lastName}`,
        description: `Lleva ${Math.floor(staleHours / 24)} día(s) sin enviar cotización`,
        opportunityId: opp.id,
        opportunityTitle: opp.title,
        contactName: `${opp.contact.firstName} ${opp.contact.lastName}`,
        urgency: staleHours >= 72 ? "HIGH" : staleHours >= 48 ? "MEDIUM" : "LOW",
        staleHours,
      });
    }
  }

  // 4. Follow-ups vencidos
  for (const fu of overdueFollowUps) {
    const staleMs = now.getTime() - new Date(fu.scheduledAt).getTime();
    const staleHours = Math.floor(staleMs / (1000 * 60 * 60));
    actions.push({
      id: `seguimiento-${fu.id}`,
      category: "SEGUIMIENTO",
      title: `${fu.label} — ${fu.opportunity.contact.firstName} ${fu.opportunity.contact.lastName}`,
      description: staleHours >= 24
        ? `Vencido hace ${Math.floor(staleHours / 24)} día(s)`
        : `Vencido hace ${staleHours} horas`,
      opportunityId: fu.opportunity.id,
      opportunityTitle: fu.opportunity.title,
      contactName: `${fu.opportunity.contact.firstName} ${fu.opportunity.contact.lastName}`,
      urgency: staleHours >= 48 ? "HIGH" : staleHours >= 24 ? "MEDIUM" : "LOW",
      staleHours,
    });
  }

  // 5. Dormidos por más de 7 días — recordar revisar
  for (const opp of dormidos) {
    const staleMs = now.getTime() - new Date(opp.stageChangedAt).getTime();
    const staleHours = Math.floor(staleMs / (1000 * 60 * 60));
    const staleDays = Math.floor(staleHours / 24);
    if (staleDays >= 7) {
      actions.push({
        id: `dormido-${opp.id}`,
        category: "DORMIDO_REVISAR",
        title: `Revisar dormido: ${opp.contact.firstName} ${opp.contact.lastName}`,
        description: `Lleva ${staleDays} días dormido`,
        opportunityId: opp.id,
        opportunityTitle: opp.title,
        contactName: `${opp.contact.firstName} ${opp.contact.lastName}`,
        urgency: staleDays >= 30 ? "HIGH" : staleDays >= 14 ? "MEDIUM" : "LOW",
        staleHours,
      });
    }
  }

  // Sort by urgency (HIGH first) then by staleHours descending
  const urgencyOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  actions.sort((a, b) => {
    const urgDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgDiff !== 0) return urgDiff;
    return b.staleHours - a.staleHours;
  });

  return actions;
}
