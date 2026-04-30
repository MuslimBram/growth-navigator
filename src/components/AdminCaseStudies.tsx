import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, Save, X, Loader2, Image, ChevronDown, ChevronUp,
  Eye, EyeOff, GripVertical,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  client_name: string | null;
  industry: string | null;
  problem: string;
  result_summary: string;
  metrics: any[];
  testimonial: string | null;
  testimonial_author: string | null;
  image_url: string | null;
  services: string[];
  display_order: number;
  published: boolean;
}

const EMPTY: Omit<CaseStudy, "id"> = {
  slug: "",
  title: "",
  client_name: "",
  industry: "",
  problem: "",
  result_summary: "",
  metrics: [{ label: "", value: "" }],
  testimonial: "",
  testimonial_author: "",
  image_url: null,
  services: [],
  display_order: 0,
  published: true,
};

const SERVICE_OPTIONS = [
  { value: "seo", label: "SEO" },
  { value: "web_3d", label: "Web 3D" },
  { value: "photo_video_360", label: "Foto/Video 360°" },
  { value: "social_media", label: "Social Media" },
  { value: "google_maps", label: "Google Maps" },
  { value: "combined_package", label: "Paketë Kombinuar" },
];

export function AdminCaseStudies() {
  const [items, setItems] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Omit<CaseStudy, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("case_studies")
      .select("*")
      .order("display_order", { ascending: true });
    if (data) setItems(data as unknown as CaseStudy[]);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const startCreate = () => {
    setForm({ ...EMPTY, display_order: items.length, metrics: [{ label: "", value: "" }] });
    setCreating(true);
    setEditing(null);
  };

  const startEdit = (cs: CaseStudy) => {
    setForm({
      slug: cs.slug,
      title: cs.title,
      client_name: cs.client_name || "",
      industry: cs.industry || "",
      problem: cs.problem,
      result_summary: cs.result_summary,
      metrics: Array.isArray(cs.metrics) && cs.metrics.length > 0 ? cs.metrics : [{ label: "", value: "" }],
      testimonial: cs.testimonial || "",
      testimonial_author: cs.testimonial_author || "",
      image_url: cs.image_url,
      services: Array.isArray(cs.services) ? cs.services : [],
      display_order: cs.display_order,
      published: cs.published,
    });
    setEditing(cs.id);
    setCreating(false);
  };

  const cancel = () => { setEditing(null); setCreating(false); };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, ""),
      metrics: form.metrics.filter((m: any) => m.label || m.value),
    };

    if (creating) {
      await supabase.from("case_studies").insert(payload as any);
    } else if (editing) {
      await supabase.from("case_studies").update(payload as any).eq("id", editing);
    }
    setSaving(false);
    cancel();
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Je i sigurt që do ta fshish këtë rast studimi?")) return;
    await supabase.from("case_studies").delete().eq("id", id);
    fetchItems();
  };

  const togglePublished = async (id: string, current: boolean) => {
    await supabase.from("case_studies").update({ published: !current } as any).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, published: !current } : i));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `case-studies/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("business-reports").upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from("business-reports").getPublicUrl(path);
      setForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
    }
    setUploading(false);
  };

  const updateMetric = (idx: number, field: "label" | "value", val: string) => {
    setForm(prev => ({
      ...prev,
      metrics: prev.metrics.map((m: any, i: number) => i === idx ? { ...m, [field]: val } : m),
    }));
  };

  const addMetric = () => setForm(prev => ({ ...prev, metrics: [...prev.metrics, { label: "", value: "" }] }));
  const removeMetric = (idx: number) => setForm(prev => ({ ...prev, metrics: prev.metrics.filter((_: any, i: number) => i !== idx) }));

  const toggleService = (svc: string) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(svc)
        ? prev.services.filter(s => s !== svc)
        : [...prev.services, svc],
    }));
  };

  const isFormOpen = creating || editing;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Raste Studimi ({items.length})</h2>
        {!isFormOpen && (
          <button onClick={startCreate} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> Shto të ri
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">{creating ? "Rast i ri studimi" : "Edito"}</h3>
                <button onClick={cancel} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Titulli *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                <input placeholder="Klienti" value={form.client_name || ""} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                <input placeholder="Industria" value={form.industry || ""} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>

              <textarea placeholder="Problemi *" value={form.problem} onChange={e => setForm(p => ({ ...p, problem: e.target.value }))} rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              <textarea placeholder="Rezultati *" value={form.result_summary} onChange={e => setForm(p => ({ ...p, result_summary: e.target.value }))} rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />

              {/* Metrics */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Metrikat</div>
                {form.metrics.map((m: any, i: number) => (
                  <div key={i} className="flex gap-2 mb-1">
                    <input placeholder="Label (p.sh. +40%)" value={m.label} onChange={e => updateMetric(i, "label", e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" />
                    <input placeholder="Vlera" value={m.value} onChange={e => updateMetric(i, "value", e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" />
                    <button onClick={() => removeMetric(i)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                <button onClick={addMetric} className="text-xs text-primary hover:underline">+ Shto metrikë</button>
              </div>

              {/* Testimonial */}
              <textarea placeholder="Dëshmi (testimonial)" value={form.testimonial || ""} onChange={e => setForm(p => ({ ...p, testimonial: e.target.value }))} rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              <input placeholder="Autori i dëshmisë" value={form.testimonial_author || ""} onChange={e => setForm(p => ({ ...p, testimonial_author: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />

              {/* Services */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Shërbimet</div>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICE_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => toggleService(s.value)}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium border transition ${form.services.includes(s.value) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image upload */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary transition">
                  <Image className="h-3.5 w-3.5" />
                  {uploading ? "Duke ngarkuar..." : "Ngarko foto"}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {form.image_url && (
                  <div className="flex items-center gap-2">
                    <img src={form.image_url} alt="preview" className="h-10 w-14 rounded object-cover" />
                    <button onClick={() => setForm(p => ({ ...p, image_url: null }))} className="text-xs text-destructive">Fshi</button>
                  </div>
                )}
              </div>

              {/* Published toggle */}
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.published} onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} className="rounded" />
                Publikuar
              </label>

              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.problem || !form.result_summary}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : <><Save className="h-4 w-4 inline mr-1.5" />{creating ? "Krijo" : "Ruaj"}</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Asnjë rast studimi</div>
      ) : (
        <div className="space-y-2">
          {items.map(cs => (
            <div key={cs.id} className={`rounded-xl border bg-card overflow-hidden ${cs.published ? "border-border" : "border-border/50 opacity-60"}`}>
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  {cs.image_url && <img src={cs.image_url} alt="" className="h-8 w-12 rounded object-cover shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{cs.title}</div>
                    <div className="text-[10px] text-muted-foreground">{cs.client_name} · {cs.industry}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => togglePublished(cs.id, cs.published)} className="p-1.5 rounded hover:bg-muted/30" title={cs.published ? "Fshih" : "Publiko"}>
                    {cs.published ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  <button onClick={() => startEdit(cs)} className="p-1.5 rounded hover:bg-muted/30"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button onClick={() => handleDelete(cs.id)} className="p-1.5 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
