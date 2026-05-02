import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listRecommendations,
  listPackages,
  listAddons,
  updateRecommendationStatus,
  updateRecommendationPackages,
  updateRecommendationAddons,
  updateRecommendationProposal,
  updateRecommendationNotes,
  regenerateProposal,
} from "@/server/recommendations.functions";
import { Loader2, MessageCircle, RefreshCw, Save, Filter, X, Check, Plus, Trash2 } from "lucide-react";

type Priority = "low" | "medium" | "high";
type Status = "new" | "reviewed" | "contacted" | "converted" | "rejected";

interface Recommendation {
  id: string;
  business_name: string | null;
  business_type: string | null;
  city: string | null;
  digital_score: number | null;
  key_problems: unknown;
  recommended_package_ids: unknown;
  reasoning: string | null;
  client_proposal_text: string | null;
  normal_price_total: number | string;
  offer_price_total: number | string;
  savings_total: number | string;
  currency: string;
  priority: Priority;
  status: Status;
  admin_notes: string | null;
  created_at: string;
  session_id: string | null;
  analysis_id: string | null;
  lead_id: string | null;
}

interface ServicePackage {
  id: string;
  name: string;
  category: "instagram" | "website";
  level: string;
  duration: string;
  normal_price: number | string;
  offer_price: number | string;
  is_quote_only: boolean;
  status: "active" | "inactive";
  includes: unknown;
}

const WA_NUMBER = "355697221224";

const STATUS_LABEL: Record<Status, string> = {
  new: "I ri",
  reviewed: "Shqyrtuar",
  contacted: "Kontaktuar",
  converted: "Konvertuar",
  rejected: "Refuzuar",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Ulët",
  medium: "Mesatar",
  high: "Lartë",
};

const PRIORITY_COLOR: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/10 text-blue-500",
  high: "bg-red-500/10 text-red-500",
};

function asArray<T = string>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function formatPrice(n: number | string, currency = "USD") {
  const v = typeof n === "string" ? Number(n) : n;
  if (!isFinite(v) || v === 0) return "—";
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency;
  return `${symbol}${v.toLocaleString("en-US")}`;
}

export function AdminRecommendations() {
  const list = useServerFn(listRecommendations);
  const listPkg = useServerFn(listPackages);

  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        list({ data: { limit: 100 } }),
        listPkg({ data: undefined as never }),
      ]);
      setRecs(r.recommendations as unknown as Recommendation[]);
      setPackages(p.packages as unknown as ServicePackage[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(
    () =>
      recs.filter((r) => {
        if (filterStatus !== "all" && r.status !== filterStatus) return false;
        if (filterPriority !== "all" && r.priority !== filterPriority) return false;
        if (filterCity && !(r.city ?? "").toLowerCase().includes(filterCity.toLowerCase()))
          return false;
        if (
          filterType &&
          !(r.business_type ?? "").toLowerCase().includes(filterType.toLowerCase())
        )
          return false;
        return true;
      }),
    [recs, filterStatus, filterPriority, filterCity, filterType],
  );

  const openRec = openId ? recs.find((r) => r.id === openId) ?? null : null;

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as Status | "all")}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
        >
          <option value="all">Të gjithë statuset</option>
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as Priority | "all")}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
        >
          <option value="all">Të gjithë prioritetet</option>
          {(Object.keys(PRIORITY_LABEL) as Priority[]).map((s) => (
            <option key={s} value={s}>
              {PRIORITY_LABEL[s]}
            </option>
          ))}
        </select>
        <input
          placeholder="Qyteti"
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs w-28 outline-none focus:border-primary"
        />
        <input
          placeholder="Lloji biznesit"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs w-32 outline-none focus:border-primary"
        />
        <button
          onClick={fetchAll}
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Rifresko
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
          Asnjë sugjerim. Sa herë që klientë bëjnë diagnozë ose analizë, AI gjeneron një sugjerim
          këtu automatikisht.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const pkgIds = asArray<string>(r.recommended_package_ids);
            const pkgs = pkgIds
              .map((id) => packages.find((p) => p.id === id))
              .filter(Boolean) as ServicePackage[];
            return (
              <div
                key={r.id}
                className="rounded-xl border border-border bg-card p-4 hover:bg-muted/20 cursor-pointer transition"
                onClick={() => setOpenId(r.id)}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground truncate">
                        {r.business_name || "Pa emër"}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_COLOR[r.priority]}`}
                      >
                        {PRIORITY_LABEL[r.priority]}
                      </span>
                      <span className="inline-flex rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium">
                        {STATUS_LABEL[r.status]}
                      </span>
                      {r.business_type && (
                        <span className="text-[10px] text-muted-foreground">
                          {r.business_type}
                        </span>
                      )}
                      {r.city && (
                        <span className="text-[10px] text-muted-foreground">• {r.city}</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {pkgs.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px] text-foreground"
                        >
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-foreground">
                      {formatPrice(r.offer_price_total, r.currency)}
                    </div>
                    {Number(r.savings_total) > 0 && (
                      <div className="text-[10px] text-green-500">
                        Kursim {formatPrice(r.savings_total, r.currency)}
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(r.created_at).toLocaleString("sq-AL")}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openRec && (
        <RecommendationDetailModal
          rec={openRec}
          allPackages={packages}
          onClose={() => setOpenId(null)}
          onUpdated={fetchAll}
        />
      )}
    </div>
  );
}

function RecommendationDetailModal({
  rec,
  allPackages,
  onClose,
  onUpdated,
}: {
  rec: Recommendation;
  allPackages: ServicePackage[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const setStatus = useServerFn(updateRecommendationStatus);
  const setPkgs = useServerFn(updateRecommendationPackages);
  const setProposal = useServerFn(updateRecommendationProposal);
  const setNotes = useServerFn(updateRecommendationNotes);
  const regen = useServerFn(regenerateProposal);

  const [proposal, setProposal_] = useState(rec.client_proposal_text ?? "");
  const [notes, setNotes_] = useState(rec.admin_notes ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    asArray<string>(rec.recommended_package_ids),
  );
  const [busy, setBusy] = useState<string | null>(null);

  const totals = useMemo(() => {
    let n = 0,
      o = 0;
    for (const id of selectedIds) {
      const p = allPackages.find((x) => x.id === id);
      if (!p) continue;
      n += Number(p.normal_price) || 0;
      o += Number(p.offer_price) || 0;
    }
    return { n, o, s: Math.max(0, n - o) };
  }, [selectedIds, allPackages]);

  const togglePkg = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const savePkgs = async () => {
    setBusy("pkgs");
    try {
      await setPkgs({ data: { id: rec.id, package_ids: selectedIds } });
      onUpdated();
    } finally {
      setBusy(null);
    }
  };

  const saveProposal = async () => {
    setBusy("proposal");
    try {
      await setProposal({ data: { id: rec.id, client_proposal_text: proposal } });
      onUpdated();
    } finally {
      setBusy(null);
    }
  };

  const saveNotes = async () => {
    setBusy("notes");
    try {
      await setNotes({ data: { id: rec.id, admin_notes: notes } });
      onUpdated();
    } finally {
      setBusy(null);
    }
  };

  const changeStatus = async (s: Status) => {
    setBusy("status");
    try {
      await setStatus({ data: { id: rec.id, status: s } });
      onUpdated();
    } finally {
      setBusy(null);
    }
  };

  const regenerate = async () => {
    setBusy("regen");
    try {
      const r = await regen({ data: { id: rec.id } });
      if (r?.client_proposal_text) setProposal_(r.client_proposal_text);
      onUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  const sendWa = () => {
    const text = encodeURIComponent(proposal || rec.client_proposal_text || "");
    window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {rec.business_name || "Sugjerim"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {rec.business_type || "—"} {rec.city && `• ${rec.city}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status pills */}
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                disabled={busy === "status"}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  rec.status === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          {/* Problems */}
          {asArray<string>(rec.key_problems).length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Problemet kryesore
              </h3>
              <ul className="space-y-1">
                {asArray<string>(rec.key_problems).map((p, i) => (
                  <li key={i} className="text-sm text-foreground flex gap-2">
                    <span className="text-red-500">•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Reasoning */}
          {rec.reasoning && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Arsyetimi për Adminin
              </h3>
              <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3 leading-relaxed">
                {rec.reasoning}
              </p>
            </section>
          )}

          {/* Package selector */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                Paketat ({selectedIds.length} të zgjedhura)
              </h3>
              <button
                onClick={savePkgs}
                disabled={busy === "pkgs"}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                {busy === "pkgs" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                Ruaj
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {allPackages
                .filter((p) => p.status === "active")
                .map((p) => {
                  const sel = selectedIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePkg(p.id)}
                      className={`text-left rounded-lg border p-2 transition ${
                        sel
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-foreground truncate">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground capitalize">
                            {p.category} • {p.level.replace("_", " ")}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {p.is_quote_only ? (
                            <span className="text-[10px] text-amber-500">Quote</span>
                          ) : (
                            <>
                              <div className="text-[11px] font-semibold text-foreground">
                                ${Number(p.offer_price)}
                              </div>
                              <div className="text-[9px] text-muted-foreground line-through">
                                ${Number(p.normal_price)}
                              </div>
                            </>
                          )}
                        </div>
                        {sel && <Check className="h-3 w-3 text-primary shrink-0" />}
                      </div>
                    </button>
                  );
                })}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs bg-muted/40 rounded-lg p-3">
              <div>
                <div className="text-muted-foreground">Totali</div>
                <div className="font-semibold text-foreground text-sm">
                  ${totals.o.toLocaleString()} <span className="text-muted-foreground line-through font-normal text-xs">${totals.n.toLocaleString()}</span>
                </div>
              </div>
              {totals.s > 0 && (
                <div className="text-green-500 font-medium">
                  Kursim ${totals.s.toLocaleString()}
                </div>
              )}
            </div>
          </section>

          {/* Client proposal */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                Propozim për klientin
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={regenerate}
                  disabled={busy === "regen"}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {busy === "regen" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Rigjenero
                </button>
                <button
                  onClick={saveProposal}
                  disabled={busy === "proposal"}
                  className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                >
                  {busy === "proposal" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  Ruaj
                </button>
              </div>
            </div>
            <textarea
              value={proposal}
              onChange={(e) => setProposal_(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary resize-none"
            />
            <button
              onClick={sendWa}
              className="mt-2 flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm font-medium"
            >
              <MessageCircle className="h-4 w-4" />
              Dërgo në WhatsApp (Admin)
            </button>
          </section>

          {/* Admin notes */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                Shënime private (vetëm Admin)
              </h3>
              <button
                onClick={saveNotes}
                disabled={busy === "notes"}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                {busy === "notes" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                Ruaj
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes_(e.target.value)}
              rows={3}
              placeholder="Shënime për këtë lead…"
              className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary resize-none"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
