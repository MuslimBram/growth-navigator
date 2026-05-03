import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listMicroServices,
  upsertMicroService,
  deleteMicroService,
} from "@/server/micro-services.functions";
import { Loader2, Plus, Save, Trash2, X, AlertTriangle } from "lucide-react";

type Platform = "facebook" | "instagram" | "tiktok" | "youtube" | "twitter" | "linkedin";
type Variant = "S" | "M" | "L" | "XL" | "none";
type Risk = "low" | "medium" | "high";

interface MicroService {
  id: string;
  platform: Platform;
  service_name: string;
  variant: Variant;
  unit: string;
  standard_price: number | string;
  offer_price: number | string;
  discount_percentage: number | string;
  delivery_time: string | null;
  description: string | null;
  risk_level: Risk;
  recommended_use_case: string | null;
  category: string;
  active: boolean;
  display_order: number;
}

const PLATFORM_LABEL: Record<Platform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "Twitter",
  linkedin: "LinkedIn",
};
const PLATFORM_COLOR: Record<Platform, string> = {
  facebook: "bg-blue-500/10 text-blue-500",
  instagram: "bg-pink-500/10 text-pink-500",
  tiktok: "bg-foreground/10 text-foreground",
  youtube: "bg-red-500/10 text-red-500",
  twitter: "bg-sky-500/10 text-sky-500",
  linkedin: "bg-blue-700/10 text-blue-700",
};
const RISK_COLOR: Record<Risk, string> = {
  low: "bg-green-500/10 text-green-600",
  medium: "bg-orange-500/10 text-orange-500",
  high: "bg-red-500/10 text-red-500",
};

export function AdminMicroServices() {
  const list = useServerFn(listMicroServices);
  const upsert = useServerFn(upsertMicroService);
  const del = useServerFn(deleteMicroService);

  const [items, setItems] = useState<MicroService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MicroService | "new" | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<Platform | "all">("all");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await list({ data: undefined as never });
      setItems(r.services as unknown as MicroService[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const onDelete = async (id: string) => {
    if (!confirm("Fshi këtë boost service?")) return;
    await del({ data: { id } });
    fetchAll();
  };

  const filtered = filterPlatform === "all"
    ? items
    : items.filter((i) => i.platform === filterPlatform);

  return (
    <div>
      <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 mb-4 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
        <p className="text-xs text-foreground">
          <strong>Boost Services:</strong> Këto janë shërbime opsionale për rritje të përkohshme,
          jo zgjidhje kryesore. AI i sugjeron VETËM kur biznesi ka strategji + përmbajtje aktive + website.
        </p>
      </div>

      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value as Platform | "all")}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
        >
          <option value="all">Të gjitha platformat</option>
          {(Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => (
            <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>
          ))}
        </select>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Boost service i ri
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
          Asnjë boost service.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const disc = Number(s.discount_percentage);
            const discClass = disc > 50 ? "text-red-500 font-bold" : disc > 30 ? "text-orange-500" : "text-green-500";
            return (
              <div key={s.id} className="rounded-xl border border-border bg-card p-4 hover:bg-muted/20 transition">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${PLATFORM_COLOR[s.platform]}`}>
                        {PLATFORM_LABEL[s.platform]}
                      </span>
                      <span className="font-medium text-sm text-foreground">{s.service_name}</span>
                      {s.variant !== "none" && (
                        <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px] text-foreground">
                          {s.variant}
                        </span>
                      )}
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${RISK_COLOR[s.risk_level]}`}>
                        Risk: {s.risk_level}
                      </span>
                      {!s.active && (
                        <span className="inline-flex rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px]">
                          Joaktiv
                        </span>
                      )}
                    </div>
                    {s.recommended_use_case && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{s.recommended_use_case}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-foreground">${Number(s.offer_price)}</div>
                    <div className="text-[10px] text-muted-foreground">
                      <span className="line-through">${Number(s.standard_price)}</span>{" "}
                      <span className={discClass}>−{disc}%</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditing(s)} className="rounded-lg px-2 py-1 text-xs text-primary hover:bg-primary/10">Edito</button>
                    <button onClick={() => onDelete(s.id)} className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <Editor
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchAll(); }}
          save={upsert}
        />
      )}
    </div>
  );
}

function Editor({
  item, onClose, onSaved, save,
}: {
  item: MicroService | null;
  onClose: () => void;
  onSaved: () => void;
  save: ReturnType<typeof useServerFn<typeof upsertMicroService>>;
}) {
  const [platform, setPlatform] = useState<Platform>(item?.platform ?? "instagram");
  const [name, setName] = useState(item?.service_name ?? "");
  const [variant, setVariant] = useState<Variant>(item?.variant ?? "S");
  const [unit, setUnit] = useState(item?.unit ?? "per 1K");
  const [stdP, setStdP] = useState(Number(item?.standard_price ?? 0));
  const [offP, setOffP] = useState(Number(item?.offer_price ?? 0));
  const [risk, setRisk] = useState<Risk>(item?.risk_level ?? "low");
  const [useCase, setUseCase] = useState(item?.recommended_use_case ?? "");
  const [desc, setDesc] = useState(item?.description ?? "");
  const [delivery, setDelivery] = useState(item?.delivery_time ?? "");
  const [active, setActive] = useState(item?.active ?? true);
  const [order, setOrder] = useState(item?.display_order ?? 0);
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    setBusy(true);
    try {
      await save({
        data: {
          id: item?.id,
          platform, service_name: name.trim(), variant, unit,
          standard_price: stdP, offer_price: offP, risk_level: risk,
          recommended_use_case: useCase.trim() || null,
          description: desc.trim() || null,
          delivery_time: delivery.trim() || null,
          active, display_order: order,
        },
      });
      onSaved();
    } catch (e) {
      console.error(e); alert("Ruajtja dështoi.");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl max-w-xl w-full my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-foreground">{item ? "Edito boost service" : "Boost service i ri"}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Platforma</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                {(Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => (
                  <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Varianti</label>
              <select value={variant} onChange={(e) => setVariant(e.target.value as Variant)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                {(["S","M","L","XL","none"] as Variant[]).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Emri i shërbimit</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="p.sh. 1K Followers, Views, Komente…" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Çmimi standard ($)</label>
              <input type="number" min={0} step="0.01" value={stdP} onChange={(e) => setStdP(Number(e.target.value) || 0)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Çmimi ofertë ($)</label>
              <input type="number" min={0} step="0.01" value={offP} onChange={(e) => setOffP(Number(e.target.value) || 0)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Risk</label>
              <select value={risk} onChange={(e) => setRisk(e.target.value as Risk)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Njësia</label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Koha e dorëzimit</label>
              <input value={delivery} onChange={(e) => setDelivery(e.target.value)} placeholder="p.sh. 24h, 3-5 ditë" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Use case (kur sugjerohet)</label>
            <input value={useCase} onChange={(e) => setUseCase(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Përshkrimi</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded" />
              <span className="text-foreground">Aktiv</span>
            </label>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Renditja</label>
              <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} className="ml-2 w-20 rounded-lg border border-border bg-background px-3 py-1 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">Anulo</button>
            <button onClick={onSave} disabled={busy || !name.trim()} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Ruaj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
