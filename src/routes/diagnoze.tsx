import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Check, AlertCircle, Home, Building2 } from "lucide-react";
import {
  getVisibleQuestions,
  type AnswersMap,
  type AnswerValue,
} from "@/lib/diagnostic-types";
import { answersSchema } from "@/lib/diagnostic-schemas";
import { getVisitorId, setLastSessionId } from "@/lib/visitor-id";
import { submitDiagnosis } from "@/server/diagnostic.functions";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/diagnoze")({
  head: () => ({
    meta: [
      { title: "Diagnoza — Muslimi Digital" },
      {
        name: "description",
        content: "Përgjigju pyetjeve të shkurtra për të zbuluar hendekun e biznesit tënd.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DiagnozePage,
});

function DiagnozePage() {
  const navigate = useNavigate();
  // phase: "name" = business name input, "questions" = diagnostic questions
  const [phase, setPhase] = useState<"name" | "questions">("name");
  const [businessName, setBusinessName] = useState("");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dynamic question list based on current answers
  const visibleQuestions = useMemo(() => getVisibleQuestions(answers), [answers]);
  const total = visibleQuestions.length;
  const current = visibleQuestions[step];
  const progress = total > 0 ? ((step) / total) * 100 : 0;

  useEffect(() => {
    track({ event: "diagnosis_start" });
  }, []);

  // Cleanup feedback timer
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const startQuestions = () => {
    setPhase("questions");
    track({ event: "business_name_entered", metadata: { businessName: businessName || "(pa emër)" } });
  };

  const handleAnswer = (value: AnswerValue, weak: boolean) => {
    if (submitting || !current) return;
    setError(null);
    const next: AnswersMap = { ...answers, [current.key]: value };
    setAnswers(next);
    track({ event: "question_answered", step, metadata: { key: current.key, value, weak } });

    if (weak) {
      setFeedback(current.weakFeedback);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => advance(next), 2500);
    } else {
      advance(next);
    }
  };

  const advance = (collected: AnswersMap) => {
    setFeedback(null);
    const newVisible = getVisibleQuestions(collected);
    if (step + 1 >= newVisible.length) {
      void submit(collected);
    } else {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (submitting) return;
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback(null);
    if (step === 0) {
      setPhase("name");
    } else {
      setStep(step - 1);
    }
  };

  const submit = async (collected: AnswersMap) => {
    setSubmitting(true);
    setError(null);

    // Cast to plain string record for schema
    const plain: Record<string, string> = {};
    for (const [k, v] of Object.entries(collected)) {
      if (v) plain[k] = v;
    }

    const parsed = answersSchema.safeParse(plain);
    if (!parsed.success) {
      console.error("[diagnoze] validation failed:", parsed.error.issues, "answers:", plain);
      setSubmitting(false);
      // Instead of dead-end, try to submit anyway with raw data
      try {
        const visitorId = getVisitorId();
        const { sessionId } = await submitDiagnosis({
          data: { answers: plain, visitorId, businessName: businessName || undefined },
        });
        setLastSessionId(sessionId);
        track({ event: "diagnosis_complete", sessionId });
        navigate({ to: "/rezultati/$sessionId", params: { sessionId } });
        return;
      } catch (e2) {
        console.error("[diagnoze] fallback submit also failed:", e2);
        setError("Diçka shkoi keq. Provo përsëri ose rifillo diagnozën.");
        return;
      }
    }

    try {
      const visitorId = getVisitorId();
      const { sessionId } = await submitDiagnosis({
        data: { answers: parsed.data, visitorId, businessName: businessName || undefined },
      });
      setLastSessionId(sessionId);
      track({ event: "diagnosis_complete", sessionId });
      navigate({ to: "/rezultati/$sessionId", params: { sessionId } });
    } catch (e) {
      console.error(e);
      setSubmitting(false);
      setError("Diçka shkoi keq gjatë analizës. Kontrollo lidhjen dhe provo përsëri.");
    }
  };

  const retrySubmit = () => {
    void submit(answers);
  };

  const restart = () => {
    setPhase("name");
    setBusinessName("");
    setStep(0);
    setAnswers({});
    setFeedback(null);
    setSubmitting(false);
    setError(null);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    track({ event: "diagnosis_restart" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-50" />

      {/* Header with progress */}
      <header className="relative z-10 mx-auto max-w-2xl px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="mb-4 flex items-center gap-2">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/60 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Faqja kryesore"
          >
            <Home className="h-4 w-4" />
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary shadow-glow" />
            <span className="font-display text-xs font-semibold tracking-wide">
              MUSLIMI <span className="text-primary">DIGITAL</span>
            </span>
          </Link>
        </div>
        {phase === "questions" && (
          <>
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                onClick={goBack}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Mbrapa
              </button>
              <span>
                Pyetja{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(step + 1, total)}
                </span>{" "}
                nga <span className="font-semibold text-foreground">{total}</span>
              </span>
              <span className="tabular-nums">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface">
              <motion.div
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-primary"
              />
            </div>
          </>
        )}
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-2xl flex-col justify-center px-4 py-8 sm:px-6 sm:py-12">
        <AnimatePresence mode="wait">
          {phase === "name" ? (
            <motion.div
              key="name-phase"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">
                Si quhet biznesi yt?
              </h1>
              <p className="mt-3 text-base text-muted-foreground">
                Emri i biznesit ndihmon për një diagnozë më të personalizuar.
              </p>

              <div className="mx-auto mt-8 max-w-sm">
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="P.sh. Caffe Milano, Studio Bella..."
                  maxLength={120}
                  className="w-full rounded-xl border border-border bg-surface px-5 py-4 text-center text-lg font-medium text-foreground placeholder:text-muted-foreground/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") startQuestions();
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={startQuestions}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:scale-[1.02]"
                >
                  {businessName ? "Vazhdo me diagnozën" : "Vazhdo pa emër"}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <p className="mt-3 text-xs text-muted-foreground">
                  Mund ta lësh bosh — diagnoza funksionon njëlloj.
                </p>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="font-display text-lg font-semibold">{error}</p>
              <div className="mt-6 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={retrySubmit}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:scale-[1.02]"
                >
                  Provo Përsëri
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={restart}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Rifillo diagnozën nga fillimi
                </button>
              </div>
            </motion.div>
          ) : feedback ? (
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
                Po analizojmë{businessName ? ` "${businessName}"` : " biznesin tënd"}…
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Kjo zgjat disa sekonda.
              </p>
            </motion.div>
          ) : current ? (
            <motion.div
              key={`q-${current.key}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              {businessName && (
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
                  <Building2 className="h-3 w-3" />
                  {businessName}
                </div>
              )}
              <h1 className="text-balance font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">
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
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}
