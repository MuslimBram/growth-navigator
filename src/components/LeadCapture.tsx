import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { submitLead } from "@/server/diagnostic.functions";
import { notifyNewLead } from "@/server/notify-lead.functions";
import { leadSchema } from "@/lib/diagnostic-schemas";
import { WhatsAppCTA } from "@/components/WhatsAppCTA";
import { useT } from "@/lib/i18n";

interface Props {
  sessionId: string;
  primaryServiceLabel: string;
  diagnosis?: string;
  mainBottleneck?: string;
  answers?: Record<string, string>;
  onSuccess?: () => void;
}

export function LeadCapture({ sessionId, primaryServiceLabel, diagnosis, mainBottleneck, answers, onSuccess }: Props) {
  const t = useT();
  const submit = useServerFn(submitLead);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      email: email.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      businessName: businessName.trim() || undefined,
    };

    const parsed = leadSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("lead.invalid"));
      return;
    }

    setStatus("loading");
    try {
      await submit({ data: { sessionId, ...parsed.data } });
      setStatus("success");

      notifyNewLead({
        data: {
          businessName: businessName.trim() || undefined,
          email: email.trim() || undefined,
          whatsapp: whatsapp.trim() || undefined,
          diagnosisNotes: diagnosis || undefined,
          mainBottleneck: mainBottleneck || undefined,
          recommendedService: primaryServiceLabel,
          answers: answers || undefined,
          source: "diagnostic" as const,
        },
      }).catch(() => {});

      onSuccess?.();
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err instanceof Error ? err.message : t("common.something_wrong"));
    }
  };

  if (status === "success") {
    return (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-primary/40 bg-primary/5 p-8 text-center shadow-glow"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-bold">{t("lead.success_title")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("lead.success_desc")}</p>
        </motion.div>
        <WhatsAppCTA
          mainBottleneck={t("lead.bottleneck")}
          recommendedService={primaryServiceLabel}
        />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <h3 className="font-display text-xl font-bold">{t("lead.title")}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{t("lead.desc")}</p>

      <div className="mt-5 space-y-3">
        <input
          type="text"
          placeholder={t("lead.business_placeholder")}
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary/60"
          maxLength={120}
        />
        <input
          type="email"
          placeholder={t("lead.email_placeholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary/60"
          maxLength={200}
        />
        <input
          type="tel"
          placeholder={t("diag.whatsapp_placeholder")}
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary/60"
          maxLength={30}
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-sm text-warning"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-5 w-full rounded-full bg-gradient-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {status === "loading" ? t("common.sending") : t("common.send_lead")}
      </button>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {t("common.or")}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <a
        href={`https://wa.me/355697221224?text=${encodeURIComponent(
          t("lead.wa_msg_short", { service: primaryServiceLabel })
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
      >
        {t("lead.wa_direct")}
      </a>
    </form>
  );
}
