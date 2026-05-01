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
import { aiDiagnose } from "./diagnostic-ai.server";
import { notifyNewLead } from "./notify-lead.functions";

/**
 * Submit answers, run diagnosis, persist a new session, return its id.
 * Every call creates an independent session — no restrictions per user/device/IP.
 */
export const submitDiagnosis = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitDiagnosisSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const aiResult = await aiDiagnose(data.answers, data.businessName);
      const diagnosis = aiResult ?? fallbackDiagnose(data.answers);
      const source: "ai" | "fallback" = aiResult ? "ai" : "fallback";

      const { id } = await insertSession({
        visitorId: data.visitorId,
        answers: data.answers,
        diagnosis,
        source,
        businessName: data.businessName,
      });

      // Fire-and-forget notification for every completed diagnosis
      notifyNewLead({
        data: {
          businessName: data.businessName,
          diagnosisNotes: diagnosis.diagnosis?.slice(0, 500),
          recommendedService: diagnosis.primary_service,
          answers: data.answers,
          source: "diagnostic",
        },
      }).catch((err) => console.error("[submitDiagnosis] notify error:", err));

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
  business_name?: string;
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
      business_name: session.business_name ?? undefined,
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
