import { prisma } from "@/lib/prisma";

export interface CalendarQueryParams {
  viewerId?: string;
  viewerRole?: string;
  agentId?: string;
  from: Date;
  to: Date;
}

export interface CalendarItem {
  id: string;
  source: "FOLLOW_UP" | "ACTION";
  title: string;
  startAt: Date;
  status: string;
  opportunityId: string;
  opportunityTitle: string;
  contactName: string;
  stage: string;
  assignedToId: string;
  assignedToName: string;
  channel?: string | null;
  meetLink?: string | null;
}

export async function getCalendarItems(params: CalendarQueryParams): Promise<CalendarItem[]> {
  const isAdmin = params.viewerRole === "ADMIN";
  const effectiveAgentId = isAdmin
    ? params.agentId || undefined
    : params.viewerId || "__no_access__";

  const assignedWhere = effectiveAgentId ? { assignedToId: effectiveAgentId } : {};

  const [followUps, actions] = await Promise.all([
    prisma.followUp.findMany({
      where: {
        scheduledAt: {
          gte: params.from,
          lte: params.to,
        },
        opportunity: assignedWhere,
      },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            stage: true,
            assignedToId: true,
            assignedTo: { select: { name: true } },
            contact: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.opportunityAction.findMany({
      where: {
        scheduledAt: {
          gte: params.from,
          lte: params.to,
        },
        opportunity: assignedWhere,
      },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            stage: true,
            assignedToId: true,
            assignedTo: { select: { name: true } },
            contact: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  const mappedFollowUps: CalendarItem[] = followUps.map((fu) => ({
    id: fu.id,
    source: "FOLLOW_UP",
    title: fu.label,
    startAt: fu.scheduledAt,
    status: fu.status,
    opportunityId: fu.opportunity.id,
    opportunityTitle: fu.opportunity.title,
    contactName: `${fu.opportunity.contact.firstName} ${fu.opportunity.contact.lastName}`.trim(),
    stage: fu.opportunity.stage,
    assignedToId: fu.opportunity.assignedToId,
    assignedToName: fu.opportunity.assignedTo.name,
    meetLink: fu.googleMeetLink,
  }));

  const mappedActions: CalendarItem[] = actions
    .filter((a) => a.scheduledAt)
    .map((a) => ({
      id: a.id,
      source: "ACTION",
      title: a.action,
      startAt: a.scheduledAt!,
      status: a.status,
      opportunityId: a.opportunity.id,
      opportunityTitle: a.opportunity.title,
      contactName: `${a.opportunity.contact.firstName} ${a.opportunity.contact.lastName}`.trim(),
      stage: a.opportunity.stage,
      assignedToId: a.opportunity.assignedToId,
      assignedToName: a.opportunity.assignedTo.name,
      channel: a.channel,
      meetLink: a.googleMeetLink,
    }));

  return [...mappedFollowUps, ...mappedActions].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime()
  );
}
