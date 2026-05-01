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
import { aiDiagnose, type DeepAnalysis } from "./diagnostic-ai.server";
import { notifyNewLead } from "./notify-lead.functions";

/**
 * NEW FLOW: Submit answers + extra context + screenshots + lead contact in ONE call.
 * The diagnosis is generated server-side and NEVER returned to the client UI.
 * The user only gets a confirmation; the agency receives full analysis via Telegram + Admin.
 */
export const submitDiagnosis = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitDiagnosisSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const aiOutput = await aiDiagnose(
        data.answers,
        data.businessName,
        data.extraContext,
        data.screenshots,
      );

      const diagnosis = aiOutput?.result ?? fallbackDiagnose(data.answers);
      const deep: DeepAnalysis | null = aiOutput?.deep ?? null;
      const source: "ai" | "fallback" = aiOutput ? "ai" : "fallback";

      const { id } = await insertSession({
        visitorId: data.visitorId,
        answers: data.answers,
        diagnosis,
        source,
        businessName: data.businessName,
        extraContext: data.extraContext,
        screenshots: data.screenshots,
        deepAnalysis: deep,
      });

      // Persist the lead immediately (email/whatsapp captured before diagnosis)
      try {
        await insertLead({
          sessionId: id,
          email: data.email,
          whatsapp: data.whatsapp,
          businessName: data.businessName,
        });
      } catch (e) {
        console.error("[submitDiagnosis] insertLead failed:", e);
      }

      // Build the rich Telegram message
      const deepNotes = deep
        ? [
            `Sektori: ${deep.sector_guess}`,
            `Faza: ${deep.business_stage}`,
            "",
            `Dobësi kritike: ${deep.critical_weaknesses.join(" • ") || "—"}`,
            `Mundësi: ${deep.opportunities.join(" • ") || "—"}`,
            `Veprime: ${deep.recommended_actions.join(" • ") || "—"}`,
            "",
            `Nota strategjike: ${deep.internal_notes}`,
          ].join("\n")
        : diagnosis.diagnosis;

      // Fire-and-forget — never block the response
      notifyNewLead({
        data: {
          businessName: data.businessName,
          email: data.email,
          whatsapp: data.whatsapp,
          diagnosisNotes: deepNotes.slice(0, 3500),
          recommendedService: diagnosis.primary_service,
          answers: data.answers,
          source: "diagnostic",
        },
      }).catch((err) => console.error("[submitDiagnosis] notify error:", err));

      return { sessionId: id, ok: true };
    } catch (error) {
      console.error("[submitDiagnosis] error:", error);
      throw new Error("Diagnoza nuk u dërgua. Provo përsëri.");
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

// Legacy lead capture (still used by other forms / chatbot)
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
