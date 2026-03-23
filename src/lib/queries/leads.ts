import { prisma } from "@/lib/prisma";

export interface GetLeadsParams {
  search?: string;
  status?: string;
  assignedToId?: string;
  source?: string;
  viewerId?: string;
  viewerRole?: string;
  page?: number;
  limit?: number;
}

export async function getLeads(params: GetLeadsParams = {}) {
  const {
    search,
    status,
    assignedToId,
    source,
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

  if (status) {
    where.status = status;
  }

  if (assignedToId && isAdmin) {
    where.assignedToId = assignedToId;
  }

  if (source) {
    where.source = source;
  }

  if (search) {
    where.OR = [
      { contact: { firstName: { contains: search } } },
      { contact: { lastName: { contains: search } } },
      { contact: { email: { contains: search } } },
      { destination: { contains: search } },
      { interest: { contains: search } },
    ];
  }

  const [rawLeads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            type: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { opportunities: true },
        },
        opportunities: {
          select: { id: true, stage: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  const leads = rawLeads.map((lead) => ({
    ...lead,
    currentOpportunityId: lead.opportunities[0]?.id ?? null,
    currentOpportunityStage: lead.opportunities[0]?.stage ?? null,
    hasOpportunity: lead._count.opportunities > 0,
  }));

  return {
    leads,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getLead(
  id: string,
  viewer?: { id?: string; role?: string }
) {
  const isAdmin = viewer?.role === "ADMIN";
  const lead = await prisma.lead.findFirst({
    where: {
      id,
      ...(isAdmin ? {} : { assignedToId: viewer?.id ?? "__no_access__" }),
    },
    include: {
      contact: true,
      assignedTo: {
        select: { id: true, name: true, email: true, role: true },
      },
      opportunities: {
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
        take: 50,
      },
    },
  });

  return lead;
}

export async function getLeadCount() {
  return prisma.lead.count();
}
