import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { ArrowLeft, CalendarClock, ImageIcon, Loader2, Plus, Save, Send, Trash2 } from "lucide-react";
import { z } from "zod";
import {
  createEventAdmin,
  listAudienceRulesAdmin,
  listCategoriesAdmin,
  listOrganizersAdmin,
  listRefundPoliciesAdmin,
  listTagsAdmin,
  listTicketTemplatesAdmin,
  listVenuesAdmin,
} from "@/lib/admin-api.functions";
import type { AudienceRule, Category, OrganizerProfile, RefundPolicy, Tag, TicketTemplate, Venue } from "@/lib/api-client";

const formats = ["GA", "SEATED", "ONLINE", "HYBRID", "FREE"] as const;
const visibilityOptions = ["PUBLIC", "PRIVATE"] as const;
const refundTypes = ["NO_REFUND", "FULL", "PARTIAL", "EXCHANGE"] as const;

const ticketSchema = z.object({
  nameAr: z.string().min(1, "Arabic ticket name is required").max(60),
  nameEn: z.string().min(1, "English ticket name is required").max(60),
  visualType: z.enum(["COLOR", "IMAGE"]),
  visualValue: z.string().min(1, "Ticket visual is required"),
  price: z.coerce.number().min(0).max(999999),
  quantityTotal: z.coerce.number().int().min(1).max(100000),
  maxPerOrder: z.coerce.number().int().min(1),
  peoplePerTicket: z.coerce.number().int().min(1).max(20),
  saleStartsAt: z.string().min(1, "Sale opening time is required"),
  saleEndsAt: z.string().min(1, "Sale closing time is required"),
  perksText: z.string().optional(),
  visibility: z.enum(["PUBLIC", "HIDDEN"]),
});

const createEventSchema = z.object({
  organizerId: z.string().optional(),
  titleAr: z.string().min(3, "Arabic title must be at least 3 characters").max(120),
  titleEn: z.string().min(3, "English title must be at least 3 characters").max(120),
  format: z.enum(formats),
  categoryId: z.string().min(1, "Category is required"),
  descriptionAr: z.string().min(20, "Arabic description must be at least 20 characters").max(2000),
  descriptionEn: z.string().min(20, "English description must be at least 20 characters").max(2000),
  coverImageUrl: z.string().url("Cover image must be a valid URL"),
  galleryText: z.string().optional(),
  tagIds: z.array(z.string()).max(10),
  startsAt: z.string().min(1, "Start time is required"),
  endsAt: z.string().min(1, "End time is required"),
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
  ticketTypes: z.array(ticketSchema).min(1).max(20),
}).superRefine((value, ctx) => {
  const startsAt = new Date(value.startsAt);
  const endsAt = new Date(value.endsAt);
  const now = new Date();

  if (Number.isFinite(startsAt.valueOf()) && startsAt <= now) {
    ctx.addIssue({ code: "custom", path: ["startsAt"], message: "Start time must be in the future" });
  }
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
    const result = z.string().url().safeParse(streamUrl);
    if (!streamUrl || !result.success) {
      ctx.addIssue({ code: "custom", path: ["streamUrl"], message: "A valid stream URL is required" });
    }
  }
  if (value.refundMode === "template" && !value.refundPolicyId) {
    ctx.addIssue({ code: "custom", path: ["refundPolicyId"], message: "Refund policy is required" });
  }
  if (value.refundMode === "custom" && value.customRefundType === "PARTIAL" && value.customRefundPercentage == null) {
    ctx.addIssue({ code: "custom", path: ["customRefundPercentage"], message: "Refund percentage is required" });
  }
  value.ticketTypes.forEach((ticket, index) => {
    if (ticket.maxPerOrder > ticket.quantityTotal) {
      ctx.addIssue({ code: "custom", path: ["ticketTypes", index, "maxPerOrder"], message: "Max per order cannot exceed quantity" });
    }
    const saleStartsAt = new Date(ticket.saleStartsAt);
    const saleEndsAt = new Date(ticket.saleEndsAt);
    if (Number.isFinite(saleStartsAt.valueOf()) && saleStartsAt >= startsAt) {
      ctx.addIssue({ code: "custom", path: ["ticketTypes", index, "saleStartsAt"], message: "Sale opens before event start" });
    }
    if (Number.isFinite(saleEndsAt.valueOf()) && saleEndsAt >= startsAt) {
      ctx.addIssue({ code: "custom", path: ["ticketTypes", index, "saleEndsAt"], message: "Sale closes before event start" });
    }
    if (Number.isFinite(saleStartsAt.valueOf()) && Number.isFinite(saleEndsAt.valueOf()) && saleEndsAt <= saleStartsAt) {
      ctx.addIssue({ code: "custom", path: ["ticketTypes", index, "saleEndsAt"], message: "Sale closes after sale opens" });
    }
  });
});

type CreateEventForm = z.infer<typeof createEventSchema>;

const blankTicket = (): CreateEventForm["ticketTypes"][number] => ({
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
});

const defaultValues: CreateEventForm = {
  organizerId: "",
  titleAr: "",
  titleEn: "",
  format: "GA",
  categoryId: "",
  descriptionAr: "",
  descriptionEn: "",
  coverImageUrl: "",
  galleryText: "",
  tagIds: [],
  startsAt: "",
  endsAt: "",
  doorsOpenAt: "",
  venueId: "",
  streamUrl: "",
  visibility: "PUBLIC",
  audienceRestrictionId: "",
  refundMode: "template",
  refundPolicyId: "",
  customRefundType: "NO_REFUND",
  customRefundDeadlineDaysBefore: 7,
  customRefundPercentage: 50,
  ticketTypes: [blankTicket()],
};

export const Route = createFileRoute("/admin/events/new")({
  loader: async () => {
    const [categories, tags, audienceRules, refundPolicies, ticketTemplates, venueList, organizerList] = await Promise.all([
      listCategoriesAdmin(),
      listTagsAdmin(),
      listAudienceRulesAdmin(),
      listRefundPoliciesAdmin(),
      listTicketTemplatesAdmin(),
      listVenuesAdmin({ data: { page: 1, limit: 20 } }),
      listOrganizersAdmin({ data: { page: 1, limit: 50 } }),
    ]);

    return {
      categories: Array.isArray(categories) ? categories : [],
      tags: Array.isArray(tags) ? tags : [],
      audienceRules: Array.isArray(audienceRules) ? audienceRules : [],
      refundPolicies: Array.isArray(refundPolicies) ? refundPolicies : [],
      ticketTemplates: Array.isArray(ticketTemplates) ? ticketTemplates : [],
      venues: Array.isArray(venueList?.rows) ? venueList.rows : [],
      organizers: Array.isArray(organizerList) ? organizerList : [],
    };
  },
  component: NewEventPage,
});

function toIso(value?: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function listFromLines(value?: string) {
  return (value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildPayload(values: CreateEventForm, status?: "DRAFT") {
  const payload: Record<string, unknown> = {
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
    ticketTypes: values.ticketTypes.map((ticket) => ({
      nameAr: ticket.nameAr.trim(),
      nameEn: ticket.nameEn.trim(),
      visualType: ticket.visualType,
      visualValue: ticket.visualValue.trim(),
      price: Number(ticket.price),
      quantityTotal: Number(ticket.quantityTotal),
      maxPerOrder: Number(ticket.maxPerOrder),
      peoplePerTicket: Number(ticket.peoplePerTicket),
      saleStartsAt: toIso(ticket.saleStartsAt),
      saleEndsAt: toIso(ticket.saleEndsAt),
      perks: listFromLines(ticket.perksText).slice(0, 10),
      visibility: ticket.visibility,
    })),
  };

  if (status) payload.status = status;
  if (values.doorsOpenAt) payload.doorsOpenAt = toIso(values.doorsOpenAt);
  if (values.venueId) payload.venueId = values.venueId;
  if (values.streamUrl) payload.streamUrl = values.streamUrl.trim();
  if (values.audienceRestrictionId) payload.audienceRestrictionId = values.audienceRestrictionId;
  if (values.refundMode === "template") {
    payload.refundPolicyId = values.refundPolicyId;
  } else {
    payload.customRefundPolicy = {
      type: values.customRefundType,
      deadlineDaysBefore: values.customRefundDeadlineDaysBefore,
      refundPercentage: values.customRefundType === "PARTIAL" ? values.customRefundPercentage : undefined,
    };
  }

  return payload;
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

function NewEventPage() {
  const { categories, tags, audienceRules, refundPolicies, ticketTemplates, venues, organizers } = Route.useLoaderData() as {
    categories: Category[];
    tags: Tag[];
    audienceRules: AudienceRule[];
    refundPolicies: RefundPolicy[];
    ticketTemplates: TicketTemplate[];
    venues: Venue[];
    organizers: OrganizerProfile[];
  };
  const navigate = useNavigate();
  const createFn = useServerFn(createEventAdmin);
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    resetField,
    setValue,
    watch,
    getValues,
  } = useForm<CreateEventForm>({
    defaultValues,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createEventSchema) as any,
    mode: "onBlur",
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "ticketTypes" });
  const format = watch("format");
  const coverImageUrl = watch("coverImageUrl");
  const refundMode = watch("refundMode");
  const selectedVenueId = watch("venueId");
  const selectedVenue = venues.find((venue) => venue.id === selectedVenueId);
  const showVenue = ["GA", "SEATED", "HYBRID", "FREE"].includes(format);
  const showStream = ["ONLINE", "HYBRID"].includes(format);
  const coverPreview = useMemo(() => {
    return z.string().url().safeParse(coverImageUrl).success ? coverImageUrl : "";
  }, [coverImageUrl]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || saving) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, saving]);

  useEffect(() => {
    resetField("venueId");
    resetField("streamUrl");
  }, [format, resetField]);

  const submitValues = async (values: CreateEventForm, status?: "DRAFT") => {
    setSaving(status === "DRAFT" ? "draft" : "submit");
    setError(null);
    setSuccess(null);
    try {
      await createFn({ data: buildPayload(values, status) });
      if (status === "DRAFT") {
        setSuccess("Draft saved.");
      } else {
        window.sessionStorage.setItem("tazkara:event-created", "Event created successfully.");
        navigate({ to: "/admin/events" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event.");
    } finally {
      setSaving(null);
    }
  };

  const onSubmit = handleSubmit(
    (values) => submitValues(values),
    () => {
      setError("Please fix the highlighted errors before submitting.");
      const firstError = document.querySelector("[data-error='true']");
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
  );

  const saveDraft = () => {
    submitValues(getValues() as CreateEventForm, "DRAFT");
  };

  return (
    <div className="flex min-h-full flex-col pb-28">
      <div className="border-b border-border bg-card/70 px-8 py-6 backdrop-blur">
        <Link to="/admin/events" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft size={16} />
          Back to events
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event Management</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">New Event</h1>
          </div>
          <div className="rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm text-info">
            Cairo time is used for date and time inputs.
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 p-8">
        {success && <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{success}</div>}
        {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          {sectionTitle(1, "Basic Information")}

          {/* Organizer assignment (admin-only) */}
          <div className="mb-4" data-error={!!errors.organizerId}>
            <label htmlFor="organizerId" className="mb-1.5 block text-sm font-semibold">
              Assign to Organizer <span className="font-normal text-muted-foreground">(optional — leave blank for platform-owned event)</span>
            </label>
            <select id="organizerId" {...register("organizerId")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">— No organizer (platform event) —</option>
              {organizers
                .filter((org) => (org as { status?: string }).status === "APPROVED" || (org as { status?: string }).status === "ACTIVE")
                .map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.displayNameEn}
                  </option>
                ))}
            </select>
            {fieldError(errors.organizerId)}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div data-error={!!errors.titleAr}>
              <label htmlFor="titleAr" className="mb-1.5 block text-sm font-semibold">عنوان الفعالية</label>
              <input id="titleAr" dir="rtl" lang="ar" placeholder="أدخل عنوان الفعالية بالعربية" {...register("titleAr")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-right text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
              {fieldError(errors.titleAr)}
            </div>
            <div data-error={!!errors.titleEn}>
              <label htmlFor="titleEn" className="mb-1.5 block text-sm font-semibold">Event Title</label>
              <input id="titleEn" placeholder="Enter event title in English" {...register("titleEn")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
              {fieldError(errors.titleEn)}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div data-error={!!errors.format}>
              <label htmlFor="format" className="mb-1.5 block text-sm font-semibold">Event Format</label>
              <select id="format" {...register("format")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="GA">General Admission</option>
                <option value="SEATED">Reserved Seating</option>
                <option value="ONLINE">Online Only</option>
                <option value="HYBRID">Hybrid</option>
                <option value="FREE">Free Event</option>
              </select>
              {fieldError(errors.format)}
            </div>
            <div data-error={!!errors.categoryId}>
              <label htmlFor="categoryId" className="mb-1.5 block text-sm font-semibold">Category</label>
              <select id="categoryId" {...register("categoryId")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.nameEn}</option>
                ))}
              </select>
              {fieldError(errors.categoryId)}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div data-error={!!errors.descriptionAr}>
              <label htmlFor="descriptionAr" className="mb-1.5 block text-sm font-semibold">الوصف بالعربية</label>
              <textarea id="descriptionAr" rows={5} dir="rtl" lang="ar" {...register("descriptionAr")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-right text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
              <p className="mt-1 text-xs text-muted-foreground">{watch("descriptionAr")?.length || 0} / 2000</p>
              {fieldError(errors.descriptionAr)}
            </div>
            <div data-error={!!errors.descriptionEn}>
              <label htmlFor="descriptionEn" className="mb-1.5 block text-sm font-semibold">Description (English)</label>
              <textarea id="descriptionEn" rows={5} {...register("descriptionEn")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
              <p className="mt-1 text-xs text-muted-foreground">{watch("descriptionEn")?.length || 0} / 2000</p>
              {fieldError(errors.descriptionEn)}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
            <div data-error={!!errors.coverImageUrl}>
              <label htmlFor="coverImageUrl" className="mb-1.5 block text-sm font-semibold">Cover Image URL</label>
              <input id="coverImageUrl" placeholder="https://cdn.example.com/event-cover.jpg" {...register("coverImageUrl")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
              <p className="mt-1 text-xs text-muted-foreground">The shared Postman collection has no media upload endpoint, so this form sends image URLs.</p>
              {fieldError(errors.coverImageUrl)}
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
              {coverPreview ? <img src={coverPreview} alt="Cover preview" className="aspect-video h-full w-full object-cover" /> : (
                <div className="flex aspect-video items-center justify-center text-muted-foreground">
                  <ImageIcon size={24} />
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="galleryText" className="mb-1.5 block text-sm font-semibold">Gallery URLs</label>
              <textarea id="galleryText" rows={4} placeholder="One URL per line, up to 10" {...register("galleryText")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <Controller
              control={control}
              name="tagIds"
              render={({ field }) => (
                <div>
                  <p className="mb-1.5 block text-sm font-semibold">Tags</p>
                  <div className="grid max-h-36 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3 md:grid-cols-2">
                    {tags.map((tag) => (
                      <label key={tag.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={field.value.includes(tag.id)}
                          onChange={(event) => {
                            const next = event.target.checked
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

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          {sectionTitle(2, "Timing")}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div data-error={!!errors.startsAt}>
              <label htmlFor="startsAt" className="mb-1.5 block text-sm font-semibold">Start Date & Time</label>
              <input id="startsAt" type="datetime-local" {...register("startsAt")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
              <p className="mt-1 text-xs text-muted-foreground">Cairo time (UTC+2)</p>
              {fieldError(errors.startsAt)}
            </div>
            <div data-error={!!errors.endsAt}>
              <label htmlFor="endsAt" className="mb-1.5 block text-sm font-semibold">End Date & Time</label>
              <input id="endsAt" type="datetime-local" {...register("endsAt")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
              {fieldError(errors.endsAt)}
            </div>
            <div data-error={!!errors.doorsOpenAt}>
              <label htmlFor="doorsOpenAt" className="mb-1.5 block text-sm font-semibold">Doors Open Time</label>
              <input id="doorsOpenAt" type="datetime-local" {...register("doorsOpenAt")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
              <p className="mt-1 text-xs text-muted-foreground">Shown on the ticket QR.</p>
              {fieldError(errors.doorsOpenAt)}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card" aria-live="polite">
          {sectionTitle(3, "Location & Stream")}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {showVenue && (
              <div data-error={!!errors.venueId}>
                <label htmlFor="venueId" className="mb-1.5 block text-sm font-semibold">Venue</label>
                <select id="venueId" {...register("venueId")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">{format === "FREE" ? "No venue" : "Select approved venue"}</option>
                  {venues.filter((venue) => venue.status === "APPROVED").map((venue) => (
                    <option key={venue.id} value={venue.id}>{venue.nameEn} - capacity {venue.totalCapacity}</option>
                  ))}
                </select>
                {selectedVenue?.seatsioChartKey && format === "SEATED" && (
                  <p className="mt-2 rounded-xl border border-info/30 bg-info/10 px-3 py-2 text-xs font-medium text-info">This venue has a seat map. Attendees will select seats during checkout.</p>
                )}
                {fieldError(errors.venueId)}
              </div>
            )}
            {showStream && (
              <div data-error={!!errors.streamUrl}>
                <label htmlFor="streamUrl" className="mb-1.5 block text-sm font-semibold">Stream URL</label>
                <input id="streamUrl" placeholder="https://zoom.us/j/..." {...register("streamUrl")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                <p className="mt-1 text-xs text-muted-foreground">This link is revealed to attendees after purchase.</p>
                {fieldError(errors.streamUrl)}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          {sectionTitle(4, "Audience & Policy")}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="visibility" className="mb-1.5 block text-sm font-semibold">Event Visibility</label>
              <select id="visibility" {...register("visibility")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div>
              <label htmlFor="audienceRestrictionId" className="mb-1.5 block text-sm font-semibold">Who can attend?</label>
              <select id="audienceRestrictionId" {...register("audienceRestrictionId")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Open to all</option>
                {audienceRules.filter((rule) => rule.isActive).map((rule) => (
                  <option key={rule.id} value={rule.id}>{rule.labelEn} / {rule.labelAr}</option>
                ))}
              </select>
            </div>
            <div data-error={!!errors.refundPolicyId}>
              <label htmlFor="refundMode" className="mb-1.5 block text-sm font-semibold">Refund Policy Mode</label>
              <select id="refundMode" {...register("refundMode")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="template">Template</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          {refundMode === "template" ? (
            <div className="mt-4" data-error={!!errors.refundPolicyId}>
              <label htmlFor="refundPolicyId" className="mb-1.5 block text-sm font-semibold">Refund Policy</label>
              <select id="refundPolicyId" {...register("refundPolicyId")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select policy</option>
                {refundPolicies.filter((policy) => policy.isActive).map((policy) => (
                  <option key={policy.id} value={policy.id}>{policy.nameEn} - {policy.type}</option>
                ))}
              </select>
              {fieldError(errors.refundPolicyId)}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="customRefundType" className="mb-1.5 block text-sm font-semibold">Policy Type</label>
                <select id="customRefundType" {...register("customRefundType")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                  {refundTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="customRefundDeadlineDaysBefore" className="mb-1.5 block text-sm font-semibold">Deadline Days Before</label>
                <input id="customRefundDeadlineDaysBefore" type="number" min={0} {...register("customRefundDeadlineDaysBefore")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label htmlFor="customRefundPercentage" className="mb-1.5 block text-sm font-semibold">Refund Percentage</label>
                <input id="customRefundPercentage" type="number" min={0} max={100} {...register("customRefundPercentage")} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                {fieldError(errors.customRefundPercentage)}
              </div>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
            Platform rule: if you cancel the event, all ticket holders receive a full refund regardless of the policy set here.
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          {sectionTitle(5, "Ticket Types")}
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold">Ticket Type {index + 1}</h3>
                  <div className="flex gap-2">
                    <button type="button" disabled={index === 0} onClick={() => move(index, index - 1)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Move up</button>
                    <button type="button" disabled={index === fields.length - 1} onClick={() => move(index, index + 1)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40">Move down</button>
                    <button type="button" disabled={fields.length === 1} onClick={() => remove(index)} className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-40">
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-semibold">Start from template</label>
                  <select
                    onChange={(event) => {
                      const template = ticketTemplates.find((item) => item.id === event.target.value);
                      if (!template) return;
                      setValue(`ticketTypes.${index}.nameAr`, template.nameAr);
                      setValue(`ticketTypes.${index}.nameEn`, template.nameEn);
                      setValue(`ticketTypes.${index}.visualType`, template.visualType);
                      setValue(`ticketTypes.${index}.visualValue`, template.visualValue || "#7c3aed");
                      setValue(`ticketTypes.${index}.price`, Number(template.defaultPrice || 0));
                    }}
                    className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Start blank</option>
                    {ticketTemplates.filter((template) => template.isActive).slice(0, 4).map((template) => (
                      <option key={template.id} value={template.id}>{template.nameEn} - EGP {template.defaultPrice || 0}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div data-error={!!errors.ticketTypes?.[index]?.nameAr}>
                    <label className="mb-1.5 block text-sm font-semibold">الاسم بالعربية</label>
                    <input dir="rtl" lang="ar" {...register(`ticketTypes.${index}.nameAr`)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-right text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                    {fieldError(errors.ticketTypes?.[index]?.nameAr)}
                  </div>
                  <div data-error={!!errors.ticketTypes?.[index]?.nameEn}>
                    <label className="mb-1.5 block text-sm font-semibold">Name (English)</label>
                    <input {...register(`ticketTypes.${index}.nameEn`)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                    {fieldError(errors.ticketTypes?.[index]?.nameEn)}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Visual Type</label>
                    <select {...register(`ticketTypes.${index}.visualType`)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="COLOR">Color</option>
                      <option value="IMAGE">Image URL</option>
                    </select>
                  </div>
                  <div data-error={!!errors.ticketTypes?.[index]?.visualValue}>
                    <label className="mb-1.5 block text-sm font-semibold">Visual Value</label>
                    <input {...register(`ticketTypes.${index}.visualValue`)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                    {fieldError(errors.ticketTypes?.[index]?.visualValue)}
                  </div>
                  <div data-error={!!errors.ticketTypes?.[index]?.price}>
                    <label className="mb-1.5 block text-sm font-semibold">Price (EGP)</label>
                    <input type="number" min={0} {...register(`ticketTypes.${index}.price`)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                    {fieldError(errors.ticketTypes?.[index]?.price)}
                  </div>
                  <div data-error={!!errors.ticketTypes?.[index]?.quantityTotal}>
                    <label className="mb-1.5 block text-sm font-semibold">Total Tickets</label>
                    <input type="number" min={1} {...register(`ticketTypes.${index}.quantityTotal`)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                    {fieldError(errors.ticketTypes?.[index]?.quantityTotal)}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div data-error={!!errors.ticketTypes?.[index]?.maxPerOrder}>
                    <label className="mb-1.5 block text-sm font-semibold">Max per order</label>
                    <input type="number" min={1} {...register(`ticketTypes.${index}.maxPerOrder`)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                    {fieldError(errors.ticketTypes?.[index]?.maxPerOrder)}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">People per ticket</label>
                    <input type="number" min={1} max={20} {...register(`ticketTypes.${index}.peoplePerTicket`)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div data-error={!!errors.ticketTypes?.[index]?.saleStartsAt}>
                    <label className="mb-1.5 block text-sm font-semibold">Sale Opens</label>
                    <input type="datetime-local" {...register(`ticketTypes.${index}.saleStartsAt`)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                    {fieldError(errors.ticketTypes?.[index]?.saleStartsAt)}
                  </div>
                  <div data-error={!!errors.ticketTypes?.[index]?.saleEndsAt}>
                    <label className="mb-1.5 block text-sm font-semibold">Sale Closes</label>
                    <input type="datetime-local" {...register(`ticketTypes.${index}.saleEndsAt`)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                    {fieldError(errors.ticketTypes?.[index]?.saleEndsAt)}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Ticket perks</label>
                    <textarea rows={3} placeholder="One perk per line" {...register(`ticketTypes.${index}.perksText`)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold">Visible to public</label>
                    <select {...register(`ticketTypes.${index}.visibility`)} className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="PUBLIC">Visible</option>
                      <option value="HIDDEN">Hidden</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" disabled={fields.length >= 20} onClick={() => append(blankTicket())} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-accent disabled:opacity-50">
            <Plus size={16} />
            Add Ticket Type
          </button>
        </section>
      </form>

      <div className="fixed bottom-0 left-64 right-0 z-30 border-t border-border bg-card/95 px-8 py-4 shadow-pop backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock size={16} />
            Full validation runs on submit. Draft saves the current payload.
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={saveDraft} disabled={!!saving} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-accent disabled:opacity-50">
              {saving === "draft" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save as Draft
            </button>
            <button type="button" onClick={onSubmit} disabled={!!saving} className="inline-flex items-center gap-2 rounded-xl admin-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand disabled:opacity-50">
              {saving === "submit" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Submit Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
