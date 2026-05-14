import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Home,
  Loader2,
  X,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppCTA } from "@/components/WhatsAppCTA";
import { getVisitorId } from "@/lib/visitor-id";
import { chatWithBot } from "@/server/business-chat.functions";
import { toast } from "sonner";
import { notifyNewLead } from "@/server/notify-lead.functions";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/analizo-biznesin")({
  head: () => ({
    meta: [
      { title: "Analizë Biznesi me AI — Muslimi Digital" },
      {
        name: "description",
        content:
          "Talk to our AI consultant. They'll understand your business and find the bottleneck holding back growth.",
      },
      { property: "og:title", content: "Analizë Biznesi me AI — Muslimi Digital" },
      { property: "og:url", content: "https://muslimi.lovable.app/analizo-biznesin" },
      {
        property: "og:description",
        content:
          "Professional online performance diagnosis. Our AI consultant analyzes your business and identifies the bottleneck.",
      },
    ],
  }),
  component: AnalyzePage,
});

interface ChatMsg {
  role: "bot" | "user";
  text: string;
  images?: { name: string; url: string }[];
}

const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;

function AnalyzePage() {
  const t = useT();
  const chat = useServerFn(chatWithBot);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "bot", text: t("ai.initial_message") },
  ]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isDiagnosis, setIsDiagnosis] = useState(false);
  const [diagnosisText, setDiagnosisText] = useState<string | null>(null);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update initial message when language changes (only if it's still the only message)
  useEffect(() => {
    setMessages((m) => {
      if (m.length === 1 && m[0].role === "bot") {
        return [{ role: "bot", text: t("ai.initial_message") }];
      }
      return m;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isDiagnosis, leadSubmitted]);

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
        toast.error(t("ai.format_unsupported", { name: f.name }));
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.error(t("ai.too_big", { name: f.name }));
        continue;
      }
      valid.push(f);
    }
    const combined = [...files, ...valid].slice(0, MAX_FILES);
    if (files.length + valid.length > MAX_FILES) {
      toast.warning(t("ai.max_files", { max: MAX_FILES }));
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

  // Build conversation history for the AI (excluding images, just text)
  function buildHistory(): Array<{ role: "user" | "assistant"; content: string }> {
    const history: Array<{ role: "user" | "assistant"; content: string }> = [];
    for (const msg of messages) {
      if (msg.role === "bot") {
        history.push({ role: "assistant", content: msg.text });
      } else if (msg.text) {
        history.push({ role: "user", content: msg.text });
      }
    }
    return history;
  }

  async function handleSend() {
    if (submitting) return;
    if (files.length === 0 && !text.trim()) {
      toast.error(t("ai.write_or_upload"));
      return;
    }

    const userMsg: ChatMsg = {
      role: "user",
      text: text.trim(),
      images: files.map((f, i) => ({ name: f.name, url: filePreviews[i] })),
    };

    setMessages((m) => [...m, userMsg, { role: "bot", text: t("ai.thinking") }]);
    setSubmitting(true);

    try {
      const visitorId = getVisitorId();
      const uploadedPaths: string[] = [];

      // Capture device info
      const deviceInfo = typeof navigator !== "undefined"
        ? `${/Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop"}, ${navigator.language || "sq"}, ${navigator.userAgent.split(" ").slice(-2).join(" ")}`
        : "";

      // Upload images if any
      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "png";
        const path = `${visitorId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("business-reports")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) {
          console.error("upload error", upErr);
          toast.error(t("ai.upload_failed", { name: file.name }));
          continue;
        }
        uploadedPaths.push(path);
      }

      const res = await chat({
        data: {
          visitorId,
          messages: buildHistory(),
          userText: text.trim(),
          imagePaths: uploadedPaths,
          deviceInfo,
        },
      });

      // Clean up the reply (remove markers)
      let cleanReply = res.reply
        .replace("---DIAGNOZA---", "")
        .replace("---FUND---", "")
        .trim();

      if (res.isDiagnosis) {
        // Store diagnosis but DON'T show it to user
        setDiagnosisText(cleanReply);
        setIsDiagnosis(true);
        // Replace "thinking" bubble with a prompt to leave contact
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "bot",
            text: t("ai.diagnosis_ready_short"),
          };
          return copy;
        });
      } else {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "bot", text: cleanReply };
          return copy;
        });
      }

      // Reset input
      setText("");
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
      setFiles([]);
      setFilePreviews([]);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : t("common.something_wrong"));
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "bot", text: t("ai.error_generic") };
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

      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/60 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label={t("ai.back_aria")}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/60 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label={t("ai.home_aria")}
          >
            <Home className="h-4 w-4" />
          </Link>
        </div>
        <Link to="/" className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary shadow-glow" />
          <span className="font-display text-sm font-semibold tracking-wide">
            MUSLIMI <span className="text-primary">DIGITAL</span>
          </span>
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-32 pt-4 sm:px-6">
        {/* Hero */}
        <div className="mb-6 text-center sm:mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              {t("ai.tagline")}
            </span>
          </div>
          <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            {t("ai.title_part1")} <span className="text-gradient-primary">{t("ai.title_highlight")}</span> {t("ai.title_part2")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            {t("ai.subtitle")}
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

            {isDiagnosis && !leadSubmitted && (
              <AnalysisLeadCapture diagnosisText={diagnosisText} onSuccess={() => setLeadSubmitted(true)} />
            )}

            {leadSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center"
              >
                <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
                <h3 className="mt-3 font-display text-xl font-bold">{t("ai.thanks_title")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("ai.thanks_desc")}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("ai.start_new")}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Composer — always visible unless lead submitted */}
          {!leadSubmitted && (
            <div className="border-t border-border/60 bg-background/40 p-4 sm:p-5">
              {filePreviews.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {filePreviews.map((url, i) => (
                    <div
                      key={i}
                      className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border"
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute right-0.5 top-0.5 rounded-full bg-background/80 p-0.5 opacity-0 transition group-hover:opacity-100"
                        aria-label={t("diag.remove_image")}
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
                  aria-label={t("diag.add_image")}
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
                  placeholder={t("ai.placeholder")}
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
                <Button onClick={handleSend} disabled={submitting} className="h-10 shrink-0">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground/70">
                {t("ai.upload_help", { max: MAX_FILES })}
              </p>
            </div>
          )}
        </Card>

        {leadSubmitted && (
          <WhatsAppCTA
            mainBottleneck={t("ai.bottleneck")}
            recommendedService={t("ai.recommended_label")}
            className="mt-6"
          />
        )}
      </main>
    </div>
  );
}

function AnalysisLeadCapture({ diagnosisText, onSuccess }: { diagnosisText: string | null; onSuccess: () => void }) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() && !whatsapp.trim()) {
      toast.error(t("ai.lead_email_or_wa"));
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from("diagnostic_leads").insert({
        session_id: null,
        email: email.trim() || null,
        whatsapp: whatsapp.trim() || null,
        business_name: businessName.trim() || null,
        diagnosis_notes: diagnosisText || null,
      } as any);
      if (error) throw error;

      // Fire-and-forget admin notification with full data
      notifyNewLead({
        data: {
          businessName: businessName.trim() || undefined,
          email: email.trim() || undefined,
          whatsapp: whatsapp.trim() || undefined,
          diagnosisNotes: diagnosisText || undefined,
          source: "chatbot" as const,
        },
      }).catch(() => {});

      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(t("common.something_wrong"));
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
          {t("ai.lead_title")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("ai.lead_desc")}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder={t("ai.lead_business")}
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="w-full rounded-lg border border-border bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          type="email"
          placeholder={t("ai.lead_email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          type="tel"
          placeholder={t("ai.lead_whatsapp")}
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
              {t("ai.lead_submit")}
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
        <span className="text-xs font-semibold">·</span>
      </div>
      <div className="max-w-[85%] space-y-2">
        {msg.images && msg.images.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {msg.images.map((img, i) => (
              <div key={i} className="h-20 w-20 overflow-hidden rounded-lg border border-border">
                <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
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
