import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TELEGRAM_GATEWAY = "https://connector-gateway.lovable.dev/telegram";

export const Route = createFileRoute("/api/public/hooks/stale-leads")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth: shared secret
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.replace(/^Bearer\s+/i, "");
        const expected = process.env.CRON_SECRET;
        if (!expected || token !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Find leads created >24h ago, not contacted, not yet reminded
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: leads, error } = await supabaseAdmin
          .from("diagnostic_leads")
          .select("id, business_name, email, whatsapp, created_at, diagnosis_notes")
          .lt("created_at", cutoff)
          .eq("contacted", false)
          .is("reminded_at", null)
          .order("created_at", { ascending: true })
          .limit(20);

        if (error) {
          console.error("[stale-leads] query error", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!leads || leads.length === 0) {
          return new Response(JSON.stringify({ ok: true, reminded: 0 }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const lovableKey = process.env.LOVABLE_API_KEY;
        const telegramKey = process.env.TELEGRAM_API_KEY;
        const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

        let sent = 0;
        const remindedIds: string[] = [];

        for (const lead of leads) {
          const ageHours = Math.floor(
            (Date.now() - new Date(lead.created_at).getTime()) / 3600000
          );
          const lines = [
            `⏰ *Reminder: Lead pa kontakt*`,
            ``,
            `📋 *Biznesi:* ${lead.business_name || "Pa emër"}`,
            `📧 *Email:* ${lead.email || "—"}`,
            `📱 *WhatsApp:* ${lead.whatsapp || "—"}`,
            `🕐 *Mosha:* ${ageHours}h`,
            ``,
            `👉 Hap admin panelin për të kontaktuar.`,
          ];
          const msg = lines.join("\n");

          // Telegram
          if (lovableKey && telegramKey && chatId) {
            try {
              await fetch(`${TELEGRAM_GATEWAY}/sendMessage`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${lovableKey}`,
                  "X-Connection-Api-Key": telegramKey,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: msg,
                  parse_mode: "Markdown",
                }),
              });
              sent++;
            } catch (e) {
              console.error("[stale-leads] telegram error", e);
            }
          }

          // ntfy fallback
          try {
            await fetch("https://ntfy.sh/muslimi-digital-leads", {
              method: "POST",
              headers: {
                Title: `Reminder: ${lead.business_name || "Lead"} (${ageHours}h)`,
                Tags: "alarm_clock",
              },
              body: msg.replace(/\*/g, ""),
            });
          } catch (e) {
            console.error("[stale-leads] ntfy error", e);
          }

          remindedIds.push(lead.id);
        }

        // Mark reminded
        if (remindedIds.length > 0) {
          await supabaseAdmin
            .from("diagnostic_leads")
            .update({ reminded_at: new Date().toISOString() })
            .in("id", remindedIds);
        }

        return new Response(
          JSON.stringify({ ok: true, found: leads.length, telegram_sent: sent }),
          { headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});
