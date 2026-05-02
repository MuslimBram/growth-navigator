import { Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  const next = locale === "en" ? "sq" : "en";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      title={locale === "en" ? "Ndrysho në Shqip" : "Switch to English"}
      aria-label="Change language"
      className={`flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition hover:border-primary/40 hover:text-primary ${className}`}
    >
      <Globe className="h-3 w-3" />
      <span className={locale === "en" ? "text-primary" : ""}>EN</span>
      <span className="opacity-40">|</span>
      <span className={locale === "sq" ? "text-primary" : ""}>SQ</span>
    </button>
  );
}
