import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  generateAndPersistFromSession,
  generateAndPersistFromAnalysis,
  fetchActivePackages,
  fetchActiveAddons,
  computeTotals,
  generateAIRecommendation,
  persistRecommendation,
  priceLookupForAddon,
  type AIRecommendation,
  type AddonDuration,
  type RecommendedAddon,
} from "./recommendation-engine.server";

const ADDON_DURATIONS = ["1_month", "3_months", "6_months", "1_year"] as const;
const ADDON_CATEGORIES = [
  "optimization",
  "strategy",
  "analytics",
  "planning",
  "ads_management",
] as const;

// ───── Public-side trigger (no auth, called from diagnosis flow) ─────
// Fire-and-forget. Only requires a session/analysis ID; service-role used internally.
export const triggerRecommendationForSession = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ sessionId: z.string().uuid(), leadId: z.string().uuid().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const id = await generateAndPersistFromSession(data.sessionId, data.leadId ?? null);
      return { ok: true, recommendationId: id };
    } catch (e) {
      console.error("[triggerRecommendationForSession] error:", e);
      return { ok: false, recommendationId: null as string | null };
    }
  });

export const triggerRecommendationForAnalysis = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ analysisId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const id = await generateAndPersistFromAnalysis(data.analysisId);
      return { ok: true, recommendationId: id };
    } catch (e) {
      console.error("[triggerRecommendationForAnalysis] error:", e);
      return { ok: false, recommendationId: null as string | null };
    }
  });

// ───── Admin-only CRUD ─────

export const listRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z.string().optional(),
        priority: z.string().optional(),
        category: z.string().optional(),
        limit: z.number().min(1).max(200).default(100),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("admin_recommendations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status) q = q.eq("status", data.status as never);
    if (data.priority) q = q.eq("priority", data.priority as never);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { recommendations: rows ?? [] };
  });

export const listPackages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("service_packages")
      .select("*")
      .order("display_order");
    if (error) throw new Error(error.message);
    return { packages: data ?? [] };
  });

export const updateRecommendationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "reviewed", "contacted", "converted", "rejected"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("admin_recommendations")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateRecommendationNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), admin_notes: z.string().max(2000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("admin_recommendations")
      .update({ admin_notes: data.admin_notes })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateRecommendationPackages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        package_ids: z.array(z.string().uuid()).min(1).max(5),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const packages = await fetchActivePackages();
    const totals = computeTotals(data.package_ids, packages);
    const { error } = await context.supabase
      .from("admin_recommendations")
      .update({
        recommended_package_ids: data.package_ids,
        normal_price_total: totals.normal_price_total,
        offer_price_total: totals.offer_price_total,
        savings_total: totals.savings_total,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, totals };
  });

export const updateRecommendationProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), client_proposal_text: z.string().max(5000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("admin_recommendations")
      .update({ client_proposal_text: data.client_proposal_text })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertPackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(200),
        category: z.enum(["instagram", "website"]),
        level: z.enum([
          "basic",
          "advanced",
          "premium",
          "full_basic",
          "full_advanced",
          "full_premium",
        ]),
        duration: z.enum([
          "1_month",
          "3_months",
          "6_months",
          "1_year",
          "2_years",
          "5_years",
          "custom",
        ]),
        normal_price: z.number().min(0),
        offer_price: z.number().min(0),
        currency: z.string().default("USD"),
        description: z.string().max(2000).optional().nullable(),
        includes: z.array(z.string()).default([]),
        status: z.enum(["active", "inactive"]).default("active"),
        admin_notes: z.string().max(2000).optional().nullable(),
        is_quote_only: z.boolean().default(false),
        display_order: z.number().int().default(0),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase
        .from("service_packages")
        .update({
          name: data.name,
          category: data.category,
          level: data.level,
          duration: data.duration,
          normal_price: data.normal_price,
          offer_price: data.offer_price,
          currency: data.currency,
          description: data.description ?? null,
          includes: data.includes,
          status: data.status,
          admin_notes: data.admin_notes ?? null,
          is_quote_only: data.is_quote_only,
          display_order: data.display_order,
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: inserted, error } = await context.supabase
      .from("service_packages")
      .insert({
        name: data.name,
        category: data.category,
        level: data.level,
        duration: data.duration,
        normal_price: data.normal_price,
        offer_price: data.offer_price,
        currency: data.currency,
        description: data.description ?? null,
        includes: data.includes,
        status: data.status,
        admin_notes: data.admin_notes ?? null,
        is_quote_only: data.is_quote_only,
        display_order: data.display_order,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id };
  });

export const deletePackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("service_packages")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Regenerate AI text (reasoning + proposal) for an existing recommendation,
// using the current package selection.
export const regenerateProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rec, error } = await context.supabase
      .from("admin_recommendations")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !rec) throw new Error("Rekomandimi nuk u gjet.");

    const packages = await fetchActivePackages();
    const aiRes = await generateAIRecommendation(
      {
        businessName: rec.business_name,
        businessType: rec.business_type,
        city: rec.city,
        digitalScore: rec.digital_score,
        diagnosis: rec.reasoning,
      },
      packages,
    );
    if (!aiRes) throw new Error("Gjenerimi dështoi. Provo më vonë.");

    const ai: AIRecommendation = aiRes.result;
    // Keep current package selection; only refresh text.
    const { error: updErr } = await context.supabase
      .from("admin_recommendations")
      .update({
        reasoning: ai.reasoning,
        client_proposal_text: ai.client_proposal_text,
      })
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);
    return { ok: true, reasoning: ai.reasoning, client_proposal_text: ai.client_proposal_text };
  });
