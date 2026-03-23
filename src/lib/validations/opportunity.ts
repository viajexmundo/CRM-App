import { z } from "zod";
import { PIPELINE_STAGES } from "@/types";

const pipelineStageEnum = z.enum(PIPELINE_STAGES);

export const opportunityCreateSchema = z.object({
  title: z
    .string()
    .min(1, "El t\u00edtulo es obligatorio")
    .max(300, "El t\u00edtulo no puede exceder 300 caracteres"),
  contactId: z.string().min(1, "El contacto es obligatorio"),
  leadId: z.string().optional().nullable(),
  assignedToId: z.string().min(1, "El vendedor asignado es obligatorio"),
  stage: pipelineStageEnum.default("LEAD_NUEVO"),
  estimatedValue: z
    .number()
    .min(0, "El valor estimado no puede ser negativo")
    .default(0),
  currency: z.string().default("GTQ"),

  // Next Step
  nextStepType: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
  nextStepAction: z
    .string()
    .max(500, "La acci\u00f3n no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  nextStepDate: z.coerce.date().optional().nullable(),
  nextStepChannel: z
    .enum(["WHATSAPP", "EMAIL", "PHONE", "SMS", "MEETING"])
    .optional()
    .nullable(),

  // Diagnosis fields
  segment: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
  travelMotif: z
    .string()
    .max(200)
    .optional()
    .or(z.literal("")),
  destination: z
    .string()
    .max(200)
    .optional()
    .or(z.literal("")),
  departureDate: z.coerce.date().optional().nullable(),
  returnDate: z.coerce.date().optional().nullable(),
  passengers: z.number().int().min(1).optional().nullable(),
  priorities: z.array(z.string()).default([]),
  restrictions: z.array(z.string()).default([]),
  budgetMin: z.number().min(0).optional().nullable(),
  budgetMax: z.number().min(0).optional().nullable(),
  budgetCurrency: z.string().default("GTQ"),
  decisionMaker: z
    .string()
    .max(200)
    .optional()
    .or(z.literal("")),
  decisionCriteria: z
    .string()
    .max(500)
    .optional()
    .or(z.literal("")),
  specialRequests: z.string().optional().or(z.literal("")),

  // Close info
  closeReason: z.string().optional().or(z.literal("")),
  lostReason: z.string().optional().or(z.literal("")),
});

export const opportunityUpdateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  contactId: z.string().min(1).optional(),
  leadId: z.string().optional().nullable(),
  assignedToId: z.string().min(1).optional(),
  stage: pipelineStageEnum.optional(),
  previousStage: pipelineStageEnum.optional().nullable(),
  estimatedValue: z.number().min(0).optional(),
  currency: z.string().optional(),

  // Next Step
  nextStepType: z.string().max(100).optional().or(z.literal("")),
  nextStepAction: z.string().max(500).optional().or(z.literal("")),
  nextStepDate: z.coerce.date().optional().nullable(),
  nextStepChannel: z
    .enum(["WHATSAPP", "EMAIL", "PHONE", "SMS", "MEETING"])
    .optional()
    .nullable(),

  // Diagnosis fields
  segment: z.string().max(100).optional().or(z.literal("")),
  travelMotif: z.string().max(200).optional().or(z.literal("")),
  destination: z.string().max(200).optional().or(z.literal("")),
  departureDate: z.coerce.date().optional().nullable(),
  returnDate: z.coerce.date().optional().nullable(),
  passengers: z.number().int().min(1).optional().nullable(),
  priorities: z.array(z.string()).optional(),
  restrictions: z.array(z.string()).optional(),
  budgetMin: z.number().min(0).optional().nullable(),
  budgetMax: z.number().min(0).optional().nullable(),
  budgetCurrency: z.string().optional(),
  decisionMaker: z.string().max(200).optional().or(z.literal("")),
  decisionCriteria: z.string().max(500).optional().or(z.literal("")),
  specialRequests: z.string().optional().or(z.literal("")),

  // Close info
  closeReason: z.string().optional().or(z.literal("")),
  lostReason: z.string().optional().or(z.literal("")),
  closedAt: z.coerce.date().optional().nullable(),

  // Score
  score: z.number().int().min(0).max(100).optional(),

  // Diagnosis questionnaire
  diagnosisAnswers: z.string().optional().nullable(),
  diagnosisScore: z.number().int().min(0).max(100).optional().nullable(),
});

export const stageTransitionSchema = z.object({
  opportunityId: z.string().min(1, "La oportunidad es obligatoria"),
  toStage: pipelineStageEnum,
  reason: z.string().optional().or(z.literal("")),
});

export type OpportunityCreateInput = z.infer<typeof opportunityCreateSchema>;
export type OpportunityUpdateInput = z.infer<typeof opportunityUpdateSchema>;
export type StageTransitionInput = z.infer<typeof stageTransitionSchema>;
