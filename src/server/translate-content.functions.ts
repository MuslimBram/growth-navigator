import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const translationSchema = z.object({
  items: z.array(z.any()),
  targetLocale: z.string(),
});

export const translateCaseStudies = createServerFn({ method: "POST" })
  .inputValidator((data) => translationSchema.parse(data))
  .handler(async ({ data }) => {
    const { items, targetLocale } = data;
    if (targetLocale === "sq" || items.length === 0) return items;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      console.error("[translate] LOVABLE_API_KEY missing");
      return items;
    }

    try {
      const payload = items.map((i) => ({
        id: i.id,
        title: i.title,
        industry: i.industry,
        result_summary: i.result_summary,
        testimonial: i.testimonial,
        metrics: i.metrics,
      }));

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                'You are a professional marketing translator. Translate Albanian business case-study fields into natural, fluent English. ' +
                'Rules: keep numbers, percentages, URLs, and proper business names unchanged. ' +
                'Translate the "industry", "title", "result_summary", and "testimonial" fields. ' +
                'Inside "metrics", translate the "label" property only (e.g., "pacientë/muaj" -> "patients/month"); leave "value" untouched. ' +
                'Return ONLY a valid JSON object of the form {"items":[...]} where each item has the SAME shape and SAME id as the input.',
            },
            {
              role: "user",
              content: JSON.stringify({ items: payload }),
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("[translate] AI Gateway error", response.status, text);
        return items;
      }

      const result = await response.json();
      const content = result?.choices?.[0]?.message?.content;
      if (!content) {
        console.error("[translate] empty AI response");
        return items;
      }

      const parsed = JSON.parse(content);
      const translatedArray = Array.isArray(parsed) ? parsed : parsed.items || [];

      return items.map((original) => {
        const trans = translatedArray.find((t: any) => t.id === original.id);
        if (!trans) return original;
        return {
          ...original,
          title: trans.title || original.title,
          industry: trans.industry || original.industry,
          result_summary: trans.result_summary || original.result_summary,
          testimonial: trans.testimonial || original.testimonial,
          metrics: trans.metrics || original.metrics,
        };
      });
    } catch (error) {
      console.error("[translate] error:", error);
      return items;
    }
  });
