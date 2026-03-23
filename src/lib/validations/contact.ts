import { z } from "zod";

export const contactCreateSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "El nombre es obligatorio")
      .max(100, "El nombre no puede exceder 100 caracteres"),
    lastName: z
      .string()
      .min(1, "El apellido es obligatorio")
      .max(100, "El apellido no puede exceder 100 caracteres"),
    email: z
      .string()
      .email("El correo electr\u00f3nico no es v\u00e1lido")
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .min(7, "El tel\u00e9fono debe tener al menos 7 d\u00edgitos")
      .max(20, "El tel\u00e9fono no puede exceder 20 caracteres")
      .optional()
      .or(z.literal("")),
    secondaryPhone: z
      .string()
      .max(20, "El tel\u00e9fono no puede exceder 20 caracteres")
      .optional()
      .or(z.literal("")),
    type: z.enum(["LEISURE", "CORPORATE"]).default("LEISURE"),
    company: z
      .string()
      .max(200, "El nombre de empresa no puede exceder 200 caracteres")
      .optional()
      .or(z.literal("")),
    position: z
      .string()
      .max(100, "El cargo no puede exceder 100 caracteres")
      .optional()
      .or(z.literal("")),
    preferredChannel: z
      .enum(["WHATSAPP", "EMAIL", "PHONE", "SMS"])
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
    consentStatus: z.enum(["PENDING", "GRANTED", "REVOKED"]).default("PENDING"),
    consentDate: z.coerce.date().optional().nullable(),
    country: z
      .string()
      .max(100)
      .optional()
      .or(z.literal("")),
    timezone: z
      .string()
      .max(50)
      .optional()
      .or(z.literal("")),
    language: z.string().default("es"),
    tags: z.array(z.string()).default([]),
    notes: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      const hasEmail = data.email && data.email.length > 0;
      const hasPhone = data.phone && data.phone.length > 0;
      return hasEmail || hasPhone;
    },
    {
      message: "Debe proporcionar al menos un correo electr\u00f3nico o un n\u00famero de tel\u00e9fono",
      path: ["email"],
    }
  );

export const contactUpdateSchema = z.object({
  firstName: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .optional(),
  lastName: z
    .string()
    .min(1, "El apellido es obligatorio")
    .max(100, "El apellido no puede exceder 100 caracteres")
    .optional(),
  email: z
    .string()
    .email("El correo electr\u00f3nico no es v\u00e1lido")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .min(7, "El tel\u00e9fono debe tener al menos 7 d\u00edgitos")
    .max(20, "El tel\u00e9fono no puede exceder 20 caracteres")
    .optional()
    .or(z.literal("")),
  secondaryPhone: z
    .string()
    .max(20, "El tel\u00e9fono no puede exceder 20 caracteres")
    .optional()
    .or(z.literal("")),
  type: z.enum(["LEISURE", "CORPORATE"]).optional(),
  company: z
    .string()
    .max(200)
    .optional()
    .or(z.literal("")),
  position: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
  preferredChannel: z
    .enum(["WHATSAPP", "EMAIL", "PHONE", "SMS"])
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
    .optional(),
  consentStatus: z.enum(["PENDING", "GRANTED", "REVOKED"]).optional(),
  consentDate: z.coerce.date().optional().nullable(),
  country: z.string().max(100).optional().or(z.literal("")),
  timezone: z.string().max(50).optional().or(z.literal("")),
  language: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().or(z.literal("")),
});

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;
