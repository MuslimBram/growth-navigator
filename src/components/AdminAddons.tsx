import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listAddons,
  upsertAddon,
  deleteAddon,
} from "@/server/recommendations.functions";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";

type AddonCategory =
  | "optimization"
  | "strategy"
  | "analytics"
  | "planning"
  | "ads_management";

const CATEGORY_LABEL: Record<AddonCategory, string> = {
  optimization: "Optimizim",
  strategy: "Strategji",
  analytics: "Analizë",
  planning: "Planifikim",
  ads_management: "Menaxhim Reklamash",
};

interface Addon {
  id: string;
  name: string;
  category: AddonCategory;
  description: string | null;
  included_features: unknown;
  supported_platforms: unknown;
  price_1_month: number | string;
  price_3_months: number | string;
  price_6_months: number | string;
  price_1_year: number | string;
  currency: string;
  active: boolean;
  display_order: number;
  admin_notes: string | null;
}

function asArr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

export function AdminAddons() {
  const list = useServerFn(listAddons);
  const upsert = useServerFn(upsertAddon);
  const del = useServerFn(deleteAddon);

  const [items, setItems] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Addon | "new" | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await list({ data: undefined as never });
      setItems(r.addons as unknown as Addon[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("A je i sigurt që do ta fshish këtë add-on?")) return;
    await del({ data: { id } });
    fetchAll();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">
          Menaxho katalogun e shërbimeve shtesë (add-ons) që AI sugjeron krahas paketave kryesore.
        </p>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Add-on i ri
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
          Asnjë add-on. Shto të parin.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-border bg-card p-4 hover:bg-muted/20 transition"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{a.name}</span>
                    <span className="inline-flex rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium">
                      {CATEGORY_LABEL[a.category]}
                    </span>
                    {!a.active && (
                      <span className="inline-flex rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px]">
                        Joaktiv
                      </span>
                    )}
                  </div>
                  {a.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {a.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-foreground">
                    <span>1m: <strong>${Number(a.price_1_month)}</strong></span>
                    <span>3m: <strong>${Number(a.price_3_months)}</strong></span>
                    <span>6m: <strong>${Number(a.price_6_months)}</strong></span>
                    <span>1v: <strong>${Number(a.price_1_year)}</strong></span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditing(a)}
                    className="rounded-lg px-2 py-1 text-xs text-primary hover:bg-primary/10"
                  >
                    Edito
                  </button>
                  <button
                    onClick={() => onDelete(a.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <AddonEditor
          addon={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchAll();
          }}
          save={upsert}
        />
      )}
    </div>
  );
}

function AddonEditor({
  addon,
  onClose,
  onSaved,
  save,
}: {
  addon: Addon | null;
  onClose: () => void;
  onSaved: () => void;
  save: ReturnType<typeof useServerFn<typeof upsertAddon>>;
}) {
  const [name, setName] = useState(addon?.name ?? "");
  const [category, setCategory] = useState<AddonCategory>(addon?.category ?? "optimization");
  const [description, setDescription] = useState(addon?.description ?? "");
  const [features, setFeatures] = useState(asArr(addon?.included_features).join("\n"));
  const [platforms, setPlatforms] = useState(asArr(addon?.supported_platforms).join(", "));
  const [p1m, setP1m] = useState(Number(addon?.price_1_month ?? 0));
  const [p3m, setP3m] = useState(Number(addon?.price_3_months ?? 0));
  const [p6m, setP6m] = useState(Number(addon?.price_6_months ?? 0));
  const [p1y, setP1y] = useState(Number(addon?.price_1_year ?? 0));
  const [active, setActive] = useState(addon?.active ?? true);
  const [order, setOrder] = useState(addon?.display_order ?? 0);
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    setBusy(true);
    try {
      await save({
        data: {
          id: addon?.id,
          name: name.trim(),
          category,
          description: description.trim() || null,
          included_features: features
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          supported_platforms: platforms
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          price_1_month: p1m,
          price_3_months: p3m,
          price_6_months: p6m,
          price_1_year: p1y,
          currency: "USD",
          active,
          display_order: order,
        },
      });
      onSaved();
    } catch (e) {
      console.error(e);
      alert("Ruajtja dështoi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-foreground">
            {addon ? "Edito add-on" : "Add-on i ri"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Emri</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Kategoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AddonCategory)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {(Object.keys(CATEGORY_LABEL) as AddonCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Renditja</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Përshkrimi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Çfarë përfshin (një rresht për pikë)
            </label>
            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Platformat (të ndara me presje)
            </label>
            <input
              value={platforms}
              onChange={(e) => setPlatforms(e.target.value)}
              placeholder="Facebook, Instagram, TikTok…"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "1 muaj ($)", value: p1m, set: setP1m },
              { label: "3 muaj ($)", value: p3m, set: setP3m },
              { label: "6 muaj ($)", value: p6m, set: setP6m },
              { label: "1 vit ($)", value: p1y, set: setP1y },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                <input
                  type="number"
                  min={0}
                  value={f.value}
                  onChange={(e) => f.set(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded"
            />
            <span className="text-foreground">Aktiv (i shfaqet AI-së për sugjerime)</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Anulo
            </button>
            <button
              onClick={onSave}
              disabled={busy || !name.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Ruaj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
