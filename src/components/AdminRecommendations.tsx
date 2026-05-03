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
import {
  listMicroServices,
  updateRecommendationMicroServices,
} from "@/server/micro-services.functions";
import { Loader2, MessageCircle, RefreshCw, Save, Filter, X, Check, Plus, Trash2, AlertTriangle, Zap } from "lucide-react";

type Priority = "low" | "medium" | "high";
type Status = "new" | "reviewed" | "contacted" | "converted" | "rejected";

type AddonDuration = "1_month" | "3_months" | "6_months" | "1_year";

interface RecAddon {
  addon_id: string;
  duration: AddonDuration;
  price: number;
  reason?: string;
}

interface RecMicroService {
  service_id: string;
  quantity: number;
  total_price: number;
  reason?: string;
}

interface Recommendation {
  id: string;
  business_name: string | null;
  business_type: string | null;
  city: string | null;
  digital_score: number | null;
  key_problems: unknown;
  recommended_package_ids: unknown;
  recommended_addons: unknown;
  recommended_micro_services: unknown;
  micro_services_total: number | string;
  boost_eligible: boolean;
  boost_eligibility_reason: string | null;
  reasoning: string | null;
  client_proposal_text: string | null;
  normal_price_total: number | string;
  offer_price_total: number | string;
  savings_total: number | string;
  addons_total: number | string;
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

interface AddonService {
  id: string;
  name: string;
  category: string;
  description: string | null;
  included_features: unknown;
  supported_platforms: unknown;
  price_1_month: number | string;
  price_3_months: number | string;
  price_6_months: number | string;
  price_1_year: number | string;
  active: boolean;
}

interface MicroService {
  id: string;
  platform: string;
  service_name: string;
  variant: string;
  unit: string;
  standard_price: number | string;
  offer_price: number | string;
  risk_level: "low" | "medium" | "high";
  recommended_use_case: string | null;
  active: boolean;
}

const RISK_COLOR: Record<"low" | "medium" | "high", string> = {
  low: "bg-green-500/10 text-green-600",
  medium: "bg-orange-500/10 text-orange-500",
  high: "bg-red-500/10 text-red-500",
};

const ADDON_DURATION_LABEL: Record<AddonDuration, string> = {
  "1_month": "1 muaj",
  "3_months": "3 muaj",
  "6_months": "6 muaj",
  "1_year": "1 vit",
};

function addonPriceFor(addon: AddonService, d: AddonDuration): number {
  switch (d) {
    case "1_month": return Number(addon.price_1_month) || 0;
    case "3_months": return Number(addon.price_3_months) || 0;
    case "6_months": return Number(addon.price_6_months) || 0;
    case "1_year": return Number(addon.price_1_year) || 0;
  }
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
  const listAdd = useServerFn(listAddons);
  const listMicro = useServerFn(listMicroServices);

  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [addons, setAddons] = useState<AddonService[]>([]);
  const [microServices, setMicroServices] = useState<MicroService[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r, p, a, m] = await Promise.all([
        list({ data: { limit: 100 } }),
        listPkg({ data: undefined as never }),
        listAdd({ data: undefined as never }),
        listMicro({ data: undefined as never }),
      ]);
      setRecs(r.recommendations as unknown as Recommendation[]);
      setPackages(p.packages as unknown as ServicePackage[]);
      setAddons(a.addons as unknown as AddonService[]);
      setMicroServices(m.services as unknown as MicroService[]);
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
          allAddons={addons}
          allMicroServices={microServices}
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
  allAddons,
  allMicroServices,
  onClose,
  onUpdated,
}: {
  rec: Recommendation;
  allPackages: ServicePackage[];
  allAddons: AddonService[];
  allMicroServices: MicroService[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const setStatus = useServerFn(updateRecommendationStatus);
  const setPkgs = useServerFn(updateRecommendationPackages);
  const setAddonsFn = useServerFn(updateRecommendationAddons);
  const setProposal = useServerFn(updateRecommendationProposal);
  const setNotes = useServerFn(updateRecommendationNotes);
  const setMicroFn = useServerFn(updateRecommendationMicroServices);
  const regen = useServerFn(regenerateProposal);

  const [proposal, setProposal_] = useState(rec.client_proposal_text ?? "");
  const [notes, setNotes_] = useState(rec.admin_notes ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    asArray<string>(rec.recommended_package_ids),
  );
  const [selectedAddons, setSelectedAddons] = useState<RecAddon[]>(
    asArray<RecAddon>(rec.recommended_addons),
  );
  const [selectedMicro, setSelectedMicro] = useState<RecMicroService[]>(
    asArray<RecMicroService>(rec.recommended_micro_services),
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
    const addonsSum = selectedAddons.reduce((s, a) => s + (Number(a.price) || 0), 0);
    const microSum = selectedMicro.reduce((s, m) => s + (Number(m.total_price) || 0), 0);
    return { n, o, s: Math.max(0, n - o), addons: addonsSum, micro: microSum, grand: o + addonsSum + microSum };
  }, [selectedIds, selectedAddons, selectedMicro, allPackages]);

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

  const addAddon = (addon: AddonService) => {
    if (selectedAddons.some((a) => a.addon_id === addon.id)) return;
    const duration: AddonDuration = "3_months";
    setSelectedAddons((prev) => [
      ...prev,
      { addon_id: addon.id, duration, price: addonPriceFor(addon, duration) },
    ]);
  };

  const removeAddon = (addonId: string) => {
    setSelectedAddons((prev) => prev.filter((a) => a.addon_id !== addonId));
  };

  const changeAddonDuration = (addonId: string, duration: AddonDuration) => {
    setSelectedAddons((prev) =>
      prev.map((a) => {
        if (a.addon_id !== addonId) return a;
        const ref = allAddons.find((x) => x.id === addonId);
        return { ...a, duration, price: ref ? addonPriceFor(ref, duration) : a.price };
      }),
    );
  };

  const changeAddonPrice = (addonId: string, price: number) => {
    setSelectedAddons((prev) =>
      prev.map((a) => (a.addon_id === addonId ? { ...a, price } : a)),
    );
  };

  const saveAddons = async () => {
    setBusy("addons");
    try {
      await setAddonsFn({
        data: {
          id: rec.id,
          addons: selectedAddons.map((a) => ({
            addon_id: a.addon_id,
            duration: a.duration,
            price: a.price,
            reason: a.reason,
          })),
        },
      });
      onUpdated();
    } finally {
      setBusy(null);
    }
  };

  const addMicro = (svc: MicroService) => {
    if (selectedMicro.some((m) => m.service_id === svc.id)) return;
    setSelectedMicro((prev) => [
      ...prev,
      { service_id: svc.id, quantity: 1, total_price: Number(svc.offer_price) || 0 },
    ]);
  };
  const removeMicro = (id: string) =>
    setSelectedMicro((prev) => prev.filter((m) => m.service_id !== id));
  const changeMicroQty = (id: string, qty: number) =>
    setSelectedMicro((prev) =>
      prev.map((m) => {
        if (m.service_id !== id) return m;
        const ref = allMicroServices.find((s) => s.id === id);
        const unit = ref ? Number(ref.offer_price) || 0 : 0;
        return { ...m, quantity: qty, total_price: unit * qty };
      }),
    );
  const changeMicroPrice = (id: string, price: number) =>
    setSelectedMicro((prev) => prev.map((m) => (m.service_id === id ? { ...m, total_price: price } : m)));

  const saveMicro = async () => {
    setBusy("micro");
    try {
      await setMicroFn({
        data: {
          id: rec.id,
          items: selectedMicro.map((m) => ({
            service_id: m.service_id,
            quantity: m.quantity,
            total_price: m.total_price,
            reason: m.reason,
          })),
        },
      });
      onUpdated();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Ruajtja dështoi.");
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
                <div className="text-muted-foreground">Paketat</div>
                <div className="font-semibold text-foreground text-sm">
                  ${totals.o.toLocaleString()}{" "}
                  <span className="text-muted-foreground line-through font-normal text-xs">
                    ${totals.n.toLocaleString()}
                  </span>
                </div>
              </div>
              {totals.s > 0 && (
                <div className="text-green-500 font-medium">
                  Kursim ${totals.s.toLocaleString()}
                </div>
              )}
            </div>
          </section>

          {/* Add-on services */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                Shërbime shtesë (add-ons) — {selectedAddons.length}
              </h3>
              <button
                onClick={saveAddons}
                disabled={busy === "addons"}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                {busy === "addons" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                Ruaj
              </button>
            </div>

            {/* Selected addons */}
            {selectedAddons.length > 0 && (
              <div className="space-y-2 mb-3">
                {selectedAddons.map((sa) => {
                  const ref = allAddons.find((x) => x.id === sa.addon_id);
                  if (!ref) return null;
                  return (
                    <div
                      key={sa.addon_id}
                      className="rounded-lg border border-primary/30 bg-primary/5 p-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-foreground">{ref.name}</div>
                          {sa.reason && (
                            <div className="text-[10px] text-muted-foreground mt-0.5 italic">
                              {sa.reason}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeAddon(sa.addon_id)}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          title="Hiqe nga propozimi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <select
                          value={sa.duration}
                          onChange={(e) =>
                            changeAddonDuration(sa.addon_id, e.target.value as AddonDuration)
                          }
                          className="rounded border border-border bg-background px-2 py-1 text-[11px] outline-none focus:border-primary"
                        >
                          {(Object.keys(ADDON_DURATION_LABEL) as AddonDuration[]).map((d) => (
                            <option key={d} value={d}>
                              {ADDON_DURATION_LABEL[d]} (${addonPriceFor(ref, d)})
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground">$</span>
                          <input
                            type="number"
                            min={0}
                            value={sa.price}
                            onChange={(e) =>
                              changeAddonPrice(sa.addon_id, Number(e.target.value) || 0)
                            }
                            className="w-20 rounded border border-border bg-background px-2 py-1 text-[11px] outline-none focus:border-primary"
                            title="Ndrysho çmimin manualisht"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Available addons to add */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allAddons
                .filter(
                  (a) => a.active && !selectedAddons.some((s) => s.addon_id === a.id),
                )
                .map((a) => (
                  <button
                    key={a.id}
                    onClick={() => addAddon(a)}
                    className="text-left rounded-lg border border-border hover:border-primary/50 p-2 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">
                          {a.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          nga ${Number(a.price_1_month)} / muaj
                        </div>
                      </div>
                      <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
                    </div>
                  </button>
                ))}
              {allAddons.filter((a) => a.active).length === 0 && (
                <div className="col-span-full text-[11px] text-muted-foreground text-center py-2">
                  Asnjë add-on aktiv. Shtoji nga tab-i "Add-ons".
                </div>
              )}
            </div>

            {/* Grand total */}
            <div className="mt-3 flex items-center justify-between text-xs bg-primary/10 rounded-lg p-3">
              <div>
                <div className="text-muted-foreground">Totali i propozimit</div>
                <div className="font-bold text-foreground text-base">
                  ${totals.grand.toLocaleString()}
                </div>
                {(totals.addons > 0 || totals.micro > 0) && (
                  <div className="text-[10px] text-muted-foreground">
                    Paketa ${totals.o.toLocaleString()}
                    {totals.addons > 0 && <> + Add-ons ${totals.addons.toLocaleString()}</>}
                    {totals.micro > 0 && <> + Boost ${totals.micro.toLocaleString()}</>}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Boost suggestions (Micro Services) */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-orange-500" />
                Boost Services — {selectedMicro.length}
              </h3>
              <button
                onClick={saveMicro}
                disabled={busy === "micro" || !rec.boost_eligible}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                {busy === "micro" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Ruaj
              </button>
            </div>

            {!rec.boost_eligible ? (
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-foreground">Biznesi nuk është gati për boost.</p>
                  <p className="text-muted-foreground mt-0.5">
                    {rec.boost_eligibility_reason ||
                      "Boost services janë vetëm për biznese me strategji + përmbajtje aktive + website. Sugjero fillimisht paketën kryesore."}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-2 mb-2 text-[11px] text-foreground flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Kujdes:</strong> Boost services janë opsionale, on-demand. NUK zëvendësojnë strategji apo përmbajtje organike.
                  </span>
                </div>

                {selectedMicro.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {selectedMicro.map((sm) => {
                      const ref = allMicroServices.find((s) => s.id === sm.service_id);
                      if (!ref) return null;
                      return (
                        <div key={sm.service_id} className="rounded-lg border border-primary/30 bg-primary/5 p-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] uppercase text-muted-foreground">{ref.platform}</span>
                                <span className="text-xs font-medium text-foreground">{ref.service_name}</span>
                                {ref.variant !== "none" && (
                                  <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px]">{ref.variant}</span>
                                )}
                                <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${RISK_COLOR[ref.risk_level]}`}>
                                  {ref.risk_level}
                                </span>
                              </div>
                              {sm.reason && <div className="text-[10px] text-muted-foreground mt-0.5 italic">{sm.reason}</div>}
                            </div>
                            <button
                              onClick={() => removeMicro(sm.service_id)}
                              className="text-muted-foreground hover:text-destructive shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <label className="text-[10px] text-muted-foreground">Sasia:</label>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={sm.quantity}
                              onChange={(e) => changeMicroQty(sm.service_id, Math.max(1, Number(e.target.value) || 1))}
                              className="w-16 rounded border border-border bg-background px-2 py-1 text-[11px] outline-none focus:border-primary"
                            />
                            <span className="text-[10px] text-muted-foreground">$</span>
                            <input
                              type="number"
                              min={0}
                              value={sm.total_price}
                              onChange={(e) => changeMicroPrice(sm.service_id, Number(e.target.value) || 0)}
                              className="w-24 rounded border border-border bg-background px-2 py-1 text-[11px] outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {allMicroServices
                    .filter((s) => s.active && !selectedMicro.some((m) => m.service_id === s.id))
                    .slice(0, 30)
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => addMicro(s)}
                        className="text-left rounded-lg border border-border hover:border-primary/50 p-2 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase text-muted-foreground">{s.platform}</div>
                            <div className="text-xs font-medium text-foreground truncate">
                              {s.service_name} {s.variant !== "none" && `(${s.variant})`}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-foreground">${Number(s.offer_price)}</span>
                              <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] ${RISK_COLOR[s.risk_level]}`}>
                                {s.risk_level}
                              </span>
                            </div>
                          </div>
                          <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
                        </div>
                      </button>
                    ))}
                </div>
              </>
            )}
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
