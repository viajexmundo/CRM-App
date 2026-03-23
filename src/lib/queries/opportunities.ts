import { prisma } from "@/lib/prisma";
import {
  PIPELINE_STAGE_ORDER,
  PIPELINE_STAGE_CONFIG,
} from "@/lib/constants/pipeline";
import type { PipelineStage } from "@/types";

export interface GetOpportunitiesParams {
  search?: string;
  stage?: string;
  assignedToId?: string;
  contactId?: string;
  viewerId?: string;
  viewerRole?: string;
  page?: number;
  limit?: number;
}

export async function getOpportunities(params: GetOpportunitiesParams = {}) {
  const {
    search,
    stage,
    assignedToId,
    contactId,
    viewerId,
    viewerRole,
    page = 1,
    limit = 20,
  } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  const isAdmin = viewerRole === "ADMIN";

  if (!isAdmin) {
    if (!viewerId) {
      where.id = "__no_access__";
    } else {
      where.assignedToId = viewerId;
    }
  }

  if (stage) {
    where.stage = stage;
  }

  if (assignedToId && isAdmin) {
    where.assignedToId = assignedToId;
  }

  if (contactId) {
    where.contactId = contactId;
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { contact: { firstName: { contains: search } } },
      { contact: { lastName: { contains: search } } },
      { destination: { contains: search } },
    ];
  }

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, phone: true },
        },
        _count: {
          select: {
            cases: true,
            tasks: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.opportunity.count({ where }),
  ]);

  return {
    opportunities,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOpportunitiesByStage(viewer?: {
  id?: string;
  role?: string;
}) {
  const isAdmin = viewer?.role === "ADMIN";
  const opportunities = await prisma.opportunity.findMany({
    where: {
      stage: {
        not: "CERRADO_PERDIDO",
      },
      ...(isAdmin ? {} : { assignedToId: viewer?.id ?? "__no_access__" }),
    },
    include: {
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      assignedTo: {
        select: { id: true, name: true, email: true, phone: true, role: true },
      },
      activities: {
        select: {
          id: true,
          type: true,
          title: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      followUps: {
        where: { status: "PENDING" },
        select: {
          id: true,
          label: true,
          scheduledAt: true,
        },
        orderBy: { scheduledAt: "asc" },
      },
      actions: {
        where: { status: "PENDING" },
        select: {
          id: true,
          type: true,
          action: true,
          scheduledAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { cases: true },
      },
    },
    orderBy: { stageChangedAt: "asc" },
  });

  const grouped: Record<
    PipelineStage,
    {
      stage: PipelineStage;
      label: string;
      color: string;
      opportunities: typeof opportunities;
      count: number;
      totalValue: number;
    }
  > = {} as typeof grouped;

  for (const stage of PIPELINE_STAGE_ORDER) {
    const config = PIPELINE_STAGE_CONFIG[stage];
    grouped[stage] = {
      stage,
      label: config.label,
      color: config.color,
      opportunities: [],
      count: 0,
      totalValue: 0,
    };
  }

  for (const opp of opportunities) {
    const stage = opp.stage as PipelineStage;
    if (grouped[stage]) {
      grouped[stage].opportunities.push(opp);
      grouped[stage].count += 1;
      grouped[stage].totalValue += opp.estimatedValue;
    }
  }

  return grouped;
}

export async function getOpportunity(
  id: string,
  viewer?: { id?: string; role?: string }
) {
  const isAdmin = viewer?.role === "ADMIN";
  const opportunity = await prisma.opportunity.findFirst({
    where: {
      id,
      ...(isAdmin ? {} : { assignedToId: viewer?.id ?? "__no_access__" }),
    },
    include: {
      contact: true,
      lead: true,
      assignedTo: {
        select: { id: true, name: true, email: true, phone: true, role: true },
      },
      bookings: {
        include: {
          tickets: true,
        },
        orderBy: { createdAt: "desc" },
      },
      cases: {
        include: {
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      activities: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      stageHistory: {
        orderBy: { createdAt: "desc" },
      },
      tasks: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: "asc" },
      },
      followUps: {
        orderBy: { scheduledAt: "asc" },
      },
      actions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return opportunity;
}

export async function getOpportunityCount() {
  return prisma.opportunity.count();
}

export async function getFollowUpConfigs() {
  return prisma.followUpConfig.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function getPipelineValue() {
  const grouped = await prisma.opportunity.groupBy({
    by: ["stage"],
    where: {
      stage: {
        notIn: ["CERRADO_PERDIDO", "CLIENTE_GANADO"],
      },
    },
    _count: { _all: true },
    _sum: { estimatedValue: true },
  });

  const byStage: Record<string, { count: number; totalValue: number; weightedValue: number }> = {};

  for (const row of grouped) {
    const stage = row.stage as PipelineStage;
    const config = PIPELINE_STAGE_CONFIG[stage];
    if (!config) continue;
    const totalValue = row._sum.estimatedValue ?? 0;

    byStage[stage] = {
      count: row._count._all,
      totalValue,
      weightedValue: totalValue * (config.probability / 100),
    };
  }

  const totalWeightedValue = Object.values(byStage).reduce(
    (sum, s) => sum + s.weightedValue,
    0
  );

  return {
    byStage,
    totalWeightedValue,
  };
}
