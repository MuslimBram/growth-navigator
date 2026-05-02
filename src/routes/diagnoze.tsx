import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  ArrowLeft, ArrowRight, Check, AlertCircle, Home, Building2,
  ImagePlus, X as XIcon, Sparkles, Mail, Phone, Loader2,
} from "lucide-react";
import {
  getVisibleQuestions,
  type AnswersMap,
  type AnswerValue,
} from "@/lib/diagnostic-types";
import { answersSchema } from "@/lib/diagnostic-schemas";
import { getVisitorId, setLastSessionId } from "@/lib/visitor-id";
import { submitDiagnosis } from "@/server/diagnostic.functions";
import { track } from "@/lib/analytics";
import { useT, useI18n, QUESTION_TR } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/diagnoze")({
  head: () => ({
    meta: [
      { title: "Diagnosis — Muslimi Digital" },
      {
        name: "description",
        content: "Answer the short questions and our team will get back with a personalized analysis.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DiagnozePage,
});

type Phase = "name" | "questions" | "context" | "lead" | "submitting" | "done";

function DiagnozePage() {
  const t = useT();
  const { locale } = useI18n();
  const [phase, setPhase] = useState<Phase>("name");
  const [businessName, setBusinessName] = useState("");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extra context
  const [extraContext, setExtraContext] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [uploadingShot, setUploadingShot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lead
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const visibleQuestions = useMemo(() => getVisibleQuestions(answers), [answers]);
  const total = visibleQuestions.length;
  const current = visibleQuestions[step];
  const progress = total > 0 ? (step / total) * 100 : 0;

  useEffect(() => {
    track({ event: "diagnosis_start" });
  }, []);

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
    if (!current) return;
    setError(null);
    const next: AnswersMap = { ...answers, [current.key]: value };
    setAnswers(next);
    track({ event: "question_answered", step, metadata: { key: current.key, value, weak } });

    if (weak) {
      const tr = QUESTION_TR[locale]?.[current.key];
      setFeedback(tr?.weakFeedback ?? current.weakFeedback);
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
      setPhase("context");
    } else {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback(null);
    if (step === 0) {
      setPhase("name");
    } else {
      setStep(step - 1);
    }
  };

  const handleScreenshotUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (screenshots.length + files.length > 4) {
      setError(t("diag.max_images"));
      return;
    }
    setUploadingShot(true);
    setError(null);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/public/upload-screenshot", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || t("diag.upload_failed"));
        newUrls.push(json.url);
      }
      setScreenshots((prev) => [...prev, ...newUrls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("diag.upload_failed"));
    } finally {
      setUploadingShot(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeScreenshot = (url: string) => {
    setScreenshots((prev) => prev.filter((u) => u !== url));
  };

  const submitAll = async () => {
    setError(null);

    if (!email.trim() && !whatsapp.trim()) {
      setError(t("diag.lead_required"));
      return;
    }

    const plain: Record<string, string> = {};
    for (const [k, v] of Object.entries(answers)) {
      if (v) plain[k] = v;
    }
    const parsed = answersSchema.safeParse(plain);
    const safeAnswers = parsed.success ? parsed.data : plain;

    setPhase("submitting");
    try {
      const visitorId = getVisitorId();
      const { sessionId } = await submitDiagnosis({
        data: {
          answers: safeAnswers,
          visitorId,
          businessName: businessName || undefined,
          extraContext: extraContext || undefined,
          screenshots,
          email: email.trim() || undefined,
          whatsapp: whatsapp.trim() || undefined,
        },
      });
      setLastSessionId(sessionId);
      track({ event: "diagnosis_complete", sessionId });
      track({ event: "lead_captured", sessionId });
      setPhase("done");
    } catch (e) {
      console.error(e);
      setError(t("common.something_wrong"));
      setPhase("lead");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-50" />

      <header className="relative z-10 mx-auto max-w-2xl px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/60 text-muted-foreground transition hover:bg-accent hover:text-foreground"
              aria-label={t("common.home")}
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
          <LanguageSwitcher />
        </div>
        {phase === "questions" && (
          <>
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("common.back")}
              </button>
              <span>
                {t("diag.question_label")}{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(step + 1, total)}
                </span>{" "}
                {t("diag.of")} <span className="font-semibold text-foreground">{total}</span>
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
          {/* PHASE: business name */}
          {phase === "name" && (
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
                {t("diag.business_q")}
              </h1>
              <p className="mt-3 text-base text-muted-foreground">
                {t("diag.business_help")}
              </p>

              <div className="mx-auto mt-8 max-w-sm">
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={t("diag.business_placeholder")}
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
                  {businessName ? t("diag.business_continue_with") : t("diag.business_continue_without")}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("diag.business_skip_hint")}
                </p>
              </div>
            </motion.div>
          )}

          {/* PHASE: questions */}
          {phase === "questions" && feedback && (
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
          )}

          {phase === "questions" && !feedback && current && (
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
                {QUESTION_TR[locale]?.[current.key]?.question ?? current.question}
              </h1>
              {(QUESTION_TR[locale]?.[current.key]?.subtitle ?? current.subtitle) && (
                <p className="mt-3 text-balance text-base text-muted-foreground">
                  {QUESTION_TR[locale]?.[current.key]?.subtitle ?? current.subtitle}
                </p>
              )}

              <div className="mt-10 space-y-3">
                {current.options.map((opt) => {
                  const selected = answers[current.key] === opt.value;
                  const label = QUESTION_TR[locale]?.[current.key]?.options?.[opt.value] ?? opt.label;
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
                      <span className="font-medium">{label}</span>
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

          {/* PHASE: extra context */}
          {phase === "context" && (
            <motion.div
              key="context-phase"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
                <Sparkles className="h-3 w-3" />
                {t("diag.context_badge")}
              </div>
              <h1 className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">
                {t("diag.context_title")}
              </h1>
              <p className="mt-3 text-base text-muted-foreground">
                {t("diag.context_desc")}
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    {t("diag.context_label")}
                  </label>
                  <textarea
                    value={extraContext}
                    onChange={(e) => setExtraContext(e.target.value)}
                    maxLength={4000}
                    rows={5}
                    placeholder={t("diag.context_placeholder")}
                    className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {extraContext.length}/4000
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">
                    {t("diag.screenshots_label")}
                  </label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("diag.screenshots_help")}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {screenshots.map((url) => (
                      <div
                        key={url}
                        className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface"
                      >
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeScreenshot(url)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground hover:bg-destructive hover:text-destructive-foreground"
                          aria-label={t("diag.remove_image")}
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {screenshots.length < 4 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingShot}
                        className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:opacity-50"
                      >
                        {uploadingShot ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <ImagePlus className="h-5 w-5" />
                            {t("diag.add_image")}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={(e) => handleScreenshotUpload(e.target.files)}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPhase("questions")}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" /> {t("common.back")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setError(null); setPhase("lead"); }}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-[1.02] transition-all"
                  >
                    {t("common.continue")}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* PHASE: lead capture */}
          {phase === "lead" && (
            <motion.div
              key="lead-phase"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/5 px-3 py-1 text-xs text-warning">
                <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                Hapi i fundit
              </div>
              <h1 className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">
                Ku të të kontaktojmë me analizën?
              </h1>
              <p className="mt-3 text-base text-muted-foreground">
                Ekipi ynë do të të dërgojë analizën personale brenda 24 orëve në Email ose WhatsApp. Pa pagesë, pa spam.
              </p>

              <div className="mt-6 space-y-3">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email yt"
                    maxLength={200}
                    className="w-full rounded-xl border border-border bg-surface pl-11 pr-4 py-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="WhatsApp (p.sh. +355 69 ...)"
                    maxLength={30}
                    className="w-full rounded-xl border border-border bg-surface pl-11 pr-4 py-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Mjafton një nga të dyja. Të dyja = përgjigje më e shpejtë.
                </p>
              </div>

              {error && (
                <p className="mt-3 text-sm text-destructive">{error}</p>
              )}

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPhase("context")}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" /> Mbrapa
                </button>
                <button
                  type="button"
                  onClick={submitAll}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-[1.02] transition-all"
                >
                  Dërgo & Prit Analizën
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* PHASE: submitting */}
          {phase === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="font-display text-xl font-semibold">
                Po dërgojmë{businessName ? ` analizën për "${businessName}"` : " analizën"}…
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Disa sekonda.
              </p>
            </motion.div>
          )}

          {/* PHASE: done */}
          {phase === "done" && (
            <motion.div
              key="done-phase"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary/40 bg-primary/10 shadow-glow">
                <Check className="h-10 w-10 text-primary" strokeWidth={2.5} />
              </div>
              <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Faleminderit{businessName ? `, ${businessName}` : ""}!
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Analiza jote po përgatitet personalisht nga ekipi ynë.
                <br className="hidden sm:block" />
                Do të të kontaktojmë brenda <span className="font-semibold text-foreground">24 orëve</span> në {email && whatsapp ? "Email dhe WhatsApp" : email ? "Email" : "WhatsApp"}.
              </p>

              <div className="mt-8 rounded-2xl border border-border bg-surface p-5 text-left text-sm">
                <p className="font-semibold text-foreground">Çfarë po ndodh tani:</p>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Përgjigjet e tua janë regjistruar
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    AI dhe ekipi po analizojnë rastin tënd
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Do të marrësh planin personal pa pagesë
                  </li>
                </ul>
              </div>

              <div className="mt-8 flex flex-col items-center gap-3">
                <a
                  href={`https://wa.me/355697221224?text=${encodeURIComponent(
                    `Përshëndetje! Sapo dërgova diagnozën${businessName ? ` për "${businessName}"` : ""}. Dua ta diskutoj sa më shpejt.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/10"
                >
                  💬 Dua ta diskutoj tani në WhatsApp
                </a>
                <Link
                  to="/"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Kthehu në fillim
                </Link>
              </div>
            </motion.div>
          )}

          {/* error fallback */}
          {error && phase !== "context" && phase !== "lead" && phase !== "questions" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="font-display text-lg font-semibold">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
