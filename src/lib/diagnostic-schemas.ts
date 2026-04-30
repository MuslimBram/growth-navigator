import { z } from "zod";

// Keep these enums in sync with diagnostic-types.ts.
// We allow ALL valid AnswerValue strings — semantic validity is enforced at
// the question level on the client, server treats values as opaque labels.

export const ANSWER_VALUES = [
  "yes",
  "partial",
  "no",
  "basic",
  "likes_only",
  "not_optimized",
  "nothing",
] as const;

export const ANSWER_KEYS = [
  "seo",
  "website",
  "visual360",
  "social_conversion",
  "google_maps",
  "differentiation",
] as const;

export const SERVICE_KEYS = [
  "seo",
  "web_3d",
  "photo_video_360",
  "social_media",
  "google_maps",
  "combined_package",
] as const;

const answerValueSchema = z.enum(ANSWER_VALUES);

export const answersSchema = z.object({
  seo: answerValueSchema,
  website: answerValueSchema,
  visual360: answerValueSchema,
  social_conversion: answerValueSchema,
  google_maps: answerValueSchema,
  differentiation: answerValueSchema,
});

export type AnswersInput = z.infer<typeof answersSchema>;

export const submitDiagnosisSchema = z.object({
  answers: answersSchema,
  visitorId: z.string().min(1).max(128),
});

export type SubmitDiagnosisInput = z.infer<typeof submitDiagnosisSchema>;

export const getResultSchema = z.object({
  sessionId: z.string().uuid(),
});

export const leadSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(255)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    whatsapp: z
      .string()
      .trim()
      .min(5)
      .max(32)
      .regex(/^[+\d\s\-()]+$/, "Numër i pavlefshëm")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    businessName: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  .refine((d) => d.email || d.whatsapp, {
    message: "Duhet të lësh të paktën email ose WhatsApp.",
    path: ["email"],
  });

export const submitLeadSchema = z.object({ sessionId: z.string().uuid() }).and(
  leadSchema,
);

export type SubmitLeadInput = z.infer<typeof submitLeadSchema>;

