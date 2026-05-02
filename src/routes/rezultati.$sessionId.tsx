import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Lock, Sparkles, Plus, History, RefreshCw, Building2 } from "lucide-react";
import { CaseStudyPreview } from "@/components/CaseStudyPreview";
import { useT, useI18n, SERVICE_LABELS_I18N, SERVICE_TAGLINES_I18N } from "@/lib/i18n";
import type { ServiceKey } from "@/lib/diagnostic-types";
import { getResult } from "@/server/diagnostic.functions";
import { LeadCapture } from "@/components/LeadCapture";
import { WhatsAppCTA } from "@/components/WhatsAppCTA";
import { saveAnalysis } from "@/routes/historiku";

export const Route = createFileRoute("/rezultati/$sessionId")({
  head: () => ({
    meta: [
      { title: "Your Diagnosis — Muslimi Digital" },
      { name: "description", content: "Your personal business diagnosis." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: async ({ params }) => {
    const result = await getResult({ data: { sessionId: params.sessionId } });
    if (!result) throw notFound();
    return result;
  },
  errorComponent: ResultError,
  notFoundComponent: ResultNotFound,
  component: ResultPage,
});

function ResultPage() {
  const t = useT();
  const { locale } = useI18n();
  const labels = SERVICE_LABELS_I18N[locale];
  const taglines = SERVICE_TAGLINES_I18N[locale];

  const data = Route.useLoaderData();
  const primary = data.primary_service as ServiceKey;
  const secondaries = data.secondary_services as ServiceKey[];
  const businessName = data.business_name || "";

  const [unlocked, setUnlocked] = useState(false);

  // Save analysis to localStorage for history
  useEffect(() => {
    saveAnalysis({
      sessionId: data.id,
      businessName: businessName,
      diagnosis: data.diagnosis,
      primaryService: data.primary_service,
      secondaryServices: data.secondary_services as string[],
      answers: data.answers as Record<string, string>,
      createdAt: new Date().toISOString(),
      source: "diagnostic",
    });
  }, [data]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-50" />
      <main className="relative z-10 mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/5 px-4 py-1.5 text-xs text-warning"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
          {unlocked ? t("result.badge_unlocked") : t("result.badge_ready")}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl"
        >
          {unlocked
            ? businessName
              ? t("result.title_unlocked_named", { name: businessName })
              : t("result.title_unlocked")
            : t("result.title_locked")}
        </motion.h1>

        {!unlocked ? (
          <>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-4 text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg"
            >
              {t("result.intro_part1")}{" "}
              <span className="font-semibold text-foreground">
                {t("result.intro_emphasis")}
              </span>{" "}
              {t("result.intro_part2")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="relative mt-8 sm:mt-10"
            >
              <div className="pointer-events-none select-none blur-md grayscale">
                <div className="mt-4 rounded-2xl border border-primary/40 bg-primary/5 p-5 shadow-glow sm:p-6">
                  <div className="text-xs uppercase tracking-wider text-primary">
                    {t("result.solution_title")}
                  </div>
                  <h2 className="mt-2 font-display text-xl font-bold sm:text-2xl">
                    ●●●●●●●●●●●●●●
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                    ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
                  </p>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-background/80 px-4 py-2 backdrop-blur sm:px-5 sm:py-2.5">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium whitespace-pre-line sm:text-sm">
                    {t("result.locked_cta")}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-8 sm:mt-10"
            >
              <LeadCapture
                sessionId={data.id}
                primaryServiceLabel={labels[primary]}
                onSuccess={() => setUnlocked(true)}
              />
            </motion.div>
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary"
            >
              <Sparkles className="h-3 w-3" /> {t("result.unlocked_badge")}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {data.diagnosis}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 rounded-2xl border border-primary/40 bg-primary/5 p-5 shadow-glow sm:mt-10 sm:p-8"
            >
              <div className="text-xs uppercase tracking-wider text-primary">
                {t("result.solution_title")}
              </div>
              <h2 className="mt-2 font-display text-xl font-bold sm:text-2xl md:text-3xl">
                {labels[primary]}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">{taglines[primary]}</p>
            </motion.div>

            {secondaries.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t("result.plus_complement")}
                </div>
                {secondaries.map((s, i) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="font-semibold text-sm sm:text-base">{labels[s]}</div>
                    <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      {taglines[s]}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <WhatsAppCTA
              mainBottleneck={data.diagnosis || t("result.fallback_diagnosis")}
              recommendedService={labels[primary]}
              className="mt-10 sm:mt-12"
            />

            {/* Relevant case study */}
            <CaseStudyPreview
              filterService={primary}
              limit={1}
              title={t("result.case_similar")}
            />
          </>
        )}

        {/* Action buttons */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/diagnoze"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-[1.02] transition-all"
            >
              <Building2 className="h-4 w-4" />
              {t("result.analyze_other")}
            </Link>
            <Link
              to="/diagnoze"
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              <RefreshCw className="h-4 w-4" />
              {t("result.restart")}
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/historiku"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-elevated"
            >
              <History className="h-4 w-4" />
              {t("result.history")}
            </Link>
            <Link
              to="/krahaso"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-elevated"
            >
              <Plus className="h-4 w-4" />
              {t("result.compare")}
            </Link>
          </div>
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t("result.back_home")}
          </Link>
        </div>
      </main>
    </div>
  );
}

function ResultError({ error, reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 sm:px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-bold sm:text-2xl">{t("result.error_title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || t("result.error_default")}
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          {t("result.try_again")}
        </button>
      </div>
    </div>
  );
}

function ResultNotFound() {
  const t = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 sm:px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-bold sm:text-2xl">{t("result.notfound_title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("result.notfound_desc")}
        </p>
        <Link
          to="/diagnoze"
          className="mt-6 inline-flex rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          {t("result.start_new")}
        </Link>
      </div>
    </div>
  );
}
