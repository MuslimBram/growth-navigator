import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getLastSessionId } from "@/lib/visitor-id";
import { track } from "@/lib/analytics";
import { ExitIntentSurvey } from "@/components/ExitIntentSurvey";

export function Landing() {
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    setReturning(Boolean(getLastSessionId()));
    track({ event: "landing_view" });
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-radial-glow animate-slow-zoom" />
      <div className="pointer-events-none absolute left-1/2 top-[-20%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px] animate-pulse-glow" />

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary shadow-glow" />
          <span className="font-display text-sm font-semibold tracking-wide">
            MUSLIMI <span className="text-primary">DIGITAL</span>
          </span>
        </div>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Diagnozë Falas · 2 minuta
        </span>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-4xl flex-col items-center justify-center px-4 pb-12 pt-8 text-center sm:px-6 sm:pb-16 sm:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">
            Vende të limituara këtë muaj
          </span>
        </motion.div>

        {returning ? (
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="max-w-3xl text-balance text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
          >
            Ende nuk e ke{" "}
            <span className="text-gradient-primary">rregulluar</span> këtë problem?
          </motion.h1>
        ) : (
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="max-w-3xl text-balance text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
          >
            Nëse dikush kërkon shërbimin tënd sot…{" "}
            <span className="text-gradient-primary">
              a përfundon tek ti apo tek konkurrenti?
            </span>
          </motion.h1>
        )}

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg"
        >
          {returning
            ? "Apo do që të zbulosh ndonjë gjë tjetër? Nis një diagnozë të re falas."
            : "Zbulo brenda 2 minutash cilat shërbime i mungojnë biznesit tënd."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-8 flex flex-col items-center gap-3 sm:mt-10"
        >
          <Link
            to="/diagnoze"
            onClick={() => track({ event: "diagnosis_start", metadata: { source: "hero_cta" } })}
            className="group inline-flex items-center gap-3 rounded-full bg-gradient-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:scale-[1.03] hover:shadow-glow-soft sm:px-8 sm:py-4 sm:text-base"
          >
            Nis Diagnozën Falas
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            to="/analizo-biznesin"
            onClick={() => track({ event: "ai_analyze_start", metadata: { source: "hero_cta" } })}
            className="group inline-flex items-center gap-3 rounded-full border-2 border-primary px-6 py-3.5 text-sm font-semibold text-primary shadow-glow-soft transition-all hover:scale-[1.03] hover:bg-primary hover:text-primary-foreground sm:px-8 sm:py-4 sm:text-base"
          >
            Analizo me AI
            <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" />
          </Link>

          <p className="mt-4 text-xs text-muted-foreground">
            Pa email · pa regjistrim · 6 pyetje
          </p>
          <Link
            to="/historiku"
            className="mt-2 text-xs text-primary/60 hover:text-primary transition"
          >
            Shiko analizat e mëparshme →
          </Link>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-14 grid w-full max-w-2xl grid-cols-3 gap-3 border-t border-border pt-8 sm:mt-20 sm:gap-4 sm:pt-10"
        >
          {[
            { n: "6", l: "pyetje" },
            { n: "2 min", l: "kohë" },
            { n: "100%", l: "personalizuar" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                {s.n}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                {s.l}
              </div>
            </div>
          ))}
        </motion.div>
      </main>
      <ExitIntentSurvey />
    </div>
  );
}
