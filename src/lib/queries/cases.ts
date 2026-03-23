import { prisma } from "@/lib/prisma";

export interface GetCasesParams {
  search?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
  type?: string;
  contactId?: string;
  page?: number;
  limit?: number;
}

export async function getCases(params: GetCasesParams = {}) {
  const {
    search,
    status,
    priority,
    assignedToId,
    type,
    contactId,
    page = 1,
    limit = 20,
  } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (assignedToId) {
    where.assignedToId = assignedToId;
  }

  if (type) {
    where.type = type;
  }

  if (contactId) {
    where.contactId = contactId;
  }

  if (search) {
    where.OR = [
      { subject: { contains: search } },
      { description: { contains: search } },
      { contact: { firstName: { contains: search } } },
      { contact: { lastName: { contains: search } } },
    ];
  }

  const [cases, total] = await Promise.all([
    prisma.case.findMany({
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
          select: { id: true, name: true, email: true },
        },
        opportunity: {
          select: { id: true, title: true },
        },
        _count: {
          select: { activities: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.case.count({ where }),
  ]);

  return {
    cases,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getCase(id: string) {
  const caseRecord = await prisma.case.findUnique({
    where: { id },
    include: {
      contact: true,
      assignedTo: {
        select: { id: true, name: true, email: true, role: true },
      },
      opportunity: {
        select: { id: true, title: true, stage: true },
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

  return caseRecord;
}

export async function getOverdueCases() {
  const now = new Date();

  const cases = await prisma.case.findMany({
    where: {
      status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "WAITING_SUPPLIER"] },
      OR: [
        { slaBreached: true },
        { slaDeadline: { lt: now } },
      ],
    },
    include: {
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      assignedTo: {
        select: { id: true, name: true, email: true },
      },
      opportunity: {
        select: { id: true, title: true },
      },
    },
    orderBy: { slaDeadline: "asc" },
  });

  return cases;
}
