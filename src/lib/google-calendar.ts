import "server-only";

import { prisma } from "@/lib/prisma";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || "America/Guatemala";

type GoogleUserTokens = {
  id: string;
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
  googleTokenExpiresAt: Date | null;
};

type GoogleEventMeta = {
  id: string | null;
  htmlLink: string | null;
  status: string | null;
  updatedAt: Date | null;
  meetLink: string | null;
};

function canUseGoogleCalendar() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

async function refreshGoogleAccessToken(user: GoogleUserTokens): Promise<string | null> {
  if (!canUseGoogleCalendar() || !user.googleRefreshToken) return null;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: user.googleRefreshToken,
    }),
  });

  if (!response.ok) return null;

  const json = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
  };

  if (!json.access_token) return null;

  const expiresAt = new Date(Date.now() + (json.expires_in ?? 3600) * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      googleAccessToken: json.access_token,
      googleTokenExpiresAt: expiresAt,
      googleRefreshToken: json.refresh_token ?? user.googleRefreshToken,
      googleConnectedAt: new Date(),
    },
  });

  return json.access_token;
}

async function getGoogleAccessTokenForUser(userId: string): Promise<string | null> {
  if (!canUseGoogleCalendar()) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiresAt: true,
    },
  });

  if (!user) return null;

  const isTokenStillValid =
    user.googleAccessToken &&
    user.googleTokenExpiresAt &&
    user.googleTokenExpiresAt.getTime() - Date.now() > 60_000;

  if (isTokenStillValid) {
    return user.googleAccessToken;
  }

  return refreshGoogleAccessToken(user);
}

async function createOrUpdateEvent(params: {
  ownerUserId: string;
  eventId?: string | null;
  summary: string;
  description: string;
  startAt: Date;
  endAt: Date;
  location?: string | null;
  colorId?: string;
  includeMeet?: boolean;
}): Promise<GoogleEventMeta | null> {
  const accessToken = await getGoogleAccessTokenForUser(params.ownerUserId);
  if (!accessToken) return null;

  const payload = {
    summary: params.summary,
    description: params.description,
    location: params.location || undefined,
    start: {
      dateTime: params.startAt.toISOString(),
      timeZone: DEFAULT_TIMEZONE,
    },
    end: {
      dateTime: params.endAt.toISOString(),
      timeZone: DEFAULT_TIMEZONE,
    },
    colorId: params.colorId,
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 15 },
        { method: "popup", minutes: 0 },
      ],
    },
    conferenceData: params.includeMeet
      ? {
          createRequest: {
            requestId: `crm-${Math.random().toString(36).slice(2, 12)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        }
      : undefined,
  };

  const eventPath = params.eventId
    ? `${GOOGLE_CALENDAR_EVENTS_URL}/${encodeURIComponent(params.eventId)}`
    : GOOGLE_CALENDAR_EVENTS_URL;
  const eventUrl = params.includeMeet
    ? `${eventPath}${eventPath.includes("?") ? "&" : "?"}conferenceDataVersion=1`
    : eventPath;
  const method = params.eventId ? "PATCH" : "POST";

  const response = await fetch(eventUrl, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (params.eventId && response.status === 404) {
      return createOrUpdateEvent({ ...params, eventId: null });
    }
    return null;
  }

  const event = (await response.json()) as {
    id?: string;
    htmlLink?: string;
    status?: string;
    updated?: string;
    hangoutLink?: string;
    conferenceData?: {
      entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
    };
  };

  const meetFromConference =
    event.conferenceData?.entryPoints?.find(
      (entry) => entry.entryPointType === "video" && entry.uri
    )?.uri ?? null;

  return {
    id: event.id ?? null,
    htmlLink: event.htmlLink ?? null,
    status: event.status ?? null,
    updatedAt: event.updated ? new Date(event.updated) : null,
    meetLink: event.hangoutLink ?? meetFromConference,
  };
}

async function deleteEvent(ownerUserId: string, eventId: string): Promise<void> {
  const accessToken = await getGoogleAccessTokenForUser(ownerUserId);
  if (!accessToken) return;

  await fetch(`${GOOGLE_CALENDAR_EVENTS_URL}/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

function getCalendarColorIdByStage(stage: string): string {
  const stageColorMap: Record<string, string> = {
    LEAD_NUEVO: "9",
    PERFILADO: "10",
    PROPUESTA_EN_PREPARACION: "5",
    COTIZACION_EN_SEGUIMIENTO: "6",
    APARTADO: "11",
    VENTA_CERRADA: "2",
    VIAJE_EN_CURSO: "7",
    POST_VIAJE: "8",
    CLIENTE_GANADO: "2",
    CERRADO_PERDIDO: "4",
    DORMIDO: "3",
  };
  return stageColorMap[stage] ?? "1";
}

export async function syncFollowUpCalendarEvent(followUpId: string): Promise<void> {
  const followUp = await prisma.followUp.findUnique({
    where: { id: followUpId },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          stage: true,
          destination: true,
          assignedToId: true,
          contact: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!followUp) return;

  if (followUp.status !== "PENDING") {
    if (followUp.googleEventId && followUp.googleEventUserId) {
      await deleteEvent(followUp.googleEventUserId, followUp.googleEventId);
      await prisma.followUp.update({
        where: { id: followUp.id },
        data: {
          googleEventId: null,
          googleEventUserId: null,
          googleEventHtmlLink: null,
          googleEventStatus: "cancelled",
          googleEventUpdatedAt: new Date(),
          googleMeetLink: null,
        },
      });
    }
    return;
  }

  const ownerUserId = followUp.opportunity.assignedToId;
  if (!ownerUserId) return;

  if (
    followUp.googleEventId &&
    followUp.googleEventUserId &&
    followUp.googleEventUserId !== ownerUserId
  ) {
    await deleteEvent(followUp.googleEventUserId, followUp.googleEventId);
  }

  const startAt = new Date(followUp.scheduledAt);
  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
  const contactName = `${followUp.opportunity.contact.firstName} ${followUp.opportunity.contact.lastName}`.trim();
  const summary = `Seguimiento: ${followUp.label} - ${contactName}`;
  const description = [
    `Oportunidad: ${followUp.opportunity.title}`,
    `Cliente: ${contactName}`,
    `Etapa: ${followUp.opportunity.stage}`,
    `Seguimiento: ${followUp.label}`,
  ].join("\n");

  const eventMeta = await createOrUpdateEvent({
    ownerUserId,
    eventId:
      followUp.googleEventUserId === ownerUserId ? followUp.googleEventId : null,
    summary,
    description,
    startAt,
    endAt,
    location: followUp.opportunity.destination || null,
    colorId: getCalendarColorIdByStage(followUp.opportunity.stage),
  });

  if (!eventMeta?.id) return;

  await prisma.followUp.update({
    where: { id: followUp.id },
    data: {
      googleEventId: eventMeta.id,
      googleEventUserId: ownerUserId,
      googleEventHtmlLink: eventMeta.htmlLink,
      googleEventStatus: eventMeta.status,
      googleEventUpdatedAt: eventMeta.updatedAt,
      googleMeetLink: eventMeta.meetLink,
    },
  });
}

export async function syncOpportunityActionCalendarEvent(actionId: string): Promise<void> {
  const action = await prisma.opportunityAction.findUnique({
    where: { id: actionId },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          stage: true,
          destination: true,
          assignedToId: true,
          contact: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!action) return;

  const shouldDelete = action.status !== "PENDING" || !action.scheduledAt;
  if (shouldDelete) {
    if (action.googleEventId && action.googleEventUserId) {
      await deleteEvent(action.googleEventUserId, action.googleEventId);
      await prisma.opportunityAction.update({
        where: { id: action.id },
        data: {
          googleEventId: null,
          googleEventUserId: null,
          googleEventHtmlLink: null,
          googleEventStatus: "cancelled",
          googleEventUpdatedAt: new Date(),
          googleMeetLink: null,
        },
      });
    }
    return;
  }

  if (!action.scheduledAt) return;

  const ownerUserId = action.opportunity.assignedToId;
  if (!ownerUserId) return;

  if (
    action.googleEventId &&
    action.googleEventUserId &&
    action.googleEventUserId !== ownerUserId
  ) {
    await deleteEvent(action.googleEventUserId, action.googleEventId);
  }

  const startAt = new Date(action.scheduledAt);
  const endAt = new Date(startAt.getTime() + 45 * 60 * 1000);
  const contactName = `${action.opportunity.contact.firstName} ${action.opportunity.contact.lastName}`.trim();
  const summary = `Accion: ${action.action} - ${contactName}`;
  const description = [
    `Oportunidad: ${action.opportunity.title}`,
    `Cliente: ${contactName}`,
    `Etapa: ${action.opportunity.stage}`,
    `Tipo: ${action.type}`,
    action.channel ? `Canal: ${action.channel}` : null,
    `Accion: ${action.action}`,
  ]
    .filter(Boolean)
    .join("\n");

  const shouldIncludeMeet =
    action.type === "MEETING" ||
    action.type === "CALL" ||
    action.channel === "GOOGLE_MEET";

  const eventMeta = await createOrUpdateEvent({
    ownerUserId,
    eventId: action.googleEventUserId === ownerUserId ? action.googleEventId : null,
    summary,
    description,
    startAt,
    endAt,
    location: action.opportunity.destination || null,
    colorId: getCalendarColorIdByStage(action.opportunity.stage),
    includeMeet: shouldIncludeMeet,
  });

  if (!eventMeta?.id) return;

  await prisma.opportunityAction.update({
    where: { id: action.id },
    data: {
      googleEventId: eventMeta.id,
      googleEventUserId: ownerUserId,
      googleEventHtmlLink: eventMeta.htmlLink,
      googleEventStatus: eventMeta.status,
      googleEventUpdatedAt: eventMeta.updatedAt,
      googleMeetLink: eventMeta.meetLink,
    },
  });
}

export async function syncOpportunityCalendar(opportunityId: string): Promise<void> {
  const [followUps, actions] = await Promise.all([
    prisma.followUp.findMany({
      where: { opportunityId },
      select: { id: true },
    }),
    prisma.opportunityAction.findMany({
      where: { opportunityId },
      select: { id: true },
    }),
  ]);

  for (const followUp of followUps) {
    await syncFollowUpCalendarEvent(followUp.id);
  }
  for (const action of actions) {
    await syncOpportunityActionCalendarEvent(action.id);
  }
}
