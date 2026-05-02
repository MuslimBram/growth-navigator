import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { CaseStudyPreview } from "./CaseStudyPreview";
import { useT, useI18n, SERVICE_PAGE_CONTENT } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface ServicePageProps {
  /** Service key — content is pulled from SERVICE_PAGE_CONTENT in the user's locale */
  serviceKey: string;
  /** Optional CTA override; defaults to translated "Start free diagnosis" */
  ctaText?: string;
}

export function ServicePageLayout({ serviceKey, ctaText }: ServicePageProps) {
  const t = useT();
  const { locale } = useI18n();
  const content = SERVICE_PAGE_CONTENT[serviceKey]?.[locale]
    ?? SERVICE_PAGE_CONTENT[serviceKey]?.en;

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Content not available.</p>
      </div>
    );
  }

  const { title, subtitle, problem, problemPoints, solution, solutionPoints, results } = content;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {t("service.back")}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/diagnoze" className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90">
              {t("service.start_diag")}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        <section className="pt-16 pb-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl md:text-5xl font-bold mb-4"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            {subtitle}
          </motion.p>
        </section>

        <section className="py-12 border-t border-border">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <div className="text-xs uppercase tracking-wider text-destructive mb-2">{t("service.problem")}</div>
              <h2 className="font-display text-2xl font-bold mb-4">{problem}</h2>
              <ul className="space-y-3">
                {problemPoints.map((p, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                    {p}
                  </motion.li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-primary mb-2">{t("service.solution")}</div>
              <h2 className="font-display text-2xl font-bold mb-4">{solution}</h2>
              <ul className="space-y-3">
                {solutionPoints.map((p, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 text-sm text-foreground/80"
                  >
                    <CheckCircle className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    {p}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="py-12 border-t border-border">
          <div className="text-xs uppercase tracking-wider text-primary mb-4">{t("service.results")}</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {results.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center"
              >
                <div className="text-sm font-semibold text-foreground">{r}</div>
              </motion.div>
            ))}
          </div>
        </section>

        <CaseStudyPreview filterService={serviceKey} limit={2} title={t("service.case_real")} />

        <section className="py-16 text-center">
          <h2 className="font-display text-2xl font-bold mb-4">{t("service.cta_title")}</h2>
          <p className="text-muted-foreground mb-6">{t("service.cta_desc")}</p>
          <Link
            to="/diagnoze"
            className="inline-flex items-center gap-2 bg-gradient-primary px-8 py-4 rounded-xl font-semibold text-primary-foreground shadow-glow hover:scale-[1.02] transition-transform"
          >
            {ctaText ?? t("service.default_cta")} <ArrowRight className="h-5 w-5" />
          </Link>
        </section>
      </main>
    </div>
  );
}
