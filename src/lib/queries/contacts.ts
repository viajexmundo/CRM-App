import { prisma } from "@/lib/prisma";
import { normalizeEmail, normalizePhone } from "@/lib/utils/format";

export interface GetContactsParams {
  search?: string;
  type?: string;
  source?: string;
  page?: number;
  limit?: number;
}

export async function getContacts(params: GetContactsParams = {}) {
  const { search, type, source, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (type) {
    where.type = type;
  }

  if (source) {
    where.source = source;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { company: { contains: search } },
    ];
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        _count: {
          select: {
            leads: true,
            opportunities: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.contact.count({ where }),
  ]);

  return {
    contacts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getContact(id: string) {
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      leads: {
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      opportunities: {
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
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
      messages: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      documents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return contact;
}

export async function getContactCount() {
  return prisma.contact.count();
}

export async function checkDuplicateContact(
  email?: string | null,
  phone?: string | null,
  excludeId?: string
) {
  const conditions: Record<string, unknown>[] = [];

  if (email) {
    const normalized = normalizeEmail(email);
    conditions.push({ normalizedEmail: normalized });
  }

  if (phone) {
    const normalized = normalizePhone(phone);
    conditions.push({ normalizedPhone: normalized });
  }

  if (conditions.length === 0) {
    return null;
  }

  const where: Record<string, unknown> = {
    OR: conditions,
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  const duplicate = await prisma.contact.findFirst({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  });

  return duplicate;
}
