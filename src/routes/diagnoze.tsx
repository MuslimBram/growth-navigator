import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { QUESTIONS, type AnswersMap, type AnswerValue } from "@/lib/diagnostic-types";

export const Route = createFileRoute("/diagnoze")({
  head: () => ({
    meta: [
      { title: "Diagnoza — Muslimi Digital" },
      {
        name: "description",
        content: "Përgjigju 6 pyetjeve të shkurtra për të zbuluar hendekun e biznesit tënd.",
      },
    ],
  }),
  component: DiagnozePage,
});

function DiagnozePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = QUESTIONS.length;
  const current = QUESTIONS[step];
  const progress = ((step + (feedback ? 1 : 0)) / total) * 100;

  const handleAnswer = (value: AnswerValue, weak: boolean) => {
    const next = { ...answers, [current.key]: value };
    setAnswers(next);
    if (weak) {
      setFeedback(current.weakFeedback);
      // Show feedback then advance
      setTimeout(() => advance(next), 1600);
    } else {
      advance(next);
    }
  };

  const advance = (collected: AnswersMap) => {
    setFeedback(null);
    if (step + 1 >= total) {
      // Final step → submit (logic in Phase 4/6). For now navigate to a placeholder result.
      submit(collected);
    } else {
      setStep(step + 1);
    }
  };

  const submit = async (collected: AnswersMap) => {
    setSubmitting(true);
    // PLACEHOLDER — real submission lands in Phase 4 (AI engine) + Phase 6 (mapping).
    // For now, generate a temporary id so the flow is testable end-to-end.
    const tempId = "preview-" + Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem(`md_answers_${tempId}`, JSON.stringify(collected));
    await new Promise((r) => setTimeout(r, 600));
    navigate({ to: "/rezultati/$sessionId", params: { sessionId: tempId } });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-50" />

      {/* Header with progress */}
      <header className="relative z-10 mx-auto max-w-2xl px-6 pt-8">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Pyetja{" "}
            <span className="font-semibold text-foreground">{step + 1}</span> nga{" "}
            <span className="font-semibold text-foreground">{total}</span>
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface">
          <motion.div
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-primary"
          />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-2xl flex-col justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {feedback ? (
            <motion.div
              key={`fb-${step}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-warning/30 bg-warning/5 p-8 text-center shadow-warning-glow"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/15">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                {feedback}
              </p>
            </motion.div>
          ) : submitting ? (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="font-display text-xl font-semibold">
                Po analizojmë biznesin tënd…
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Kjo zgjat disa sekonda.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={`q-${step}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-balance font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {current.question}
              </h1>
              {current.subtitle && (
                <p className="mt-3 text-balance text-base text-muted-foreground">
                  {current.subtitle}
                </p>
              )}

              <div className="mt-10 space-y-3">
                {current.options.map((opt) => {
                  const selected = answers[current.key] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(opt.value, opt.weak)}
                      className={`group flex w-full items-center justify-between rounded-xl border p-5 text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/10 shadow-glow"
                          : "border-border bg-surface hover:border-primary/40 hover:bg-surface-elevated"
                      }`}
                    >
                      <span className="font-medium">{opt.label}</span>
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background group-hover:border-primary/50"
                        }`}
                      >
                        {selected ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
