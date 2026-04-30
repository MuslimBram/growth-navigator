// Server-only Lovable AI integration for diagnostic engine.

import type { AnswersInput } from "@/lib/diagnostic-schemas";
import type { DiagnosisResult } from "@/lib/diagnostic-engine";
import type { ServiceKey } from "@/lib/diagnostic-types";
import { QUESTIONS } from "@/lib/diagnostic-types";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const SERVICE_ENUM: ServiceKey[] = [
  "seo", "web_3d", "photo_video_360", "social_media",
  "google_maps", "combined_package", "automation", "ads",
  "analytics_measurement",
];

const SYSTEM_PROMPT = `Ti je një konsulent strategjik dixhital për "Muslimi Digital", një agjenci që ofron këto shërbime:
- seo: SEO (optimizim Google)
- web_3d: Faqe interneti 3D / moderne
- photo_video_360: Foto & Video 360°
- social_media: Menaxhim rrjetesh sociale me fokus konvertimin
- google_maps: Optimizim Google Maps për biznes
- combined_package: Paketë e kombinuar premium
- automation: Automatizim & AI (chatbot, auto-reply, sisteme)
- ads: Reklama Dixhitale (Facebook/Google Ads)
- analytics_measurement: Matje & Analitikë

Detyra: Bazuar në përgjigjet e biznesit, identifiko shërbimin PRIMAR që i nevojitet dhe deri në 2 shërbime sekondare.
Diagnoza duhet:
- Të jetë në shqip, e ngrohtë por e drejtpërdrejtë
- Ta bëjë pronarin të ndihet i kuptuar dhe pak i pakënaqur me situatën aktuale
- Të mbyllet me siguri që ekziston një zgjidhje (pa e përmendur drejtpërdrejt emrin e shërbimit)
- 2-4 fjali, MAX 400 karaktere
- Pa emoji, pa lista, pa tituj

Llogarit gjithashtu humbjen e vlerësuar mujore (klientë + EUR), bazuar në vlerë mesatare ~80 EUR/klient. Konservativ: 0-60 klientë.`;

function buildUserPrompt(answers: AnswersInput): string {
  const answeredKeys = Object.keys(answers);
  const lines = QUESTIONS
    .filter((q) => answeredKeys.includes(q.key))
    .map((q) => {
      const val = (answers as Record<string, string>)[q.key];
      const opt = q.options.find((o) => o.value === val);
      return `- ${q.question}\n  Përgjigja: ${opt?.label ?? val} ${opt?.weak ? "[DOBËSI]" : "[OK]"}`;
    })
    .join("\n");
  return `Përgjigjet e biznesit:\n${lines}\n\nKthe diagnozën strukturuar.`;
}

export async function aiDiagnose(
  answers: AnswersInput,
): Promise<DiagnosisResult | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    console.warn("[aiDiagnose] LOVABLE_API_KEY missing, skipping AI");
    return null;
  }

  const tool = {
    type: "function" as const,
    function: {
      name: "submit_diagnosis",
      description: "Strukturo diagnozën finale për biznesin.",
      parameters: {
        type: "object",
        properties: {
          diagnosis: {
            type: "string",
            description: "Diagnoza në shqip, 2-4 fjali, max 400 karaktere.",
          },
          primary_service: { type: "string", enum: SERVICE_ENUM },
          secondary_services: {
            type: "array",
            items: { type: "string", enum: SERVICE_ENUM },
            maxItems: 2,
          },
          estimated_lost_clients: { type: "number", minimum: 0, maximum: 60 },
          estimated_lost_eur: { type: "number", minimum: 0, maximum: 6000 },
        },
        required: [
          "diagnosis", "primary_service", "secondary_services",
          "estimated_lost_clients", "estimated_lost_eur",
        ],
        additionalProperties: false,
      },
    },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

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
          { role: "user", content: buildUserPrompt(answers) },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "submit_diagnosis" } },
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      if (res.status === 429) console.warn("[aiDiagnose] rate limited (429)");
      else if (res.status === 402) console.warn("[aiDiagnose] credits exhausted (402)");
      else console.warn("[aiDiagnose] gateway error", res.status, await res.text());
      return null;
    }

    const json = await res.json();
    const call = json?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = call?.function?.arguments;
    if (!argsStr) {
      console.warn("[aiDiagnose] no tool_call arguments in response");
      return null;
    }

    const parsed = JSON.parse(argsStr);

    if (!SERVICE_ENUM.includes(parsed.primary_service)) return null;
    const secondary: ServiceKey[] = Array.isArray(parsed.secondary_services)
      ? parsed.secondary_services.filter((s: string): s is ServiceKey =>
          SERVICE_ENUM.includes(s as ServiceKey),
        )
      : [];

    const diagnosis = String(parsed.diagnosis ?? "").trim().slice(0, 600);
    if (!diagnosis) return null;

    return {
      diagnosis,
      primary_service: parsed.primary_service as ServiceKey,
      secondary_services: secondary.slice(0, 2),
      estimated_lost_clients: Math.max(0, Math.min(60, Math.round(Number(parsed.estimated_lost_clients) || 0))),
      estimated_lost_eur: Math.max(0, Math.min(6000, Math.round(Number(parsed.estimated_lost_eur) || 0))),
    };
  } catch (err) {
    console.error("[aiDiagnose] failed:", err);
    return null;
  }
}
