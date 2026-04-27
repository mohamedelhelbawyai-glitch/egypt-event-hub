/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Loader2,
  Plus,
  Save,
  Trash2,
  XCircle,
  Ban,
  Pencil,
  X,
} from "lucide-react";
import { z } from "zod";
import {
  getEventAdmin,
  updateEventAdmin,
  approveEventAdmin,
  rejectEventAdmin,
  cancelEventAdmin,
  deleteEventAdmin,
  listAudienceRulesAdmin,
  listCategoriesAdmin,
  listOrganizersAdmin,
  listRefundPoliciesAdmin,
  listTagsAdmin,
  listTicketTemplatesAdmin,
  listVenuesAdmin,
} from "@/lib/admin-api.functions";
import { eventsApi } from "@/lib/api-client";
import { getAdminSession } from "@/lib/admin-auth.functions";
import type { AudienceRule, Category, OrganizerProfile, RefundPolicy, Tag, TicketTemplate, Venue } from "@/lib/api-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiStatusBadge } from "@/components/admin/AdminCrudPage";

// ─── Status helpers ──────────────────────────────────────

const EDITABLE_STATUSES = ["DRAFT", "PENDING_REVIEW", "PUBLISHED"];
const PUBLIC_STATUSES = ["PUBLISHED", "ON_SALE", "SOLD_OUT", "LIVE"];
const formats = ["GA", "SEATED", "ONLINE", "HYBRID", "FREE"] as const;
const visibilityOptions = ["PUBLIC", "PRIVATE"] as const;
const refundTypes = ["NO_REFUND", "FULL", "PARTIAL", "EXCHANGE"] as const;

// ─── Ticket type form schema ─────────────────────────────

const ticketTypeSchema = z.object({
  nameAr: z.string().min(1, "Arabic name is required").max(60),
  nameEn: z.string().min(1, "English name is required").max(60),
  visualType: z.enum(["COLOR", "IMAGE"]),
  visualValue: z.string().min(1, "Visual value is required"),
  price: z.coerce.number().min(0).max(999999),
  quantityTotal: z.coerce.number().int().min(1).max(100000),
  maxPerOrder: z.coerce.number().int().min(1),
  peoplePerTicket: z.coerce.number().int().min(1).max(20),
  saleStartsAt: z.string().min(1, "Sale open time is required"),
  saleEndsAt: z.string().min(1, "Sale close time is required"),
  perksText: z.string().optional(),
  visibility: z.enum(["PUBLIC", "HIDDEN"]),
});

type TicketTypeForm = z.infer<typeof ticketTypeSchema>;

// ─── Event update schema ─────────────────────────────────

const updateEventSchema = z.object({
  organizerId: z.string().optional(),
  titleAr: z.string().min(3).max(120),
  titleEn: z.string().min(3).max(120),
  format: z.enum(formats),
  categoryId: z.string().min(1, "Category is required"),
  descriptionAr: z.string().min(20).max(2000),
  descriptionEn: z.string().min(20).max(2000),
  coverImageUrl: z.string().url("Must be a valid URL"),
  galleryText: z.string().optional(),
  tagIds: z.array(z.string()).max(10),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  doorsOpenAt: z.string().optional(),
  venueId: z.string().optional(),
  streamUrl: z.string().optional(),
  visibility: z.enum(visibilityOptions),
  audienceRestrictionId: z.string().optional(),
  refundMode: z.enum(["template", "custom"]),
  refundPolicyId: z.string().optional(),
  customRefundType: z.enum(refundTypes),
  customRefundDeadlineDaysBefore: z.coerce.number().int().min(0).optional(),
  customRefundPercentage: z.coerce.number().int().min(0).max(100).optional(),
}).superRefine((value, ctx) => {
  const startsAt = new Date(value.startsAt);
  const endsAt = new Date(value.endsAt);
  if (Number.isFinite(startsAt.valueOf()) && Number.isFinite(endsAt.valueOf()) && endsAt <= startsAt) {
    ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End time must be after start time" });
  }
  if (value.doorsOpenAt) {
    const doorsOpenAt = new Date(value.doorsOpenAt);
    if (Number.isFinite(doorsOpenAt.valueOf()) && doorsOpenAt >= startsAt) {
      ctx.addIssue({ code: "custom", path: ["doorsOpenAt"], message: "Doors open must be before event start" });
    }
  }
  if (["GA", "SEATED", "HYBRID"].includes(value.format) && !value.venueId) {
    ctx.addIssue({ code: "custom", path: ["venueId"], message: "Venue is required for this format" });
  }
  if (["ONLINE", "HYBRID"].includes(value.format)) {
    const streamUrl = value.streamUrl?.trim();
    if (!streamUrl || !z.string().url().safeParse(streamUrl).success) {
      ctx.addIssue({ code: "custom", path: ["streamUrl"], message: "A valid stream URL is required" });
    }
  }
  if (value.refundMode === "template" && !value.refundPolicyId) {
    ctx.addIssue({ code: "custom", path: ["refundPolicyId"], message: "Refund policy is required" });
  }
});

type UpdateEventForm = z.infer<typeof updateEventSchema>;

// ─── Helpers ─────────────────────────────────────────────

function toIso(value?: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function toLocalDatetime(isoString?: string | null) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (!Number.isFinite(d.valueOf())) return "";
  // datetime-local expects "YYYY-MM-DDTHH:mm"
  return d.toISOString().slice(0, 16);
}

function listFromLines(value?: string) {
  return (value || "").split("\n").map((l) => l.trim()).filter(Boolean);
}

function fieldError(error?: { message?: string }) {
  if (!error?.message) return null;
  return <p className="mt-1 text-xs font-medium text-destructive">{error.message}</p>;
}

function sectionTitle(number: number, title: string) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {number}
      </span>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
    </div>
  );
}

function blankTicket(): TicketTypeForm {
  return {
    nameAr: "",
    nameEn: "",
    visualType: "COLOR",
    visualValue: "#7c3aed",
    price: 0,
    quantityTotal: 100,
    maxPerOrder: 10,
    peoplePerTicket: 1,
    saleStartsAt: "",
    saleEndsAt: "",
    perksText: "",
    visibility: "PUBLIC",
  };
}

// ─── Inventory badge ─────────────────────────────────────

function InventoryBar({ sold, reserved, total }: { sold: number; reserved: number; total: number }) {
  const available = Math.max(0, total - sold - reserved);
  const soldPct = total > 0 ? Math.min(100, (sold / total) * 100) : 0;
  const reservedPct = total > 0 ? Math.min(100, (reserved / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div style={{ width: `${soldPct}%` }} className="bg-destructive transition-all" />
        <div style={{ width: `${reservedPct}%` }} className="bg-warning/70 transition-all" />
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span><span className="font-semibold text-foreground">{sold}</span> sold</span>
        <span><span className="font-semibold text-foreground">{reserved}</span> reserved</span>
        <span><span className="font-semibold text-success">{available}</span> available</span>
        <span className="ml-auto">{total} total</span>
      </div>
    </div>
  );
}

// ─── Ticket type row (read mode) ─────────────────────────

function TicketRow({
  ticket,
  token,
  eventId,
  onRefresh,
  templates,
}: {
  ticket: any;
  token: string;
  eventId: string;
  onRefresh: () => Promise<void>;
  templates: TicketTemplate[];
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const sold = ticket.quantitySold ?? 0;
  const reserved = ticket.quantityReserved ?? 0;
  const total = ticket.quantityTotal ?? 0;
  const hasSales = sold + reserved > 0;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TicketTypeForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ticketTypeSchema) as any,
    defaultValues: {
      nameAr: ticket.nameAr ?? "",
      nameEn: ticket.nameEn ?? "",
      visualType: ticket.visualType ?? "COLOR",
      visualValue: ticket.visualValue ?? "#7c3aed",
      price: ticket.price ?? 0,
      quantityTotal: total,
      maxPerOrder: ticket.maxPerOrder ?? 10,
      peoplePerTicket: ticket.peoplePerTicket ?? 1,
      saleStartsAt: toLocalDatetime(ticket.saleStartsAt),
      saleEndsAt: toLocalDatetime(ticket.saleEndsAt),
      perksText: Array.isArray(ticket.perks) ? ticket.perks.join("\n") : "",
      visibility: ticket.visibility ?? "PUBLIC",
    },
  });

  const onSave = handleSubmit(async (values) => {
    if (values.maxPerOrder > values.quantityTotal) {
      return;
    }
    if (values.quantityTotal < sold + reserved) {
      setErr(`Cannot reduce total below ${sold + reserved} (sold + reserved).`);
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await eventsApi.updateTicketType(eventId, ticket.id, {
        nameAr: values.nameAr,
        nameEn: values.nameEn,
        visualType: values.visualType,
        visualValue: values.visualValue,
        price: Number(values.price),
        quantityTotal: Number(values.quantityTotal),
        maxPerOrder: Number(values.maxPerOrder),
        peoplePerTicket: Number(values.peoplePerTicket),
        saleStartsAt: toIso(values.saleStartsAt),
        saleEndsAt: toIso(values.saleEndsAt),
        perks: listFromLines(values.perksText),
        visibility: values.visibility,
      } as any, token);
      await onRefresh();
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to update ticket type.");
    } finally {
      setSaving(false);
    }
  });

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await eventsApi.deleteTicketType(eventId, ticket.id, token);
      await onRefresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete ticket type.");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (editing) {
    return (
      <div className="rounded-xl border border-primary/30 bg-card p-4">
        {err && <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold">الاسم بالعربية</label>
            <input dir="rtl" {...register("nameAr")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {fieldError(errors.nameAr)}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Name (English)</label>
            <input {...register("nameEn")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {fieldError(errors.nameEn)}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold">Visual Type</label>
            <select {...register("visualType")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="COLOR">Color</option>
              <option value="IMAGE">Image URL</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Visual Value</label>
            <input {...register("visualValue")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Price (EGP)</label>
            <input type="number" min={0} {...register("price")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Total Tickets</label>
            <input type="number" min={sold + reserved || 1} {...register("quantityTotal")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {fieldError(errors.quantityTotal)}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold">Max per order</label>
            <input type="number" min={1} {...register("maxPerOrder")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">People/ticket</label>
            <input type="number" min={1} max={20} {...register("peoplePerTicket")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Sale Opens</label>
            <input type="datetime-local" {...register("saleStartsAt")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Sale Closes</label>
            <input type="datetime-local" {...register("saleEndsAt")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold">Perks (one per line)</label>
            <textarea rows={2} {...register("perksText")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Visibility</label>
            <select {...register("visibility")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="PUBLIC">Visible</option>
              <option value="HIDDEN">Hidden</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => { reset(); setEditing(false); setErr(null); }} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent">
            Cancel
          </button>
          <button type="button" onClick={onSave} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{ticket.nameEn}</p>
            <p className="text-sm text-muted-foreground" dir="rtl">{ticket.nameAr}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium">{ticket.visibility}</span>
            <span className="text-sm font-bold">EGP {ticket.price ?? 0}</span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Edit ticket type"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title={hasSales ? "Will be hidden (has sales)" : "Delete ticket type"}
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          </div>
        </div>
        <InventoryBar sold={sold} reserved={reserved} total={total} />
        {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{hasSales ? "Hide Ticket Type" : "Delete Ticket Type"}</AlertDialogTitle>
            <AlertDialogDescription>
              {hasSales
                ? `This ticket type has ${sold + reserved} sold/reserved tickets and cannot be hard-deleted. It will be hidden from public view instead.`
                : "This ticket type has no sales. It will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              {hasSales ? "Hide" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Add ticket type form ─────────────────────────────────

function AddTicketForm({
  eventId,
  token,
  templates,
  onDone,
}: {
  eventId: string;
  token: string;
  templates: TicketTemplate[];
  onDone: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<TicketTypeForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ticketTypeSchema) as any,
    defaultValues: blankTicket(),
  });

  const onSave = handleSubmit(async (values) => {
    if (values.maxPerOrder > values.quantityTotal) {
      setErr("Max per order cannot exceed total quantity.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await eventsApi.createTicketType(eventId, {
        nameAr: values.nameAr,
        nameEn: values.nameEn,
        visualType: values.visualType,
        visualValue: values.visualValue,
        price: Number(values.price),
        quantityTotal: Number(values.quantityTotal),
        maxPerOrder: Number(values.maxPerOrder),
        peoplePerTicket: Number(values.peoplePerTicket),
        saleStartsAt: toIso(values.saleStartsAt),
        saleEndsAt: toIso(values.saleEndsAt),
        perks: listFromLines(values.perksText),
        visibility: values.visibility,
      } as any, token);
      await onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create ticket type.");
      setSaving(false);
    }
  });

  return (
    <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
      <p className="mb-3 text-sm font-semibold text-primary">New Ticket Type</p>
      {err && <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>}

      <div className="mb-3">
        <label className="mb-1 block text-xs font-semibold">Start from template</label>
        <select
          onChange={(e) => {
            const tpl = templates.find((t) => t.id === e.target.value);
            if (!tpl) return;
            setValue("nameAr", tpl.nameAr);
            setValue("nameEn", tpl.nameEn);
            setValue("visualType", tpl.visualType as any);
            setValue("visualValue", tpl.visualValue || "#7c3aed");
            setValue("price", Number(tpl.defaultPrice || 0));
          }}
          className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Start blank</option>
          {templates.filter((t) => t.isActive).map((t) => (
            <option key={t.id} value={t.id}>{t.nameEn} — EGP {t.defaultPrice ?? 0}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">الاسم بالعربية</label>
          <input dir="rtl" {...register("nameAr")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          {fieldError(errors.nameAr)}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">Name (English)</label>
          <input {...register("nameEn")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          {fieldError(errors.nameEn)}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold">Visual Type</label>
          <select {...register("visualType")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="COLOR">Color</option>
            <option value="IMAGE">Image URL</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">Visual Value</label>
          <input {...register("visualValue")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">Price (EGP)</label>
          <input type="number" min={0} {...register("price")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">Total Tickets</label>
          <input type="number" min={1} {...register("quantityTotal")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          {fieldError(errors.quantityTotal)}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-semibold">Max per order</label>
          <input type="number" min={1} {...register("maxPerOrder")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">People/ticket</label>
          <input type="number" min={1} max={20} {...register("peoplePerTicket")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">Sale Opens</label>
          <input type="datetime-local" {...register("saleStartsAt")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          {fieldError(errors.saleStartsAt)}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">Sale Closes</label>
          <input type="datetime-local" {...register("saleEndsAt")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          {fieldError(errors.saleEndsAt)}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">Perks (one per line)</label>
          <textarea rows={2} {...register("perksText")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">Visibility</label>
          <select {...register("visibility")} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="PUBLIC">Visible</option>
            <option value="HIDDEN">Hidden</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={() => onDone()} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent">
          Cancel
        </button>
        <button type="button" onClick={onSave} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Add Ticket Type
        </button>
      </div>
    </div>
  );
}

// ─── Route ───────────────────────────────────────────────

export const Route = createFileRoute("/admin/events/$eventId")({
  loader: async ({ params }) => {
    const [event, categories, tags, audienceRules, refundPolicies, ticketTemplates, venueList, organizerList, session] =
      await Promise.all([
        getEventAdmin({ data: { id: params.eventId } }),
        listCategoriesAdmin(),
        listTagsAdmin(),
        listAudienceRulesAdmin(),
        listRefundPoliciesAdmin(),
        listTicketTemplatesAdmin(),
        listVenuesAdmin({ data: { page: 1, limit: 20 } }),
        listOrganizersAdmin({ data: { page: 1, limit: 50 } }),
        getAdminSession(),
      ]);

    return {
      event: event as any,
      categories: Array.isArray(categories) ? categories : [],
      tags: Array.isArray(tags) ? tags : [],
      audienceRules: Array.isArray(audienceRules) ? audienceRules : [],
      refundPolicies: Array.isArray(refundPolicies) ? refundPolicies : [],
      ticketTemplates: Array.isArray(ticketTemplates) ? ticketTemplates : [],
      venues: Array.isArray(venueList?.rows) ? venueList.rows : [],
      organizers: Array.isArray(organizerList) ? organizerList : [],
      token: session.admin?.accessToken ?? "",
    };
  },
  component: EventDetailPage,
});

// ─── Main page ───────────────────────────────────────────

function EventDetailPage() {
  const loaderData = Route.useLoaderData() as {
    event: any;
    categories: Category[];
    tags: Tag[];
    audienceRules: AudienceRule[];
    refundPolicies: RefundPolicy[];
    ticketTemplates: TicketTemplate[];
    venues: Venue[];
    organizers: OrganizerProfile[];
    token: string;
  };

  const { categories, tags, audienceRules, refundPolicies, ticketTemplates, venues, organizers, token } = loaderData;
  const [event, setEvent] = useState<any>(loaderData.event);
  const { eventId } = Route.useParams();
  const navigate = useNavigate();

  const updateFn = useServerFn(updateEventAdmin);
  const approveFn = useServerFn(approveEventAdmin);
  const rejectFn = useServerFn(rejectEventAdmin);
  const cancelFn = useServerFn(cancelEventAdmin);
  const deleteFn = useServerFn(deleteEventAdmin);

  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  // Moderation dialogs
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [moderating, setModerating] = useState<"approve" | "reject" | "cancel" | "delete" | null>(null);

  // Ticket type UI
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<any[]>(event?.ticketTypes ?? []);

  const isEditable = EDITABLE_STATUSES.includes(event?.status);
  const isPublic = PUBLIC_STATUSES.includes(event?.status);
  const isDraft = event?.status === "DRAFT";
  const isCancelled = event?.status === "CANCELLED";

  // ── Refresh event data ──────────────────────────────────
  const refreshEvent = async () => {
    try {
      const fresh = await getEventAdmin({ data: { id: eventId } });
      setEvent(fresh);
      setTicketTypes((fresh as any)?.ticketTypes ?? []);
    } catch {
      // silent — stale data shown
    }
  };

  // ── Build defaults from event ───────────────────────────
  const formDefaults: UpdateEventForm = useMemo(() => {
    const e = event ?? {};
    const hasCustomRefund = !e.refundPolicyId && e.customRefundPolicy;
    return {
      organizerId: e.organizerId ?? e.organizer?.id ?? "",
      titleAr: e.titleAr ?? "",
      titleEn: e.titleEn ?? "",
      format: e.format ?? "GA",
      categoryId: e.categoryId ?? e.category?.id ?? "",
      descriptionAr: e.descriptionAr ?? "",
      descriptionEn: e.descriptionEn ?? "",
      coverImageUrl: e.coverImageUrl ?? "",
      galleryText: Array.isArray(e.galleryUrls) ? e.galleryUrls.join("\n") : "",
      tagIds: Array.isArray(e.tags) ? e.tags.map((t: any) => t.id ?? t) : (e.tagIds ?? []),
      startsAt: toLocalDatetime(e.startsAt),
      endsAt: toLocalDatetime(e.endsAt),
      doorsOpenAt: toLocalDatetime(e.doorsOpenAt),
      venueId: e.venueId ?? e.venue?.id ?? "",
      streamUrl: e.streamUrl ?? "",
      visibility: e.visibility ?? "PUBLIC",
      audienceRestrictionId: e.audienceRestrictionId ?? e.audienceRestriction?.id ?? "",
      refundMode: hasCustomRefund ? "custom" : "template",
      refundPolicyId: e.refundPolicyId ?? "",
      customRefundType: e.customRefundPolicy?.type ?? "NO_REFUND",
      customRefundDeadlineDaysBefore: e.customRefundPolicy?.deadlineDaysBefore ?? 7,
      customRefundPercentage: e.customRefundPolicy?.refundPercentage ?? 50,
    };
  }, [event]);

  const {
    control,
    register,
    handleSubmit,
    watch,
    resetField,
    formState: { errors, isDirty },
  } = useForm<UpdateEventForm>({
    defaultValues: formDefaults,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(updateEventSchema) as any,
    mode: "onBlur",
  });

  const format = watch("format");
  const refundMode = watch("refundMode");
  const coverImageUrl = watch("coverImageUrl");
  const showVenue = ["GA", "SEATED", "HYBRID", "FREE"].includes(format);
  const showStream = ["ONLINE", "HYBRID"].includes(format);
  const coverPreview = useMemo(
    () => (z.string().url().safeParse(coverImageUrl).success ? coverImageUrl : ""),
    [coverImageUrl],
  );

  useEffect(() => {
    resetField("venueId");
    resetField("streamUrl");
  }, [format, resetField]);

  // ── Save edits ──────────────────────────────────────────
  const onSubmit = handleSubmit(
    async (values) => {
      setSaving(true);
      setGlobalError(null);
      setGlobalSuccess(null);
      try {
        const updates: Record<string, unknown> = {
          ...(values.organizerId ? { organizerId: values.organizerId } : {}),
          titleAr: values.titleAr.trim(),
          titleEn: values.titleEn.trim(),
          format: values.format,
          categoryId: values.categoryId,
          descriptionAr: values.descriptionAr.trim(),
          descriptionEn: values.descriptionEn.trim(),
          coverImageUrl: values.coverImageUrl.trim(),
          galleryUrls: listFromLines(values.galleryText).slice(0, 10),
          tagIds: values.tagIds,
          startsAt: toIso(values.startsAt),
          endsAt: toIso(values.endsAt),
          visibility: values.visibility,
        };
        if (values.doorsOpenAt) updates.doorsOpenAt = toIso(values.doorsOpenAt);
        if (values.venueId) updates.venueId = values.venueId;
        if (values.streamUrl) updates.streamUrl = values.streamUrl.trim();
        if (values.audienceRestrictionId) updates.audienceRestrictionId = values.audienceRestrictionId;
        if (values.refundMode === "template") {
          updates.refundPolicyId = values.refundPolicyId;
        } else {
          updates.customRefundPolicy = {
            type: values.customRefundType,
            deadlineDaysBefore: values.customRefundDeadlineDaysBefore,
            refundPercentage: values.customRefundType === "PARTIAL" ? values.customRefundPercentage : undefined,
          };
        }

        const result = await updateFn({ data: { id: eventId, updates } });
        setEvent((result as any)?.data ?? result ?? event);
        setGlobalSuccess("Event updated successfully.");
      } catch (e) {
        setGlobalError(e instanceof Error ? e.message : "Failed to update event.");
      } finally {
        setSaving(false);
      }
    },
    () => {
      setGlobalError("Please fix the highlighted errors.");
    },
  );

  // ── Moderation actions ──────────────────────────────────
  const handleApprove = async () => {
    setModerating("approve");
    setGlobalError(null);
    try {
      await approveFn({ data: { id: eventId } });
      await refreshEvent();
      setGlobalSuccess("Event approved.");
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Failed to approve event.");
    } finally {
      setModerating(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setModerating("reject");
    setShowRejectDialog(false);
    setGlobalError(null);
    try {
      await rejectFn({ data: { id: eventId, reason: rejectReason.trim() } });
      await refreshEvent();
      setGlobalSuccess("Event rejected.");
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Failed to reject event.");
    } finally {
      setModerating(null);
      setRejectReason("");
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setModerating("cancel");
    setShowCancelDialog(false);
    setGlobalError(null);
    try {
      await cancelFn({ data: { id: eventId, reason: cancelReason.trim() } });
      await refreshEvent();
      setGlobalSuccess("Event cancelled.");
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Failed to cancel event.");
    } finally {
      setModerating(null);
      setCancelReason("");
    }
  };

  const handleDelete = async () => {
    setModerating("delete");
    setShowDeleteDialog(false);
    try {
      await deleteFn({ data: { id: eventId } });
      window.sessionStorage.setItem("tazkara:event-deleted", "Draft event deleted.");
      navigate({ to: "/admin/events" });
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Failed to delete event.");
      setModerating(null);
    }
  };

  // ── Public visibility check ─────────────────────────────
  const handleViewPublic = async () => {
    try {
      const result = await eventsApi.getPublicEvent(eventId);
      const data = (result as any)?.data ?? result;
      if (data?.id) {
        setGlobalSuccess(`Event is publicly visible. Status: ${data.status}`);
      } else {
        setGlobalError("Event is not visible in the public API.");
      }
    } catch {
      setGlobalError("Event is not visible in the public API (or public endpoint returned an error).");
    }
  };

  // ─── Render ───────────────────────────────────────────

  return (
    <div className="flex min-h-full flex-col pb-28">
      {/* Header */}
      <div className="border-b border-border bg-card/70 px-8 py-6 backdrop-blur">
        <Link to="/admin/events" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft size={16} />
          Back to events
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event Management</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{event?.titleEn ?? "Event Detail"}</h1>
            {event?.titleAr && <p className="mt-0.5 text-base text-muted-foreground" dir="rtl">{event.titleAr}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ApiStatusBadge status={event?.status} />

            {event?.status === "PENDING_REVIEW" && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={!!moderating}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm font-semibold text-success hover:bg-success/20 disabled:opacity-50"
                >
                  {moderating === "approve" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Approve
                </button>
                <button
                  onClick={() => { setRejectReason(""); setShowRejectDialog(true); }}
                  disabled={!!moderating}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
                >
                  {moderating === "reject" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Reject
                </button>
              </>
            )}

            {!isCancelled && !isDraft && (
              <button
                onClick={() => { setCancelReason(""); setShowCancelDialog(true); }}
                disabled={!!moderating}
                className="inline-flex items-center gap-1.5 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm font-semibold text-warning-foreground hover:bg-warning/20 disabled:opacity-50"
              >
                {moderating === "cancel" ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                Cancel Event
              </button>
            )}

            {isDraft && (
              <button
                onClick={() => setShowDeleteDialog(true)}
                disabled={!!moderating}
                className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50"
              >
                {moderating === "delete" ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete Draft
              </button>
            )}

            {isPublic && (
              <button
                onClick={handleViewPublic}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-accent"
              >
                <ExternalLink size={14} />
                Verify Public
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global messages */}
      <div className="px-8 pt-4 space-y-3">
        {globalSuccess && (
          <div className="flex items-center justify-between rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            {globalSuccess}
            <button onClick={() => setGlobalSuccess(null)}><X size={14} /></button>
          </div>
        )}
        {globalError && (
          <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {globalError}
            <button onClick={() => setGlobalError(null)}><X size={14} /></button>
          </div>
        )}
        {!isEditable && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
            This event is <strong>{event?.status}</strong> — editing is disabled. Only moderation actions (approve / reject / cancel) are available.
          </div>
        )}
      </div>

      {/* Edit form */}
      <form onSubmit={onSubmit} className="space-y-6 p-8">
        <fieldset disabled={!isEditable} className="space-y-6 disabled:opacity-60">

          {/* Section 1 — Basic Information */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            {sectionTitle(1, "Basic Information")}

            <div className="mb-4">
              <label htmlFor="organizerId" className="mb-1.5 block text-sm font-semibold">
                Organizer <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <select id="organizerId" {...register("organizerId")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">— Platform event —</option>
                {organizers
                  .filter((org) => (org as any).status === "APPROVED" || (org as any).status === "ACTIVE")
                  .map((org) => (
                    <option key={org.id} value={org.id}>{org.displayNameEn}</option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div data-error={!!errors.titleAr}>
                <label htmlFor="titleAr" className="mb-1.5 block text-sm font-semibold">عنوان الفعالية</label>
                <input id="titleAr" dir="rtl" lang="ar" {...register("titleAr")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-right text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                {fieldError(errors.titleAr)}
              </div>
              <div data-error={!!errors.titleEn}>
                <label htmlFor="titleEn" className="mb-1.5 block text-sm font-semibold">Event Title</label>
                <input id="titleEn" {...register("titleEn")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                {fieldError(errors.titleEn)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div data-error={!!errors.format}>
                <label htmlFor="format" className="mb-1.5 block text-sm font-semibold">Format</label>
                <select id="format" {...register("format")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="GA">General Admission</option>
                  <option value="SEATED">Reserved Seating</option>
                  <option value="ONLINE">Online Only</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="FREE">Free Event</option>
                </select>
              </div>
              <div data-error={!!errors.categoryId}>
                <label htmlFor="categoryId" className="mb-1.5 block text-sm font-semibold">Category</label>
                <select id="categoryId" {...register("categoryId")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
                </select>
                {fieldError(errors.categoryId)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div data-error={!!errors.descriptionAr}>
                <label className="mb-1.5 block text-sm font-semibold">الوصف بالعربية</label>
                <textarea rows={5} dir="rtl" lang="ar" {...register("descriptionAr")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-right text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                {fieldError(errors.descriptionAr)}
              </div>
              <div data-error={!!errors.descriptionEn}>
                <label className="mb-1.5 block text-sm font-semibold">Description (English)</label>
                <textarea rows={5} {...register("descriptionEn")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                {fieldError(errors.descriptionEn)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
              <div data-error={!!errors.coverImageUrl}>
                <label className="mb-1.5 block text-sm font-semibold">Cover Image URL</label>
                <input {...register("coverImageUrl")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                {fieldError(errors.coverImageUrl)}
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
                {coverPreview
                  ? <img src={coverPreview} alt="Cover" className="aspect-video h-full w-full object-cover" />
                  : <div className="flex aspect-video items-center justify-center text-muted-foreground text-xs">No preview</div>}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Gallery URLs</label>
                <textarea rows={3} placeholder="One URL per line" {...register("galleryText")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <Controller
                control={control}
                name="tagIds"
                render={({ field }) => (
                  <div>
                    <p className="mb-1.5 block text-sm font-semibold">Tags</p>
                    <div className="grid max-h-36 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3">
                      {tags.map((tag) => (
                        <label key={tag.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={field.value.includes(tag.id)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...field.value, tag.id].slice(0, 10)
                                : field.value.filter((id) => id !== tag.id);
                              field.onChange(next);
                            }}
                          />
                          {tag.nameEn}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              />
            </div>
          </section>

          {/* Section 2 — Timing */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            {sectionTitle(2, "Timing")}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div data-error={!!errors.startsAt}>
                <label className="mb-1.5 block text-sm font-semibold">Start Date & Time</label>
                <input type="datetime-local" {...register("startsAt")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                <p className="mt-1 text-xs text-muted-foreground">Cairo time (UTC+2)</p>
                {fieldError(errors.startsAt)}
              </div>
              <div data-error={!!errors.endsAt}>
                <label className="mb-1.5 block text-sm font-semibold">End Date & Time</label>
                <input type="datetime-local" {...register("endsAt")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                {fieldError(errors.endsAt)}
              </div>
              <div data-error={!!errors.doorsOpenAt}>
                <label className="mb-1.5 block text-sm font-semibold">Doors Open Time</label>
                <input type="datetime-local" {...register("doorsOpenAt")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                {fieldError(errors.doorsOpenAt)}
              </div>
            </div>
          </section>

          {/* Section 3 — Location */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            {sectionTitle(3, "Location & Stream")}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {showVenue && (
                <div data-error={!!errors.venueId}>
                  <label className="mb-1.5 block text-sm font-semibold">Venue</label>
                  <select {...register("venueId")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select approved venue</option>
                    {venues.filter((v) => v.status === "APPROVED").map((v) => (
                      <option key={v.id} value={v.id}>{v.nameEn} — capacity {v.totalCapacity}</option>
                    ))}
                  </select>
                  {fieldError(errors.venueId)}
                </div>
              )}
              {showStream && (
                <div data-error={!!errors.streamUrl}>
                  <label className="mb-1.5 block text-sm font-semibold">Stream URL</label>
                  <input {...register("streamUrl")} placeholder="https://zoom.us/j/..." className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                  {fieldError(errors.streamUrl)}
                </div>
              )}
            </div>
          </section>

          {/* Section 4 — Audience & Policy */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            {sectionTitle(4, "Audience & Policy")}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Visibility</label>
                <select {...register("visibility")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Who can attend?</label>
                <select {...register("audienceRestrictionId")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Open to all</option>
                  {audienceRules.filter((r) => r.isActive).map((r) => (
                    <option key={r.id} value={r.id}>{r.labelEn} / {r.labelAr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Refund Policy Mode</label>
                <select {...register("refundMode")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="template">Template</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            {refundMode === "template" ? (
              <div className="mt-4" data-error={!!errors.refundPolicyId}>
                <label className="mb-1.5 block text-sm font-semibold">Refund Policy</label>
                <select {...register("refundPolicyId")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select policy</option>
                  {refundPolicies.filter((p) => p.isActive).map((p) => (
                    <option key={p.id} value={p.id}>{p.nameEn} — {p.type}</option>
                  ))}
                </select>
                {fieldError(errors.refundPolicyId)}
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Policy Type</label>
                  <select {...register("customRefundType")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                    {refundTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Deadline Days Before</label>
                  <input type="number" min={0} {...register("customRefundDeadlineDaysBefore")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Refund %</label>
                  <input type="number" min={0} max={100} {...register("customRefundPercentage")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            )}
          </section>
        </fieldset>

        {/* Section 5 — Ticket Types */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          {sectionTitle(5, "Ticket Types")}

          {ticketTypes.length === 0 && (
            <p className="mb-4 text-sm text-muted-foreground">No ticket types yet. Add one below.</p>
          )}

          <div className="space-y-3">
            {ticketTypes.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                token={token}
                eventId={eventId}
                templates={ticketTemplates}
                onRefresh={refreshEvent}
              />
            ))}
          </div>

          {showAddTicket ? (
            <div className="mt-3">
              <AddTicketForm
                eventId={eventId}
                token={token}
                templates={ticketTemplates}
                onDone={async () => {
                  setShowAddTicket(false);
                  await refreshEvent();
                }}
              />
            </div>
          ) : (
            !isCancelled && (
              <button
                type="button"
                onClick={() => setShowAddTicket(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-accent"
              >
                <Plus size={16} />
                Add Ticket Type
              </button>
            )
          )}
        </section>
      </form>

      {/* Sticky save bar (only when editable and form is dirty) */}
      {isEditable && (
        <div className="fixed bottom-0 left-64 right-0 z-30 border-t border-border bg-card/95 px-8 py-4 shadow-pop backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{isDirty ? "You have unsaved changes." : "No unsaved changes."}</p>
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving || !isDirty}
              className="inline-flex items-center gap-2 rounded-xl admin-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* ── Reject dialog ── */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Event</AlertDialogTitle>
            <AlertDialogDescription>Provide a reason that will be sent to the organizer.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={!rejectReason.trim()} className="bg-destructive hover:bg-destructive/90">
              Reject Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Cancel dialog ── */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Event</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the event. All ticket holders should be refunded per your platform policy.
              Provide a cancellation reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              rows={4}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={!cancelReason.trim()} className="bg-destructive hover:bg-destructive/90">
              Cancel Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete draft dialog ── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              This draft event will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
