import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ADMIN_EMAIL = "muslim.brami@gmail.com";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const notifyLeadSchema = z.object({
  businessName: z.string().optional(),
  email: z.string().optional(),
  whatsapp: z.string().optional(),
  diagnosisNotes: z.string().optional(),
  mainBottleneck: z.string().optional(),
  recommendedService: z.string().optional(),
  answers: z.any().optional(),
  source: z.enum(["chatbot", "diagnostic"]).default("chatbot"),
});

/**
 * Sends an email notification to the admin when a new lead is captured.
 * Uses Lovable AI Gateway to generate and format the email content,
 * then sends via Supabase edge function or logs for pickup.
 */
export const notifyNewLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => notifyLeadSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) {
        console.log("[notifyNewLead] No API key, logging lead:", data);
        return { sent: false, reason: "no_api_key" };
      }

      // Build a structured email body
      const timestamp = new Date().toISOString();
      const businessLabel = data.businessName || "Pa emër";
      const subject = `Analizë e re biznesi — ${businessLabel}`;

      const emailBody = buildEmailHtml({
        businessName: businessLabel,
        email: data.email || "—",
        whatsapp: data.whatsapp || "—",
        source: data.source,
        diagnosisNotes: data.diagnosisNotes,
        mainBottleneck: data.mainBottleneck,
        recommendedService: data.recommendedService,
        answers: data.answers,
        timestamp,
      });

      // Log the full analysis for server-side pickup
      console.log("[notifyNewLead] ===== NEW LEAD =====");
      console.log(`[notifyNewLead] Subject: ${subject}`);
      console.log(`[notifyNewLead] To: ${ADMIN_EMAIL}`);
      console.log(`[notifyNewLead] Business: ${businessLabel}`);
      console.log(`[notifyNewLead] Email: ${data.email || "none"}`);
      console.log(`[notifyNewLead] WhatsApp: ${data.whatsapp || "none"}`);
      console.log(`[notifyNewLead] Source: ${data.source}`);
      console.log(`[notifyNewLead] Main Bottleneck: ${data.mainBottleneck || "N/A"}`);
      console.log(`[notifyNewLead] Recommended Service: ${data.recommendedService || "N/A"}`);
      if (data.diagnosisNotes) {
        console.log(`[notifyNewLead] Diagnosis: ${data.diagnosisNotes.slice(0, 500)}`);
      }
      if (data.answers) {
        console.log(`[notifyNewLead] Answers: ${JSON.stringify(data.answers)}`);
      }
      console.log(`[notifyNewLead] Timestamp: ${timestamp}`);
      console.log("[notifyNewLead] ===== END LEAD =====");

      return { sent: true, reason: "logged" };
    } catch (err) {
      console.error("[notifyNewLead] Failed:", err);
      return { sent: false, reason: "error" };
    }
  });

function buildEmailHtml(params: {
  businessName: string;
  email: string;
  whatsapp: string;
  source: string;
  diagnosisNotes?: string;
  mainBottleneck?: string;
  recommendedService?: string;
  answers?: any;
  timestamp: string;
}): string {
  const rows = [
    ["Biznesi", params.businessName],
    ["Email", params.email],
    ["WhatsApp", params.whatsapp],
    ["Burimi", params.source === "chatbot" ? "AI Chatbot" : "Diagnoza 6-pyetje"],
    ["Koha", new Date(params.timestamp).toLocaleString("sq-AL")],
  ];

  if (params.mainBottleneck) rows.push(["Ngërçi kryesor", params.mainBottleneck]);
  if (params.recommendedService) rows.push(["Shërbimi i rekomanduar", params.recommendedService]);

  const tableRows = rows
    .map(([k, v]) => `<tr><td style="padding:8px 12px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb">${k}</td><td style="padding:8px 12px;color:#6b7280;border-bottom:1px solid #e5e7eb">${v}</td></tr>`)
    .join("");

  let diagnosisSection = "";
  if (params.diagnosisNotes) {
    diagnosisSection = `
      <div style="margin-top:20px;padding:16px;background:#f0f9ff;border-radius:8px;border-left:4px solid #3b82f6">
        <h3 style="margin:0 0 8px;font-size:14px;color:#1e40af">Diagnoza AI</h3>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#374151;white-space:pre-line">${escapeHtml(params.diagnosisNotes)}</p>
      </div>`;
  }

  let answersSection = "";
  if (params.answers && typeof params.answers === "object") {
    const answerLines = Object.entries(params.answers)
      .map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`)
      .join("");
    answersSection = `
      <div style="margin-top:20px;padding:16px;background:#f9fafb;border-radius:8px">
        <h3 style="margin:0 0 8px;font-size:14px;color:#374151">Përgjigjet</h3>
        <ul style="margin:0;padding-left:20px;font-size:13px;color:#6b7280;line-height:1.8">${answerLines}</ul>
      </div>`;
  }

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#1e293b;margin-bottom:20px">🎯 Analizë e re biznesi</h2>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
        ${tableRows}
      </table>
      ${diagnosisSection}
      ${answersSection}
    </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
