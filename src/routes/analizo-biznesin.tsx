import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  X,
  Image as ImageIcon,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "@/lib/visitor-id";
import { analyzeBusinessReport } from "@/server/business-analysis.functions";
import {
  SERVICE_LABEL,
  SERVICE_DESCRIPTION,
  type BusinessAnalysisResult,
  type ServiceKey,
} from "@/lib/business-analysis-types";
import { toast } from "sonner";

export const Route = createFileRoute("/analizo-biznesin")({
  head: () => ({
    meta: [
      {
        title: "Analizo Biznesin Tënd | AI Diagnozë e Performancës — Muslimi Digital",
      },
      {
        name: "description",
        content:
          "Ngarko screenshot-et e Insights, Google Maps ose website-it. AI lexon raportet dhe gjen ngërçin që po pengon biznesin tënd të rritet.",
      },
      { property: "og:title", content: "Analizo Biznesin Tënd me AI" },
      {
        property: "og:description",
        content:
          "Diagnozë profesionale e performancës online. AI lexon raportet e tua dhe identifikon ngërçin.",
      },
    ],
  }),
  component: AnalyzePage,
});

type ChatMsg =
  | { role: "bot"; text: string }
  | { role: "user"; text?: string; images?: { name: string; url: string }[] };

const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;

function AnalyzePage() {
  const analyze = useServerFn(analyzeBusinessReport);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "bot",
      text: `Na jep raportet e fundit:

• Facebook / Instagram Insights
• Google Business (Maps)
• Website traffic (nëse ke)
• Çfarëdo statistike që ke

Ngarko screenshot-e ose shkruaj shifrat me tekst.`,
    },
  ]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BusinessAnalysisResult | null>(null);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, result]);

  useEffect(() => {
    return () => {
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(newFiles: FileList | File[]) {
    const incoming = Array.from(newFiles);
    const valid: File[] = [];
    for (const f of incoming) {
      if (!ALLOWED.includes(f.type)) {
        toast.error(`${f.name}: format jo i mbështetur`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name}: tepër e madhe (max 10MB)`);
        continue;
      }
      valid.push(f);
    }
    const combined = [...files, ...valid].slice(0, MAX_FILES);
    if (files.length + valid.length > MAX_FILES) {
      toast.warning(`Maksimumi ${MAX_FILES} foto`);
    }
    const previews = combined.map((f) => URL.createObjectURL(f));
    filePreviews.forEach((url) => URL.revokeObjectURL(url));
    setFiles(combined);
    setFilePreviews(previews);
  }

  function removeFile(idx: number) {
    URL.revokeObjectURL(filePreviews[idx]);
    setFiles(files.filter((_, i) => i !== idx));
    setFilePreviews(filePreviews.filter((_, i) => i !== idx));
  }

  // Bot rule: if user sends only a question with no files and no stats, reply "Ne funde."
  function looksLikeQuestion(t: string): boolean {
    if (!t) return false;
    const trimmed = t.trim();
    if (trimmed.length < 8) return false;
    if (/\d/.test(trimmed)) return false; // has numbers → likely stats
    return /\?|si\b|pse\b|sa\b|ku\b|kush\b|kur\b|cili\b|ç'|cfare/i.test(trimmed);
  }

  async function handleSend() {
    if (submitting) return;
    if (files.length === 0 && !text.trim()) {
      toast.error("Ngarko një screenshot ose shkruaj shifrat.");
      return;
    }

    // Push question? gating: if no files and text looks like a question
    if (files.length === 0 && looksLikeQuestion(text)) {
      setMessages((m) => [
        ...m,
        { role: "user", text: text.trim() },
        { role: "bot", text: "Ne funde." },
      ]);
      setText("");
      return;
    }

    const userMsg: ChatMsg = {
      role: "user",
      text: text.trim() || undefined,
      images: files.map((f, i) => ({ name: f.name, url: filePreviews[i] })),
    };
    setMessages((m) => [
      ...m,
      userMsg,
      { role: "bot", text: "Po lexoj raportet e tua…" },
    ]);
    setSubmitting(true);

    try {
      const visitorId = getVisitorId();
      const uploadedPaths: string[] = [];

      // Upload each file to private bucket under visitor folder
      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "png";
        const path = `${visitorId}/${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("business-reports")
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          });
        if (upErr) {
          console.error("upload error", upErr);
          toast.error(`Nuk u ngarkua: ${file.name}`);
          continue;
        }
        uploadedPaths.push(path);
      }

      const res = await analyze({
        data: {
          visitorId,
          sessionId: null,
          userText: text.trim(),
          imagePaths: uploadedPaths,
        },
      });

      setResult(res.analysis);
      // Replace the "po lexoj…" placeholder with a confirmation
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "bot",
          text: res.analysis.unreadable
            ? "Nuk arrita ta lexoj qartë raportin. Provo përsëri me screenshot më të pastër."
            : "AI e analizoi biznesin tënd! 🎯\n\nLër kontaktin tënd dhe ne do ta dërgojmë diagnozën e plotë brenda 24 orëve.",
        };
        return copy;
      });

      // reset input
      setText("");
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
      setFiles([]);
      setFilePreviews([]);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Diçka shkoi keq");
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "bot",
          text: "Diçka shkoi keq. Provo përsëri.",
        };
        return copy;
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-[-30%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />

      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <a href="/" className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary shadow-glow" />
          <span className="font-display text-sm font-semibold tracking-wide">
            MUSLIMI <span className="text-primary">DIGITAL</span>
          </span>
        </a>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          AI Analizë e Performancës
        </span>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-32 pt-4 sm:px-6">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              AI Konsulent Strategjik
            </span>
          </div>
          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Ku po <span className="text-gradient-primary">ngec</span> biznesi yt
            online?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Ngarko screenshot-et e raporteve. AI lexon shifrat dhe gjen ngërçin
            që po pengon rritjen.
          </p>
        </div>

        {/* Chat */}
        <Card className="overflow-hidden border-border/60 bg-surface/40 backdrop-blur">
          <div
            ref={scrollRef}
            className="max-h-[60vh] min-h-[320px] space-y-4 overflow-y-auto p-5 sm:p-6"
          >
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {result && !result.unreadable && !leadSubmitted && (
              <AnalysisLeadCapture onSuccess={() => setLeadSubmitted(true)} />
            )}

            {leadSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center"
              >
                <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
                <h3 className="mt-3 font-display text-xl font-bold">Faleminderit! 🎯</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Muslimi Digital do ta dërgojë diagnozën e plotë brenda 24 orëve
                  në kontaktin që ke lënë.
                </p>
              </motion.div>
            )}
          </div>

          {/* Composer */}
          {!result && (
            <div className="border-t border-border/60 bg-background/40 p-4 sm:p-5">
              {filePreviews.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {filePreviews.map((url, i) => (
                    <div
                      key={i}
                      className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border"
                    >
                      <img
                        src={url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute right-0.5 top-0.5 rounded-full bg-background/80 p-0.5 opacity-0 transition group-hover:opacity-100"
                        aria-label="Hiq"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting || files.length >= MAX_FILES}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background/60 text-muted-foreground transition hover:text-primary disabled:opacity-50"
                  aria-label="Ngarko screenshot"
                >
                  <Upload className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Shkruaj kontekstin ose shifrat (opsionale)…"
                  rows={1}
                  className="min-h-[40px] flex-1 resize-none rounded-md border border-border bg-background/60 px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={submitting}
                />
                <Button
                  onClick={handleSend}
                  disabled={submitting}
                  className="h-10 shrink-0"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground/70">
                PNG / JPG / WEBP · max {MAX_FILES} foto · 10MB secila
              </p>
            </div>
          )}
        </Card>

        {/* Thank you CTA after lead submitted */}
        {leadSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex justify-center"
          >
            <Button size="lg" asChild className="bg-gradient-to-r from-primary to-primary/80 shadow-glow">
              <a
                href={`https://wa.me/355697221224?text=${encodeURIComponent(
                  "Përshëndetje! Sapo dërgova raportet për analizë. Dua ta di rezultatin sa më shpejt.",
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Na shkruaj në WhatsApp për përgjigje më të shpejtë
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </motion.div>
        )}

        {result?.unreadable && (
          <div className="mt-6 rounded-lg border border-warning/40 bg-warning/5 p-4 text-sm text-muted-foreground">
            Provo përsëri me një screenshot më të pastër ose shkruaj me tekst:
            shikime, ndjekës, ndërveprime, klikime linku, vizita në website,
            dukshmëria në Google Maps, qëllimi kryesor.
          </div>
        )}
      </main>
    </div>
  );
}

function AnalysisLeadCapture({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() && !whatsapp.trim()) {
      toast.error("Shkruaj email ose numrin e WhatsApp.");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from("diagnostic_leads").insert({
        session_id: null,
        email: email.trim() || null,
        whatsapp: whatsapp.trim() || null,
        business_name: businessName.trim() || null,
      });
      if (error) throw error;
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Diçka shkoi keq. Provo përsëri.");
    } finally {
      setSending(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/30 bg-primary/5 p-5"
    >
      <div className="mb-4 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-primary" />
        <h3 className="mt-2 font-display text-lg font-bold">
          Diagnoza jote është gati! 🎯
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Lër kontaktin tënd dhe Muslimi Digital do ta dërgojë diagnozën e plotë brenda 24 orëve.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Emri i biznesit"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="w-full rounded-lg border border-border bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          type="email"
          placeholder="Email *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          type="tel"
          placeholder="WhatsApp (opsionale)"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className="w-full rounded-lg border border-border bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <Button
          type="submit"
          disabled={sending}
          className="w-full bg-gradient-to-r from-primary to-primary/80 shadow-glow"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Dërgoma diagnozën
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}

function MessageBubble({ msg }: { msg: ChatMsg }) {
  if (msg.role === "bot") {
    return (
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-tl-sm border border-border/60 bg-background/40 px-4 py-3 text-sm leading-relaxed">
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-row-reverse gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted-foreground">
        <span className="text-xs font-semibold">Ti</span>
      </div>
      <div className="max-w-[85%] space-y-2">
        {msg.images && msg.images.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {msg.images.map((img, i) => (
              <div
                key={i}
                className="h-20 w-20 overflow-hidden rounded-lg border border-border"
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
        {msg.text && (
          <div className="whitespace-pre-line rounded-2xl rounded-tr-sm bg-primary/90 px-4 py-3 text-sm leading-relaxed text-primary-foreground">
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultPanel({ result }: { result: BusinessAnalysisResult }) {
  const m = result.detected_metrics;
  const metricCards = [
    { label: "Shikime", value: m.views },
    { label: "Ndjekës", value: m.followers },
    { label: "Ndërveprime", value: m.engagement },
    { label: "Klikime linku", value: m.link_clicks },
    { label: "Vizita website", value: m.website_visits },
  ].filter((c) => c.value && String(c.value).trim() !== "");

  const allServices: ServiceKey[] = [
    result.recommended_primary_service,
    ...result.recommended_secondary_services,
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-5 pt-2"
      >
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
          <CheckCircle2 className="h-4 w-4" /> AI lexoi raportet e tua
        </div>

        {/* Metrics */}
        {metricCards.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {metricCards.map((c) => (
              <div
                key={c.label}
                className="rounded-lg border border-border/60 bg-background/40 p-3"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </div>
                <div className="mt-1 font-display text-lg font-semibold">
                  {c.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {(m.top_sources?.length || m.top_locations?.length) && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {m.top_sources && m.top_sources.length > 0 && (
              <InfoBlock title="Burimet kryesore" items={m.top_sources} />
            )}
            {m.top_locations && m.top_locations.length > 0 && (
              <InfoBlock title="Audienca" items={m.top_locations} />
            )}
          </div>
        )}

        {/* Diagnosis */}
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-destructive">
            <AlertTriangle className="h-4 w-4" /> Ngërçi kryesor
          </div>
          <h3 className="font-display text-xl font-semibold leading-tight">
            {result.main_bottleneck}
          </h3>
          {result.diagnosis && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {result.diagnosis}
            </p>
          )}
        </div>

        {/* Emotional message */}
        {result.emotional_message && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center">
            <p className="whitespace-pre-line font-display text-lg leading-snug">
              {result.emotional_message}
            </p>
          </div>
        )}

        {/* Solution */}
        <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Zgjidhja për këtë problem
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-gradient-primary">
            Muslimi Digital
          </p>
        </div>

        {/* Services */}
        <div className="space-y-2">
          {allServices.map((svc, i) => (
            <ServiceCard key={`${svc}-${i}`} svc={svc} primary={i === 0} />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.slice(0, 6).map((it, i) => (
          <span
            key={i}
            className="rounded-full bg-surface px-2 py-0.5 text-xs text-foreground"
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

function ServiceCard({
  svc,
  primary,
}: {
  svc: ServiceKey;
  primary: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 transition ${
        primary
          ? "border-primary/50 bg-primary/5"
          : "border-border/60 bg-background/40"
      }`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          primary
            ? "bg-primary text-primary-foreground"
            : "bg-surface text-muted-foreground"
        }`}
      >
        <ImageIcon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-display text-sm font-semibold">
            {SERVICE_LABEL[svc]}
          </h4>
          {primary && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
              Rekomanduar
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {SERVICE_DESCRIPTION[svc]}
        </p>
      </div>
    </div>
  );
}
