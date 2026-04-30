import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, ArrowRight, Home, Trash2, BarChart3, Plus } from "lucide-react";
import { SERVICE_LABELS } from "@/lib/diagnostic-types";
import type { ServiceKey } from "@/lib/diagnostic-types";

export const Route = createFileRoute("/historiku")({
  head: () => ({
    meta: [
      { title: "Historiku i Analizave — Muslimi Digital" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HistoryPage,
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

const STORAGE_KEY = "md_analysis_history";

export function getSavedAnalyses(): SavedAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAnalysis(analysis: SavedAnalysis) {
  if (typeof window === "undefined") return;
  const existing = getSavedAnalyses();
  // Don't duplicate
  if (existing.some((a) => a.sessionId === analysis.sessionId)) return;
  existing.unshift(analysis);
  // Keep max 50
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
}

export function deleteAnalysis(sessionId: string) {
  if (typeof window === "undefined") return;
  const existing = getSavedAnalyses();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(existing.filter((a) => a.sessionId !== sessionId))
  );
}

function HistoryPage() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);

  useEffect(() => {
    setAnalyses(getSavedAnalyses());
  }, []);

  const handleDelete = (sessionId: string) => {
    deleteAnalysis(sessionId);
    setAnalyses(getSavedAnalyses());
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-50" />

      <header className="relative z-10 mx-auto flex max-w-4xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/60 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <Home className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-lg font-bold sm:text-xl">
            Historiku i Analizave
          </h1>
        </div>
        <Link
          to="/diagnoze"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow sm:text-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Analizë e re
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        {analyses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 rounded-2xl border border-border bg-surface p-10 text-center"
          >
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h2 className="mt-4 font-display text-xl font-bold">
              Asnjë analizë ende
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Nis diagnozën e parë për të parë historikun këtu.
            </p>
            <Link
              to="/diagnoze"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Nis Diagnozën <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : (
          <>
            {analyses.length >= 2 && (
              <div className="mb-6 flex justify-end">
                <Link
                  to="/krahaso"
                  className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Krahaso 2 analiza
                </Link>
              </div>
            )}

            <div className="space-y-3">
              {analyses.map((a, i) => (
                <motion.div
                  key={a.sessionId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-border bg-surface p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm truncate">
                          {a.businessName || "Pa emër"}
                        </span>
                        <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {SERVICE_LABELS[a.primaryService as ServiceKey] || a.primaryService}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(a.createdAt).toLocaleString("sq-AL")}
                      </div>
                      {a.diagnosis && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                          {a.diagnosis}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        to="/rezultati/$sessionId"
                        params={{ sessionId: a.sessionId }}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted/40"
                      >
                        Shiko
                      </Link>
                      <button
                        onClick={() => handleDelete(a.sessionId)}
                        className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Fshi"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
