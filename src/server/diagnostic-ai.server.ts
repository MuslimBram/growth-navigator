// Server-only Lovable AI integration for diagnostic engine.
// Now generates a DEEP analysis (sector, competition, weak spots, opportunities)
// for the admin/Telegram — not for the user.

import type { AnswersInput } from "@/lib/diagnostic-schemas";
import type { DiagnosisResult } from "@/lib/diagnostic-engine";
import type { ServiceKey } from "@/lib/diagnostic-types";
import { QUESTIONS } from "@/lib/diagnostic-types";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-pro";

const SERVICE_ENUM: ServiceKey[] = [
  "seo", "web_3d", "photo_video_360", "social_media",
  "google_maps", "combined_package", "automation", "ads",
  "analytics_measurement",
];

export interface DeepAnalysis {
  sector_guess: string;
  business_stage: string;
  main_strengths: string[];
  critical_weaknesses: string[];
  competitive_risks: string[];
  opportunities: string[];
  recommended_actions: string[]; // 3–5 concrete actions
  internal_notes: string; // for the agency owner — what to say in the call
  estimated_lost_clients_monthly: number;
  estimated_lost_eur_monthly: number;
}

const SYSTEM_PROMPT = `Ti je një konsulent strategjik dixhital senior për "Muslimi Digital", një agjenci shqiptare që ofron:
- seo, web_3d, photo_video_360, social_media, google_maps, combined_package, automation, ads, analytics_measurement.

Detyra jote: Bëj një ANALIZË TË THELLË për pronarin e biznesit (analiza NUK i tregohet klientit — i shkon vetëm ekipit të agjencisë në Telegram dhe Admin Panel).

ANALIZA DUHET TË JETË:
- Në shqip, profesionale, shumë specifike (jo gjenerike)
- E thellë: të identifikosh sektorin e mundshëm, fazën e biznesit, konkurrencën, rreziqet, mundësitë
- Të japësh 3–5 veprime KONKRETE që ekipi ynë mund t'i propozojë në kontaktin e parë
- Të shkruash "internal_notes" si nota për pronarin e agjencisë: çfarë të theksojë në bisedë me klientin, cila është dhimbja e vërtetë, çfarë oferte t'i propozojë

Përdor çdo grimcë informacioni — emrin e biznesit, kontekstin e lirë, screenshot-et (nëse ka).`;

function buildUserContent(
  answers: AnswersInput,
  businessName?: string,
  extraContext?: string,
  screenshots?: string[],
): Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }> {
  const answeredKeys = Object.keys(answers);
  const lines = QUESTIONS
    .filter((q) => answeredKeys.includes(q.key))
    .map((q) => {
      const val = (answers as Record<string, string>)[q.key];
      const opt = q.options.find((o) => o.value === val);
      return `- ${q.question}\n  Përgjigja: ${opt?.label ?? val} ${opt?.weak ? "[DOBËSI]" : "[OK]"}`;
    })
    .join("\n");

  const text = [
    `Emri i biznesit: ${businessName || "(nuk u dha)"}`,
    `Konteksti shtesë nga pronari: ${extraContext || "(nuk dha)"}`,
    "",
    "Përgjigjet e diagnozës:",
    lines,
    "",
    "Kthe analizën e plotë strukturuar.",
  ].join("\n");

  const content: Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }> = [
    { type: "text", text },
  ];

  if (screenshots && screenshots.length > 0) {
    for (const url of screenshots.slice(0, 6)) {
      content.push({ type: "image_url", image_url: { url } });
    }
  }

  return content;
}

export async function aiDiagnose(
  answers: AnswersInput,
  businessName?: string,
  extraContext?: string,
  screenshots?: string[],
): Promise<{ result: DiagnosisResult; deep: DeepAnalysis } | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    console.warn("[aiDiagnose] LOVABLE_API_KEY missing, skipping AI");
    return null;
  }

  const tool = {
    type: "function" as const,
    function: {
      name: "submit_deep_analysis",
      description: "Strukturo analizën e thellë të biznesit për ekipin e agjencisë.",
      parameters: {
        type: "object",
        properties: {
          short_diagnosis: {
            type: "string",
            description: "Diagnozë e shkurtër (2–4 fjali, max 500 karaktere) — për referencë të brendshme.",
          },
          primary_service: { type: "string", enum: SERVICE_ENUM },
          secondary_services: {
            type: "array",
            items: { type: "string", enum: SERVICE_ENUM },
            maxItems: 3,
          },
          sector_guess: { type: "string", description: "Sektori më i mundshëm (p.sh. 'restorant lokal', 'studio bukurie')." },
          business_stage: { type: "string", description: "Faza: start-up / e qëndrueshme / rritje / krizë." },
          main_strengths: { type: "array", items: { type: "string" }, maxItems: 4 },
          critical_weaknesses: { type: "array", items: { type: "string" }, maxItems: 5 },
          competitive_risks: { type: "array", items: { type: "string" }, maxItems: 4 },
          opportunities: { type: "array", items: { type: "string" }, maxItems: 5 },
          recommended_actions: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 5,
            description: "3–5 veprime KONKRETE që ekipi i agjencisë mund të propozojë në kontaktin e parë.",
          },
          internal_notes: {
            type: "string",
            description: "Notat strategjike për pronarin e agjencisë: çfarë të theksojë, cili është levëria emocionale, si ta mbyllë shitjen.",
          },
          estimated_lost_clients_monthly: { type: "number", minimum: 0, maximum: 100 },
          estimated_lost_eur_monthly: { type: "number", minimum: 0, maximum: 10000 },
        },
        required: [
          "short_diagnosis", "primary_service", "secondary_services",
          "sector_guess", "business_stage", "main_strengths",
          "critical_weaknesses", "competitive_risks", "opportunities",
          "recommended_actions", "internal_notes",
          "estimated_lost_clients_monthly", "estimated_lost_eur_monthly",
        ],
        additionalProperties: false,
      },
    },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserContent(answers, businessName, extraContext, screenshots) },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "submit_deep_analysis" } },
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn("[aiDiagnose] gateway error", res.status, await res.text().catch(() => ""));
      return null;
    }

    const json = await res.json();
    const call = json?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = call?.function?.arguments;
    if (!argsStr) return null;

    const parsed = JSON.parse(argsStr);
    if (!SERVICE_ENUM.includes(parsed.primary_service)) return null;

    const secondary: ServiceKey[] = Array.isArray(parsed.secondary_services)
      ? parsed.secondary_services.filter((s: string): s is ServiceKey => SERVICE_ENUM.includes(s as ServiceKey))
      : [];

    const diagnosis = String(parsed.short_diagnosis ?? "").trim().slice(0, 800);

    const result: DiagnosisResult = {
      diagnosis,
      primary_service: parsed.primary_service as ServiceKey,
      secondary_services: secondary.slice(0, 3),
      estimated_lost_clients: Math.max(0, Math.min(100, Math.round(Number(parsed.estimated_lost_clients_monthly) || 0))),
      estimated_lost_eur: Math.max(0, Math.min(10000, Math.round(Number(parsed.estimated_lost_eur_monthly) || 0))),
    };

    const deep: DeepAnalysis = {
      sector_guess: String(parsed.sector_guess ?? "").slice(0, 200),
      business_stage: String(parsed.business_stage ?? "").slice(0, 200),
      main_strengths: (parsed.main_strengths ?? []).map((s: unknown) => String(s).slice(0, 200)).slice(0, 4),
      critical_weaknesses: (parsed.critical_weaknesses ?? []).map((s: unknown) => String(s).slice(0, 200)).slice(0, 5),
      competitive_risks: (parsed.competitive_risks ?? []).map((s: unknown) => String(s).slice(0, 200)).slice(0, 4),
      opportunities: (parsed.opportunities ?? []).map((s: unknown) => String(s).slice(0, 200)).slice(0, 5),
      recommended_actions: (parsed.recommended_actions ?? []).map((s: unknown) => String(s).slice(0, 300)).slice(0, 5),
      internal_notes: String(parsed.internal_notes ?? "").slice(0, 1500),
      estimated_lost_clients_monthly: result.estimated_lost_clients,
      estimated_lost_eur_monthly: result.estimated_lost_eur,
    };

    return { result, deep };
  } catch (err) {
    console.error("[aiDiagnose] failed:", err);
    return null;
  }
}
