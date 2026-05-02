import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useT, useI18n, SERVICE_LABELS_I18N } from "@/lib/i18n";
import type { ServiceKey } from "@/lib/diagnostic-types";
import { getSavedAnalyses } from "./historiku";

export const Route = createFileRoute("/krahaso")({
  head: () => ({
    meta: [
      { title: "Compare Analyses — Muslimi Digital" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ComparePage,
});

interface SavedAnalysis {
  sessionId: string;
  businessName: string;
  diagnosis: string;
  primaryService: string;
  secondaryServices: string[];
  mainBottleneck?: string;
  answers: Record<string, string>;
  createdAt: string;
  source: "diagnostic" | "chatbot";
}

function ComparePage() {
  const t = useT();
  const { locale } = useI18n();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [selected, setSelected] = useState<[string | null, string | null]>([null, null]);

  useEffect(() => {
    setAnalyses(getSavedAnalyses());
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev[0] === id) return [null, prev[1]];
      if (prev[1] === id) return [prev[0], null];
      if (!prev[0]) return [id, prev[1]];
      if (!prev[1]) return [prev[0], id];
      return [id, prev[1]];
    });
  };

  const left = analyses.find((a) => a.sessionId === selected[0]);
  const right = analyses.find((a) => a.sessionId === selected[1]);
  const dateLocale = locale === "sq" ? "sq-AL" : "en-US";

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-50" />

      <header className="relative z-10 mx-auto flex max-w-5xl items-center gap-3 px-4 py-6 sm:px-6">
        <Link
          to="/historiku"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/60 text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-lg font-bold sm:text-xl">
          {t("cmp.title")}
        </h1>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        {/* Selector */}
        {(!left || !right) && (
          <div className="mb-8">
            <p className="mb-3 text-sm text-muted-foreground">
              {t("cmp.pick_prefix")}
              {!left && !right ? t("cmp.pick_two") : t("cmp.pick_one_more")}
              {t("cmp.pick_suffix")}
            </p>
            <div className="space-y-2">
              {analyses.map((a) => {
                const isSelected = selected.includes(a.sessionId);
                return (
                  <button
                    key={a.sessionId}
                    onClick={() => toggle(a.sessionId)}
                    className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-surface hover:border-primary/40"
                    }`}
                  >
                    <div>
                      <span className="font-medium text-sm">
                        {a.businessName || t("cmp.unnamed")}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleDateString(dateLocale)}
                      </span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Comparison */}
        {left && right && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <CompareCard analysis={left} label={t("cmp.label_a")} />
              <CompareCard analysis={right} label={t("cmp.label_b")} />
            </div>

            <button
              onClick={() => setSelected([null, null])}
              className="mt-6 text-sm text-muted-foreground hover:text-foreground"
            >
              {t("cmp.choose_others")}
            </button>
          </motion.div>
        )}

        {analyses.length < 2 && (
          <div className="mt-12 rounded-2xl border border-border bg-surface p-10 text-center">
            <p className="text-muted-foreground">
              {t("cmp.need_two")}
            </p>
            <Link
              to="/diagnoze"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              {t("cmp.start_diag")}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function CompareCard({
  analysis,
  label,
}: {
  analysis: SavedAnalysis;
  label: string;
}) {
  const t = useT();
  const { locale } = useI18n();
  const labels = SERVICE_LABELS_I18N[locale];
  const dateLocale = locale === "sq" ? "sq-AL" : "en-US";
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">
        {label}
      </div>
      <h3 className="font-display text-lg font-bold">
        {analysis.businessName || t("cmp.unnamed")}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {new Date(analysis.createdAt).toLocaleString(dateLocale)}
      </p>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <span className="text-xs text-muted-foreground">{t("cmp.main_service_label")}</span>
          <p className="font-semibold text-primary">
            {labels[analysis.primaryService as ServiceKey] || analysis.primaryService}
          </p>
        </div>

        {analysis.diagnosis && (
          <div>
            <span className="text-xs text-muted-foreground">{t("cmp.diagnosis_label")}</span>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {analysis.diagnosis}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
