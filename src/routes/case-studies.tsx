import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Quote, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/case-studies")({
  component: CaseStudiesPage,
  head: () => ({
    meta: [
      { title: "Case Studies — Muslimi Digital" },
      {
        name: "description",
        content:
          "How we have helped real businesses grow sales, customers and digital presence with SEO, 3D web, branding and automation.",
      },
      { property: "og:title", content: "Case Studies — Muslimi Digital" },
      {
        property: "og:description",
        content: "Real results from our clients.",
      },
    ],
  }),
});

interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  client_name: string | null;
  industry: string | null;
  problem: string;
  result_summary: string;
  metrics: any;
  testimonial: string | null;
  testimonial_author: string | null;
  image_url: string | null;
  services: any;
  display_order: number;
}

function CaseStudiesPage() {
  const t = useT();
  const [items, setItems] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("case_studies")
      .select("*")
      .eq("published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setItems(data as CaseStudy[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {t("common.back")}
          </Link>
          <Link
            to="/diagnoze"
            className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90"
          >
            {t("hist.start")}
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold text-foreground mb-4"
        >
          {t("cases.title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          {t("cases.subtitle")}
        </motion.p>
      </section>

      <main className="max-w-6xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-6">
              {t("cases.empty")}
            </p>
            <Link
              to="/diagnoze"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90"
            >
              {t("cases.be_first")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:gap-10">
            {items.map((cs, i) => (
              <motion.article
                key={cs.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                <div className="grid md:grid-cols-5 gap-0">
                  {cs.image_url && (
                    <div className="md:col-span-2 bg-muted/30 aspect-video md:aspect-auto">
                      <img
                        src={cs.image_url}
                        alt={cs.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className={`p-6 md:p-8 ${cs.image_url ? "md:col-span-3" : "md:col-span-5"}`}>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      {cs.industry && (
                        <span className="bg-muted px-2 py-0.5 rounded">{cs.industry}</span>
                      )}
                      {cs.client_name && <span>· {cs.client_name}</span>}
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">{cs.title}</h2>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{t("cases.problem")}</div>
                        <p className="text-foreground/80">{cs.problem}</p>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{t("cases.result")}</div>
                        <p className="text-foreground/80">{cs.result_summary}</p>
                      </div>
                    </div>

                    {Array.isArray(cs.metrics) && cs.metrics.length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mt-5">
                        {cs.metrics.slice(0, 3).map((m: any, idx: number) => (
                          <div key={idx} className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
                            <div className="text-xl font-bold text-primary flex items-center justify-center gap-1">
                              <TrendingUp className="h-4 w-4" /> {m.value}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {cs.testimonial && (
                      <blockquote className="mt-5 border-l-2 border-primary pl-4 text-sm italic text-foreground/80">
                        <Quote className="h-4 w-4 text-primary mb-1" />
                        "{cs.testimonial}"
                        {cs.testimonial_author && (
                          <footer className="text-xs text-muted-foreground mt-2 not-italic">
                            — {cs.testimonial_author}
                          </footer>
                        )}
                      </blockquote>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <Link
            to="/diagnoze"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            {t("cases.want_results")} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
