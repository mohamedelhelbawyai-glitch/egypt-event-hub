import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  canWriteVenuesAdmin,
  createVenueAdmin,
  listVenueFacilitiesAdmin,
} from "@/lib/admin-api.functions";
import type { CreateVenueRequest, Facility } from "@/lib/api-client";

export const Route = createFileRoute("/admin/venues/new")({
  loader: async () => {
    const [facilities, canWrite] = await Promise.all([
      listVenueFacilitiesAdmin(),
      canWriteVenuesAdmin(),
    ]);
    return { facilities, canWrite };
  },
  component: NewVenuePage,
});

type VenueFormState = {
  nameAr: string;
  nameEn: string;
  type: CreateVenueRequest["type"];
  governorateId: string;
  cityId: string;
  addressAr: string;
  addressEn: string;
  lat: string;
  lng: string;
  totalCapacity: string;
  googleMapsUrl: string;
  photosText: string;
  sectionsText: string;
  facilityIds: string[];
};

const DEFAULT_FORM: VenueFormState = {
  nameAr: "",
  nameEn: "",
  type: "HALL",
  governorateId: "",
  cityId: "",
  addressAr: "",
  addressEn: "",
  lat: "",
  lng: "",
  totalCapacity: "",
  googleMapsUrl: "",
  photosText: "",
  sectionsText: "{}",
  facilityIds: [],
};

function parseSections(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = JSON.parse(trimmed) as unknown;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Sections must be a valid JSON object.");
  }
  return parsed as Record<string, unknown>;
}

function toggleFacility(selected: string[], facilityId: string) {
  if (selected.includes(facilityId)) {
    return selected.filter((id) => id !== facilityId);
  }
  return [...selected, facilityId];
}

function NewVenuePage() {
  const { facilities, canWrite } = Route.useLoaderData();
  const navigate = useNavigate();
  const createFn = useServerFn(createVenueAdmin);

  const [form, setForm] = useState<VenueFormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canWrite) return;

    setLoading(true);
    setError(null);
    try {
      const payload: CreateVenueRequest = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        type: form.type,
        governorateId: form.governorateId.trim(),
        cityId: form.cityId.trim() || undefined,
        addressAr: form.addressAr.trim(),
        addressEn: form.addressEn.trim(),
        lat: Number(form.lat),
        lng: Number(form.lng),
        totalCapacity: Number(form.totalCapacity),
        googleMapsUrl: form.googleMapsUrl.trim() || undefined,
        photos: form.photosText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        sections: parseSections(form.sectionsText),
        facilityIds: form.facilityIds,
      };

      const created = await createFn({ data: payload });
      if (created?.id) {
        navigate({ to: "/admin/venues/$id", params: { id: created.id } });
      } else {
        navigate({ to: "/admin/venues" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create venue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card/70 backdrop-blur px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Venue Management
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">Add Venue</h1>
      </div>

      <div className="p-8 space-y-4">
        <Link to="/admin/venues" className="text-sm font-semibold text-primary hover:underline">
          ← Back to venues
        </Link>

        {!canWrite && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            Create venue is unavailable for the current backend token policy. You can still browse and moderate venues.
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card shadow-card p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Name (AR)</label>
              <input
                required
                value={form.nameAr}
                onChange={(event) => setForm((prev) => ({ ...prev, nameAr: event.target.value }))}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Name (EN)</label>
              <input
                required
                value={form.nameEn}
                onChange={(event) => setForm((prev) => ({ ...prev, nameEn: event.target.value }))}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Type</label>
              <select
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as VenueFormState["type"] }))}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="STADIUM">STADIUM</option>
                <option value="THEATER">THEATER</option>
                <option value="HALL">HALL</option>
                <option value="ARENA">ARENA</option>
                <option value="OUTDOOR">OUTDOOR</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Governorate ID</label>
              <input
                required
                value={form.governorateId}
                onChange={(event) => setForm((prev) => ({ ...prev, governorateId: event.target.value }))}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">City ID (optional)</label>
              <input
                value={form.cityId}
                onChange={(event) => setForm((prev) => ({ ...prev, cityId: event.target.value }))}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Address (AR)</label>
              <input
                required
                value={form.addressAr}
                onChange={(event) => setForm((prev) => ({ ...prev, addressAr: event.target.value }))}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Address (EN)</label>
              <input
                required
                value={form.addressEn}
                onChange={(event) => setForm((prev) => ({ ...prev, addressEn: event.target.value }))}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Latitude</label>
              <input
                required
                type="number"
                step="any"
                value={form.lat}
                onChange={(event) => setForm((prev) => ({ ...prev, lat: event.target.value }))}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Longitude</label>
              <input
                required
                type="number"
                step="any"
                value={form.lng}
                onChange={(event) => setForm((prev) => ({ ...prev, lng: event.target.value }))}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Total Capacity</label>
              <input
                required
                type="number"
                min={1}
                value={form.totalCapacity}
                onChange={(event) => setForm((prev) => ({ ...prev, totalCapacity: event.target.value }))}
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Google Maps URL (optional)</label>
            <input
              value={form.googleMapsUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, googleMapsUrl: event.target.value }))}
              className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Photos (one URL per line)</label>
            <textarea
              rows={4}
              value={form.photosText}
              onChange={(event) => setForm((prev) => ({ ...prev, photosText: event.target.value }))}
              className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Sections JSON</label>
            <textarea
              rows={5}
              value={form.sectionsText}
              onChange={(event) => setForm((prev) => ({ ...prev, sectionsText: event.target.value }))}
              className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-mono shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <p className="mb-1.5 block text-sm font-semibold text-foreground">Facilities</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-xl border border-border bg-muted/30 p-3">
              {facilities.map((facility: Facility) => (
                <label key={facility.id} className="inline-flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.facilityIds.includes(facility.id)}
                    onChange={() =>
                      setForm((prev) => ({
                        ...prev,
                        facilityIds: toggleFacility(prev.facilityIds, facility.id),
                      }))
                    }
                  />
                  <span>{facility.nameEn} / {facility.nameAr}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Link
              to="/admin/venues"
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !canWrite}
              className="inline-flex items-center gap-2 rounded-xl admin-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Create Venue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
