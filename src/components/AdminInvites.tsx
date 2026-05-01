import { useEffect, useState } from "react";
import { Loader2, Trash2, UserPlus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Invite {
  id: string;
  email: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
}

export function AdminInvites() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_invites")
      .select("id,email,used,used_at,created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setInvites(data ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Email i pavlefshëm");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("admin_invites").insert({ email: trimmed });
    setSubmitting(false);
    if (error) {
      setError(error.message.includes("duplicate") ? "Ky email është ftuar tashmë." : error.message);
      return;
    }
    setEmail("");
    void load();
  };

  const remove = async (id: string) => {
    if (!confirm("Hiq këtë ftesë admin?")) return;
    const { error } = await supabase.from("admin_invites").delete().eq("id", id);
    if (error) setError(error.message);
    else void load();
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-foreground">Menaxho Admin-ët</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Shto email-in e personit që do të jetë admin. Kur ai regjistrohet me atë email, do të bëhet automatikisht admin.
      </p>

      <form onSubmit={add} className="flex flex-col sm:flex-row gap-2 mb-5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@shembull.com"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {submitting ? "Duke shtuar..." : "Shto Admin"}
        </button>
      </form>

      {error && <p className="text-sm text-destructive mb-3">{error}</p>}

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : invites.length === 0 ? (
        <p className="text-sm text-muted-foreground">Asnjë ftesë.</p>
      ) : (
        <ul className="space-y-2">
          {invites.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground truncate">{inv.email}</span>
                  {inv.used ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600">
                      <Check className="h-2.5 w-2.5" /> Aktiv
                    </span>
                  ) : (
                    <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                      Në pritje
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Ftuar më {new Date(inv.created_at).toLocaleString("sq-AL")}
                </p>
              </div>
              <button
                onClick={() => remove(inv.id)}
                className="text-muted-foreground hover:text-destructive p-1.5 rounded transition"
                aria-label="Hiq"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
