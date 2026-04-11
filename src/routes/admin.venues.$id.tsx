import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Archive, CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { ApiStatusBadge } from "@/components/admin/AdminCrudPage";
import {
  approveVenueAdmin,
  archiveVenueAdmin,
  canWriteVenuesAdmin,
  getVenueAdmin,
  listVenueFacilitiesAdmin,
  rejectVenueAdmin,
  updateVenueAdmin,
} from "@/lib/admin-api.functions";
import type { Facility, UpdateVenueRequest, Venue } from "@/lib/api-client";

export const Route = createFileRoute("/admin/venues/$id")({
  loader: async ({ params }) => {
    const [venue, facilities, canWrite] = await Promise.all([
      getVenueAdmin({ data: { id: params.id } }),
      listVenueFacilitiesAdmin(),
      canWriteVenuesAdmin(),
    ]);
    return { venue, facilities, canWrite };
  },
  component: VenueDetailsPage,
});

type VenueFormState = {
  nameAr: string;
  nameEn: string;
  type: Venue["type"];
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

function buildFormState(venue: Venue): VenueFormState {
  return {
    nameAr: venue.nameAr ?? "",
    nameEn: venue.nameEn ?? "",
    type: venue.type,
    governorateId: venue.governorateId ?? "",
    cityId: venue.cityId ?? "",
    addressAr: venue.addressAr ?? "",
    addressEn: venue.addressEn ?? "",
    lat: String(venue.lat ?? ""),
    lng: String(venue.lng ?? ""),
    totalCapacity: String(venue.totalCapacity ?? ""),
    googleMapsUrl: venue.googleMapsUrl ?? "",
    photosText: (venue.photos ?? []).join("\n"),
    sectionsText: venue.sections ? JSON.stringify(venue.sections, null, 2) : "{}",
    facilityIds: (venue.facilities ?? []).map((facility) => facility.id),
  };
}

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

function VenueDetailsPage() {
  const { venue: initialVenue, facilities, canWrite } = Route.useLoaderData();
  const getVenueFn = useServerFn(getVenueAdmin);
  const updateFn = useServerFn(updateVenueAdmin);
  const approveFn = useServerFn(approveVenueAdmin);
  const rejectFn = useServerFn(rejectVenueAdmin);
  const archiveFn = useServerFn(archiveVenueAdmin);

  const [venue, setVenue] = useState<Venue>(initialVenue);
  const [form, setForm] = useState<VenueFormState>(buildFormState(initialVenue));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshVenue = async () => {
    setError(null);
    try {
      const updated = await getVenueFn({ data: { id: venue.id } });
      setVenue(updated);
      setForm(buildFormState(updated));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh venue.");
    }
  };

  const onApprove = async () => {
    setBusy("approve");
    setError(null);
    try {
      await approveFn({ data: { id: venue.id } });
      await refreshVenue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve venue.");
    } finally {
      setBusy(null);
    }
  };

  const onReject = async () => {
    const reason = window.prompt("Rejection reason:");
    if (!reason) return;
    setBusy("reject");
    setError(null);
    try {
      await rejectFn({ data: { id: venue.id, reason } });
      await refreshVenue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject venue.");
    } finally {
      setBusy(null);
    }
  };

  const onArchive = async () => {
    if (!window.confirm("Archive this venue?")) return;
    setBusy("archive");
    setError(null);
    try {
      await archiveFn({ data: { id: venue.id } });
      await refreshVenue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive venue.");
    } finally {
      setBusy(null);
    }
  };

  const onSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canWrite) return;

    setBusy("save");
    setError(null);
    try {
      const payload: UpdateVenueRequest = {
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
      await updateFn({ data: { id: venue.id, updates: payload } });
      await refreshVenue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update venue.");
    } finally {
      setBusy(null);
    }
  };

  const orderedPhotos = useMemo(() => venue.photos ?? [], [venue.photos]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card/70 backdrop-blur px-8 py-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Venue Details
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{venue.nameEn}</h1>
          <p className="text-sm text-muted-foreground">{venue.nameAr}</p>
        </div>
        <div className="flex items-center gap-2">
          <ApiStatusBadge status={venue.status} />
          <button
            onClick={refreshVenue}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-8 space-y-4">
        <Link to="/admin/venues" className="text-sm font-semibold text-primary hover:underline">
          ← Back to venues
        </Link>

        {!canWrite && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            Edit operations are unavailable for admin sessions on the current backend policy.
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card shadow-card p-4 flex flex-wrap items-center gap-2">
          {venue.status === "PENDING" && (
            <>
              <button
                onClick={onApprove}
                disabled={Boolean(busy)}
                className="inline-flex items-center gap-2 rounded-xl bg-success px-4 py-2 text-sm font-semibold text-success-foreground disabled:opacity-50"
              >
                {busy === "approve" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Approve
              </button>
              <button
                onClick={onReject}
                disabled={Boolean(busy)}
                className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
              >
                {busy === "reject" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Reject
              </button>
            </>
          )}
          {venue.status !== "ARCHIVED" && (
            <button
              onClick={onArchive}
              disabled={Boolean(busy)}
              className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 disabled:opacity-50"
            >
              {busy === "archive" ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
              Archive
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Snapshot</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-semibold text-foreground">{venue.type}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Governorate ID</p>
              <p className="font-semibold text-foreground">{venue.governorateId}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Capacity</p>
              <p className="font-semibold text-foreground">{venue.totalCapacity.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <form onSubmit={onSave} className="rounded-2xl border border-border bg-card shadow-card p-6 space-y-5">
          <h2 className="text-lg font-bold text-foreground">Edit Venue</h2>

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

          {orderedPhotos.length > 0 && (
            <div>
              <p className="mb-1.5 block text-sm font-semibold text-foreground">Existing Photos</p>
              <div className="space-y-1 text-sm">
                {orderedPhotos.map((photo, index) => (
                  <a key={`${photo}-${index}`} href={photo} target="_blank" rel="noreferrer" className="block text-primary hover:underline">
                    {photo}
                  </a>
                ))}
              </div>
            </div>
          )}

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

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy === "save" || !canWrite}
              className="inline-flex items-center gap-2 rounded-xl admin-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand disabled:opacity-50"
            >
              {busy === "save" && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
