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

    try {
      // Use the AI Gateway to translate in one batch
      const response = await fetch("https://api.lovable.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a professional marketing translator. Translate the following business case studies from Albanian to English. 
              Keep tone professional and concise. 
              - Do NOT change numbers, percentages, or proper business names.
              - Translate "industry", "title", "result_summary", "testimonial".
              - Inside "metrics", translate the "label" field (e.g. "pacientë/muaj" -> "patients/month").
              - Return ONLY a JSON array of objects matching the input structure.`,
            },
            {
              role: "user",
              content: JSON.stringify(items.map(i => ({
                id: i.id,
                title: i.title,
                industry: i.industry,
                result_summary: i.result_summary,
                testimonial: i.testimonial,
                metrics: i.metrics
              }))),
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      const result = await response.json();
      const translatedData = JSON.parse(result.choices[0].message.content);
      
      // The AI might return { "items": [...] } or just [...] depending on formatting
      const translatedArray = Array.isArray(translatedData) ? translatedData : translatedData.items || [];

      // Merge translations back into original items (keeping image_url, client_name etc)
      return items.map(original => {
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
      console.error("Translation error:", error);
      return items; // Fallback to original
    }
  });
