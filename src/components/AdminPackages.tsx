import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listPackages,
  upsertPackage,
  deletePackage,
} from "@/server/recommendations.functions";
import { Loader2, Plus, Pencil, Trash2, X, Save } from "lucide-react";

interface ServicePackage {
  id: string;
  name: string;
  category: "instagram" | "website";
  level: string;
  duration: string;
  normal_price: number | string;
  offer_price: number | string;
  currency: string;
  description: string | null;
  includes: unknown;
  status: "active" | "inactive";
  admin_notes: string | null;
  is_quote_only: boolean;
  display_order: number;
}

const LEVELS = [
  { value: "basic", label: "Bazë" },
  { value: "advanced", label: "Avancuar" },
  { value: "premium", label: "Premium" },
  { value: "full_basic", label: "Full Bazë" },
  { value: "full_advanced", label: "Full Avancuar" },
  { value: "full_premium", label: "Full Premium" },
];

const DURATIONS = [
  { value: "1_month", label: "1 Muaj" },
  { value: "3_months", label: "3 Muaj" },
  { value: "6_months", label: "6 Muaj" },
  { value: "1_year", label: "1 Vit" },
  { value: "2_years", label: "2 Vjet" },
  { value: "5_years", label: "5 Vjet" },
  { value: "custom", label: "Custom (Quote)" },
];

function asArray<T = string>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function AdminPackages() {
  const list = useServerFn(listPackages);
  const upsert = useServerFn(upsertPackage);
  const del = useServerFn(deletePackage);

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ServicePackage | null>(null);
  const [showNew, setShowNew] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await list({ data: undefined as never });
      setPackages(r.packages as unknown as ServicePackage[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Fshi këtë paketë?")) return;
    await del({ data: { id } });
    fetchAll();
  };

  const grouped = packages.reduce<Record<string, ServicePackage[]>>((acc, p) => {
    const key = `${p.category}:${p.level}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">
          {packages.length} paketa në katalog
        </p>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Shto paketë
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([key, pkgs]) => {
            const [cat, lvl] = key.split(":");
            const lvlLabel = LEVELS.find((l) => l.value === lvl)?.label || lvl;
            return (
              <div key={key} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-2 bg-muted/30 border-b border-border">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    {cat} • {lvlLabel}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {pkgs.map((p) => (
                    <div
                      key={p.id}
                      className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/20"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {p.name}
                          {p.status === "inactive" && (
                            <span className="ml-2 text-[10px] text-muted-foreground">
                              (joaktive)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {DURATIONS.find((d) => d.value === p.duration)?.label}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {p.is_quote_only ? (
                          <span className="text-xs text-amber-500">Flet me Adminet</span>
                        ) : (
                          <>
                            <div className="text-sm font-semibold text-foreground">
                              ${Number(p.offer_price)}
                            </div>
                            <div className="text-[10px] text-muted-foreground line-through">
                              ${Number(p.normal_price)}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setEditing(p)}
                          className="rounded p-1.5 hover:bg-muted text-muted-foreground"
                          title="Ndrysho"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="rounded p-1.5 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground"
                          title="Fshi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(editing || showNew) && (
        <PackageEditor
          pkg={editing}
          onClose={() => {
            setEditing(null);
            setShowNew(false);
          }}
          onSaved={() => {
            setEditing(null);
            setShowNew(false);
            fetchAll();
          }}
          onSave={async (input) => {
            await upsert({ data: input });
          }}
        />
      )}
    </div>
  );
}

function PackageEditor({
  pkg,
  onClose,
  onSaved,
  onSave,
}: {
  pkg: ServicePackage | null;
  onClose: () => void;
  onSaved: () => void;
  onSave: (input: {
    id?: string;
    name: string;
    category: "instagram" | "website";
    level: "basic" | "advanced" | "premium" | "full_basic" | "full_advanced" | "full_premium";
    duration: "1_month" | "3_months" | "6_months" | "1_year" | "2_years" | "5_years" | "custom";
    normal_price: number;
    offer_price: number;
    currency?: string;
    description?: string | null;
    includes: string[];
    status: "active" | "inactive";
    admin_notes?: string | null;
    is_quote_only: boolean;
    display_order: number;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(pkg?.name ?? "");
  const [category, setCategory] = useState<"instagram" | "website">(pkg?.category ?? "instagram");
  const [level, setLevel] = useState<string>(pkg?.level ?? "basic");
  const [duration, setDuration] = useState<string>(pkg?.duration ?? "1_month");
  const [normal, setNormal] = useState(String(pkg?.normal_price ?? "0"));
  const [offer, setOffer] = useState(String(pkg?.offer_price ?? "0"));
  const [description, setDescription] = useState(pkg?.description ?? "");
  const [includes, setIncludes] = useState(asArray<string>(pkg?.includes).join("\n"));
  const [status, setStatus] = useState<"active" | "inactive">(pkg?.status ?? "active");
  const [adminNotes, setAdminNotes] = useState(pkg?.admin_notes ?? "");
  const [isQuoteOnly, setIsQuoteOnly] = useState(pkg?.is_quote_only ?? false);
  const [order, setOrder] = useState(String(pkg?.display_order ?? 0));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await onSave({
        id: pkg?.id,
        name,
        category,
        level: level as never,
        duration: duration as never,
        normal_price: Number(normal) || 0,
        offer_price: Number(offer) || 0,
        description: description || null,
        includes: includes
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        status,
        admin_notes: adminNotes || null,
        is_quote_only: isQuoteOnly,
        display_order: Number(order) || 0,
      });
      onSaved();
    } catch (e) {
      console.error(e);
      alert("Gabim. Provo përsëri.");
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
            {pkg ? "Ndrysho paketën" : "Paketë e re"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <Field label="Emri">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kategoria">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as "instagram" | "website")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="instagram">Instagram</option>
                <option value="website">Website</option>
              </select>
            </Field>
            <Field label="Niveli">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Kohëzgjatja">
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {DURATIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Çmimi normal ($)">
              <input
                type="number"
                value={normal}
                onChange={(e) => setNormal(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Çmimi ofertë ($)">
              <input
                type="number"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label="Përshkrim">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
            />
          </Field>
          <Field label="Çfarë përfshin (një rresht për çdo pikë)">
            <textarea
              value={includes}
              onChange={(e) => setIncludes(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none font-mono"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Statusi">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="active">Aktive</option>
                <option value="inactive">Joaktive</option>
              </select>
            </Field>
            <Field label="Renditja">
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isQuoteOnly}
              onChange={(e) => setIsQuoteOnly(e.target.checked)}
            />
            Vetëm me kuotim ("Flet me Adminet")
          </label>
          <Field label="Shënime për Adminin">
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Anulo
            </button>
            <button
              onClick={save}
              disabled={busy || !name}
              className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}
