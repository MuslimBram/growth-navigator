import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { SERVICE_LABELS, SERVICE_TAGLINES } from "@/lib/diagnostic-types";
import type { ServiceKey } from "@/lib/diagnostic-types";
import { getResult } from "@/server/diagnostic.functions";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { LeadCapture } from "@/components/LeadCapture";
import { WhatsAppCTA } from "@/components/WhatsAppCTA";

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

  // Gate the result behind lead capture
  const [unlocked, setUnlocked] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-50" />
      <main className="relative z-10 mx-auto max-w-2xl px-6 py-16">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/5 px-4 py-1.5 text-xs text-warning"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
          {unlocked ? "Diagnoza personale" : "Diagnoza është gati"}
        </motion.div>

        {/* Headline — always visible */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
        >
          {unlocked
            ? "Ja çfarë po ndodh me biznesin tënd"
            : "Diagnoza jote është gati 🔒"}
        </motion.h1>

        {!unlocked ? (
          <>
            {/* Locked teaser */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-6 text-lg leading-relaxed text-muted-foreground"
            >
              Bazuar në përgjigjet e tua, kemi identifikuar{" "}
              <span className="font-semibold text-foreground">
                shërbimin kryesor
              </span>{" "}
              që të mungon dhe një vlerësim konkret të{" "}
              <span className="font-semibold text-warning">
                klientëve dhe të ardhurave që po humbet çdo muaj
              </span>
              . Lër kontaktin më poshtë dhe merr raportin e plotë + planin
              personal — pa pagesë.
            </motion.p>

            {/* Blurred preview to build curiosity */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="relative mt-10"
            >
              <div className="pointer-events-none select-none blur-md grayscale">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Klientë të humbur / muaj
                    </div>
                    <div className="mt-2 font-display text-3xl font-bold text-warning sm:text-4xl">
                      ~●●
                    </div>
                  </div>
                  <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Të ardhura / muaj
                    </div>
                    <div className="mt-2 font-display text-3xl font-bold text-warning sm:text-4xl">
                      ~€●●●●
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-primary/40 bg-primary/5 p-6 shadow-glow">
                  <div className="text-xs uppercase tracking-wider text-primary">
                    Zgjidhja kryesore për ty
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-bold">
                    ●●●●●●●●●●●●●●
                  </h2>
                  <p className="mt-3 text-muted-foreground">
                    ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
                  </p>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-background/80 px-5 py-2.5 backdrop-blur">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Lër kontaktin për të zhbllokuar
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Lead capture — gate */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-10"
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
            {/* Unlocked: full diagnosis */}
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
              className="mt-4 text-lg leading-relaxed text-muted-foreground"
            >
              {data.diagnosis}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-10 grid grid-cols-2 gap-4"
            >
              <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Klientë të humbur / muaj
                </div>
                <div className="mt-2 font-display text-3xl font-bold text-warning sm:text-4xl">
                  <AnimatedCounter value={data.estimated_lost_clients} prefix="~" />
                </div>
              </div>
              <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Të ardhura / muaj
                </div>
                <div className="mt-2 font-display text-3xl font-bold text-warning sm:text-4xl">
                  <AnimatedCounter value={data.estimated_lost_eur} prefix="~€" />
                </div>
              </div>
            </motion.div>
            <p className="mt-3 text-xs text-muted-foreground">
              Vlerësim konservativ bazuar në përgjigjet e tua. Realiteti shpesh është më i lartë.
            </p>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-10 rounded-2xl border border-primary/40 bg-primary/5 p-6 shadow-glow sm:p-8"
            >
              <div className="text-xs uppercase tracking-wider text-primary">
                Zgjidhja kryesore për ty
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                {SERVICE_LABELS[primary]}
              </h2>
              <p className="mt-3 text-muted-foreground">{SERVICE_TAGLINES[primary]}</p>
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
                    <div className="font-semibold">{SERVICE_LABELS[s]}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {SERVICE_TAGLINES[s]}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center"
            >
              <h3 className="font-display text-lg font-bold">
                Të kontaktojmë brenda 24 orësh
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ekipi ynë do të të dërgojë një plan personal. Mund të na shkruash
                edhe direkt në WhatsApp.
              </p>
              <a
                href={`https://wa.me/355697221224?text=${encodeURIComponent(
                  `Përshëndetje! Sapo plotësova diagnozën. Më rekomandohet: ${SERVICE_LABELS[primary]}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
              >
                💬 Shkruaj në WhatsApp
              </a>
            </motion.div>
          </>
        )}

        <div className="mt-10 text-center">
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
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-bold">Diçka shkoi keq</h1>
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
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-bold">Sesioni nuk u gjet</h1>
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
