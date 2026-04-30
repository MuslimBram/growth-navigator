import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TELEGRAM_GATEWAY = "https://connector-gateway.lovable.dev/telegram";

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

export const notifyNewLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => notifyLeadSchema.parse(input))
  .handler(async ({ data }) => {
    const results: string[] = [];
    const timestamp = new Date().toISOString();
    const businessLabel = data.businessName || "Pa emër";

    // Build message text
    const lines = [
      `🎯 *Analizë e re biznesi*`,
      ``,
      `📋 *Biznesi:* ${businessLabel}`,
      `📧 *Email:* ${data.email || "—"}`,
      `📱 *WhatsApp:* ${data.whatsapp || "—"}`,
      `🔍 *Burimi:* ${data.source === "chatbot" ? "AI Chatbot" : "Diagnoza 6-pyetje"}`,
      ``,
    ];
    if (data.mainBottleneck) lines.push(`⚠️ *Ngërçi:* ${data.mainBottleneck}`);
    if (data.recommendedService) lines.push(`✅ *Shërbimi:* ${data.recommendedService}`);
    if (data.diagnosisNotes) {
      lines.push(``, `💡 *Diagnoza:*`, data.diagnosisNotes.slice(0, 800));
    }
    lines.push(``, `🕐 ${new Date(timestamp).toLocaleString("sq-AL")}`);
    const message = lines.join("\n");

    // 1. Telegram notification
    try {
      const lovableKey = process.env.LOVABLE_API_KEY;
      const telegramKey = process.env.TELEGRAM_API_KEY;
      const chatId = ADMIN_CHAT_ID;

      if (lovableKey && telegramKey && chatId) {
        const res = await fetch(`${TELEGRAM_GATEWAY}/sendMessage`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": telegramKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "Markdown",
          }),
        });
        const json = await res.json();
        if (res.ok && json.ok) {
          results.push("telegram:sent");
        } else {
          console.error("[notify] Telegram failed:", json);
          results.push("telegram:failed");
        }
      } else {
        results.push("telegram:no_config");
      }
    } catch (err) {
      console.error("[notify] Telegram error:", err);
      results.push("telegram:error");
    }

    // 2. ntfy.sh push notification (free, no signup)
    try {
      const ntfyTopic = "muslimi-digital-leads";
      const plainMessage = message.replace(/\*/g, "");
      await fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: "POST",
        headers: {
          Title: `Lead: ${businessLabel}`,
          Tags: "chart_with_upwards_trend",
        },
        body: plainMessage,
      });
      results.push("ntfy:sent");
    } catch (err) {
      console.error("[notify] ntfy error:", err);
      results.push("ntfy:error");
    }

    // 3. Console log (always)
    console.log("[notifyNewLead] ===== NEW LEAD =====");
    console.log(`[notifyNewLead] Business: ${businessLabel}`);
    console.log(`[notifyNewLead] Results: ${results.join(", ")}`);
    console.log("[notifyNewLead] ===== END LEAD =====");

    return { sent: true, channels: results };
  });
