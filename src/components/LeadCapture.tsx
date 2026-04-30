import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { submitLead } from "@/server/diagnostic.functions";
import { notifyNewLead } from "@/server/notify-lead.functions";
import { leadSchema } from "@/lib/diagnostic-schemas";
import { WhatsAppCTA } from "@/components/WhatsAppCTA";

interface Props {
  sessionId: string;
  primaryServiceLabel: string;
  onSuccess?: () => void;
}

export function LeadCapture({ sessionId, primaryServiceLabel, onSuccess }: Props) {
  const submit = useServerFn(submitLead);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
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
      setError(
        parsed.error.issues[0]?.message ??
          "Të dhënat nuk janë të vlefshme. Kontrollo email ose WhatsApp.",
      );
      return;
    }

    setStatus("loading");
    try {
      await submit({ data: { sessionId, ...parsed.data } });
      setStatus("success");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Diçka shkoi keq.");
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
          <h3 className="font-display text-xl font-bold">Të dhënat u dërguan</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Ekipi ynë do të kontaktojë sa më shpejtë me një plan personal.
          </p>
        </motion.div>
        <WhatsAppCTA
          mainBottleneck="Diagnoza e biznesit"
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
      <h3 className="font-display text-xl font-bold">
        Merr planin tënd personal falas
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Lëre Email-in ose WhatsApp — do të kontaktojmë sa më shpejtë.
      </p>

      <div className="mt-5 space-y-3">
        <input
          type="text"
          placeholder="Emri i biznesit (opsionale)"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary/60"
          maxLength={120}
        />
        <input
          type="email"
          placeholder="Email yt"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary/60"
          maxLength={200}
        />
        <input
          type="tel"
          placeholder="WhatsApp (p.sh. +355 69 ...)"
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
        {status === "loading" ? "Duke dërguar..." : "Dërgo & Merr Planin"}
      </button>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          ose
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <a
        href={`https://wa.me/355697221224?text=${encodeURIComponent(
          `Përshëndetje! Sapo plotësova diagnozën. Më rekomandohet: ${primaryServiceLabel}. Dua të diskutoj më shumë.`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
      >
        💬 Shkruaj direkt në WhatsApp
      </a>
    </form>
  );
}
