// Server-only: AI vision analysis for business reports.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type {
  BusinessAnalysisResult,
  ServiceKey,
} from "@/lib/business-analysis-types";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const VISION_MODEL = "google/gemini-2.5-flash"; // multimodal capable

const SERVICE_ENUM: ServiceKey[] = [
  "seo",
  "web_3d",
  "photo_video_360",
  "social_media",
  "google_maps",
  "combined_package",
];

const SYSTEM_PROMPT = `Ti je një analist strategjik dixhital për "Muslimi Digital", agjenci që ofron 6 shërbime:
- seo: Optimizim Google
- web_3d: Faqe interneti 3D / premium
- photo_video_360: Foto & Video 360°
- social_media: Menaxhim rrjetesh sociale për konvertim
- google_maps: Optimizim Google Maps
- combined_package: Paketë e kombinuar premium

DETYRA: Lexo me kujdes screenshot-et e raporteve të biznesit (Facebook/Instagram Insights, Google Business, Website analytics, etj.) si dhe çdo tekst që klienti ka shkruar. Nxirr metrikat kryesore, identifiko NGËRÇIN kryesor (bottleneck) që po pengon rritjen, dhe rekomando shërbimin e duhur.

LOGJIKA E DIAGNOZËS:
- Shumë shikime, pak klikime → problem konvertimi / CTA
- Shumë ndjekës, pak klientë → social media nuk konverton
- Trafik në website, pa kontakte → funnel i dobët në website
- S'ka të dhëna Google Maps → mungesë dukshmërie lokale
- Pa trafik nga search → problem SEO
- Përmbajtje e mirë, engagement i ulët → strategji përmbajtjeje

TONI:
- Si konsulent, jo si chatbot
- Shqip i pastër, i drejtpërdrejtë
- "emotional_message" duhet të jetë maksimum 2-3 rreshta, që shtyn pronarin të veprojë
- Nëse screenshot-et NUK lexohen qartë, vendos "unreadable": true dhe shpjego në "diagnosis"

Përgjigju gjithmonë vetëm përmes tool call-it të dhënë.`;

interface AnalyzeInput {
  visitorId: string;
  sessionId: string | null;
  imageDataUrls: string[]; // base64 data URLs ready for the model
  imagePaths: string[]; // storage paths (for DB record)
  userText: string;
}

function buildToolSchema() {
  return {
    type: "function" as const,
    function: {
      name: "submit_business_analysis",
      description: "Strukturo analizën finale të biznesit.",
      parameters: {
        type: "object",
        properties: {
          detected_metrics: {
            type: "object",
            properties: {
              views: { type: "string" },
              followers: { type: "string" },
              engagement: { type: "string" },
              link_clicks: { type: "string" },
              website_visits: { type: "string" },
              top_sources: { type: "array", items: { type: "string" } },
              top_locations: { type: "array", items: { type: "string" } },
              audience_notes: { type: "string" },
            },
          },
          main_bottleneck: { type: "string" },
          secondary_bottlenecks: { type: "array", items: { type: "string" } },
          risk_level: { type: "string", enum: ["low", "medium", "high"] },
          diagnosis: { type: "string" },
          recommended_primary_service: { type: "string", enum: SERVICE_ENUM },
          recommended_secondary_services: {
            type: "array",
            items: { type: "string", enum: SERVICE_ENUM },
            maxItems: 2,
          },
          emotional_message: { type: "string" },
          cta_summary: { type: "string" },
          unreadable: { type: "boolean" },
        },
        required: [
          "main_bottleneck",
          "diagnosis",
          "recommended_primary_service",
          "emotional_message",
        ],
        additionalProperties: false,
      },
    },
  };
}

function fallbackAnalysis(reason: string): BusinessAnalysisResult {
  return {
    detected_metrics: {},
    main_bottleneck: "Nuk u lexuan dot raportet qartë",
    secondary_bottlenecks: [],
    risk_level: "medium",
    diagnosis: reason,
    recommended_primary_service: "combined_package",
    recommended_secondary_services: [],
    emotional_message:
      "Na duhen të dhëna më të qarta për të identifikuar saktë ngërçin tënd.",
    cta_summary: "Na kontakto për një analizë më të thellë.",
    unreadable: true,
  };
}

async function callAI(
  imageDataUrls: string[],
  userText: string,
): Promise<BusinessAnalysisResult | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    console.warn("[businessAnalysis] LOVABLE_API_KEY missing");
    return null;
  }

  const userContent: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [];

  const intro = userText
    ? `Konteksti nga klienti:\n${userText}\n\nLexo screenshot-et më poshtë dhe nxirr analizën.`
    : "Lexo screenshot-et e raporteve të biznesit më poshtë dhe nxirr analizën.";
  userContent.push({ type: "text", text: intro });

  for (const url of imageDataUrls) {
    userContent.push({ type: "image_url", image_url: { url } });
  }

  if (imageDataUrls.length === 0 && userText) {
    userContent.push({
      type: "text",
      text: "S'ka screenshot — bazohu vetëm tek teksti. Nëse nuk mjafton, vendos 'unreadable': true.",
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [buildToolSchema()],
        tool_choice: {
          type: "function",
          function: { name: "submit_business_analysis" },
        },
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.warn("[businessAnalysis] gateway error", res.status, txt);
      if (res.status === 429)
        throw new Error("Tepër kërkesa. Provo përsëri pas pak.");
      if (res.status === 402)
        throw new Error("Krediti i AI ka mbaruar. Kontakto adminin.");
      return null;
    }

    const json = await res.json();
    const argsStr =
      json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argsStr) return null;

    const parsed = JSON.parse(argsStr);

    const primary: ServiceKey = SERVICE_ENUM.includes(
      parsed.recommended_primary_service,
    )
      ? parsed.recommended_primary_service
      : "combined_package";
    const secondary: ServiceKey[] = Array.isArray(
      parsed.recommended_secondary_services,
    )
      ? parsed.recommended_secondary_services
          .filter((s: string): s is ServiceKey =>
            SERVICE_ENUM.includes(s as ServiceKey),
          )
          .slice(0, 2)
      : [];

    return {
      detected_metrics: parsed.detected_metrics ?? {},
      main_bottleneck: String(parsed.main_bottleneck ?? "").slice(0, 300),
      secondary_bottlenecks: Array.isArray(parsed.secondary_bottlenecks)
        ? parsed.secondary_bottlenecks.slice(0, 4)
        : [],
      risk_level: ["low", "medium", "high"].includes(parsed.risk_level)
        ? parsed.risk_level
        : "medium",
      diagnosis: String(parsed.diagnosis ?? "").slice(0, 800),
      recommended_primary_service: primary,
      recommended_secondary_services: secondary,
      emotional_message: String(parsed.emotional_message ?? "").slice(0, 300),
      cta_summary: String(parsed.cta_summary ?? "").slice(0, 200),
      unreadable: Boolean(parsed.unreadable),
    };
  } catch (err) {
    if (err instanceof Error && err.message.includes("Krediti")) throw err;
    if (err instanceof Error && err.message.includes("Tepër")) throw err;
    console.error("[businessAnalysis] failed:", err);
    return null;
  }
}

export async function runBusinessAnalysis(input: AnalyzeInput): Promise<{
  id: string;
  analysis: BusinessAnalysisResult;
  source: "ai" | "fallback";
}> {
  let analysis = await callAI(input.imageDataUrls, input.userText);
  let source: "ai" | "fallback" = "ai";
  if (!analysis) {
    analysis = fallbackAnalysis(
      input.imageDataUrls.length === 0 && !input.userText
        ? "Nuk u dha asnjë informacion. Ngarko screenshot ose shkruaj statistika."
        : "AI nuk arriti të lexojë qartë. Ngarko një screenshot më të pastër ose shkruaj shifrat me tekst.",
    );
    source = "fallback";
  }

  const { data, error } = await supabaseAdmin
    .from("business_report_analyses")
    .insert({
      visitor_id: input.visitorId,
      session_id: input.sessionId,
      uploaded_images: input.imagePaths,
      user_text: input.userText || null,
      extracted_metrics: analysis.detected_metrics,
      ai_analysis: analysis as unknown as Record<string, unknown>,
      main_bottleneck: analysis.main_bottleneck,
      recommended_service: analysis.recommended_primary_service,
      ai_source: source,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[runBusinessAnalysis] insert error:", error);
    throw new Error("Analiza nuk u ruajt. Provo përsëri.");
  }

  return { id: data.id, analysis, source };
}
