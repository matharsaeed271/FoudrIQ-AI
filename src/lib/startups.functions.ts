import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { StartupBlueprint, StartupBlueprintInput } from "./ai.functions";

type Json = string | number | boolean | null | { [k: string]: Json | undefined } | Json[];

export type StartupRow = {
  id: string;
  name: string;
  industry: string | null;
  problem: string | null;
  solution: string | null;
  business_model: string | null;
  revenue_model: string | null;
  pricing: string | null;
  marketing_plan: string | null;
  score: number | null;
  report: Json;
  inputs: Json;
  created_at: string;
  updated_at: string;
};

function friendlyDbError(msg: string): Error {
  if (/permission|denied|jwt/i.test(msg)) return new Error("You must be signed in to do that.");
  if (/network|fetch/i.test(msg)) return new Error("Network error. Please try again.");
  return new Error("Something went wrong. Please try again.");
}

export const saveStartup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { blueprint: StartupBlueprint; inputs: StartupBlueprintInput }) => {
    if (!input?.blueprint) throw new Error("Missing blueprint");
    return input;
  })
  .handler(async ({ data, context }) => {
    const b = data.blueprint;
    const { data: row, error } = await context.supabase
      .from("startups")
      .insert({
        user_id: context.userId,
        name: b.startupName || "Untitled startup",
        industry: data.inputs.customers?.join(", ") ?? null,
        problem: b.problemStatement ?? null,
        solution: b.solution ?? null,
        business_model: b.businessModel ?? null,
        revenue_model: b.revenueModel ?? null,
        pricing: b.pricingSuggestions ?? null,
        marketing_plan: b.marketingStrategy ?? null,
        score: null,
        report: b as never,
        inputs: data.inputs as never,
      })
      .select("id")
      .single();
    if (error) throw friendlyDbError(error.message);
    return { id: row.id };
  });

export const listStartups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("startups")
      .select("id, name, industry, problem, score, created_at, updated_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw friendlyDbError(error.message);
    return data ?? [];
  });

export const getStartup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing id");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("startups")
      .select("*")
      .eq("user_id", context.userId)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw friendlyDbError(error.message);
    if (!row) throw new Error("Startup not found.");
    return row as StartupRow;
  });

export const renameStartup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; name: string }) => {
    if (!input?.id) throw new Error("Missing id");
    const name = input.name?.trim();
    if (!name) throw new Error("Please enter a name.");
    if (name.length > 120) throw new Error("Name is too long.");
    return { id: input.id, name };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("startups")
      .update({ name: data.name })
      .eq("user_id", context.userId)
      .eq("id", data.id);
    if (error) throw friendlyDbError(error.message);
    return { ok: true };
  });

export const deleteStartup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("Missing id");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("startups")
      .delete()
      .eq("user_id", context.userId)
      .eq("id", data.id);
    if (error) throw friendlyDbError(error.message);
    return { ok: true };
  });
