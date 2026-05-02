import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { track } from "@/lib/analytics";
import { getVisitorId } from "@/lib/visitor-id";
import { useT } from "@/lib/i18n";

const DISMISS_KEY = "md_exit_dismissed";
const SHOWN_KEY = "md_exit_shown";

const REASON_VALUES = ["not_sure_need", "no_time", "want_more_info", "other"] as const;

export function ExitIntentSurvey() {
  const t = useT();
  const REASONS = [
    { value: "not_sure_need", label: t("exit.reason_not_sure") },
    { value: "no_time", label: t("exit.reason_no_time") },
    { value: "want_more_info", label: t("exit.reason_more_info") },
    { value: "other", label: t("exit.reason_other") },
  ];

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(DISMISS_KEY) || sessionStorage.getItem(SHOWN_KEY)) return;

    const trigger = () => {
      if (triggeredRef.current) return;
      triggeredRef.current = true;
      sessionStorage.setItem(SHOWN_KEY, "1");
      setOpen(true);
      track({ event: "exit_survey_shown" });
    };

    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 8 && !e.relatedTarget) trigger();
    };
    const timer = window.setTimeout(trigger, 25_000);
    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      if (scrolled >= document.body.scrollHeight - 80) trigger();
    };

    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, []);

  const close = () => {
    setOpen(false);
    if (typeof window !== "undefined") sessionStorage.setItem(DISMISS_KEY, "1");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    try {
      await fetch("/api/public/exit-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitor_id: getVisitorId(),
          reason,
          details: details.trim() || null,
          email: email.trim() || null,
        }),
      });
      track({ event: "exit_survey_answered", metadata: { reason } });
    } catch {
      /* ignore */
    }
    setSubmitted(true);
    if (typeof window !== "undefined") sessionStorage.setItem(DISMISS_KEY, "1");
    setTimeout(() => setOpen(false), 1800);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 backdrop-blur-sm sm:items-center"
          onClick={close}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-glow sm:p-8"
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              aria-label={t("common.close")}
            >
              <X className="h-4 w-4" />
            </button>

            {submitted ? (
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                  ✓
                </div>
                <h3 className="font-display text-lg font-bold">{t("exit.thanks_title")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("exit.thanks_desc")}</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <h3 className="font-display text-xl font-bold leading-tight">
                  {t("exit.title")}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{t("exit.desc")}</p>

                <div className="mt-5 space-y-2">
                  {REASONS.map((r) => {
                    const selected = reason === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setReason(r.value)}
                        className={`w-full rounded-xl border p-3 text-left text-sm transition-all ${
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:border-primary/40"
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>

                {reason === "other" && (
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={t("exit.details_placeholder")}
                    rows={2}
                    maxLength={500}
                    className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                  />
                )}

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("exit.email_placeholder")}
                  maxLength={200}
                  className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60"
                />

                <button
                  type="submit"
                  disabled={!reason}
                  className="mt-4 w-full rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] disabled:opacity-40"
                >
                  {t("exit.submit")}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const _REASONS = REASON_VALUES;
