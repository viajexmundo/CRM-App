import type { PipelineStage, FollowUpStep } from "@/types";

export interface PipelineStageConfig {
  key: PipelineStage;
  label: string;
  color: string;
  probability: number;
  isClosed: boolean;
}

export const PIPELINE_STAGE_CONFIG: Record<PipelineStage, PipelineStageConfig> = {
  LEAD_NUEVO: {
    key: "LEAD_NUEVO",
    label: "Lead nuevo",
    color: "blue",
    probability: 5,
    isClosed: false,
  },
  PERFILADO: {
    key: "PERFILADO",
    label: "Perfilado",
    color: "indigo",
    probability: 15,
    isClosed: false,
  },
  PROPUESTA_EN_PREPARACION: {
    key: "PROPUESTA_EN_PREPARACION",
    label: "Propuesta en preparación",
    color: "violet",
    probability: 30,
    isClosed: false,
  },
  COTIZACION_EN_SEGUIMIENTO: {
    key: "COTIZACION_EN_SEGUIMIENTO",
    label: "Cotización en seguimiento",
    color: "amber",
    probability: 60,
    isClosed: false,
  },
  APARTADO: {
    key: "APARTADO",
    label: "Apartado",
    color: "orange",
    probability: 75,
    isClosed: false,
  },
  VENTA_CERRADA: {
    key: "VENTA_CERRADA",
    label: "Venta cerrada",
    color: "emerald",
    probability: 90,
    isClosed: false,
  },
  VIAJE_EN_CURSO: {
    key: "VIAJE_EN_CURSO",
    label: "Viaje en curso",
    color: "teal",
    probability: 95,
    isClosed: false,
  },
  POST_VIAJE: {
    key: "POST_VIAJE",
    label: "Post-viaje",
    color: "cyan",
    probability: 100,
    isClosed: false,
  },
  CLIENTE_GANADO: {
    key: "CLIENTE_GANADO",
    label: "Cliente ganado",
    color: "green",
    probability: 100,
    isClosed: true,
  },
  CERRADO_PERDIDO: {
    key: "CERRADO_PERDIDO",
    label: "Perdido",
    color: "red",
    probability: 0,
    isClosed: true,
  },
  DORMIDO: {
    key: "DORMIDO",
    label: "Dormido",
    color: "slate",
    probability: 5,
    isClosed: false,
  },
};

/**
 * Ordered list of pipeline stages for the Kanban board.
 * DORMIDO and CERRADO_PERDIDO are special states shown at the end.
 */
export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
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
];

// ==================== FOLLOW-UP CONFIGURATION ====================

export interface FollowUpStepConfig {
  key: FollowUpStep;
  label: string;
  description: string;
  defaultDayOffset: number;
  defaultHourOffset: number;
  sortOrder: number;
}

/**
 * Default follow-up schedule for "Cotización en seguimiento" stage.
 * These intervals are the defaults that admins can override.
 */
export const DEFAULT_FOLLOW_UP_STEPS: FollowUpStepConfig[] = [
  {
    key: "CONFIRMACION",
    label: "Seguimiento de Confirmación",
    description: "Confirmar que el cliente recibió la cotización y resolver dudas iniciales",
    defaultDayOffset: 0,
    defaultHourOffset: 4,
    sortOrder: 1,
  },
  {
    key: "CORTO",
    label: "Seguimiento corto",
    description: "Contacto breve para mantener el interés y consultar si tiene preguntas",
    defaultDayOffset: 1,
    defaultHourOffset: 0,
    sortOrder: 2,
  },
  {
    key: "VALOR",
    label: "Seguimiento de valor",
    description: "Compartir información adicional de valor: testimonios, fotos del destino, tips",
    defaultDayOffset: 3,
    defaultHourOffset: 0,
    sortOrder: 3,
  },
  {
    key: "URGENCIA",
    label: "Seguimiento de urgencia",
    description: "Generar sentido de urgencia: disponibilidad limitada, fechas próximas, precios",
    defaultDayOffset: 5,
    defaultHourOffset: 0,
    sortOrder: 4,
  },
  {
    key: "CIERRE",
    label: "Seguimiento de cierre",
    description: "Intentar cerrar la venta, ofrecer condiciones especiales o facilidades de pago",
    defaultDayOffset: 7,
    defaultHourOffset: 0,
    sortOrder: 5,
  },
  {
    key: "FINAL",
    label: "Seguimiento final",
    description: "Último intento de contacto, ofrecer mantener la propuesta abierta por tiempo limitado",
    defaultDayOffset: 14,
    defaultHourOffset: 0,
    sortOrder: 6,
  },
];

/**
 * Shorter follow-up schedule for APARTADO stage.
 * 1-2 messages about not losing the reservation.
 */
export const APARTADO_FOLLOW_UP_STEPS: FollowUpStepConfig[] = [
  {
    key: "CONFIRMACION",
    label: "Recordatorio de reservación",
    description: "Confirmar que el cliente tiene claro los próximos pasos y fechas de pago",
    defaultDayOffset: 1,
    defaultHourOffset: 0,
    sortOrder: 1,
  },
  {
    key: "CORTO",
    label: "Urgencia de reservación",
    description: "Recordar que la reservación tiene fecha límite para no perder su lugar",
    defaultDayOffset: 3,
    defaultHourOffset: 0,
    sortOrder: 2,
  },
];

// ==================== STAGE TRANSITION VALIDATION ====================

/**
 * Validates whether an opportunity can transition to a given stage.
 * Currently all transitions are allowed (no restrictions).
 * Validations will be added back as needed.
 */
export function validateStageTransition(
  _toStage: PipelineStage,
  _opportunity: unknown
): string | null {
  return null;
}

/**
 * Allowed stage transitions map.
 * Each stage can advance forward, go back one step, or move to CERRADO_PERDIDO.
 */
export const ALLOWED_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  LEAD_NUEVO: ["PERFILADO", "DORMIDO", "CERRADO_PERDIDO"],
  PERFILADO: ["PROPUESTA_EN_PREPARACION", "LEAD_NUEVO", "DORMIDO", "CERRADO_PERDIDO"],
  PROPUESTA_EN_PREPARACION: ["COTIZACION_EN_SEGUIMIENTO", "PERFILADO", "DORMIDO", "CERRADO_PERDIDO"],
  COTIZACION_EN_SEGUIMIENTO: ["APARTADO", "PROPUESTA_EN_PREPARACION", "DORMIDO", "CERRADO_PERDIDO"],
  APARTADO: ["VENTA_CERRADA", "COTIZACION_EN_SEGUIMIENTO", "DORMIDO", "CERRADO_PERDIDO"],
  VENTA_CERRADA: ["VIAJE_EN_CURSO", "APARTADO", "DORMIDO", "CERRADO_PERDIDO"],
  VIAJE_EN_CURSO: ["POST_VIAJE", "VENTA_CERRADA", "DORMIDO", "CERRADO_PERDIDO"],
  POST_VIAJE: ["CLIENTE_GANADO", "VIAJE_EN_CURSO", "DORMIDO", "CERRADO_PERDIDO"],
  CLIENTE_GANADO: ["POST_VIAJE", "DORMIDO", "CERRADO_PERDIDO"],
  CERRADO_PERDIDO: ["LEAD_NUEVO", "DORMIDO"],
  DORMIDO: ["LEAD_NUEVO", "PERFILADO", "PROPUESTA_EN_PREPARACION", "COTIZACION_EN_SEGUIMIENTO", "APARTADO", "VENTA_CERRADA", "CERRADO_PERDIDO"],
};
