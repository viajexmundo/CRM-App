import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const [
      users,
      contacts,
      leads,
      opportunities,
      stageTransitions,
      followUpConfigs,
      followUps,
      opportunityActions,
      activities,
      tasks,
      cases,
      templates,
      messages,
      documents,
      coachingSessions,
      bookings,
      tickets,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.contact.findMany(),
      prisma.lead.findMany(),
      prisma.opportunity.findMany(),
      prisma.stageTransition.findMany(),
      prisma.followUpConfig.findMany(),
      prisma.followUp.findMany(),
      prisma.opportunityAction.findMany(),
      prisma.activity.findMany(),
      prisma.task.findMany(),
      prisma.case.findMany(),
      prisma.template.findMany(),
      prisma.message.findMany(),
      prisma.document.findMany(),
      prisma.coachingSession.findMany(),
      prisma.booking.findMany(),
      prisma.ticket.findMany(),
    ]);

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        users,
        contacts,
        leads,
        opportunities,
        stageTransitions,
        followUpConfigs,
        followUps,
        opportunityActions,
        activities,
        tasks,
        cases,
        templates,
        messages,
        documents,
        coachingSessions,
        bookings,
        tickets,
      },
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error exporting backup:", error);
    return NextResponse.json(
      { error: "No se pudo exportar la base de datos" },
      { status: 500 }
    );
  }
}
