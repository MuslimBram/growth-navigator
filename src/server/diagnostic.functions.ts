import { createServerFn } from "@tanstack/react-start";
import {
  submitDiagnosisSchema,
  getResultSchema,
  submitLeadSchema,
} from "@/lib/diagnostic-schemas";
import { fallbackDiagnose } from "@/lib/diagnostic-engine";
import {
  insertSession,
  fetchSession,
  insertLead,
  type StoredSession,
} from "./diagnostic.server";

/**
 * Submit answers, run diagnosis, persist a new session, return its id.
 * AI integration is added in Phase 4 — this currently uses the fallback engine.
 */
export const submitDiagnosis = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitDiagnosisSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      // Phase 4 will replace this block with an AI call wrapped in try/catch
      // that falls back to fallbackDiagnose on failure.
      const diagnosis = fallbackDiagnose(data.answers);

      const { id } = await insertSession({
        visitorId: data.visitorId,
        answers: data.answers,
        diagnosis,
        source: "fallback",
      });

      return { sessionId: id };
    } catch (error) {
      console.error("[submitDiagnosis] error:", error);
      throw new Error("Diagnoza nuk u ruajt. Provo përsëri.");
    }
  });

export interface ResultPayload {
  id: string;
  diagnosis: string;
  primary_service: string;
  secondary_services: string[];
  estimated_lost_clients: number;
  estimated_lost_eur: number;
  answers: StoredSession["answers"];
  ai_source: string;
}

export const getResult = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => getResultSchema.parse(input))
  .handler(async ({ data }): Promise<ResultPayload | null> => {
    const session = await fetchSession(data.sessionId);
    if (!session) return null;

    return {
      id: session.id,
      diagnosis: session.ai_diagnosis ?? "",
      primary_service: session.primary_service ?? "combined_package",
      secondary_services: Array.isArray(session.secondary_services)
        ? session.secondary_services
        : [],
      estimated_lost_clients: session.estimated_lost_clients ?? 0,
      estimated_lost_eur: session.estimated_lost_eur ?? 0,
      answers: session.answers,
      ai_source: session.ai_source,
    };
  });

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitLeadSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const { id } = await insertLead({
        sessionId: data.sessionId,
        email: data.email,
        whatsapp: data.whatsapp,
        businessName: data.businessName,
      });
      return { leadId: id };
    } catch (error) {
      console.error("[submitLead] error:", error);
      throw new Error("Kontakti nuk u ruajt. Provo përsëri.");
    }
  });
