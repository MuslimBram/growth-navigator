import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useT } from "@/lib/i18n";

const WA_NUMBER = "355697221224";

interface WhatsAppCTAProps {
  mainBottleneck: string;
  recommendedService: string;
  businessName?: string;
  className?: string;
}

export function WhatsAppCTA({
  mainBottleneck,
  recommendedService,
  businessName,
  className = "",
}: WhatsAppCTAProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const lines = [
    t("wa.msg_hello"),
    "",
    t("wa.msg_done"),
    "",
    t("wa.msg_main_problem", { problem: mainBottleneck }),
    t("wa.msg_recommended", { service: recommendedService }),
  ];
  if (businessName) lines.push(t("wa.msg_business", { name: businessName }));
  lines.push("", t("wa.msg_book"));
  const message = lines.join("\n");

  const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = message;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center sm:p-6 ${className}`}
    >
      <h3 className="font-display text-lg font-bold">{t("wa.title")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{t("wa.desc")}</p>

      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
      >
        {t("wa.cta_open")}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>

      <div className="mt-4">
        <p className="text-xs text-muted-foreground">{t("wa.fallback")}</p>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-4 py-2 text-xs font-medium transition-colors hover:bg-accent"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-primary" />
              {t("wa.copied")}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              {t("wa.copy")}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
