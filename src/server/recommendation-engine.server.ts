// Server-only logic for generating admin service recommendations.
// Uses Lovable AI Gateway with tool calling to pick the best packages
// + add-on services from the catalog based on diagnosis answers + analysis.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type PackageRow = Database["public"]["Tables"]["service_packages"]["Row"];
type AddonRow = Database["public"]["Tables"]["addon_services"]["Row"];
type MicroRow = Database["public"]["Tables"]["micro_services"]["Row"];

export type AddonDuration = "1_month" | "3_months" | "6_months" | "1_year";

export interface RecommendedAddon {
  addon_id: string;
  duration: AddonDuration;
  price: number;
  reason?: string;
}

export interface RecommendedMicroService {
  service_id: string;
  quantity: number;
  total_price: number;
  reason?: string;
}

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
  recommended_addons: RecommendedAddon[];
  recommended_micro_services: RecommendedMicroService[];
  reasoning: string;
  client_proposal_text: string;
  priority: "low" | "medium" | "high";
  key_problems: string[];
  boost_eligible: boolean;
  boost_eligibility_reason: string;
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

export async function fetchActiveAddons(): Promise<AddonRow[]> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("addon_services")
    .select("*")
    .eq("active", true)
    .order("display_order");
  if (error) {
    console.error("[recommendation] fetchActiveAddons error:", error);
    return [];
  }
  return data ?? [];
}

export async function fetchActiveMicroServices(): Promise<MicroRow[]> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("micro_services")
    .select("*")
    .eq("active", true)
    .order("display_order");
  if (error) {
    console.error("[recommendation] fetchActiveMicroServices error:", error);
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

function buildAddonCatalog(addons: AddonRow[]): string {
  return addons
    .map(
      (a) =>
        `[${a.id}] ${a.name} | category=${a.category} | platforms=${JSON.stringify(a.supported_platforms)} | features=${JSON.stringify(a.included_features)} | prices: 1m=$${a.price_1_month}, 3m=$${a.price_3_months}, 6m=$${a.price_6_months}, 1y=$${a.price_1_year}`,
    )
    .join("\n");
}

function buildMicroCatalog(items: MicroRow[]): string {
  return items
    .map(
      (m) =>
        `[${m.id}] ${m.service_name} (${m.variant}) | platform=${m.platform} | category=${m.category} | risk=${m.risk_level} | offer=$${m.offer_price} | use_case=${m.recommended_use_case ?? ""}`,
    )
    .join("\n");
}

// Boost eligibility gate
export interface BoostEligibility {
  eligible: boolean;
  reason: string;
}

export function checkBoostEligibility(ctx: RecommendationContext): BoostEligibility {
  const a = (ctx.answers ?? {}) as Record<string, unknown>;
  const blob = JSON.stringify(a).toLowerCase() + " " + (ctx.diagnosis ?? "").toLowerCase();
  const hasWebsite =
    blob.includes("website") && !blob.includes("nuk ka website") && !blob.includes("pa website");
  const hasContent =
    blob.includes("poston") || blob.includes("aktiv") || blob.includes("përmbajtje");
  const missing: string[] = [];
  if (!hasWebsite) missing.push("website");
  if (!hasContent) missing.push("përmbajtje aktive");
  if (missing.length > 0) {
    return { eligible: false, reason: `Mungon: ${missing.join(", ")}` };
  }
  return { eligible: true, reason: "Biznesi ka strategji + përmbajtje + website." };
}

const SYSTEM_PROMPT = `Ti je këshilltar shitjesh dhe strategjie dixhitale për agjencinë Muslimi Digital (tregu shqiptar).
Detyra jote: bazuar në diagnozën e biznesit, zgjidh nga katalogu paketat KRYESORE (1-3 paketa Instagram/Website) dhe nëse ka nevojë SHTO ADD-ONS (0-3 shërbime shtesë: optimizim, strategji, analizë, planifikim, menaxhim reklamash).

Pastaj shkruaj:
1) ARSYETIM për Adminin (3-5 fjali) — pse pikërisht këto paketa + add-ons.
2) PROPOZIM profesional në shqip për klientin (4-6 fjali, miqësor por profesional, përmend përfitimin kryesor, pa shitje agresive).
3) Prioriteti i lead-it (low/medium/high).
4) 2-4 problemet kryesore.

REGULLAT PËR PAKETAT KRYESORE:
- Nuk ka website → Website Bazë/Avancuar.
- Website i dobët → Website Avancuar/Premium.
- Instagram aktiv por dobët → Bazë/Avancuar Instagram.
- Pa strategji/raportim → Full Bazë/Avancuar Instagram.
- Restorant/hotel/klinikë/dyqan/konkurrencë e fortë → Website + Instagram Full.
- Rritje serioze → Website Avancuar + Full Avancuar Instagram.
- E-commerce/booking → Website Premium (quote only) + "Flet me Adminet".
- Vetëm një variant për kategori (mos përzie 1-muaj me 3-muaj nga e njëjta).

REGULLAT PËR ADD-ONS (sugjero kur është e nevojshme):
- "Optimizim për Biznesin" → poston pa reach, hashtag-e të dobët, pa SEO social, pa targetim.
- "Strategji Suksesi" → pa plan të qartë, pa objektiva, do rritje shitjesh, pa drejtim.
- "Analizë për Biznesin" → nuk di çfarë funksionon, ka reklama pa rezultat të qartë, shumë postime pak konvertime.
- "Planifikim Suksesi" → poston pa rregull, pa kalendar, harron të publikojë.
- "Menaxhim i Reklamave dhe Buxhetit" → do reklama me pagesë, ka buxhet por nuk di si, reklamat nuk sjellin rezultate.

KOHËZGJATJA E ADD-ONS: zgjidh "1_month" / "3_months" / "6_months" / "1_year" sipas situatës. Default praktik = "3_months" për shumicën, "1_year" kur biznesi do angazhim afatgjatë.

Shembuj:
- Instagram aktiv me angazhim të dobët → Paketa Avancuar Instagram + Optimizim (3m) + Analizë (3m).
- Poston rrallë pa plan → Paketa Bazë Instagram + Planifikim (3m) + Strategji (3m).
- Ka buxhet për reklama → Paketa Full Avancuar + Menaxhim Reklamash (3m) + Analizë (3m).

Përdor VETËM ID-të nga katalogu i dhënë. Mos shpik ID dhe mos shpik çmime — çmimi i add-on duhet të përputhet me kohëzgjatjen e zgjedhur.
Propozimi për klientin: shqip, profesional, pa konkurrentë, pa premtime ekstreme.`;

const ADDON_PRICE_KEYS: Record<AddonDuration, keyof AddonRow> = {
  "1_month": "price_1_month",
  "3_months": "price_3_months",
  "6_months": "price_6_months",
  "1_year": "price_1_year",
};

function priceForAddon(addon: AddonRow, duration: AddonDuration): number {
  const k = ADDON_PRICE_KEYS[duration];
  return Number(addon[k]) || 0;
}

export async function generateAIRecommendation(
  ctx: RecommendationContext,
  packages: PackageRow[],
  addons: AddonRow[] = [],
  microServices: MicroRow[] = [],
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

  const eligibility = checkBoostEligibility(ctx);
  const showMicroCatalog = eligibility.eligible && microServices.length > 0;

  const userPrompt = [
    `BIZNESI: ${ctx.businessName ?? "N/A"}`,
    `LLOJI: ${ctx.businessType ?? "N/A"}`,
    `QYTETI: ${ctx.city ?? "N/A"}`,
    `SCORE DIXHITAL: ${ctx.digitalScore ?? "N/A"}`,
    `SHËRBIMI PRIMARY: ${ctx.primaryService ?? "N/A"}`,
    `SHËRBIME DYTËSORE: ${(ctx.secondaryServices ?? []).join(", ") || "—"}`,
    `BOOST ELIGIBLE: ${eligibility.eligible ? "PO" : "JO"} (${eligibility.reason})`,
    "",
    "PËRGJIGJET E DIAGNOZËS:",
    JSON.stringify(ctx.answers ?? {}, null, 2),
    "",
    ctx.diagnosis ? `DIAGNOZA AI:\n${ctx.diagnosis}` : "",
    ctx.deepAnalysis ? `\nANALIZA E THELLË:\n${JSON.stringify(ctx.deepAnalysis, null, 2)}` : "",
    ctx.extraContext ? `\nKONTEKST EKSTRA:\n${ctx.extraContext}` : "",
    ctx.userText ? `\nTEKST NGA KLIENTI:\n${ctx.userText}` : "",
    "",
    "KATALOGU I PAKETAVE KRYESORE:",
    buildPackageCatalog(packages),
    "",
    "KATALOGU I ADD-ONS (shërbime shtesë):",
    addons.length > 0 ? buildAddonCatalog(addons) : "(asnjë add-on aktiv)",
    "",
    "KATALOGU I MICRO SERVICES (boost on-demand — opsionale):",
    showMicroCatalog
      ? buildMicroCatalog(microServices)
      : "(NUK lejohet boost — biznesi nuk plotëson kushtet, lëre array-in bosh)",
  ]
    .filter(Boolean)
    .join("\n");

  const tool = {
    type: "function" as const,
    function: {
      name: "submit_recommendation",
      description: "Dërgo rekomandimin për këtë biznes (paketa + add-ons + micro services boost).",
      parameters: {
        type: "object",
        properties: {
          recommended_package_ids: {
            type: "array",
            items: { type: "string" },
            description: "ID-të e paketave kryesore (1-3).",
            minItems: 1,
            maxItems: 3,
          },
          recommended_addons: {
            type: "array",
            description: "Add-ons të sugjeruara (0-3). Bosh nëse nuk ka nevojë.",
            maxItems: 3,
            items: {
              type: "object",
              properties: {
                addon_id: { type: "string" },
                duration: { type: "string", enum: ["1_month", "3_months", "6_months", "1_year"] },
                reason: { type: "string" },
              },
              required: ["addon_id", "duration", "reason"],
              additionalProperties: false,
            },
          },
          recommended_micro_services: {
            type: "array",
            description:
              "Micro services boost (0-4). VETËM nëse BOOST ELIGIBLE=PO. Përdor vetëm IDs nga katalogu.",
            maxItems: 4,
            items: {
              type: "object",
              properties: {
                service_id: { type: "string" },
                quantity: { type: "integer", minimum: 1, maximum: 50 },
                reason: { type: "string", description: "Pse u sugjerua (1 fjali shqip)." },
              },
              required: ["service_id", "quantity", "reason"],
              additionalProperties: false,
            },
          },
          reasoning: { type: "string" },
          client_proposal_text: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          key_problems: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
        },
        required: [
          "recommended_package_ids",
          "recommended_addons",
          "recommended_micro_services",
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
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
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
      console.error("[recommendation] AI gateway error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) return null;

    const parsed = JSON.parse(call.function.arguments) as {
      recommended_package_ids: string[];
      recommended_addons?: Array<{ addon_id: string; duration: AddonDuration; reason?: string }>;
      recommended_micro_services?: Array<{ service_id: string; quantity: number; reason?: string }>;
      reasoning: string;
      client_proposal_text: string;
      priority: "low" | "medium" | "high";
      key_problems: string[];
    };

    const validPkgIds = new Set(packages.map((p) => p.id));
    const validAddonMap = new Map(addons.map((a) => [a.id, a]));
    const validMicroMap = new Map(microServices.map((m) => [m.id, m]));

    const filteredPkgs = parsed.recommended_package_ids.filter((id) => validPkgIds.has(id));
    if (filteredPkgs.length === 0) return null;

    const filteredAddons: RecommendedAddon[] = (parsed.recommended_addons ?? [])
      .filter((a) => validAddonMap.has(a.addon_id))
      .map((a) => {
        const addon = validAddonMap.get(a.addon_id)!;
        return {
          addon_id: a.addon_id,
          duration: a.duration,
          price: priceForAddon(addon, a.duration),
          reason: a.reason,
        };
      });

    const filteredMicros: RecommendedMicroService[] = eligibility.eligible
      ? (parsed.recommended_micro_services ?? [])
          .filter((m) => validMicroMap.has(m.service_id))
          .map((m) => {
            const ref = validMicroMap.get(m.service_id)!;
            const qty = Math.max(1, m.quantity || 1);
            return {
              service_id: m.service_id,
              quantity: qty,
              total_price: Number(ref.offer_price) * qty,
              reason: m.reason,
            };
          })
      : [];

    return {
      result: {
        recommended_package_ids: filteredPkgs,
        recommended_addons: filteredAddons,
        recommended_micro_services: filteredMicros,
        reasoning: parsed.reasoning,
        client_proposal_text: parsed.client_proposal_text,
        priority: parsed.priority,
        key_problems: parsed.key_problems,
        boost_eligible: eligibility.eligible,
        boost_eligibility_reason: eligibility.reason,
      },
      source: "ai",
    };
  } catch (e) {
    console.error("[recommendation] generation failed:", e);
    return null;
  }
}

export interface RecommendationTotals {
  normal_price_total: number;
  offer_price_total: number;
  savings_total: number;
  addons_total: number;
}

export function computeTotals(
  packageIds: string[],
  packages: PackageRow[],
  addonsSelection: RecommendedAddon[] = [],
): RecommendationTotals {
  let normal = 0;
  let offer = 0;
  for (const id of packageIds) {
    const p = packages.find((x) => x.id === id);
    if (!p) continue;
    normal += Number(p.normal_price) || 0;
    offer += Number(p.offer_price) || 0;
  }
  const addonsTotal = addonsSelection.reduce((s, a) => s + (Number(a.price) || 0), 0);
  return {
    normal_price_total: normal,
    offer_price_total: offer + addonsTotal,
    savings_total: Math.max(0, normal - offer),
    addons_total: addonsTotal,
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
      recommended_addons: input.ai.recommended_addons as never,
      reasoning: input.ai.reasoning,
      client_proposal_text: input.ai.client_proposal_text,
      normal_price_total: input.totals.normal_price_total,
      offer_price_total: input.totals.offer_price_total,
      savings_total: input.totals.savings_total,
      addons_total: input.totals.addons_total,
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

  const [packages, addons] = await Promise.all([fetchActivePackages(), fetchActiveAddons()]);
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

  const aiRes = await generateAIRecommendation(ctx, packages, addons);
  if (!aiRes) return null;

  const totals = computeTotals(
    aiRes.result.recommended_package_ids,
    packages,
    aiRes.result.recommended_addons,
  );
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

  const [packages, addons] = await Promise.all([fetchActivePackages(), fetchActiveAddons()]);
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

  const aiRes = await generateAIRecommendation(ctx, packages, addons);
  if (!aiRes) return null;

  const totals = computeTotals(
    aiRes.result.recommended_package_ids,
    packages,
    aiRes.result.recommended_addons,
  );
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

export function priceLookupForAddon(addon: AddonRow, duration: AddonDuration): number {
  return priceForAddon(addon, duration);
}
