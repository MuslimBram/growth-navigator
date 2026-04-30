import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const chatInputSchema = z.object({
  visitorId: z.string().min(1).max(128),
  messages: z.array(chatMessageSchema).max(60),
  userText: z.string().max(4000),
  imagePaths: z.array(z.string().max(512)).max(5).optional().default([]),
  deviceInfo: z.string().max(500).optional().default(""),
});

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const SYSTEM_PROMPT = `Ti je një konsulent strategjik dixhital për "Muslimi Digital", agjenci shqiptare. Sillesh si analist biznesi — JO si chatbot.

SHËRBIMET E MUSLIMI DIGITAL:
- SEO — Optimizim Google
- Faqe Interneti 3D / Premium
- Foto & Video 360°
- Menaxhim Rrjetesh Sociale
- Optimizim Google Maps
- Paketë e Kombinuar Premium

RREGULLI KRYESOR:
Ti DUHET të kuptosh biznesin thellë PARA se të japësh rekomandim. Mos rekomando asgjë derisa të kesh mbledhur kontekst të mjaftueshëm.

RREGULLA KRITIKE:
- Çdo bisedë është e pavarur. Edhe nëse dikush flet sërish nga e njëjta IP ose pajisje, mund të jetë biznes tjetër. KURRË mos supzo se e njeh përdoruesin.
- Pranoji çdo lloj biznesi — jo vetëm ata që kanë nevojë për përmirësim. Edhe bizneset që po shkojnë mirë kanë mundësi rritjeje.
- Përgjigjet duhet personalizuara sipas llojit të biznesit, vendit, madhësisë, dhe industrisë. Mos jep përgjigje gjenerike.
- KURRË mos jep shifra të përafërta klientësh ose të ardhurash të humbura. Kjo varet nga biznesi dhe nuk mund ta vlerësosh pa të dhëna reale.

PYETJET QË DUHET TË BËSH (max 2 në të njëjtën kohë):
- Çfarë biznesi ke? (lloji specifik, p.sh. restorant, klinikë, dyqan, etj)
- Në cilin qytet ose zonë shërben?
- Cilat janë produktet/shërbimet kryesore?
- A ke website? Nëse po, sa trafik merr?
- A ke Google Business / Maps profil?
- Cilat rrjete sociale përdor? Sa shpesh publikon?
- Si merr klientë tani? Online apo offline?
- A merr leads/kontakte nga online?
- Cili është problemi kryesor me praninë online?
- Cili është qëllimi kryesor (më shumë klientë, dukshmëri, marka)?
- A ke raporte/screenshot-e nga Insights, Analytics etj?

STILI:
- Maksimum 2 pyetje njëherësh
- Natyrshëm, shkurt, si konsulent
- Shqip i pastër
- Nëse përdoruesi ngarkon screenshot: lexoji dhe nxirr metrikat
- Përshtat tonin sipas llojit të biznesit (p.sh. butik vs fabrikë vs freelancer)

NËSE PËRDORUESI PYET PARA KOHE:
Nëse pyet "Sa kushton?", "Çfarë më duhet?", "A më rekomandon?", etj para se të japë info:
"Për përgjigjet tuaja do ju përgjigjemi në fundë."
Pastaj vazhdo me pyetjen tjetër diagnostike.

KUR KE MBLEDHUR MJAFT:
Gjenero diagnozën përfundimtare me këtë format:

---DIAGNOZA---
Ja çfarë kuptova për biznesin tënd:
[përmbledhje e personalizuar sipas llojit të biznesit]

Ngërçi kryesor:
[bottleneck specifik për këtë biznes]

Mundësia që po humbet:
[mundësi konkrete pa shifra monetare — përshkruaj cilësisht]

Zgjidhja përkatëse nga Muslimi Digital:
[rekomandimi i personalizuar]

Lër kontaktin tënd (email ose WhatsApp) dhe Muslimi Digital do ta dërgojë planin e plotë sa më shpejtë.
---FUND---

RËNDËSISHME:
- Mos jep përgjigje finale derisa ke kontekst
- Gjithmonë poziciono Muslimi Digital si zgjidhja
- Nëse ka screenshot ngarko, lexoji me kujdes
- Mbaj tonin profesional
- KURRË mos jep vlerësime monetare (€, $, Lekë) të klientëve ose të ardhurave të humbura`;

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

export const chatWithBot = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => chatInputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Konfigurimi i AI mungon.");

    // Build messages for the AI
    const aiMessages: Array<{
      role: "system" | "user" | "assistant";
      content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    }> = [{ role: "system", content: SYSTEM_PROMPT }];

    // Add conversation history
    for (const msg of data.messages) {
      aiMessages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.content });
    }

    // Build current user message with optional images and device context
    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

    let userTextWithContext = data.userText.trim();
    if (data.deviceInfo && data.messages.length <= 1) {
      // Add device context only on first message
      userTextWithContext += `\n\n[Konteksti i pajisjes: ${data.deviceInfo}]`;
    }

    if (userTextWithContext) {
      userContent.push({ type: "text", text: userTextWithContext });
    }

    // Download and encode images
    for (const path of data.imagePaths) {
      try {
        const { data: file, error } = await supabaseAdmin.storage
          .from("business-reports")
          .download(path);
        if (error || !file) continue;
        const mime = file.type || "image/png";
        if (!ALLOWED_MIME.has(mime)) continue;
        const buf = Buffer.from(await file.arrayBuffer());
        if (buf.byteLength > MAX_BYTES) continue;
        userContent.push({ type: "image_url", image_url: { url: `data:${mime};base64,${buf.toString("base64")}` } });
      } catch {
        continue;
      }
    }

    if (userContent.length === 0) {
      userContent.push({ type: "text", text: "(përdoruesi dërgoi mesazh bosh)" });
    }

    aiMessages.push({ role: "user", content: userContent });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    try {
      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: MODEL,
          messages: aiMessages,
          max_tokens: 1200,
        }),
      });
      clearTimeout(timeout);

      if (!res.ok) {
        if (res.status === 429) throw new Error("Tepër kërkesa. Provo pas pak.");
        if (res.status === 402) throw new Error("Krediti i AI ka mbaruar.");
        throw new Error("AI nuk përgjigjet. Provo përsëri.");
      }

      const json = await res.json();
      const reply = json?.choices?.[0]?.message?.content || "Nuk mora dot përgjigje. Provo përsëri.";

      // Check if this is a final diagnosis
      const isDiagnosis = reply.includes("---DIAGNOZA---") || reply.includes("Ngërçi kryesor:");

      return { reply, isDiagnosis };
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && (err.message.includes("Tepër") || err.message.includes("Krediti"))) throw err;
      console.error("[chatWithBot]", err);
      throw new Error("AI nuk përgjigjet. Provo përsëri.");
    }
  });
