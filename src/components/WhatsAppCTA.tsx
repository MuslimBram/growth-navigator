import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ExternalLink } from "lucide-react";

const WA_NUMBER = "355697221224";

interface WhatsAppCTAProps {
  mainBottleneck: string;
  recommendedService: string;
  businessName?: string;
  className?: string;
}

function buildMessage({
  mainBottleneck,
  recommendedService,
  businessName,
}: Omit<WhatsAppCTAProps, "className">) {
  const lines = [
    "Përshëndetje Muslimi Digital.",
    "",
    "Kam bërë diagnozën e biznesit tim.",
    "",
    `Problemi kryesor: ${mainBottleneck}`,
    `Shërbimi i rekomanduar: ${recommendedService}`,
  ];
  if (businessName) {
    lines.push(`Biznesi: ${businessName}`);
  }
  lines.push("", "Dua të rezervoj një analizë më të thellë.");
  return lines.join("\n");
}

export function WhatsAppCTA({
  mainBottleneck,
  recommendedService,
  businessName,
  className = "",
}: WhatsAppCTAProps) {
  const [copied, setCopied] = useState(false);
  const message = buildMessage({ mainBottleneck, recommendedService, businessName });
  const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
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
      className={`rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center ${className}`}
    >
      <h3 className="font-display text-lg font-bold">Vazhdo në WhatsApp</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Na shkruaj direkt për një analizë më të thellë — mesazhi është gati.
      </p>

      {/* Primary CTA — opens WhatsApp externally */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
      >
        💬 Vazhdo në WhatsApp
        <ExternalLink className="h-3.5 w-3.5" />
      </a>

      {/* Fallback: copy message */}
      <div className="mt-4">
        <p className="text-xs text-muted-foreground">
          Nuk u hap? Kopjo mesazhin dhe dërgoje manualisht në WhatsApp:{" "}
          <span className="font-medium text-foreground">+355 69 722 1224</span>
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-4 py-2 text-xs font-medium transition-colors hover:bg-accent"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-primary" />
              U kopjua!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Kopjo mesazhin
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
