import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ALLOWED_REASONS = new Set([
  "not_sure_need",
  "no_time",
  "want_more_info",
  "other",
]);

export const Route = createFileRoute("/api/public/exit-survey")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const reason = String(body?.reason ?? "");
          if (!ALLOWED_REASONS.has(reason)) {
            return new Response("invalid reason", { status: 400 });
          }
          const visitor_id = body?.visitor_id ? String(body.visitor_id).slice(0, 128) : null;
          const details = body?.details ? String(body.details).slice(0, 500) : null;
          const email = body?.email ? String(body.email).slice(0, 200) : null;

          const { error } = await supabaseAdmin.from("exit_surveys").insert({
            visitor_id,
            reason,
            details,
            email,
          });
          if (error) {
            console.error("[exit-survey] insert error", error);
            return new Response("error", { status: 500 });
          }
          return new Response("ok", { status: 204 });
        } catch (e) {
          console.error("[exit-survey] handler error", e);
          return new Response("bad request", { status: 400 });
        }
      },
    },
  },
});
