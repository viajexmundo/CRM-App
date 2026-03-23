import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type JsonRecord = Record<string, unknown>;

function asArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? (value as JsonRecord[]) : [];
}

function withDates<T extends JsonRecord>(rows: T[], fields: string[]) {
  return rows.map((row) => {
    const clone: JsonRecord = { ...row };
    for (const field of fields) {
      const value = clone[field];
      if (value !== null && value !== undefined && value !== "") {
        clone[field] = new Date(String(value));
      } else {
        clone[field] = null;
      }
    }
    return clone;
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      data?: Record<string, unknown>;
    };

    if (!body?.data) {
      return NextResponse.json({ error: "Archivo de respaldo inválido" }, { status: 400 });
    }

    const users = withDates(asArray(body.data.users), ["createdAt", "updatedAt"]);
    const contacts = withDates(asArray(body.data.contacts), ["consentDate", "createdAt", "updatedAt"]);
    const leads = withDates(asArray(body.data.leads), [
      "qualifiedAt",
      "convertedAt",
      "createdAt",
      "updatedAt",
    ]);
    const opportunities = withDates(asArray(body.data.opportunities), [
      "nextStepDate",
      "departureDate",
      "returnDate",
      "closedAt",
      "stageChangedAt",
      "createdAt",
      "updatedAt",
    ]);
    const stageTransitions = withDates(asArray(body.data.stageTransitions), ["createdAt"]);
    const followUpConfigs = withDates(asArray(body.data.followUpConfigs), ["createdAt", "updatedAt"]);
    const followUps = withDates(asArray(body.data.followUps), [
      "scheduledAt",
      "completedAt",
      "createdAt",
      "updatedAt",
    ]);
    const opportunityActions = withDates(asArray(body.data.opportunityActions), [
      "scheduledAt",
      "completedAt",
      "createdAt",
      "updatedAt",
    ]);
    const activities = withDates(asArray(body.data.activities), ["createdAt"]);
    const tasks = withDates(asArray(body.data.tasks), ["dueDate", "completedAt", "createdAt", "updatedAt"]);
    const cases = withDates(asArray(body.data.cases), [
      "slaDeadline",
      "resolvedAt",
      "closedAt",
      "createdAt",
      "updatedAt",
    ]);
    const templates = withDates(asArray(body.data.templates), ["createdAt", "updatedAt"]);
    const messages = withDates(asArray(body.data.messages), ["sentAt", "deliveredAt", "readAt", "createdAt"]);
    const documents = withDates(asArray(body.data.documents), ["createdAt"]);
    const coachingSessions = withDates(asArray(body.data.coachingSessions), [
      "scheduledAt",
      "completedAt",
      "createdAt",
      "updatedAt",
    ]);
    const bookings = withDates(asArray(body.data.bookings), ["checkIn", "checkOut", "createdAt", "updatedAt"]);
    const tickets = withDates(asArray(body.data.tickets), ["issuedAt"]);

    await prisma.$transaction(async (tx) => {
      // Delete in child-to-parent order
      await tx.ticket.deleteMany();
      await tx.booking.deleteMany();
      await tx.followUp.deleteMany();
      await tx.opportunityAction.deleteMany();
      await tx.stageTransition.deleteMany();
      await tx.task.deleteMany();
      await tx.activity.deleteMany();
      await tx.case.deleteMany();
      await tx.opportunity.deleteMany();
      await tx.lead.deleteMany();
      await tx.message.deleteMany();
      await tx.document.deleteMany();
      await tx.coachingSession.deleteMany();
      await tx.template.deleteMany();
      await tx.followUpConfig.deleteMany();
      await tx.contact.deleteMany();
      await tx.user.deleteMany();

      // Insert in parent-to-child order
      if (users.length) await tx.user.createMany({ data: users as any });
      if (contacts.length) await tx.contact.createMany({ data: contacts as any });
      if (leads.length) await tx.lead.createMany({ data: leads as any });
      if (opportunities.length) await tx.opportunity.createMany({ data: opportunities as any });
      if (cases.length) await tx.case.createMany({ data: cases as any });
      if (templates.length) await tx.template.createMany({ data: templates as any });
      if (messages.length) await tx.message.createMany({ data: messages as any });
      if (documents.length) await tx.document.createMany({ data: documents as any });
      if (coachingSessions.length) await tx.coachingSession.createMany({ data: coachingSessions as any });
      if (bookings.length) await tx.booking.createMany({ data: bookings as any });
      if (tickets.length) await tx.ticket.createMany({ data: tickets as any });
      if (followUpConfigs.length) await tx.followUpConfig.createMany({ data: followUpConfigs as any });
      if (stageTransitions.length) await tx.stageTransition.createMany({ data: stageTransitions as any });
      if (opportunityActions.length) await tx.opportunityAction.createMany({ data: opportunityActions as any });
      if (followUps.length) await tx.followUp.createMany({ data: followUps as any });
      if (activities.length) await tx.activity.createMany({ data: activities as any });
      if (tasks.length) await tx.task.createMany({ data: tasks as any });
    });

    return NextResponse.json({
      success: true,
      message: "Importación completada",
      counts: {
        users: users.length,
        contacts: contacts.length,
        leads: leads.length,
        opportunities: opportunities.length,
      },
    });
  } catch (error) {
    console.error("Error importing backup:", error);
    return NextResponse.json(
      { error: "No se pudo importar el respaldo" },
      { status: 500 }
    );
  }
}
