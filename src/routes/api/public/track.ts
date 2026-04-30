import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ALLOWED_EVENTS = new Set([
  "landing_view",
  "diagnosis_start",
  "question_answered",
  "diagnosis_complete",
  "lead_captured",
  "exit_diagnosis",
  "exit_survey_shown",
  "exit_survey_answered",
  "resume_prompt_shown",
  "resume_accepted",
]);

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const event = String(body?.event ?? "");
          if (!ALLOWED_EVENTS.has(event)) {
            return new Response("invalid event", { status: 400 });
          }
          const visitor_id = body?.visitor_id ? String(body.visitor_id).slice(0, 128) : null;
          const session_id = body?.session_id ? String(body.session_id).slice(0, 64) : null;
          const step = typeof body?.step === "number" ? body.step : null;
          const metadata =
            body?.metadata && typeof body.metadata === "object" ? body.metadata : {};

          const { error } = await supabaseAdmin.from("analytics_events").insert({
            visitor_id,
            session_id,
            event,
            step,
            metadata,
          });
          if (error) {
            console.error("[track] insert error", error);
            return new Response("error", { status: 500 });
          }
          return new Response("ok", { status: 204 });
        } catch (e) {
          console.error("[track] handler error", e);
          return new Response("bad request", { status: 400 });
        }
      },
    },
  },
});
