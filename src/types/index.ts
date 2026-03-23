import type { DefaultSession } from "next-auth";
import type { JWT as _JWT } from "@auth/core/jwt";

// ==================== ROLES ====================

export const ROLES = ["VENDEDOR", "COACH", "ADMIN", "CONTABILIDAD"] as const;
export type Role = (typeof ROLES)[number];

// ==================== PIPELINE STAGES ====================

export const PIPELINE_STAGES = [
  "LEAD_NUEVO",
  "PERFILADO",
  "PROPUESTA_EN_PREPARACION",
  "COTIZACION_EN_SEGUIMIENTO",
  "APARTADO",
  "VENTA_CERRADA",
  "VIAJE_EN_CURSO",
  "POST_VIAJE",
  "CLIENTE_GANADO",
  "CERRADO_PERDIDO",
  "DORMIDO",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

// ==================== FOLLOW-UP STEPS ====================

export const FOLLOW_UP_STEPS = [
  "CONFIRMACION",
  "CORTO",
  "VALOR",
  "URGENCIA",
  "CIERRE",
  "FINAL",
] as const;
export type FollowUpStep = (typeof FOLLOW_UP_STEPS)[number];

// ==================== ENUMS ====================

export const ContactType = {
  LEISURE: "LEISURE",
  CORPORATE: "CORPORATE",
} as const;
export type ContactType = (typeof ContactType)[keyof typeof ContactType];

export const LeadSource = {
  REFERRAL: "REFERRAL",
  WEBSITE: "WEBSITE",
  SOCIAL_MEDIA: "SOCIAL_MEDIA",
  PHONE: "PHONE",
  EMAIL: "EMAIL",
  EVENT: "EVENT",
  WALK_IN: "WALK_IN",
  PARTNER: "PARTNER",
  OTHER: "OTHER",
} as const;
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const LeadStatus = {
  NUEVO: "NUEVO",
  CONTACTADO: "CONTACTADO",
  CALIFICADO: "CALIFICADO",
  DESCALIFICADO: "DESCALIFICADO",
  CONVERTIDO: "CONVERTIDO",
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const CaseType = {
  GENERAL: "GENERAL",
  COMPLAINT: "COMPLAINT",
  CHANGE_REQUEST: "CHANGE_REQUEST",
  CANCELLATION: "CANCELLATION",
  REFUND: "REFUND",
  EMERGENCY: "EMERGENCY",
  FEEDBACK: "FEEDBACK",
} as const;
export type CaseType = (typeof CaseType)[keyof typeof CaseType];

export const CasePriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;
export type CasePriority = (typeof CasePriority)[keyof typeof CasePriority];

export const CaseStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  WAITING_CLIENT: "WAITING_CLIENT",
  WAITING_SUPPLIER: "WAITING_SUPPLIER",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;
export type CaseStatus = (typeof CaseStatus)[keyof typeof CaseStatus];

export const ProposalStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  VIEWED: "VIEWED",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
} as const;
export type ProposalStatus = (typeof ProposalStatus)[keyof typeof ProposalStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  PARTIAL: "PARTIAL",
  COMPLETED: "COMPLETED",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const BookingStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  TICKETED: "TICKETED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const ActivityType = {
  NOTE: "NOTE",
  CALL: "CALL",
  EMAIL: "EMAIL",
  WHATSAPP: "WHATSAPP",
  MEETING: "MEETING",
  TASK: "TASK",
  STAGE_CHANGE: "STAGE_CHANGE",
  PROPOSAL_SENT: "PROPOSAL_SENT",
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  SYSTEM: "SYSTEM",
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const OptionTier = {
  GOOD: "GOOD",
  BETTER: "BETTER",
  IDEAL: "IDEAL",
} as const;
export type OptionTier = (typeof OptionTier)[keyof typeof OptionTier];

export const PreferredChannel = {
  WHATSAPP: "WHATSAPP",
  EMAIL: "EMAIL",
  PHONE: "PHONE",
  SMS: "SMS",
} as const;
export type PreferredChannel = (typeof PreferredChannel)[keyof typeof PreferredChannel];

export const ConsentStatus = {
  PENDING: "PENDING",
  GRANTED: "GRANTED",
  REVOKED: "REVOKED",
} as const;
export type ConsentStatus = (typeof ConsentStatus)[keyof typeof ConsentStatus];

// ==================== SESSION ====================

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

declare module "next-auth" {
  interface Session {
    user: SessionUser & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
