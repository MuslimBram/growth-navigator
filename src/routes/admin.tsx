import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2, LogOut, Users, TrendingUp, Mail, Phone, FileText,
  AlertCircle, BarChart3, ArrowUpRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin Panel — Muslimi Digital" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

interface FunnelSummary {
  unique_visitors: number;
  started: number;
  completed: number;
  leads: number;
  abandoned: number;
  exit_surveys: number;
  sessions_total: number;
  leads_total: number;
  period_days: number;
}

interface LeadRow {
  id: string;
  business_name: string | null;
  email: string | null;
  whatsapp: string | null;
  created_at: string;
  session_id: string | null;
}

interface ExitSurveyRow {
  id: string;
  reason: string;
  details: string | null;
  email: string | null;
  created_at: string;
}

function AdminPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, checking } = useIsAdmin(user?.id);
  const [funnel, setFunnel] = useState<FunnelSummary | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [surveys, setSurveys] = useState<ExitSurveyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const [funnelRes, leadsRes, surveysRes] = await Promise.all([
        supabase.rpc("get_funnel_summary", { _days: 30 }),
        supabase
          .from("diagnostic_leads")
          .select("id,business_name,email,whatsapp,created_at,session_id")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("exit_surveys")
          .select("id,reason,details,email,created_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (funnelRes.data) setFunnel(funnelRes.data as unknown as FunnelSummary);
      if (leadsRes.data) setLeads(leadsRes.data);
      if (surveysRes.data) setSurveys(surveysRes.data);
      setLoading(false);
    })();
  }, [isAdmin]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Qasje e ndaluar</h1>
          <p className="text-muted-foreground mb-6">
            Kjo llogari nuk ka të drejtat e administratorit.
          </p>
          <button
            onClick={handleSignOut}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 font-medium"
          >
            Dil
          </button>
        </div>
      </div>
    );
  }

  const conversionRate = funnel && funnel.unique_visitors > 0
    ? ((funnel.leads / funnel.unique_visitors) * 100).toFixed(1)
    : "0.0";
  const completionRate = funnel && funnel.started > 0
    ? ((funnel.completed / funnel.started) * 100).toFixed(1)
    : "0.0";
  const leadCaptureRate = funnel && funnel.completed > 0
    ? ((funnel.leads / funnel.completed) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/40 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Muslimi Digital — 30 ditët e fundit</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/case-studies"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Case Studies
            </Link>
            <span className="text-sm text-muted-foreground hidden md:inline">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Dil
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Funnel KPIs */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <KPI label="Vizitorë unikë" value={funnel?.unique_visitors ?? 0} icon={Users} />
              <KPI label="Filluan diagnozën" value={funnel?.started ?? 0} icon={ArrowUpRight} />
              <KPI label="Përfunduan" value={funnel?.completed ?? 0} icon={TrendingUp} />
              <KPI label="Leads të kapur" value={funnel?.leads ?? 0} icon={Mail} highlight />
            </section>

            {/* Conversion rates */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <RateCard label="Konvertim total" value={`${conversionRate}%`} sub="vizitor → lead" />
              <RateCard label="Mbarim diagnoze" value={`${completionRate}%`} sub="filloi → përfundoi" />
              <RateCard label="Lead capture" value={`${leadCaptureRate}%`} sub="përfundoi → lead" />
            </section>

            {/* Recent leads */}
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" /> Leads të fundit ({leads.length})
              </h2>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 text-muted-foreground">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">Biznes</th>
                        <th className="text-left px-4 py-3 font-medium">Email</th>
                        <th className="text-left px-4 py-3 font-medium">WhatsApp</th>
                        <th className="text-left px-4 py-3 font-medium">Data</th>
                        <th className="text-left px-4 py-3 font-medium">Sesion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                            Asnjë lead ende
                          </td>
                        </tr>
                      ) : (
                        leads.map((lead) => (
                          <motion.tr
                            key={lead.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-t border-border hover:bg-muted/20"
                          >
                            <td className="px-4 py-3 text-foreground font-medium">
                              {lead.business_name ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {lead.email ? (
                                <a href={`mailto:${lead.email}`} className="hover:text-primary inline-flex items-center gap-1">
                                  <Mail className="h-3 w-3" /> {lead.email}
                                </a>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {lead.whatsapp ? (
                                <a
                                  href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:text-primary inline-flex items-center gap-1"
                                >
                                  <Phone className="h-3 w-3" /> {lead.whatsapp}
                                </a>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(lead.created_at).toLocaleString("sq-AL")}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {lead.session_id ? (
                                <Link
                                  to="/rezultati/$sessionId"
                                  params={{ sessionId: lead.session_id }}
                                  className="text-primary hover:underline"
                                >
                                  Hap
                                </Link>
                              ) : "—"}
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Exit surveys */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Pse largohen ({surveys.length})
              </h2>
              <div className="grid gap-3">
                {surveys.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                    Asnjë përgjigje ende
                  </div>
                ) : (
                  surveys.map((s) => (
                    <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">{s.reason}</div>
                          {s.details && (
                            <p className="text-sm text-muted-foreground mt-1">{s.details}</p>
                          )}
                          {s.email && (
                            <a
                              href={`mailto:${s.email}`}
                              className="text-xs text-primary hover:underline mt-2 inline-block"
                            >
                              {s.email}
                            </a>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString("sq-AL")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function KPI({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: any;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-5 ${
        highlight
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        <Icon className={`h-4 w-4 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
    </motion.div>
  );
}

function RateCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/10 p-5">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-3xl font-bold text-foreground mt-1">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
