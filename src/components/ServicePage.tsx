import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { CaseStudyPreview } from "./CaseStudyPreview";

interface ServicePageProps {
  title: string;
  subtitle: string;
  problem: string;
  problemPoints: string[];
  solution: string;
  solutionPoints: string[];
  results: string[];
  serviceKey: string;
  ctaText?: string;
}

export function ServicePageLayout({
  title, subtitle, problem, problemPoints,
  solution, solutionPoints, results, serviceKey, ctaText = "Nis diagnozën falas",
}: ServicePageProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Kthehu
          </Link>
          <Link to="/diagnoze" className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90">
            Nis Diagnozën
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        {/* Hero */}
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

        {/* Problem */}
        <section className="py-12 border-t border-border">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <div className="text-xs uppercase tracking-wider text-destructive mb-2">⚠️ Problemi</div>
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

            {/* Solution */}
            <div>
              <div className="text-xs uppercase tracking-wider text-primary mb-2">✅ Zgjidhja</div>
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

        {/* Results */}
        <section className="py-12 border-t border-border">
          <div className="text-xs uppercase tracking-wider text-primary mb-4">📊 Rezultatet</div>
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

        {/* Case Studies */}
        <CaseStudyPreview
          filterService={serviceKey}
          limit={2}
          title="Rast real"
        />

        {/* CTA */}
        <section className="py-16 text-center">
          <h2 className="font-display text-2xl font-bold mb-4">Gati për të filluar?</h2>
          <p className="text-muted-foreground mb-6">Zbulo brenda 2 minutash se si mund të rritesh.</p>
          <Link
            to="/diagnoze"
            className="inline-flex items-center gap-2 bg-gradient-primary px-8 py-4 rounded-xl font-semibold text-primary-foreground shadow-glow hover:scale-[1.02] transition-transform"
          >
            {ctaText} <ArrowRight className="h-5 w-5" />
          </Link>
        </section>
      </main>
    </div>
  );
}
