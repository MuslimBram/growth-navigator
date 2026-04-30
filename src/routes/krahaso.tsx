import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Check } from "lucide-react";
import { SERVICE_LABELS } from "@/lib/diagnostic-types";
import type { ServiceKey } from "@/lib/diagnostic-types";
import { getSavedAnalyses } from "./historiku";

export const Route = createFileRoute("/krahaso")({
  head: () => ({
    meta: [
      { title: "Krahaso Analizat — Muslimi Digital" },
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
          Krahaso 2 Analiza
        </h1>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        {/* Selector */}
        {(!left || !right) && (
          <div className="mb-8">
            <p className="mb-3 text-sm text-muted-foreground">
              Zgjidh {!left && !right ? "2 analiza" : "1 analizë tjetër"} për krahasim:
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
                        {a.businessName || "Pa emër"}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleDateString("sq-AL")}
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
              <CompareCard analysis={left} label="Analiza A" />
              <CompareCard analysis={right} label="Analiza B" />
            </div>

            <button
              onClick={() => setSelected([null, null])}
              className="mt-6 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Zgjidh analiza të tjera
            </button>
          </motion.div>
        )}

        {analyses.length < 2 && (
          <div className="mt-12 rounded-2xl border border-border bg-surface p-10 text-center">
            <p className="text-muted-foreground">
              Duhen të paktën 2 analiza për krahasim.
            </p>
            <Link
              to="/diagnoze"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Nis Diagnozën
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
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">
        {label}
      </div>
      <h3 className="font-display text-lg font-bold">
        {analysis.businessName || "Pa emër"}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {new Date(analysis.createdAt).toLocaleString("sq-AL")}
      </p>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <span className="text-xs text-muted-foreground">Shërbimi kryesor:</span>
          <p className="font-semibold text-primary">
            {SERVICE_LABELS[analysis.primaryService as ServiceKey] || analysis.primaryService}
          </p>
        </div>

        {analysis.diagnosis && (
          <div>
            <span className="text-xs text-muted-foreground">Diagnoza:</span>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {analysis.diagnosis}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
