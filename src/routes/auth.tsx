import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Hyr — Muslimi Digital" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/admin" });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
      navigate({ to: "/admin" });
    } catch (err: any) {
      setError(err.message ?? "Diçka shkoi keq");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/admin`,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) {
        setError(result.error.message ?? "Google sign-in dështoi");
        setSubmitting(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/admin" });
    } catch (err: any) {
      setError(err.message ?? "Google sign-in dështoi");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {mode === "signin" ? "Hyr në Admin" : "Krijo llogari"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Vetëm administratorët kanë qasje në panelin.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary outline-none text-foreground"
                  placeholder="ti@biznesi.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Fjalëkalimi</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-background border border-border focus:border-primary outline-none text-foreground"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Hyr" : "Krijo Llogari"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground w-full text-center"
          >
            {mode === "signin" ? "Krijo një llogari" : "Ke llogari? Hyr"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
