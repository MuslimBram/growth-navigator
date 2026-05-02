import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Search, Globe, Camera, Share2, MapPin, Sparkles, Bot, BarChart3, Megaphone } from "lucide-react";
import { useT, useI18n, SERVICE_LABELS_I18N, SERVICE_TAGLINES_I18N } from "@/lib/i18n";
import type { ServiceKey } from "@/lib/diagnostic-types";

const ICONS: Record<ServiceKey, typeof Search> = {
  seo: Search,
  web_3d: Globe,
  photo_video_360: Camera,
  social_media: Share2,
  google_maps: MapPin,
  combined_package: Sparkles,
  automation: Bot,
  ads: Megaphone,
  analytics_measurement: BarChart3,
};

const ORDER: ServiceKey[] = [
  "seo",
  "web_3d",
  "photo_video_360",
  "social_media",
  "google_maps",
  "combined_package",
];

export function LandingSections() {
  const t = useT();
  const { locale } = useI18n();
  const labels = SERVICE_LABELS_I18N[locale];
  const taglines = SERVICE_TAGLINES_I18N[locale];

  const steps = [
    { n: "01", t: t("sections.how_1_title"), d: t("sections.how_1_desc") },
    { n: "02", t: t("sections.how_2_title"), d: t("sections.how_2_desc") },
    { n: "03", t: t("sections.how_3_title"), d: t("sections.how_3_desc") },
  ];

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
      {/* How it works */}
      <div className="mb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="mb-12 text-center"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("sections.how_title")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("sections.how_subtitle")}</p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <div className="font-display text-xs font-bold tracking-wider text-primary">
                {step.n}
              </div>
              <h3 className="mt-3 font-display text-xl font-bold">{step.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.d}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Services preview */}
      <div className="mb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="mb-12 text-center"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("sections.services_title")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("sections.services_subtitle")}</p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ORDER.map((key, i) => {
            const Icon = ICONS[key];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-2xl border border-border bg-surface p-6 transition-all hover:border-primary/40 hover:shadow-glow-soft"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold">{labels[key]}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {taglines[key]}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Final CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-surface p-6 text-center shadow-glow sm:rounded-3xl sm:p-10 md:p-14"
      >
        <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-40" />
        <div className="relative">
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {t("sections.cta_title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{t("sections.cta_desc")}</p>
          <Link
            to="/diagnoze"
            className="group mt-6 inline-flex items-center gap-3 rounded-full bg-gradient-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.03] sm:mt-8 sm:px-8 sm:py-4 sm:text-base"
          >
            {t("landing.cta_start")}
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="mt-16 flex items-center justify-center border-t border-border pt-8 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Muslimi Digital</span>
      </footer>
    </section>
  );
}
