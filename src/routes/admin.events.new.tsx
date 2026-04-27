/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
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
import type {
  AudienceRule,
  Category,
  OrganizerProfile,
  RefundPolicy,
  Tag,
  TicketTemplate,
  Venue,
} from "@/lib/api-client";
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

// ─── Constants ───────────────────────────────────────────

const formats = ["GA", "SEATED", "ONLINE", "HYBRID", "FREE"] as const;
const visibilityOptions = ["PUBLIC", "PRIVATE"] as const;
const refundTypes = ["NO_REFUND", "FULL", "PARTIAL", "EXCHANGE"] as const;

const FORMAT_LABELS: Record<string, string> = {
  GA: "General Admission",
  SEATED: "Reserved Seating",
  ONLINE: "Online Only",
  HYBRID: "Hybrid",
  FREE: "Free Event",
};

// ─── Steps definition ────────────────────────────────────

const STEPS = [
  { id: 1, label: "Basic Info",   description: "Title, format & category" },
  { id: 2, label: "Media",        description: "Cover image & gallery" },
  { id: 3, label: "Schedule",     description: "Dates & location" },
  { id: 4, label: "Policies",     description: "Audience & refund" },
  { id: 5, label: "Tickets",      description: "Ticket types" },
  { id: 6, label: "Review",       description: "Confirm & submit" },
] as const;

// Fields belonging to each step (for per-step trigger validation)
const STEP_FIELDS: Record<number, (keyof CreateEventForm)[]> = {
  1: ["organizerId", "titleAr", "titleEn", "format", "categoryId", "descriptionAr", "descriptionEn", "tagIds"],
  2: ["coverImageUrl", "galleryText"],
  3: ["startsAt", "endsAt", "doorsOpenAt", "venueId", "streamUrl"],
  4: ["visibility", "audienceRestrictionId", "refundMode", "refundPolicyId", "customRefundType", "customRefundDeadlineDaysBefore", "customRefundPercentage"],
  5: ["ticketTypes"],
  6: [],
};

// ─── Zod schemas ─────────────────────────────────────────

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

const createEventSchema = z
  .object({
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
    ticketTypes: z.array(ticketSchema).min(1, "At least one ticket type is required").max(20),
  })
  .superRefine((value, ctx) => {
    const startsAt = new Date(value.startsAt);
    const endsAt = new Date(value.endsAt);
    const now = new Date();

    if (Number.isFinite(startsAt.valueOf()) && startsAt <= now)
      ctx.addIssue({ code: "custom", path: ["startsAt"], message: "Start time must be in the future" });

    if (Number.isFinite(startsAt.valueOf()) && Number.isFinite(endsAt.valueOf()) && endsAt <= startsAt)
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End time must be after start time" });

    if (value.doorsOpenAt) {
      const doorsOpenAt = new Date(value.doorsOpenAt);
      if (Number.isFinite(doorsOpenAt.valueOf()) && doorsOpenAt >= startsAt)
        ctx.addIssue({ code: "custom", path: ["doorsOpenAt"], message: "Doors open must be before event start" });
    }

    if (["GA", "SEATED", "HYBRID"].includes(value.format) && !value.venueId)
      ctx.addIssue({ code: "custom", path: ["venueId"], message: "Venue is required for this format" });

    if (["ONLINE", "HYBRID"].includes(value.format)) {
      const streamUrl = value.streamUrl?.trim();
      if (!streamUrl || !z.string().url().safeParse(streamUrl).success)
        ctx.addIssue({ code: "custom", path: ["streamUrl"], message: "A valid stream URL is required" });
    }

    if (value.refundMode === "template" && !value.refundPolicyId)
      ctx.addIssue({ code: "custom", path: ["refundPolicyId"], message: "Refund policy is required" });

    if (value.refundMode === "custom" && value.customRefundType === "PARTIAL" && value.customRefundPercentage == null)
      ctx.addIssue({ code: "custom", path: ["customRefundPercentage"], message: "Refund percentage is required" });

    if (value.format === "FREE") {
      value.ticketTypes.forEach((ticket, index) => {
        if (Number(ticket.price) !== 0)
          ctx.addIssue({ code: "custom", path: ["ticketTypes", index, "price"], message: "Free events cannot have paid tickets — price must be 0" });
      });
    }

    value.ticketTypes.forEach((ticket, index) => {
      if (ticket.maxPerOrder > ticket.quantityTotal)
        ctx.addIssue({ code: "custom", path: ["ticketTypes", index, "maxPerOrder"], message: "Max per order cannot exceed quantity" });

      const saleStartsAt = new Date(ticket.saleStartsAt);
      const saleEndsAt = new Date(ticket.saleEndsAt);

      if (Number.isFinite(saleStartsAt.valueOf()) && saleStartsAt >= startsAt)
        ctx.addIssue({ code: "custom", path: ["ticketTypes", index, "saleStartsAt"], message: "Sale must open before event starts" });

      if (Number.isFinite(saleEndsAt.valueOf()) && saleEndsAt >= startsAt)
        ctx.addIssue({ code: "custom", path: ["ticketTypes", index, "saleEndsAt"], message: "Sale must close before event starts" });

      if (Number.isFinite(saleStartsAt.valueOf()) && Number.isFinite(saleEndsAt.valueOf()) && saleEndsAt <= saleStartsAt)
        ctx.addIssue({ code: "custom", path: ["ticketTypes", index, "saleEndsAt"], message: "Sale close must be after sale open" });
    });
  });

type CreateEventForm = z.infer<typeof createEventSchema>;

// ─── Helpers ─────────────────────────────────────────────

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

function toIso(value?: string) {
  return value ? new Date(value).toISOString() : undefined;
}

function listFromLines(value?: string) {
  return (value || "").split("\n").map((l) => l.trim()).filter(Boolean);
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
    ticketTypes: values.ticketTypes.map((t) => ({
      nameAr: t.nameAr.trim(),
      nameEn: t.nameEn.trim(),
      visualType: t.visualType,
      visualValue: t.visualValue.trim(),
      price: Number(t.price),
      quantityTotal: Number(t.quantityTotal),
      maxPerOrder: Number(t.maxPerOrder),
      peoplePerTicket: Number(t.peoplePerTicket),
      saleStartsAt: toIso(t.saleStartsAt),
      saleEndsAt: toIso(t.saleEndsAt),
      perks: listFromLines(t.perksText).slice(0, 10),
      visibility: t.visibility,
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

function fmt(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-EG", { dateStyle: "medium", timeStyle: "short" });
}

// ─── Route ───────────────────────────────────────────────

export const Route = createFileRoute("/admin/events/new")({
  loader: async () => {
    const [categories, tags, audienceRules, refundPolicies, ticketTemplates, venueList, organizerList] =
      await Promise.all([
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

// ─── Stepper indicator ───────────────────────────────────

function StepIndicator({ current, completed }: { current: number; completed: Set<number> }) {
  return (
    <nav aria-label="Form steps" className="flex items-center justify-center gap-0 overflow-x-auto px-4">
      {STEPS.map((step, idx) => {
        const isDone = completed.has(step.id);
        const isActive = current === step.id;
        const isUpcoming = !isDone && !isActive;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-200",
                  isDone
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {isDone ? <Check size={15} strokeWidth={2.5} /> : step.id}
              </div>
              <span
                className={[
                  "mt-1.5 hidden text-[11px] font-semibold whitespace-nowrap sm:block",
                  isActive ? "text-primary" : isDone ? "text-primary/70" : "text-muted-foreground",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div
                className={[
                  "mx-1.5 mb-5 h-0.5 w-8 flex-shrink-0 rounded-full transition-all duration-300 sm:w-12",
                  isDone ? "bg-primary" : "bg-border",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ─── Main page ───────────────────────────────────────────

function NewEventPage() {
  const { categories, tags, audienceRules, refundPolicies, ticketTemplates, venues, organizers } =
    Route.useLoaderData() as {
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

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const totalSteps = STEPS.length;
  const isLastStep = currentStep === totalSteps;

  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    resetField,
    setValue,
    trigger,
    watch,
    getValues,
  } = useForm<CreateEventForm>({
    defaultValues,
    resolver: zodResolver(createEventSchema) as any,
    mode: "onTouched",
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "ticketTypes" });

  const format = watch("format");
  const coverImageUrl = watch("coverImageUrl");
  const refundMode = watch("refundMode");
  const selectedVenueId = watch("venueId");
  const selectedVenue = venues.find((v) => v.id === selectedVenueId);
  const showVenue = ["GA", "SEATED", "HYBRID", "FREE"].includes(format);
  const showStream = ["ONLINE", "HYBRID"].includes(format);

  const coverPreview = useMemo(
    () => (z.string().url().safeParse(coverImageUrl).success ? coverImageUrl : ""),
    [coverImageUrl],
  );

  const isFreeEvent = format === "FREE";

  // Reset location fields when format changes
  useEffect(() => {
    resetField("venueId");
    resetField("streamUrl");
  }, [format, resetField]);

  // Lock all ticket prices to 0 when format is FREE
  useEffect(() => {
    if (isFreeEvent) {
      fields.forEach((_, index) => {
        setValue(`ticketTypes.${index}.price`, 0, { shouldValidate: false });
      });
    }
  }, [isFreeEvent, fields.length, setValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Warn on accidental navigation
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && !saving) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, saving]);

  // ── Submit helpers ───────────────────────────────────

  const submitValues = async (values: CreateEventForm, status?: "DRAFT") => {
    setSaving(status === "DRAFT" ? "draft" : "submit");
    setError(null);
    try {
      await createFn({ data: buildPayload(values, status) });
      if (status === "DRAFT") {
        window.sessionStorage.setItem("tazkara:event-created", "Draft saved successfully.");
      } else {
        window.sessionStorage.setItem("tazkara:event-created", "Event submitted for review.");
      }
      navigate({ to: "/admin/events" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event.");
      setSaving(null);
    }
  };

  const onFinalSubmit = handleSubmit(
    (values) => submitValues(values),
    () => setError("Please fix all validation errors before submitting."),
  );

  const saveDraft = () => submitValues(getValues() as CreateEventForm, "DRAFT");

  // ── Step navigation ──────────────────────────────────

  const goNext = async () => {
    if (isLastStep) return;

    const fieldsToValidate = STEP_FIELDS[currentStep];
    const valid = await trigger(fieldsToValidate as any);

    if (!valid) {
      setError("Please fix the errors on this step before continuing.");
      return;
    }

    setError(null);
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    if (currentStep === 1) return;
    setError(null);
    setCurrentStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Input class ──────────────────────────────────────

  const input =
    "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring";
  const select = input;
  const label = "mb-1.5 block text-sm font-semibold";

  // ────────────────────────────────────────────────────
  // STEP CONTENT
  // ────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-5">
      {/* Organizer */}
      <div>
        <label htmlFor="organizerId" className={label}>
          Organizer{" "}
          <span className="font-normal text-muted-foreground">(optional — leave blank for platform event)</span>
        </label>
        <select id="organizerId" {...register("organizerId")} className={select}>
          <option value="">— No organizer (platform event) —</option>
          {organizers
            .filter(
              (org) =>
                (org as { status?: string }).status === "APPROVED" ||
                (org as { status?: string }).status === "ACTIVE",
            )
            .map((org) => (
              <option key={org.id} value={org.id}>
                {org.displayNameEn}
              </option>
            ))}
        </select>
      </div>

      {/* Titles */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div data-error={!!errors.titleAr}>
          <label htmlFor="titleAr" className={label}>
            عنوان الفعالية
          </label>
          <input
            id="titleAr"
            dir="rtl"
            lang="ar"
            placeholder="أدخل عنوان الفعالية بالعربية"
            {...register("titleAr")}
            className={`${input} text-right`}
          />
          {fieldError(errors.titleAr)}
        </div>
        <div data-error={!!errors.titleEn}>
          <label htmlFor="titleEn" className={label}>
            Event Title
          </label>
          <input
            id="titleEn"
            placeholder="Enter event title in English"
            {...register("titleEn")}
            className={input}
          />
          {fieldError(errors.titleEn)}
        </div>
      </div>

      {/* Format & Category */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div data-error={!!errors.format}>
          <label htmlFor="format" className={label}>
            Event Format
          </label>
          <select id="format" {...register("format")} className={select}>
            <option value="GA">General Admission</option>
            <option value="SEATED">Reserved Seating</option>
            <option value="ONLINE">Online Only</option>
            <option value="HYBRID">Hybrid</option>
            <option value="FREE">Free Event</option>
          </select>
          {fieldError(errors.format)}
        </div>
        <div data-error={!!errors.categoryId}>
          <label htmlFor="categoryId" className={label}>
            Category
          </label>
          <select id="categoryId" {...register("categoryId")} className={select}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameEn}
              </option>
            ))}
          </select>
          {fieldError(errors.categoryId)}
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div data-error={!!errors.descriptionAr}>
          <label htmlFor="descriptionAr" className={label}>
            الوصف بالعربية
          </label>
          <textarea
            id="descriptionAr"
            rows={6}
            dir="rtl"
            lang="ar"
            {...register("descriptionAr")}
            className={`${input} text-right`}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {watch("descriptionAr")?.length ?? 0} / 2000
          </p>
          {fieldError(errors.descriptionAr)}
        </div>
        <div data-error={!!errors.descriptionEn}>
          <label htmlFor="descriptionEn" className={label}>
            Description (English)
          </label>
          <textarea id="descriptionEn" rows={6} {...register("descriptionEn")} className={input} />
          <p className="mt-1 text-xs text-muted-foreground">
            {watch("descriptionEn")?.length ?? 0} / 2000
          </p>
          {fieldError(errors.descriptionEn)}
        </div>
      </div>

      {/* Tags */}
      <Controller
        control={control}
        name="tagIds"
        render={({ field }) => (
          <div>
            <p className={label}>Tags (optional, max 10)</p>
            <div className="grid max-h-36 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3 md:grid-cols-3">
              {tags.map((tag) => (
                <label key={tag.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.value.includes(tag.id)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...field.value, tag.id].slice(0, 10)
                        : field.value.filter((id) => id !== tag.id);
                      field.onChange(next);
                    }}
                    className="accent-primary"
                  />
                  {tag.nameEn}
                </label>
              ))}
            </div>
          </div>
        )}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
        <div data-error={!!errors.coverImageUrl}>
          <label htmlFor="coverImageUrl" className={label}>
            Cover Image URL <span className="font-semibold text-destructive">*</span>
          </label>
          <input
            id="coverImageUrl"
            placeholder="https://cdn.example.com/event-cover.jpg"
            {...register("coverImageUrl")}
            className={input}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            No upload service yet — enter a direct image URL.
          </p>
          {fieldError(errors.coverImageUrl)}
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
          {coverPreview ? (
            <img
              src={coverPreview}
              alt="Cover preview"
              className="aspect-video h-full w-full object-cover"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center text-muted-foreground">
              <ImageIcon size={28} />
            </div>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="galleryText" className={label}>
          Gallery URLs{" "}
          <span className="font-normal text-muted-foreground">(optional, one per line, up to 10)</span>
        </label>
        <textarea
          id="galleryText"
          rows={5}
          placeholder={"https://cdn.example.com/photo-1.jpg\nhttps://cdn.example.com/photo-2.jpg"}
          {...register("galleryText")}
          className={input}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm text-info">
        All date/time inputs use Cairo time (UTC+2).
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div data-error={!!errors.startsAt}>
          <label htmlFor="startsAt" className={label}>
            Start Date & Time <span className="font-semibold text-destructive">*</span>
          </label>
          <input
            id="startsAt"
            type="datetime-local"
            {...register("startsAt")}
            className={input}
          />
          {fieldError(errors.startsAt)}
        </div>
        <div data-error={!!errors.endsAt}>
          <label htmlFor="endsAt" className={label}>
            End Date & Time <span className="font-semibold text-destructive">*</span>
          </label>
          <input id="endsAt" type="datetime-local" {...register("endsAt")} className={input} />
          {fieldError(errors.endsAt)}
        </div>
        <div data-error={!!errors.doorsOpenAt}>
          <label htmlFor="doorsOpenAt" className={label}>
            Doors Open{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="doorsOpenAt"
            type="datetime-local"
            {...register("doorsOpenAt")}
            className={input}
          />
          <p className="mt-1 text-xs text-muted-foreground">Shown on the ticket QR.</p>
          {fieldError(errors.doorsOpenAt)}
        </div>
      </div>

      {/* Location / Stream */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {showVenue && (
          <div data-error={!!errors.venueId}>
            <label htmlFor="venueId" className={label}>
              Venue{" "}
              {format !== "FREE" && <span className="font-semibold text-destructive">*</span>}
            </label>
            <select id="venueId" {...register("venueId")} className={select}>
              <option value="">{format === "FREE" ? "No venue (optional)" : "Select approved venue"}</option>
              {venues
                .filter((v) => v.status === "APPROVED")
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nameEn} — capacity {v.totalCapacity}
                  </option>
                ))}
            </select>
            {selectedVenue?.seatsioChartKey && format === "SEATED" && (
              <p className="mt-2 rounded-xl border border-info/30 bg-info/10 px-3 py-2 text-xs font-medium text-info">
                This venue has a seat map. Attendees select seats at checkout.
              </p>
            )}
            {fieldError(errors.venueId)}
          </div>
        )}
        {showStream && (
          <div data-error={!!errors.streamUrl}>
            <label htmlFor="streamUrl" className={label}>
              Stream URL <span className="font-semibold text-destructive">*</span>
            </label>
            <input
              id="streamUrl"
              placeholder="https://zoom.us/j/..."
              {...register("streamUrl")}
              className={input}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Revealed to attendees after purchase.
            </p>
            {fieldError(errors.streamUrl)}
          </div>
        )}
        {!showVenue && !showStream && (
          <p className="text-sm text-muted-foreground">
            No location or stream required for the selected format.
          </p>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="visibility" className={label}>
            Event Visibility
          </label>
          <select id="visibility" {...register("visibility")} className={select}>
            <option value="PUBLIC">Public — appears in search & listings</option>
            <option value="PRIVATE">Private — invite-token access only</option>
          </select>
        </div>
        <div>
          <label htmlFor="audienceRestrictionId" className={label}>
            Who can attend?{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <select id="audienceRestrictionId" {...register("audienceRestrictionId")} className={select}>
            <option value="">Open to all</option>
            {audienceRules
              .filter((r) => r.isActive)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.labelEn} / {r.labelAr}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Refund policy */}
      <div>
        <label htmlFor="refundMode" className={label}>
          Refund Policy Mode
        </label>
        <div className="flex gap-3">
          {(["template", "custom"] as const).map((mode) => (
            <label
              key={mode}
              className={[
                "flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors",
                watch("refundMode") === mode
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40",
              ].join(" ")}
            >
              <input
                type="radio"
                value={mode}
                {...register("refundMode")}
                className="accent-primary"
              />
              <div>
                <p className="text-sm font-semibold capitalize">{mode}</p>
                <p className="text-xs text-muted-foreground">
                  {mode === "template"
                    ? "Choose from predefined refund policies"
                    : "Define custom refund terms"}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {refundMode === "template" ? (
        <div data-error={!!errors.refundPolicyId}>
          <label htmlFor="refundPolicyId" className={label}>
            Refund Policy <span className="font-semibold text-destructive">*</span>
          </label>
          <select id="refundPolicyId" {...register("refundPolicyId")} className={select}>
            <option value="">Select policy</option>
            {refundPolicies
              .filter((p) => p.isActive)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameEn} — {p.type}
                </option>
              ))}
          </select>
          {fieldError(errors.refundPolicyId)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="customRefundType" className={label}>
              Policy Type
            </label>
            <select id="customRefundType" {...register("customRefundType")} className={select}>
              {refundTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="customRefundDeadlineDaysBefore" className={label}>
              Deadline (days before event)
            </label>
            <input
              id="customRefundDeadlineDaysBefore"
              type="number"
              min={0}
              {...register("customRefundDeadlineDaysBefore")}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="customRefundPercentage" className={label}>
              Refund Percentage
            </label>
            <input
              id="customRefundPercentage"
              type="number"
              min={0}
              max={100}
              {...register("customRefundPercentage")}
              className={input}
            />
            {fieldError(errors.customRefundPercentage)}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
        Platform rule: if you cancel the event, all ticket holders receive a full refund regardless of this policy.
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold">Ticket Type {index + 1}</h3>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                ↑ Up
              </button>
              <button
                type="button"
                disabled={index === fields.length - 1}
                onClick={() => move(index, index + 1)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                ↓ Down
              </button>
              <button
                type="button"
                disabled={fields.length === 1}
                onClick={() => remove(index)}
                className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-40"
              >
                <Trash2 size={13} /> Remove
              </button>
            </div>
          </div>

          {/* Template picker */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-semibold">Start from template</label>
            <select
              onChange={(e) => {
                const tpl = ticketTemplates.find((t) => t.id === e.target.value);
                if (!tpl) return;
                setValue(`ticketTypes.${index}.nameAr`, tpl.nameAr);
                setValue(`ticketTypes.${index}.nameEn`, tpl.nameEn);
                setValue(`ticketTypes.${index}.visualType`, tpl.visualType);
                setValue(`ticketTypes.${index}.visualValue`, tpl.visualValue || "#7c3aed");
                setValue(`ticketTypes.${index}.price`, Number(tpl.defaultPrice || 0));
              }}
              className={select}
            >
              <option value="">Start blank</option>
              {ticketTemplates
                .filter((t) => t.isActive)
                .slice(0, 6)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameEn} — EGP {t.defaultPrice || 0}
                  </option>
                ))}
            </select>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div data-error={!!errors.ticketTypes?.[index]?.nameAr}>
              <label className="mb-1.5 block text-sm font-semibold">الاسم بالعربية</label>
              <input
                dir="rtl"
                lang="ar"
                {...register(`ticketTypes.${index}.nameAr`)}
                className={`${input} text-right`}
              />
              {fieldError(errors.ticketTypes?.[index]?.nameAr)}
            </div>
            <div data-error={!!errors.ticketTypes?.[index]?.nameEn}>
              <label className="mb-1.5 block text-sm font-semibold">Name (English)</label>
              <input {...register(`ticketTypes.${index}.nameEn`)} className={input} />
              {fieldError(errors.ticketTypes?.[index]?.nameEn)}
            </div>
          </div>

          {/* Visuals & pricing */}
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Visual Type</label>
              <select {...register(`ticketTypes.${index}.visualType`)} className={select}>
                <option value="COLOR">Color</option>
                <option value="IMAGE">Image URL</option>
              </select>
            </div>
            <div data-error={!!errors.ticketTypes?.[index]?.visualValue}>
              <label className="mb-1.5 block text-sm font-semibold">Visual Value</label>
              <input {...register(`ticketTypes.${index}.visualValue`)} className={input} />
              {fieldError(errors.ticketTypes?.[index]?.visualValue)}
            </div>
            <div data-error={!!errors.ticketTypes?.[index]?.price}>
              <label className="mb-1.5 block text-sm font-semibold">Price (EGP)</label>
              <input
                type="number"
                min={0}
                disabled={isFreeEvent}
                {...register(`ticketTypes.${index}.price`)}
                className={`${input} disabled:cursor-not-allowed disabled:opacity-50`}
              />
              {isFreeEvent ? (
                <p className="mt-1 text-xs text-muted-foreground">Free events cannot have paid tickets.</p>
              ) : (
                fieldError(errors.ticketTypes?.[index]?.price)
              )}
            </div>
            <div data-error={!!errors.ticketTypes?.[index]?.quantityTotal}>
              <label className="mb-1.5 block text-sm font-semibold">Total Tickets</label>
              <input
                type="number"
                min={1}
                {...register(`ticketTypes.${index}.quantityTotal`)}
                className={input}
              />
              {fieldError(errors.ticketTypes?.[index]?.quantityTotal)}
            </div>
          </div>

          {/* Order limits & sale window */}
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div data-error={!!errors.ticketTypes?.[index]?.maxPerOrder}>
              <label className="mb-1.5 block text-sm font-semibold">Max per order</label>
              <input
                type="number"
                min={1}
                {...register(`ticketTypes.${index}.maxPerOrder`)}
                className={input}
              />
              {fieldError(errors.ticketTypes?.[index]?.maxPerOrder)}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">People / ticket</label>
              <input
                type="number"
                min={1}
                max={20}
                {...register(`ticketTypes.${index}.peoplePerTicket`)}
                className={input}
              />
            </div>
            <div data-error={!!errors.ticketTypes?.[index]?.saleStartsAt}>
              <label className="mb-1.5 block text-sm font-semibold">Sale Opens</label>
              <input
                type="datetime-local"
                {...register(`ticketTypes.${index}.saleStartsAt`)}
                className={input}
              />
              {fieldError(errors.ticketTypes?.[index]?.saleStartsAt)}
            </div>
            <div data-error={!!errors.ticketTypes?.[index]?.saleEndsAt}>
              <label className="mb-1.5 block text-sm font-semibold">Sale Closes</label>
              <input
                type="datetime-local"
                {...register(`ticketTypes.${index}.saleEndsAt`)}
                className={input}
              />
              {fieldError(errors.ticketTypes?.[index]?.saleEndsAt)}
            </div>
          </div>

          {/* Perks & visibility */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">
                Perks{" "}
                <span className="font-normal text-muted-foreground">(one per line)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Free parking&#10;VIP lounge access"
                {...register(`ticketTypes.${index}.perksText`)}
                className={input}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Visibility</label>
              <select {...register(`ticketTypes.${index}.visibility`)} className={select}>
                <option value="PUBLIC">Visible to public</option>
                <option value="HIDDEN">Hidden</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        disabled={fields.length >= 20}
        onClick={() => append(blankTicket())}
        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
      >
        <Plus size={16} />
        Add Ticket Type
      </button>
      {errors.ticketTypes?.message && (
        <p className="text-xs font-medium text-destructive">{errors.ticketTypes.message}</p>
      )}
    </div>
  );

  // ── Review step ──────────────────────────────────────

  const renderStep6 = () => {
    const v = getValues();
    const category = categories.find((c) => c.id === v.categoryId);
    const venue = venues.find((vn) => vn.id === v.venueId);
    const organizer = organizers.find((o) => o.id === v.organizerId);
    const refundPolicy = refundPolicies.find((p) => p.id === v.refundPolicyId);
    const selectedTags = tags.filter((t) => v.tagIds.includes(t.id));

    const row = (label: string, value: React.ReactNode) => (
      <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
        <span className="min-w-32 text-sm font-semibold text-muted-foreground">{label}</span>
        <span className="flex-1 text-right text-sm font-medium text-foreground">{value || "—"}</span>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
          ✓ All steps completed. Review your event details before submitting.
        </div>

        {/* Basic */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Basic Info</h3>
          {row("Title (EN)", v.titleEn)}
          {row("Title (AR)", <span dir="rtl">{v.titleAr}</span>)}
          {row("Format", FORMAT_LABELS[v.format] ?? v.format)}
          {row("Category", category?.nameEn)}
          {row("Tags", selectedTags.length ? selectedTags.map((t) => t.nameEn).join(", ") : "None")}
          {row("Organizer", organizer?.displayNameEn ?? "Platform event")}
          {row("Visibility", v.visibility)}
        </div>

        {/* Media */}
        {v.coverImageUrl && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Media</h3>
            <img
              src={v.coverImageUrl}
              alt="Cover"
              className="aspect-video w-full rounded-xl object-cover"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            />
          </div>
        )}

        {/* Schedule */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Schedule</h3>
          {row("Starts", fmt(v.startsAt))}
          {row("Ends", fmt(v.endsAt))}
          {row("Doors Open", v.doorsOpenAt ? fmt(v.doorsOpenAt) : "Not set")}
          {row("Venue", venue?.nameEn)}
          {row("Stream URL", v.streamUrl || undefined)}
        </div>

        {/* Refund */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">Refund Policy</h3>
          {v.refundMode === "template"
            ? row("Policy", refundPolicy?.nameEn ?? "Not selected")
            : row("Custom Policy", `${v.customRefundType} — ${v.customRefundDeadlineDaysBefore ?? 0} days before`)}
        </div>

        {/* Tickets */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Ticket Types ({v.ticketTypes.length})
          </h3>
          <div className="space-y-3">
            {v.ticketTypes.map((t, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{t.nameEn}</p>
                  <p className="text-xs text-muted-foreground" dir="rtl">{t.nameAr}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">EGP {t.price}</p>
                  <p className="text-xs text-muted-foreground">{t.quantityTotal} tickets</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const STEP_RENDERERS: Record<number, () => React.ReactNode> = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
    5: renderStep5,
    6: renderStep6,
  };

  const currentStepMeta = STEPS.find((s) => s.id === currentStep)!;

  // ────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────

  return (
    <div className="flex min-h-full flex-col">
      {/* ── Page header ── */}
      <div className="border-b border-border bg-card/70 px-8 py-5 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Event Management
            </p>
            <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-foreground">New Event</h1>
          </div>
          <button
            type="button"
            onClick={() => (isDirty ? setShowCancelDialog(true) : navigate({ to: "/admin/events" }))}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            <X size={15} />
            Cancel
          </button>
        </div>
      </div>

      {/* ── Stepper ── */}
      <div className="border-b border-border bg-card/50 py-5 shadow-soft">
        <StepIndicator current={currentStep} completed={completedSteps} />
      </div>

      {/* ── Step title ── */}
      <div className="px-8 pt-7 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Step {currentStep} of {totalSteps}
        </p>
        <h2 className="mt-0.5 text-xl font-bold text-foreground">{currentStepMeta.label}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{currentStepMeta.description}</p>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mx-8 mt-4 flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
          <button type="button" onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Step content ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isLastStep) onFinalSubmit();
        }}
        className="flex-1 px-8 pb-32 pt-5"
      >
        {STEP_RENDERERS[currentStep]?.()}
      </form>

      {/* ── Fixed bottom bar ── */}
      <div className="fixed bottom-0 left-64 right-0 z-30 border-t border-border bg-card/95 px-8 py-4 shadow-pop backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Previous or Draft */}
          <div className="flex items-center gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={goPrev}
                disabled={!!saving}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-accent disabled:opacity-50"
              >
                <ArrowLeft size={15} />
                Previous
              </button>
            ) : null}

            <button
              type="button"
              onClick={saveDraft}
              disabled={!!saving}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
              {saving === "draft" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              Save Draft
            </button>
          </div>

          {/* Right: Next or Submit */}
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:block">
              {currentStep} / {totalSteps}
            </span>

            {isLastStep ? (
              <button
                type="button"
                onClick={onFinalSubmit}
                disabled={!!saving}
                className="inline-flex items-center gap-2 rounded-xl admin-gradient px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand disabled:opacity-50"
              >
                {saving === "submit" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                Submit Event
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={!!saving}
                className="inline-flex items-center gap-2 rounded-xl admin-gradient px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand disabled:opacity-50"
              >
                Next
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Cancel confirmation ── */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard new event?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. If you leave now, your progress will be lost. You can also save
              a draft first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <button
              type="button"
              onClick={() => {
                setShowCancelDialog(false);
                saveDraft();
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent"
            >
              <Save size={14} />
              Save Draft & Leave
            </button>
            <AlertDialogAction
              onClick={() => navigate({ to: "/admin/events" })}
              className="bg-destructive hover:bg-destructive/90"
            >
              Discard & Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
