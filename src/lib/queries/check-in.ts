import { prisma } from "@/lib/prisma";

const DEFAULT_CHECK_IN_TEMPLATES = [
  "Revisar agenda de hoy y confirmar horarios",
  "Priorizar seguimientos vencidos",
  "Actualizar 3 oportunidades clave",
  "Enviar al menos 2 propuestas o avances",
  "Registrar notas y próximos pasos antes de cerrar día",
];
let ensureDefaultTemplatesPromise: Promise<void> | null = null;

function startOfTodayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function endOfTodayLocal() {
  const start = startOfTodayLocal();
  return new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59, 999);
}

export async function getCheckInTemplates() {
  await ensureDefaultCheckInTemplates();
  return prisma.checkInTemplate.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function ensureTodayCheckInItems(userId: string) {
  await ensureDefaultCheckInTemplates();
  const dayStart = startOfTodayLocal();
  const dayEnd = endOfTodayLocal();

  const [templates, existing] = await Promise.all([
    prisma.checkInTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.checkInItem.findMany({
      where: {
        userId,
        date: { gte: dayStart, lte: dayEnd },
      },
      select: { id: true, title: true },
    }),
  ]);

  const existingTitles = new Set(existing.map((item) => item.title.trim().toLowerCase()));
  const missing = templates.filter(
    (template) => !existingTitles.has(template.title.trim().toLowerCase())
  );

  if (missing.length > 0) {
    await prisma.checkInItem.createMany({
      data: missing.map((template) => ({
        userId,
        date: dayStart,
        title: template.title,
        source: "TEMPLATE",
        templateId: template.id,
        sortOrder: template.sortOrder,
      })),
      skipDuplicates: true,
    });
  }
}

async function ensureDefaultCheckInTemplates() {
  if (!ensureDefaultTemplatesPromise) {
    ensureDefaultTemplatesPromise = (async () => {
      const count = await prisma.checkInTemplate.count();
      if (count > 0) return;

      await prisma.checkInTemplate.createMany({
        data: DEFAULT_CHECK_IN_TEMPLATES.map((title, index) => ({
          title,
          sortOrder: index + 1,
          isActive: true,
          isDefault: true,
        })),
      });
    })().catch((error) => {
      ensureDefaultTemplatesPromise = null;
      throw error;
    });
  }

  await ensureDefaultTemplatesPromise;
}

export async function getTodayCheckIn(userId: string) {
  await ensureTodayCheckInItems(userId);

  const dayStart = startOfTodayLocal();
  const dayEnd = endOfTodayLocal();

  const items = await prisma.checkInItem.findMany({
    where: {
      userId,
      date: { gte: dayStart, lte: dayEnd },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const completed = items.filter((item) => item.isCompleted).length;

  return {
    date: dayStart,
    items,
    total: items.length,
    completed,
    pending: items.length - completed,
  };
}
