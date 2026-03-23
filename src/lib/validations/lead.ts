import { z } from "zod";

/**
 * Schema for creating a new Lead + Contact in a single step.
 * Only name and phone are required; everything else is optional.
 */
export const leadCreateSchema = z.object({
  // Contact fields (auto-created)
  firstName: z.string().min(1, "El nombre es obligatorio").max(100),
  phone: z.string().min(1, "El teléfono es obligatorio").max(30),
  passportOrDpi: z.string().max(50).optional().or(z.literal("")),

  // Lead fields
  passengers: z
    .number()
    .int()
    .min(1, "Debe haber al menos 1 pasajero")
    .optional()
    .nullable(),
  source: z
    .enum([
      "REFERRAL",
      "WEBSITE",
      "SOCIAL_MEDIA",
      "PHONE",
      "EMAIL",
      "EVENT",
      "WALK_IN",
      "PARTNER",
      "OTHER",
    ])
    .default("OTHER"),
  destination: z.string().max(200).optional().or(z.literal("")),
  travelDateFrom: z.string().optional().or(z.literal("")),
  travelDateTo: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  assignedToId: z.string().optional().nullable(),
});

export const leadUpdateSchema = z.object({
  contactId: z.string().min(1).optional(),
  assignedToId: z.string().optional().nullable(),
  status: z
    .enum(["NUEVO", "CONTACTADO", "CALIFICADO", "DESCALIFICADO", "CONVERTIDO"])
    .optional(),
  source: z
    .enum([
      "REFERRAL",
      "WEBSITE",
      "SOCIAL_MEDIA",
      "PHONE",
      "EMAIL",
      "EVENT",
      "WALK_IN",
      "PARTNER",
      "OTHER",
    ])
    .optional(),
  score: z.number().int().min(0).max(100).optional(),
  interest: z.string().max(500).optional().or(z.literal("")),
  budget: z.number().min(0).optional().nullable(),
  budgetCurrency: z.string().optional(),
  travelDates: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
      flexible: z.boolean().default(false),
    })
    .optional()
    .nullable(),
  passengers: z.number().int().min(1).optional().nullable(),
  destination: z.string().max(200).optional().or(z.literal("")),
  travelMotif: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
