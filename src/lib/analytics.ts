// Lightweight client-side analytics. Logs to /api/public/track which
// inserts into analytics_events server-side. Fire-and-forget — never
// blocks UX if it fails.

import { getVisitorId } from "./visitor-id";

export type FunnelEvent =
  | "landing_view"
  | "diagnosis_start"
  | "question_answered"
  | "diagnosis_complete"
  | "lead_captured"
  | "exit_diagnosis"
  | "exit_survey_shown"
  | "exit_survey_answered"
  | "resume_prompt_shown"
  | "resume_accepted"
  | "ai_analyze_start";

interface TrackPayload {
  event: FunnelEvent;
  step?: number;
  sessionId?: string | null;
  metadata?: Record<string, unknown>;
}

export function track(payload: TrackPayload) {
  if (typeof window === "undefined") return;
  const visitorId = getVisitorId();
  const body = JSON.stringify({
    visitor_id: visitorId,
    event: payload.event,
    step: payload.step,
    session_id: payload.sessionId,
    metadata: payload.metadata ?? {},
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/public/track", blob);
      return;
    }
  } catch {
    /* fall through to fetch */
  }

  // Fallback
  void fetch("/api/public/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
