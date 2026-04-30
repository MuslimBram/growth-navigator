import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ADMIN_EMAIL = "muslim.brami@gmail.com";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const notifyLeadSchema = z.object({
  businessName: z.string().optional(),
  email: z.string().optional(),
  whatsapp: z.string().optional(),
  diagnosisNotes: z.string().optional(),
  source: z.enum(["chatbot", "diagnostic"]).default("chatbot"),
});

/**
 * Sends an email notification to the admin when a new lead is captured.
 * Fails silently — never breaks the user experience.
 */
export const notifyNewLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => notifyLeadSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      // For now, log the lead notification. Email infrastructure requires domain setup.
      // This function is structured to easily add email sending once configured.
      console.log("[notifyNewLead] New lead captured:", {
        business: data.businessName || "unknown",
        email: data.email || "none",
        whatsapp: data.whatsapp || "none",
        source: data.source,
        hasDiagnosis: Boolean(data.diagnosisNotes),
        timestamp: new Date().toISOString(),
      });

      // TODO: Once email domain is configured, uncomment and wire up:
      // await sendEmailNotification(data);

      return { sent: false, reason: "email_not_configured" };
    } catch (err) {
      // Never throw — this is a fire-and-forget notification
      console.error("[notifyNewLead] Failed:", err);
      return { sent: false, reason: "error" };
    }
  });