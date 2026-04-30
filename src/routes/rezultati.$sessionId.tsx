import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Lock, Sparkles, Plus, History } from "lucide-react";
import { SERVICE_LABELS, SERVICE_TAGLINES } from "@/lib/diagnostic-types";
import type { ServiceKey } from "@/lib/diagnostic-types";
import { getResult } from "@/server/diagnostic.functions";
import { LeadCapture } from "@/components/LeadCapture";
import { WhatsAppCTA } from "@/components/WhatsAppCTA";
import { saveAnalysis } from "@/routes/historiku";

export const Route = createFileRoute("/rezultati/$sessionId")({
  head: () => ({
    meta: [
      { title: "Rezultati i Diagnozës — Muslimi Digital" },
      { name: "description", content: "Diagnoza personale e biznesit tënd." },
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
  const data = Route.useLoaderData();
  const primary = data.primary_service as ServiceKey;
  const secondaries = data.secondary_services as ServiceKey[];

  const [unlocked, setUnlocked] = useState(false);

  // Save analysis to localStorage for history
  useEffect(() => {
    saveAnalysis({
      sessionId: data.id,
      businessName: "",
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
          {unlocked ? "Diagnoza personale" : "Diagnoza është gati"}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl"
        >
          {unlocked
            ? "Ja çfarë po ndodh me biznesin tënd"
            : "Diagnoza jote është gati 🔒"}
        </motion.h1>

        {!unlocked ? (
          <>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-4 text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg"
            >
              Bazuar në përgjigjet e tua, kemi identifikuar{" "}
              <span className="font-semibold text-foreground">
                shërbimin kryesor
              </span>{" "}
              që të mungon dhe një analizë konkrete të mundësive që po humbet.
              Lër kontaktin më poshtë dhe merr raportin e plotë + planin
              personal — pa pagesë.
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
                    Zgjidhja kryesore për ty
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
                    Lër kontaktin për t'ju dërguar{"\n"}rrezultatin dhe zgjidhjen!
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
                primaryServiceLabel={SERVICE_LABELS[primary]}
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
              <Sparkles className="h-3 w-3" /> Zhbllokuar
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
                Zgjidhja kryesore për ty
              </div>
              <h2 className="mt-2 font-display text-xl font-bold sm:text-2xl md:text-3xl">
                {SERVICE_LABELS[primary]}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">{SERVICE_TAGLINES[primary]}</p>
            </motion.div>

            {secondaries.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Plus këto e plotësojnë:
                </div>
                {secondaries.map((s, i) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="font-semibold text-sm sm:text-base">{SERVICE_LABELS[s]}</div>
                    <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                      {SERVICE_TAGLINES[s]}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <WhatsAppCTA
              mainBottleneck={data.diagnosis || "Mungon prania online"}
              recommendedService={SERVICE_LABELS[primary]}
              className="mt-10 sm:mt-12"
            />
          </>
        )}

        {/* Action buttons */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/diagnoze"
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" />
              Nis analizë të re
            </Link>
            <Link
              to="/historiku"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-elevated"
            >
              <History className="h-4 w-4" />
              Historiku
            </Link>
          </div>
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Kthehu në fillim
          </Link>
        </div>
      </main>
    </div>
  );
}

function ResultError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 sm:px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-bold sm:text-2xl">Diçka shkoi keq</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "Nuk arritëm të ngarkojmë rezultatin."}
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Provo Përsëri
        </button>
      </div>
    </div>
  );
}

function ResultNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 sm:px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-bold sm:text-2xl">Sesioni nuk u gjet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mund të ketë skaduar ose linku është i pasaktë.
        </p>
        <Link
          to="/diagnoze"
          className="mt-6 inline-flex rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Nis një diagnozë të re
        </Link>
      </div>
    </div>
  );
}
