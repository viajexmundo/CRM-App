import { prisma } from "@/lib/prisma";

export async function getTemplates() {
  return prisma.template.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function getAssignmentTemplates() {
  return prisma.template.findMany({
    where: {
      isActive: true,
      channel: "WHATSAPP",
      purpose: "ASSIGNMENT_NOTIFICATION",
    },
    orderBy: [{ stage: "asc" }, { targetRole: "asc" }, { name: "asc" }],
  });
}
