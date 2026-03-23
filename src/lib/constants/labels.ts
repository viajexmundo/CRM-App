/**
 * Shared label maps for translating enum values to user-friendly Spanish text.
 * Used across dashboard, opportunity detail, and other components.
 */

export const TYPE_LABELS: Record<string, string> = {
  CALL: "Llamada",
  EMAIL: "Correo electrónico",
  MEETING: "Reunión presencial",
  WHATSAPP: "WhatsApp",
  FOLLOW_UP: "Seguimiento",
  PROPOSAL: "Propuesta",
  VIDEOLLAMADA: "Videollamada",
  GOOGLE_MEET: "Google Meet",
  ZOOM: "Zoom",
  NOTE: "Nota",
  TASK: "Tarea",
  SMS: "SMS",
  OTHER: "Otro",
};

export const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  EMAIL: "Correo",
  PHONE: "Teléfono",
  SMS: "SMS",
  GOOGLE_MEET: "Google Meet",
  ZOOM: "Zoom",
  IN_PERSON: "Presencial",
  VIDEOLLAMADA: "Videollamada",
  OTHER: "Otro",
};

export const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Sitio web",
  REFERRAL: "Referido",
  SOCIAL_MEDIA: "Redes sociales",
  GOOGLE_ADS: "Google Ads",
  FACEBOOK_ADS: "Facebook Ads",
  INSTAGRAM: "Instagram",
  WALK_IN: "Visita directa",
  PHONE: "Teléfono",
  EVENT: "Evento",
  PARTNER: "Partner",
  OTHER: "Otro",
};

export function getTypeLabel(type: string | null | undefined): string {
  if (!type) return "";
  return TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

export function getChannelLabel(channel: string | null | undefined): string {
  if (!channel) return "";
  return CHANNEL_LABELS[channel] ?? channel.replace(/_/g, " ");
}

export function getSourceLabel(source: string | null | undefined): string {
  if (!source) return "";
  return SOURCE_LABELS[source] ?? source.replace(/_/g, " ");
}
