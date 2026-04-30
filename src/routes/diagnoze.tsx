import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Check, AlertCircle, Home } from "lucide-react";
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

const STORAGE_KEY = "md_diagnoze_progress";

interface PersistedState {
  step: number;
  answers: AnswersMap;
}

function loadProgress(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (typeof parsed.step !== "number" || typeof parsed.answers !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveProgress(state: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded */ }
}

function clearProgress() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

function DiagnozePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitOnceRef = useRef(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dynamic question list based on current answers
  const visibleQuestions = useMemo(() => getVisibleQuestions(answers), [answers]);
  const total = visibleQuestions.length;
  const current = visibleQuestions[step];
  const progress = total > 0 ? ((step) / total) * 100 : 0;

  // Restore progress on mount
  useEffect(() => {
    const saved = loadProgress();
    if (saved && Object.keys(saved.answers).length > 0) {
      setAnswers(saved.answers);
      const vis = getVisibleQuestions(saved.answers);
      setStep(Math.min(saved.step, vis.length - 1));
      track({ event: "resume_prompt_shown", step: saved.step });
    } else {
      track({ event: "diagnosis_start" });
    }
  }, []);

  // Persist after each answer
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      saveProgress({ step, answers });
    }
  }, [step, answers]);

  // Log exit if mid-flow
  useEffect(() => {
    const onLeave = () => {
      if (!submitOnceRef.current && Object.keys(answers).length > 0 && Object.keys(answers).length < total) {
        track({ event: "exit_diagnosis", step, metadata: { answered: Object.keys(answers).length } });
      }
    };
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, [step, answers, total]);

  const handleAnswer = (value: AnswerValue, weak: boolean) => {
    if (submitting || !current) return;
    setError(null);
    const next: AnswersMap = { ...answers, [current.key]: value };
    setAnswers(next);
    track({ event: "question_answered", step, metadata: { key: current.key, value, weak } });

    if (weak) {
      setFeedback(current.weakFeedback);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => advance(next), 1700);
    } else {
      advance(next);
    }
  };

  const advance = (collected: AnswersMap) => {
    setFeedback(null);
    // Recompute visible questions with updated answers
    const newVisible = getVisibleQuestions(collected);
    if (step + 1 >= newVisible.length) {
      void submit(collected);
    } else {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step === 0 || submitting) return;
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback(null);
    setStep(step - 1);
  };

  const submit = async (collected: AnswersMap) => {
    if (submitOnceRef.current) return;
    submitOnceRef.current = true;
    setSubmitting(true);
    setError(null);

    const parsed = answersSchema.safeParse(collected);
    if (!parsed.success) {
      submitOnceRef.current = false;
      setSubmitting(false);
      setError("Disa përgjigje mungojnë. Të lutem provo përsëri nga fillimi.");
      return;
    }

    try {
      const visitorId = getVisitorId();
      const { sessionId } = await submitDiagnosis({
        data: { answers: parsed.data, visitorId },
      });
      setLastSessionId(sessionId);
      clearProgress();
      track({ event: "diagnosis_complete", sessionId });
      navigate({ to: "/rezultati/$sessionId", params: { sessionId } });
    } catch (e) {
      console.error(e);
      submitOnceRef.current = false;
      setSubmitting(false);
      setError("Diçka shkoi keq gjatë analizës. Kontrollo lidhjen dhe provo përsëri.");
    }
  };

  const retrySubmit = () => {
    void submit(answers);
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
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0 || submitting}
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
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-2xl flex-col justify-center px-4 py-8 sm:px-6 sm:py-12">
        <AnimatePresence mode="wait">
          {error ? (
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
              <button
                type="button"
                onClick={retrySubmit}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:scale-[1.02]"
              >
                Provo Përsëri
                <ArrowRight className="h-4 w-4" />
              </button>
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
                Po analizojmë biznesin tënd…
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
