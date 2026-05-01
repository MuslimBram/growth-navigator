// Server-only helpers for diagnostic sessions.
// Imported only from .functions.ts files — never from client code.

import { createClient } from "@supabase/supabase-js";
import type { DiagnosisResult } from "@/lib/diagnostic-engine";
import type { AnswersInput } from "@/lib/diagnostic-schemas";

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase server env vars are not configured");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface StoredSession {
  id: string;
  answers: AnswersInput;
  ai_diagnosis: string | null;
  primary_service: string | null;
  secondary_services: string[];
  estimated_lost_clients: number | null;
  estimated_lost_eur: number | null;
  ai_source: string;
  created_at: string;
  business_name: string | null;
}

export async function insertSession(params: {
  visitorId: string;
  answers: AnswersInput;
  diagnosis: DiagnosisResult;
  source: "ai" | "fallback";
  businessName?: string;
}): Promise<{ id: string }> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("diagnostic_sessions")
    .insert({
      visitor_id: params.visitorId,
      answers: params.answers,
      ai_diagnosis: params.diagnosis.diagnosis,
      primary_service: params.diagnosis.primary_service,
      secondary_services: params.diagnosis.secondary_services,
      estimated_lost_clients: params.diagnosis.estimated_lost_clients,
      estimated_lost_eur: params.diagnosis.estimated_lost_eur,
      ai_source: params.source,
      ...(params.businessName ? { business_name: params.businessName } : {}),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[insertSession] error:", error);
    throw new Error("Failed to save diagnostic session");
  }
  return { id: data.id };
}

export async function fetchSession(sessionId: string): Promise<StoredSession | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("diagnostic_sessions")
    .select(
      "id, answers, ai_diagnosis, primary_service, secondary_services, estimated_lost_clients, estimated_lost_eur, ai_source, created_at, business_name"
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    console.error("[fetchSession] error:", error);
    throw new Error("Failed to fetch diagnostic session");
  }
  if (!data) return null;
  return data as StoredSession;
}

export async function insertLead(params: {
  sessionId: string;
  email?: string;
  whatsapp?: string;
  businessName?: string;
}): Promise<{ id: string }> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("diagnostic_leads")
    .insert({
      session_id: params.sessionId,
      email: params.email ?? null,
      whatsapp: params.whatsapp ?? null,
      business_name: params.businessName ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[insertLead] error:", error);
    throw new Error("Failed to save lead");
  }
  return { id: data.id };
}
