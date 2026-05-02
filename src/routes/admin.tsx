import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, LogOut, Users, TrendingUp, Mail, Phone, FileText,
  AlertCircle, BarChart3, ArrowUpRight, ExternalLink, ChevronDown,
  ChevronUp, MessageSquare, Check, Filter, Calendar, RefreshCw, Bell, BookOpen,
} from "lucide-react";
import { AdminCaseStudies } from "@/components/AdminCaseStudies";
import { AdminInvites } from "@/components/AdminInvites";
import { AdminRecommendations } from "@/components/AdminRecommendations";
import { AdminPackages } from "@/components/AdminPackages";
import { AdminAddons } from "@/components/AdminAddons";
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
  diagnosis_notes: string | null;
  contacted: boolean;
}

interface SessionRow {
  id: string;
  ai_diagnosis: string | null;
  primary_service: string | null;
  secondary_services: any;
  answers: any;
  created_at: string;
  visitor_id: string | null;
}

interface ExitSurveyRow {
  id: string;
  reason: string;
  details: string | null;
  email: string | null;
  created_at: string;
}

const WA_NUMBER = "355697221224";

function buildAdminWaMessage(lead: LeadRow, session: SessionRow | null) {
  const lines = [
    `Përshëndetje${lead.business_name ? ` ${lead.business_name}` : ""}!`,
    "",
    "Jam nga Muslimi Digital. Sapo përfundova analizën e biznesit tuaj.",
    "",
  ];
  if (session?.primary_service) {
    lines.push(`Shërbimi i rekomanduar: ${session.primary_service}`);
  }
  if (session?.ai_diagnosis) {
    const short = session.ai_diagnosis.slice(0, 200);
    lines.push(`Diagnoza: ${short}${session.ai_diagnosis.length > 200 ? "…" : ""}`);
  }
  lines.push("", "A do ta diskutojmë planin e veprimit?");
  return lines.join("\n");
}

type TabKey = "leads" | "sessions" | "surveys" | "recommendations" | "packages" | "addons" | "case-studies" | "admins";
type FilterService = "all" | string;

function AdminPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, checking } = useIsAdmin(user?.id);
  const [funnel, setFunnel] = useState<FunnelSummary | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [sessions, setSessions] = useState<Map<string, SessionRow>>(new Map());
  const [allSessions, setAllSessions] = useState<SessionRow[]>([]);
  const [surveys, setSurveys] = useState<ExitSurveyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("leads");
  const [filterService, setFilterService] = useState<FilterService>("all");
  const [filterContacted, setFilterContacted] = useState<"all" | "yes" | "no">("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const prevLeadCount = useRef<number>(0);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const [funnelRes, leadsRes, sessionsRes, surveysRes] = await Promise.all([
      supabase.rpc("get_funnel_summary", { _days: 30 }),
      supabase
        .from("diagnostic_leads")
        .select("id,business_name,email,whatsapp,created_at,session_id,diagnosis_notes,contacted")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("diagnostic_sessions")
        .select("id,ai_diagnosis,primary_service,secondary_services,answers,created_at,visitor_id")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("exit_surveys")
        .select("id,reason,details,email,created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    if (funnelRes.data) setFunnel(funnelRes.data as unknown as FunnelSummary);
    if (leadsRes.data) {
      const newLeads = leadsRes.data as LeadRow[];
      // Play sound if new leads appeared
      if (prevLeadCount.current > 0 && newLeads.length > prevLeadCount.current) {
        try {
          const audio = new Audio("data:audio/wav;base64,UklGRlgAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTQAAAB/f39/f39/f4B+gH+Af4B/gH+Af4B+gH+Af4B/gH+Af39/f39/f39/f39/f39/fw==");
          audio.play().catch(() => {});
        } catch {}
      }
      prevLeadCount.current = newLeads.length;
      setLeads(newLeads);
    }
    if (sessionsRes.data) {
      const map = new Map<string, SessionRow>();
      for (const s of sessionsRes.data) map.set(s.id, s as SessionRow);
      setSessions(map);
      setAllSessions(sessionsRes.data as SessionRow[]);
    }
    if (surveysRes.data) setSurveys(surveysRes.data);
    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchData(true);
  }, [isAdmin, fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAdmin || !autoRefresh) return;
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [isAdmin, autoRefresh, fetchData]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const toggleContacted = async (leadId: string, current: boolean) => {
    const newVal = !current;
    const { error } = await supabase
      .from("diagnostic_leads")
      .update({ contacted: newVal })
      .eq("id", leadId);
    if (!error) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, contacted: newVal } : l))
      );
    }
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

  // Get unique services for filter
  const serviceOptions = Array.from(new Set(
    allSessions.map((s) => s.primary_service).filter(Boolean) as string[]
  ));

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    if (filterContacted === "yes" && !lead.contacted) return false;
    if (filterContacted === "no" && lead.contacted) return false;
    if (filterService !== "all") {
      const session = lead.session_id ? sessions.get(lead.session_id) : null;
      if (!session || session.primary_service !== filterService) return false;
    }
    return true;
  });

  // Filter sessions
  const filteredSessions = filterService === "all"
    ? allSessions
    : allSessions.filter((s) => s.primary_service === filterService);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/40 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            <div>
              <h1 className="text-base font-bold text-foreground sm:text-lg">Admin Panel</h1>
              <p className="text-[10px] text-muted-foreground sm:text-xs">Muslimi Digital — 30 ditët e fundit</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] sm:text-xs transition-colors ${autoRefresh ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
              title={autoRefresh ? "Auto-refresh aktiv" : "Auto-refresh joaktiv"}
            >
              <Bell className="h-3 w-3" />
              {autoRefresh ? "Live" : "Off"}
            </button>
            <button
              onClick={() => fetchData(false)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              title="Rifresko tani"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            {lastRefresh && (
              <span className="hidden text-[10px] text-muted-foreground md:inline">
                {lastRefresh.toLocaleTimeString("sq-AL")}
              </span>
            )}
            <Link
              to="/case-studies"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              Case Studies
            </Link>
            <span className="hidden text-sm text-muted-foreground md:inline">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground sm:text-sm"
            >
              <LogOut className="h-4 w-4" /> Dil
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Funnel KPIs */}
            <section className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4 sm:gap-4 sm:mb-8">
              <KPI label="Vizitorë unikë" value={funnel?.unique_visitors ?? 0} icon={Users} />
              <KPI label="Filluan diagnozën" value={funnel?.started ?? 0} icon={ArrowUpRight} />
              <KPI label="Përfunduan" value={funnel?.completed ?? 0} icon={TrendingUp} />
              <KPI label="Leads të kapur" value={funnel?.leads ?? 0} icon={Mail} highlight />
            </section>

            {/* Conversion rates */}
            <section className="grid grid-cols-1 gap-3 mb-8 sm:grid-cols-3 sm:gap-4 sm:mb-10">
              <RateCard label="Konvertim total" value={`${conversionRate}%`} sub="vizitor → lead" />
              <RateCard label="Mbarim diagnoze" value={`${completionRate}%`} sub="filloi → përfundoi" />
              <RateCard label="Lead capture" value={`${leadCaptureRate}%`} sub="përfundoi → lead" />
            </section>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-4 border-b border-border">
              {(["leads", "sessions", "recommendations", "packages", "addons", "surveys", "case-studies", "admins"] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "leads" ? `Leads (${leads.length})` : tab === "sessions" ? `Sesione (${allSessions.length})` : tab === "recommendations" ? "Sugjerime AI" : tab === "packages" ? "Paketat" : tab === "addons" ? "Add-ons" : tab === "surveys" ? `Surveys (${surveys.length})` : tab === "case-studies" ? "Case Studies" : "Admin-ët"}
                </button>
              ))}
            </div>

            {/* Filters */}
            {(activeTab === "leads" || activeTab === "sessions") && (
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" />
                </div>
                <select
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                >
                  <option value="all">Të gjitha shërbimet</option>
                  {serviceOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {activeTab === "leads" && (
                  <select
                    value={filterContacted}
                    onChange={(e) => setFilterContacted(e.target.value as any)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                  >
                    <option value="all">Të gjithë</option>
                    <option value="no">Pa kontaktuar</option>
                    <option value="yes">Kontaktuar</option>
                  </select>
                )}
              </div>
            )}

            {/* Leads tab */}
            {activeTab === "leads" && (
              <section>
                {filteredLeads.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                    Asnjë lead
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLeads.map((lead) => {
                      const session = lead.session_id ? sessions.get(lead.session_id) ?? null : null;
                      const isOpen = expandedLead === lead.id;

                      return (
                        <div
                          key={lead.id}
                          className={`rounded-xl border bg-card overflow-hidden ${
                            lead.contacted ? "border-border/50 opacity-75" : "border-border"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedLead(isOpen ? null : lead.id)}
                            className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-foreground text-sm truncate">
                                  {lead.business_name || "Pa emër"}
                                </span>
                                {session?.primary_service && (
                                  <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                    {session.primary_service}
                                  </span>
                                )}
                                {lead.contacted && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600">
                                    <Check className="h-2.5 w-2.5" /> Kontaktuar
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {lead.email && (
                                  <span className="flex items-center gap-1 truncate">
                                    <Mail className="h-3 w-3 shrink-0" /> {lead.email}
                                  </span>
                                )}
                                {lead.whatsapp && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 shrink-0" /> {lead.whatsapp}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden sm:inline">
                                {new Date(lead.created_at).toLocaleString("sq-AL")}
                              </span>
                              {isOpen ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </button>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="border-t border-border p-4 space-y-4">
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Data:</span>
                                      <p className="font-medium text-foreground">
                                        {new Date(lead.created_at).toLocaleString("sq-AL")}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Biznes:</span>
                                      <p className="font-medium text-foreground">{lead.business_name || "—"}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Email:</span>
                                      <p className="font-medium text-foreground">
                                        {lead.email ? (
                                          <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
                                        ) : "—"}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">WhatsApp:</span>
                                      <p className="font-medium text-foreground">{lead.whatsapp || "—"}</p>
                                    </div>
                                    {session?.primary_service && (
                                      <div>
                                        <span className="text-muted-foreground">Shërbimi kryesor:</span>
                                        <p className="font-medium text-primary">{session.primary_service}</p>
                                      </div>
                                    )}
                                  </div>

                                  {session?.ai_diagnosis && (
                                    <div>
                                      <span className="text-xs text-muted-foreground">Diagnoza AI (sesion):</span>
                                      <p className="mt-1 text-sm text-foreground leading-relaxed whitespace-pre-line rounded-lg bg-muted/20 p-3">
                                        {session.ai_diagnosis}
                                      </p>
                                    </div>
                                  )}

                                  {lead.diagnosis_notes && (
                                    <div>
                                      <span className="text-xs text-muted-foreground">Diagnoza AI (chatbot):</span>
                                      <p className="mt-1 text-sm text-foreground leading-relaxed whitespace-pre-line rounded-lg bg-primary/5 border border-primary/20 p-3">
                                        {lead.diagnosis_notes}
                                      </p>
                                    </div>
                                  )}

                                  <div className="flex flex-wrap gap-2 pt-2">
                                    <button
                                      onClick={() => toggleContacted(lead.id, lead.contacted)}
                                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                        lead.contacted
                                          ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                                          : "bg-muted/30 text-foreground hover:bg-muted/50"
                                      }`}
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      {lead.contacted ? "Kontaktuar ✓" : "Shëno si kontaktuar"}
                                    </button>

                                    {(lead.whatsapp || lead.email) && (
                                      <a
                                        href={`https://wa.me/${(lead.whatsapp || "").replace(/\D/g, "") || WA_NUMBER}?text=${encodeURIComponent(buildAdminWaMessage(lead, session))}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#20BD5A]"
                                      >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        Open WhatsApp
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                    {lead.email && (
                                      <a
                                        href={`mailto:${lead.email}?subject=${encodeURIComponent("Diagnoza e biznesit — Muslimi Digital")}`}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted/40"
                                      >
                                        <Mail className="h-3.5 w-3.5" />
                                        Send Email
                                      </a>
                                    )}
                                    {lead.session_id && (
                                      <Link
                                        to="/rezultati/$sessionId"
                                        params={{ sessionId: lead.session_id }}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted/40"
                                      >
                                        <FileText className="h-3.5 w-3.5" />
                                        Hap rezultatin
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Sessions tab */}
            {activeTab === "sessions" && (
              <section>
                {filteredSessions.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                    Asnjë sesion
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSessions.map((session) => {
                      const isOpen = expandedSession === session.id;
                      return (
                        <div key={session.id} className="rounded-xl border border-border bg-card overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setExpandedSession(isOpen ? null : session.id)}
                            className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {session.primary_service && (
                                  <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                    {session.primary_service}
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {session.ai_diagnosis ? session.ai_diagnosis.slice(0, 80) + "…" : "Pa diagnozë"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {new Date(session.created_at).toLocaleString("sq-AL")}
                              </span>
                              {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="border-t border-border p-4 space-y-3">
                                  {session.ai_diagnosis && (
                                    <div>
                                      <span className="text-xs text-muted-foreground">Diagnoza:</span>
                                      <p className="mt-1 text-sm text-foreground whitespace-pre-line rounded-lg bg-muted/20 p-3">
                                        {session.ai_diagnosis}
                                      </p>
                                    </div>
                                  )}
                                  {session.answers && typeof session.answers === "object" && (
                                    <div>
                                      <span className="text-xs text-muted-foreground">Përgjigjet:</span>
                                      <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                                        {Object.entries(session.answers).map(([k, v]) => (
                                          <div key={k} className="rounded bg-muted/20 p-2">
                                            <span className="font-medium">{k}:</span> {String(v)}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <Link
                                    to="/rezultati/$sessionId"
                                    params={{ sessionId: session.id }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted/40"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    Hap rezultatin
                                  </Link>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Exit surveys tab */}
            {activeTab === "surveys" && (
              <section>
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
            )}

            {/* Recommendations tab */}
            {activeTab === "recommendations" && (
              <section>
                <AdminRecommendations />
              </section>
            )}

            {/* Packages tab */}
            {activeTab === "packages" && (
              <section>
                <AdminPackages />
              </section>
            )}

            {/* Add-ons tab */}
            {activeTab === "addons" && (
              <section>
                <AdminAddons />
              </section>
            )}

            {/* Case Studies tab */}
            {activeTab === "case-studies" && (
              <section>
                <AdminCaseStudies />
              </section>
            )}

            {/* Admins tab */}
            {activeTab === "admins" && (
              <section>
                <AdminInvites />
              </section>
            )}
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
      className={`rounded-xl border p-4 sm:p-5 ${
        highlight
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide sm:text-xs">{label}</span>
        <Icon className={`h-4 w-4 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="text-2xl font-bold text-foreground sm:text-3xl">{value.toLocaleString()}</div>
    </motion.div>
  );
}

function RateCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/10 p-4 sm:p-5">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide sm:text-xs">{label}</div>
      <div className="text-2xl font-bold text-foreground mt-1 sm:text-3xl">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-1 sm:text-xs">{sub}</div>
    </div>
  );
}
