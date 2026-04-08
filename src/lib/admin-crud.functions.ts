import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

// ─── Generic list ─────────────────────────────────────────
export const listRecords = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      table: z.string().min(1).max(100),
      orderBy: z.string().max(100).optional(),
      ascending: z.boolean().optional(),
    })
  )
  .handler(async ({ data }) => {
    const query = supabaseAdmin
      .from(data.table as any)
      .select("*")
      .order(data.orderBy ?? "created_at", { ascending: data.ascending ?? false });
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows as Record<string, unknown>[];
  });

// ─── Create record ───────────────────────────────────────
export const createRecord = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      table: z.string().min(1).max(100),
      record: z.record(z.unknown()),
    })
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from(data.table as any)
      .insert(data.record as any)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ─── Update record ───────────────────────────────────────
export const updateRecord = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      table: z.string().min(1).max(100),
      id: z.string().uuid(),
      updates: z.record(z.unknown()),
    })
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from(data.table as any)
      .update(data.updates as any)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ─── Delete record ───────────────────────────────────────
export const deleteRecord = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      table: z.string().min(1).max(100),
      id: z.string().uuid(),
    })
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from(data.table as any)
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Toggle boolean field ────────────────────────────────
export const toggleField = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      table: z.string().min(1).max(100),
      id: z.string().uuid(),
      field: z.string().min(1).max(100),
      value: z.boolean(),
    })
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from(data.table as any)
      .update({ [data.field]: data.value } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
