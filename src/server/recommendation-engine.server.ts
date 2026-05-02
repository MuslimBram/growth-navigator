// Server-only logic for generating admin service recommendations.
// Uses Lovable AI Gateway with tool calling to pick the best packages
// from the service_packages catalog based on diagnosis answers + analysis.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type PackageRow = Database["public"]["Tables"]["service_packages"]["Row"];

export interface RecommendationContext {
  businessName?: string | null;
  businessType?: string | null;
  city?: string | null;
  digitalScore?: number | null;
  answers?: Record<string, unknown> | null;
  diagnosis?: string | null;
  primaryService?: string | null;
  secondaryServices?: string[] | null;
  deepAnalysis?: Record<string, unknown> | null;
  extraContext?: string | null;
  userText?: string | null;
}

export interface AIRecommendation {
  recommended_package_ids: string[];
  reasoning: string;
  client_proposal_text: string;
  priority: "low" | "medium" | "high";
  key_problems: string[];
}

function getAdminClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function fetchActivePackages(): Promise<PackageRow[]> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("service_packages")
    .select("*")
    .eq("status", "active")
    .order("display_order");
  if (error) {
    console.error("[recommendation] fetchActivePackages error:", error);
    return [];
  }
  return data ?? [];
}

function buildPackageCatalog(packages: PackageRow[]): string {
  return packages
    .map(
      (p) =>
        `[${p.id}] ${p.name} | category=${p.category} | level=${p.level} | duration=${p.duration} | normal=$${p.normal_price} | offer=$${p.offer_price} | quote_only=${p.is_quote_only} | includes=${JSON.stringify(p.includes)}`,
    )
    .join("\n");
}

const SYSTEM_PROMPT = `Ti je këshilltar shitjesh dhe strategjie dixhitale për agjencinë Muslimi Digital (tregu shqiptar).
Detyra jote: bazuar në diagnozën e biznesit, zgjidh nga katalogu i paketave 1-3 paketa që i shërbejnë më mirë këtij biznesi, dhe shkruaj:
1) Një ARSYETIM të shkurtër (2-4 fjali) për Adminin — pse pikërisht këto paketa, çfarë problemi zgjidhin.
2) Një PROPOZIM profesional në shqip për t'ia dërguar klientit (3-5 fjali, ton miqësor por profesional, pa shitje agresive).
3) Prioriteti i lead-it (low/medium/high) bazuar në potencialin e shitjes.
4) 2-4 problemet kryesore të identifikuara.

REGULLAT:
- Nëse biznesi nuk ka website → propozo Website Bazë ose Avancuar.
- Nëse ka website të dobët → Website Avancuar ose Premium.
- Nëse ka rrjete sociale por poston rrallë → Paketa Bazë ose Avancuar Instagram.
- Nëse nuk ka strategji/hashtag/raport → Paketa Full Bazë ose Full Avancuar.
- Restorant / hotel / klinikë / dyqan / biznes me konkurrencë të fortë → kombinim Website + Instagram Full.
- Nëse kërkon rritje serioze → Website Avancuar + Paketa Full Avancuar.
- Nëse kërkon e-commerce / booking / shumë faqe → Website Premium (quote only) + shëno "Flet me Adminet".
- Preferoj kohëzgjatje 3-mujore për Instagram dhe 1-vit për Website kur biznesi është gati.
- Mos rekomando paketa nga e njëjta kategori me kohëzgjatje të ndryshme — vetëm një variant për kategori.
- Përdor VETËM ID-të nga katalogu i dhënë. Mos shpik ID.

PROPOZIMI për klientin: shqip, profesional, pa përmendur konkurrentët, pa premtime ekstreme. Përmend përfitimin kryesor.`;

export async function generateAIRecommendation(
  ctx: RecommendationContext,
  packages: PackageRow[],
): Promise<{ result: AIRecommendation; source: "ai" } | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    console.warn("[recommendation] LOVABLE_API_KEY missing");
    return null;
  }
  if (packages.length === 0) {
    console.warn("[recommendation] no active packages in catalog");
    return null;
  }

  const userPrompt = [
    `BIZNESI: ${ctx.businessName ?? "N/A"}`,
    `LLOJI: ${ctx.businessType ?? "N/A"}`,
    `QYTETI: ${ctx.city ?? "N/A"}`,
    `SCORE DIXHITAL: ${ctx.digitalScore ?? "N/A"}`,
    `SHËRBIMI PRIMARY: ${ctx.primaryService ?? "N/A"}`,
    `SHËRBIME DYTËSORE: ${(ctx.secondaryServices ?? []).join(", ") || "—"}`,
    "",
    "PËRGJIGJET E DIAGNOZËS:",
    JSON.stringify(ctx.answers ?? {}, null, 2),
    "",
    ctx.diagnosis ? `DIAGNOZA AI:\n${ctx.diagnosis}` : "",
    ctx.deepAnalysis ? `\nANALIZA E THELLË:\n${JSON.stringify(ctx.deepAnalysis, null, 2)}` : "",
    ctx.extraContext ? `\nKONTEKST EKSTRA:\n${ctx.extraContext}` : "",
    ctx.userText ? `\nTEKST NGA KLIENTI:\n${ctx.userText}` : "",
    "",
    "KATALOGU I PAKETAVE AKTIVE:",
    buildPackageCatalog(packages),
  ]
    .filter(Boolean)
    .join("\n");

  const tool = {
    type: "function" as const,
    function: {
      name: "submit_recommendation",
      description: "Dërgo rekomandimin e paketave për këtë biznes.",
      parameters: {
        type: "object",
        properties: {
          recommended_package_ids: {
            type: "array",
            items: { type: "string" },
            description: "Lista e ID-ve të paketave të zgjedhura nga katalogu (1-3 paketa).",
            minItems: 1,
            maxItems: 3,
          },
          reasoning: {
            type: "string",
            description: "Arsyetimi për Adminin (2-4 fjali në shqip).",
          },
          client_proposal_text: {
            type: "string",
            description: "Propozim profesional për klientin (3-5 fjali në shqip).",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          key_problems: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 5,
          },
        },
        required: [
          "recommended_package_ids",
          "reasoning",
          "client_proposal_text",
          "priority",
          "key_problems",
        ],
        additionalProperties: false,
      },
    },
  };

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "submit_recommendation" } },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("[recommendation] AI gateway error:", res.status, t);
      return null;
    }

    const data = await res.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      console.error("[recommendation] no tool call in response");
      return null;
    }

    const parsed = JSON.parse(call.function.arguments) as AIRecommendation;
    // Validate IDs exist in catalog
    const validIds = new Set(packages.map((p) => p.id));
    parsed.recommended_package_ids = parsed.recommended_package_ids.filter((id) =>
      validIds.has(id),
    );
    if (parsed.recommended_package_ids.length === 0) {
      console.error("[recommendation] AI returned no valid package IDs");
      return null;
    }

    return { result: parsed, source: "ai" };
  } catch (e) {
    console.error("[recommendation] generation failed:", e);
    return null;
  }
}

export interface RecommendationTotals {
  normal_price_total: number;
  offer_price_total: number;
  savings_total: number;
}

export function computeTotals(
  packageIds: string[],
  packages: PackageRow[],
): RecommendationTotals {
  let normal = 0;
  let offer = 0;
  for (const id of packageIds) {
    const p = packages.find((x) => x.id === id);
    if (!p) continue;
    normal += Number(p.normal_price) || 0;
    offer += Number(p.offer_price) || 0;
  }
  return {
    normal_price_total: normal,
    offer_price_total: offer,
    savings_total: Math.max(0, normal - offer),
  };
}

export interface PersistRecommendationInput {
  sessionId?: string | null;
  analysisId?: string | null;
  leadId?: string | null;
  businessName?: string | null;
  businessType?: string | null;
  city?: string | null;
  digitalScore?: number | null;
  ai: AIRecommendation;
  totals: RecommendationTotals;
  source: string;
}

export async function persistRecommendation(input: PersistRecommendationInput) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("admin_recommendations")
    .insert({
      session_id: input.sessionId ?? null,
      analysis_id: input.analysisId ?? null,
      lead_id: input.leadId ?? null,
      business_name: input.businessName ?? null,
      business_type: input.businessType ?? null,
      city: input.city ?? null,
      digital_score: input.digitalScore ?? null,
      key_problems: input.ai.key_problems,
      recommended_package_ids: input.ai.recommended_package_ids,
      reasoning: input.ai.reasoning,
      client_proposal_text: input.ai.client_proposal_text,
      normal_price_total: input.totals.normal_price_total,
      offer_price_total: input.totals.offer_price_total,
      savings_total: input.totals.savings_total,
      priority: input.ai.priority,
      status: "new",
      ai_source: input.source,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[recommendation] persist error:", error);
    throw error;
  }
  return data;
}

export async function generateAndPersistFromSession(
  sessionId: string,
  leadId?: string | null,
): Promise<string | null> {
  const admin = getAdminClient();
  const { data: session, error } = await admin
    .from("diagnostic_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  if (error || !session) {
    console.error("[recommendation] session not found:", sessionId, error);
    return null;
  }

  const answers = (session.answers ?? {}) as Record<string, unknown>;
  const businessType =
    (answers.business_type as string) ||
    (answers.businessType as string) ||
    (answers.industry as string) ||
    null;
  const city =
    (answers.city as string) ||
    (answers.location as string) ||
    null;

  const packages = await fetchActivePackages();
  const ctx: RecommendationContext = {
    businessName: session.business_name,
    businessType,
    city,
    answers,
    diagnosis: session.ai_diagnosis,
    primaryService: session.primary_service,
    secondaryServices: Array.isArray(session.secondary_services)
      ? (session.secondary_services as string[])
      : [],
    deepAnalysis: session.deep_analysis as Record<string, unknown> | null,
    extraContext: session.extra_context,
  };

  const aiRes = await generateAIRecommendation(ctx, packages);
  if (!aiRes) return null;

  const totals = computeTotals(aiRes.result.recommended_package_ids, packages);
  const inserted = await persistRecommendation({
    sessionId,
    leadId: leadId ?? null,
    businessName: session.business_name,
    businessType,
    city,
    ai: aiRes.result,
    totals,
    source: aiRes.source,
  });

  return inserted.id;
}

export async function generateAndPersistFromAnalysis(
  analysisId: string,
): Promise<string | null> {
  const admin = getAdminClient();
  const { data: analysis, error } = await admin
    .from("business_report_analyses")
    .select("*")
    .eq("id", analysisId)
    .single();
  if (error || !analysis) {
    console.error("[recommendation] analysis not found:", analysisId, error);
    return null;
  }

  const aiAnalysis = (analysis.ai_analysis ?? {}) as Record<string, unknown>;
  const metrics = (analysis.extracted_metrics ?? {}) as Record<string, unknown>;
  const businessName =
    (aiAnalysis.business_name as string) ||
    (metrics.business_name as string) ||
    null;
  const businessType =
    (aiAnalysis.business_type as string) ||
    (aiAnalysis.industry as string) ||
    (metrics.industry as string) ||
    null;
  const city =
    (aiAnalysis.city as string) ||
    (metrics.city as string) ||
    null;
  const digitalScore =
    (typeof metrics.digital_score === "number" ? metrics.digital_score : null) ||
    (typeof aiAnalysis.digital_score === "number"
      ? (aiAnalysis.digital_score as number)
      : null);

  const packages = await fetchActivePackages();
  const ctx: RecommendationContext = {
    businessName,
    businessType,
    city,
    digitalScore,
    answers: aiAnalysis,
    diagnosis: analysis.main_bottleneck,
    primaryService: analysis.recommended_service,
    deepAnalysis: aiAnalysis,
    userText: analysis.user_text,
  };

  const aiRes = await generateAIRecommendation(ctx, packages);
  if (!aiRes) return null;

  const totals = computeTotals(aiRes.result.recommended_package_ids, packages);
  const inserted = await persistRecommendation({
    analysisId,
    businessName,
    businessType,
    city,
    digitalScore,
    ai: aiRes.result,
    totals,
    source: aiRes.source,
  });

  return inserted.id;
}
