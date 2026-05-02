import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useT, useI18n } from "@/lib/i18n";
import { translateCaseStudies } from "@/server/translate-content.functions";

interface CaseStudy {
  id: string;
  title: string;
  client_name: string | null;
  industry: string | null;
  problem: string;
  result_summary: string;
  metrics: any[];
  testimonial: string | null;
  testimonial_author: string | null;
  image_url: string | null;
  services: any[];
}

interface Props {
  /** If set, only show case studies matching this service */
  filterService?: string;
  /** Max items to show */
  limit?: number;
  /** Section title */
  title?: string;
}

export function CaseStudyPreview({ filterService, limit = 3, title }: Props) {
  const t = useT();
  const sectionTitle = title ?? t("landing.cases_title");
  const [items, setItems] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("case_studies")
        .select("id,title,client_name,industry,problem,result_summary,metrics,testimonial,testimonial_author,image_url,services,updated_at")
        .eq("published", true)
        .order("display_order", { ascending: true })
        .limit(limit * 2); // Fetch more to allow filtering

      if (!data) {
        setLoading(false);
        return;
      }

      let results = data as (CaseStudy & { updated_at: string })[];
      
      // Filter by service if needed
      if (filterService) {
        results = results.filter(cs =>
          Array.isArray(cs.services) && cs.services.includes(filterService)
        );
      }
      
      const finalItems = results.slice(0, limit);

      if (locale === "en" && finalItems.length > 0) {
        // Try cache first
        const translatedItems = await Promise.all(finalItems.map(async (item) => {
          const cacheKey = `mdg_cs_en_${item.id}_${item.updated_at}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached) return JSON.parse(cached);
          return null;
        }));

        const missingIndices = translatedItems.map((item, idx) => item === null ? idx : -1).filter(idx => idx !== -1);
        
        if (missingIndices.length > 0) {
          const toTranslate = missingIndices.map(idx => finalItems[idx]);
          const translated = await translateCaseStudies({ data: { items: toTranslate, targetLocale: "en" } });
          
          translated.forEach((item: any, i: number) => {
            const original = toTranslate[i];
            const cacheKey = `mdg_cs_en_${original.id}_${original.updated_at}`;
            localStorage.setItem(cacheKey, JSON.stringify(item));
            translatedItems[missingIndices[i]] = item;
          });
        }
        
        setItems(translatedItems);
      } else {
        setItems(finalItems);
      }
      setLoading(false);
    };

    load();
  }, [filterService, limit, locale]);

  if (loading || items.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">{sectionTitle}</h2>
          <Link
            to="/case-studies"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            {t("common.see_all")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map((cs, i) => (
            <motion.div
              key={cs.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card overflow-hidden group hover:border-primary/30 transition-colors"
            >
              {cs.image_url && (
                <div className="aspect-video bg-muted/30 overflow-hidden">
                  <img src={cs.image_url} alt={cs.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                  {cs.industry && <span className="bg-muted px-2 py-0.5 rounded">{cs.industry}</span>}
                  {cs.client_name && <span>· {cs.client_name}</span>}
                </div>
                <h3 className="font-display text-base font-bold leading-snug mb-2">{cs.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{cs.result_summary}</p>

                {Array.isArray(cs.metrics) && cs.metrics.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {cs.metrics.slice(0, 2).map((m: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-1 rounded bg-primary/5 border border-primary/20 px-2 py-1 text-[10px]">
                        <TrendingUp className="h-3 w-3 text-primary" />
                        <span className="font-bold text-primary">{m.value || m.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {cs.testimonial && (
                  <blockquote className="border-l-2 border-primary/30 pl-3 text-[11px] italic text-muted-foreground line-clamp-2">
                    "{cs.testimonial}"
                  </blockquote>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
