import { z } from "zod";

// Dynamic question system — answers are partial since not all questions are shown.
export const ANSWER_VALUES = [
  "yes", "partial", "no",
  "0", "1_5", "5_20", "dont_know",
  "whatsapp", "phone", "dm", "website_form", "not_often",
  "works_well", "not_much",
  "cheap_price", "quality", "no_answer",
  "2_4h", "5_8h", "8_plus",
  "something", "writes_sometimes", "clear_path",
] as const;

export const ANSWER_KEYS = [
  "online_leads", "contact_method", "automation", "measurement",
  "ads", "brand_positioning", "working_hours", "virtual_experience",
  "funnel", "ai_usage",
] as const;

export const SERVICE_KEYS = [
  "seo", "web_3d", "photo_video_360", "social_media",
  "google_maps", "combined_package", "automation", "ads",
  "analytics_measurement",
] as const;

const answerValueSchema = z.enum(ANSWER_VALUES);

// Dynamic: answers object has at least 6 keys (core questions), up to 8
export const answersSchema = z.record(
  z.enum(ANSWER_KEYS),
  answerValueSchema,
).refine(
  (obj) => Object.keys(obj).length >= 6,
  { message: "Duhen të paktën 6 përgjigje." },
);

export type AnswersInput = Record<string, string>;

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
