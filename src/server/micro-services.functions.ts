import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PLATFORMS = ["facebook", "instagram", "tiktok", "youtube", "twitter", "linkedin"] as const;
const VARIANTS = ["S", "M", "L", "XL", "none"] as const;
const RISKS = ["low", "medium", "high"] as const;
const CATEGORIES = ["growth", "engagement", "engagement_high", "visibility_boost", "advanced"] as const;

export const listMicroServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("micro_services")
      .select("*")
      .order("platform")
      .order("display_order");
    if (error) throw new Error(error.message);
    return { services: data ?? [] };
  });

export const upsertMicroService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      platform: z.enum(PLATFORMS),
      service_name: z.string().min(1).max(200),
      variant: z.enum(VARIANTS).default("none"),
      unit: z.string().default("per 1K"),
      standard_price: z.number().min(0),
      offer_price: z.number().min(0),
      delivery_time: z.string().max(100).nullable().optional(),
      description: z.string().max(2000).nullable().optional(),
      risk_level: z.enum(RISKS).default("low"),
      recommended_use_case: z.string().max(500).nullable().optional(),
      category: z.enum(CATEGORIES).optional(),
      active: z.boolean().default(true),
      display_order: z.number().int().default(0),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const payload = {
      platform: data.platform,
      service_name: data.service_name,
      variant: data.variant,
      unit: data.unit,
      standard_price: data.standard_price,
      offer_price: data.offer_price,
      delivery_time: data.delivery_time ?? null,
      description: data.description ?? null,
      risk_level: data.risk_level,
      recommended_use_case: data.recommended_use_case ?? null,
      active: data.active,
      display_order: data.display_order,
      ...(data.category ? { category: data.category } : {}),
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("micro_services").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: ins, error } = await context.supabase
      .from("micro_services").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: ins.id };
  });

export const deleteMicroService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("micro_services").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Daily limits per category, per recommendation
const DAILY_LIMITS: Record<string, number> = {
  views: 10,
  likes: 5,
  followers: 3,
  comments: 3,
  komente: 3,
};

function categorizeServiceName(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes("view")) return "views";
  if (n.includes("like")) return "likes";
  if (n.includes("follower") || n.includes("subscriber")) return "followers";
  if (n.includes("comment") || n.includes("komente")) return "comments";
  return null;
}

export const updateRecommendationMicroServices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      items: z.array(z.object({
        service_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(100).default(1),
        total_price: z.number().min(0),
        reason: z.string().max(500).optional(),
      })).max(10),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Daily limit check (count distinct service categories used today across this recommendation)
    if (data.items.length > 0) {
      const ids = data.items.map((i) => i.service_id);
      const { data: services } = await context.supabase
        .from("micro_services").select("id, service_name").in("id", ids);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data: usageToday } = await context.supabase
        .from("micro_service_usage")
        .select("service_id")
        .eq("recommendation_id", data.id)
        .gte("created_at", today.toISOString());

      const usedCounts: Record<string, number> = {};
      for (const u of usageToday ?? []) {
        const svc = (services ?? []).find((s) => s.id === u.service_id);
        const cat = svc ? categorizeServiceName(svc.service_name) : null;
        if (cat) usedCounts[cat] = (usedCounts[cat] ?? 0) + 1;
      }
      // Add new items being proposed
      for (const item of data.items) {
        const svc = (services ?? []).find((s) => s.id === item.service_id);
        const cat = svc ? categorizeServiceName(svc.service_name) : null;
        if (!cat) continue;
        const limit = DAILY_LIMITS[cat];
        if (limit && (usedCounts[cat] ?? 0) >= limit) {
          throw new Error(`Limit ditor i tejkaluar për kategorinë "${cat}" (max ${limit}/ditë).`);
        }
      }
    }

    const total = data.items.reduce((s, i) => s + i.total_price, 0);

    // Read current totals to update grand total
    const { data: rec } = await context.supabase
      .from("admin_recommendations")
      .select("normal_price_total, addons_total, recommended_package_ids")
      .eq("id", data.id).single();

    // Recompute offer_price_total = packages_offer + addons_total + micro
    // We need packages offer; refetch packages
    const pkgIds = Array.isArray(rec?.recommended_package_ids)
      ? (rec!.recommended_package_ids as unknown as string[]) : [];
    let pkgOffer = 0;
    if (pkgIds.length > 0) {
      const { data: pkgs } = await context.supabase
        .from("service_packages").select("offer_price").in("id", pkgIds);
      pkgOffer = (pkgs ?? []).reduce((s, p) => s + (Number(p.offer_price) || 0), 0);
    }
    const addonsTotal = Number(rec?.addons_total ?? 0);
    const grandTotal = pkgOffer + addonsTotal + total;

    const { error } = await context.supabase
      .from("admin_recommendations")
      .update({
        recommended_micro_services: data.items as never,
        micro_services_total: total,
        offer_price_total: grandTotal,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    // Track usage
    if (data.items.length > 0) {
      await context.supabase.from("micro_service_usage").delete().eq("recommendation_id", data.id);
      await context.supabase.from("micro_service_usage").insert(
        data.items.map((i) => ({
          recommendation_id: data.id,
          service_id: i.service_id,
          quantity: i.quantity,
          total_price: i.total_price,
          status: "pending" as const,
        })),
      );
    }

    return { ok: true, total, grandTotal };
  });
