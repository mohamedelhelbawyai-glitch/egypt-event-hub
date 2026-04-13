import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  listRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  toggleField,
} from "@/lib/admin-crud.functions";

// ─── Types ───────────────────────────────────────────────

export interface ColumnDef {
  key: string;
  label: string;
  render?: (value: any, row: Record<string, any>) => React.ReactNode;
}

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "toggle" | "textarea" | "color";
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  defaultValue?: any;
}

export interface ApiFns {
  list?: () => Promise<Record<string, any>[]>;
  create?: (data: Record<string, any>) => Promise<Record<string, any>>;
  update?: (id: string, data: Record<string, any>) => Promise<Record<string, any>>;
  delete?: (id: string) => Promise<void>;
}

interface AdminCrudPageProps {
  title: string;
  subtitle: string;
  columns: ColumnDef[];
  fields?: FieldDef[];
  initialData: Record<string, any>[];
  // Supabase legacy mode
  table?: string;
  orderBy?: string;
  ascending?: boolean;
  // Backend API mode
  apiFns?: ApiFns;
  // Custom row actions (replaces or supplements edit/delete)
  rowActions?: (row: Record<string, any>, refresh: () => Promise<void>) => React.ReactNode;
  // Control visibility
  hideCreate?: boolean;
  hideEdit?: boolean;
  hideDelete?: boolean;
  // Extra element to render next to search bar
  filterButton?: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────

export function AdminCrudPage({
  title,
  subtitle,
  table,
  columns,
  fields = [],
  orderBy,
  ascending,
  initialData,
  apiFns,
  rowActions,
  hideCreate = false,
  hideEdit = false,
  hideDelete = false,
  filterButton,
}: AdminCrudPageProps) {
  const [data, setData] = useState<Record<string, any>[]>(initialData);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Legacy Supabase fns (only used when apiFns not provided)
  const createFn = useServerFn(createRecord);
  const updateFn = useServerFn(updateRecord);
  const deleteFn = useServerFn(deleteRecord);
  const toggleFn = useServerFn(toggleField);

  const isApiMode = !!apiFns;

  useEffect(() => {
    if (isApiMode && apiFns?.list) {
      apiFns.list().then(setData).catch(() => {});
    }
  }, []);

  const refresh = async () => {
    try {
      if (isApiMode && apiFns?.list) {
        const rows = await apiFns.list();
        setData(rows);
      } else if (table) {
        const rows = await listRecords({ data: { table, orderBy, ascending } });
        setData(rows);
      }
    } catch (err: any) {
      setError(err.message || "Failed to refresh");
    }
  };

  const filtered = data.filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return Object.values(row).some(
      (v) => typeof v === "string" && v.toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    const defaults: Record<string, any> = {};
    fields.forEach((f) => {
      if (f.defaultValue !== undefined) defaults[f.key] = f.defaultValue;
      else if (f.type === "toggle") defaults[f.key] = true;
      else if (f.type === "number") defaults[f.key] = 0;
      else defaults[f.key] = "";
    });
    setFormData(defaults);
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (row: Record<string, any>) => {
    const vals: Record<string, any> = {};
    fields.forEach((f) => {
      vals[f.key] = row[f.key] ?? "";
    });
    setFormData(vals);
    setEditing(row);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isApiMode) {
        if (editing) {
          await apiFns?.update?.(editing.id, formData);
        } else {
          await apiFns?.create?.(formData);
        }
      } else if (table) {
        if (editing) {
          await updateFn({ data: { table, id: editing.id, updates: formData } });
        } else {
          await createFn({ data: { table, record: formData } });
        }
      }
      setShowForm(false);
      await refresh();
    } catch (err: any) {
      setError(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    setError(null);
    try {
      if (isApiMode) {
        await apiFns?.delete?.(deleteId);
      } else if (table) {
        await deleteFn({ data: { table, id: deleteId } });
      }
      setDeleteId(null);
      await refresh();
    } catch (err: any) {
      setError(err.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, field: string, value: boolean) => {
    try {
      if (table && !isApiMode) {
        await toggleFn({ data: { table, id, field, value } });
        await refresh();
      }
    } catch {}
  };

  const showEditBtn = !hideEdit && fields.length > 0;
  const showDeleteBtn = !hideDelete && (isApiMode ? !!apiFns?.delete : !!table);
  const showCreateBtn = !hideCreate && fields.length > 0;
  const hasActions = showEditBtn || showDeleteBtn || !!rowActions;

  return (
    <>
      {/* Header */}
      <div className="border-b border-border bg-card/70 backdrop-blur px-8 py-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {subtitle}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
        </div>
        {showCreateBtn && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl admin-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand transition-transform hover:-translate-y-0.5"
          >
            <Plus size={16} strokeWidth={2.5} />
            Add New
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-destructive/70 hover:text-destructive font-bold ml-4">✕</button>
          </div>
        )}

        {/* Search */}
        <div className="mb-5 flex items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-input bg-card pl-10 pr-3 py-2.5 text-sm shadow-soft placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
            />
          </div>
          {filterButton}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      {col.label}
                    </th>
                  ))}
                  {hasActions && (
                    <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                          <Search size={18} className="text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">No records found</p>
                        <p className="text-xs text-muted-foreground">
                          Try adjusting your search or add a new record.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 hover:bg-primary/[0.03] transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-5 py-3.5 text-foreground">
                        {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {rowActions?.(row, refresh)}
                          {showEditBtn && (
                            <button
                              onClick={() => openEdit(row)}
                              className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {showDeleteBtn && (
                            <button
                              onClick={() => setDeleteId(row.id)}
                              className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 text-xs font-medium text-muted-foreground">
          {filtered.length} record{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Create/Edit Dialog */}
      {showForm && fields.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-pop max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {editing ? "Update" : "New record"}
                </p>
                <h2 className="mt-0.5 text-lg font-extrabold text-foreground">
                  {editing ? "Edit Record" : "Create Record"}
                </h2>
              </div>
            </div>
            {error && (
              <div className="mx-6 mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <form id="admin-crud-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-4">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  {field.type === "toggle" ? (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, [field.key]: !prev[field.key] }))
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData[field.key] ? "admin-gradient" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          formData[field.key] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  ) : field.type === "select" ? (
                    <select
                      value={formData[field.key] ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      required={field.required}
                      className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      value={formData[field.key] ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      required={field.required}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  ) : field.type === "color" ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData[field.key] || "#7C3AED"}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className="h-11 w-14 cursor-pointer rounded-xl border border-input bg-card p-1 shadow-soft"
                      />
                      <input
                        type="text"
                        value={formData[field.key] ?? ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        placeholder="#7C3AED"
                        className="flex-1 rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-mono shadow-soft focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      value={formData[field.key] ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [field.key]:
                            field.type === "number"
                              ? Number(e.target.value)
                              : e.target.value,
                        }))
                      }
                      required={field.required}
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  )}
                </div>
              ))}
            </form>
            <div className="flex justify-end gap-2 border-t border-border px-6 py-4 bg-muted/30">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="admin-crud-form"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl admin-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {editing ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-pop">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <Trash2 size={20} />
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-foreground">Delete record?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This action cannot be undone. The record will be permanently removed.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground shadow-soft hover:bg-destructive/90 disabled:opacity-50"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Status Badge Helper ─────────────────────────────────

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active
          ? "bg-success/10 text-success ring-1 ring-inset ring-success/20"
          : "bg-muted text-muted-foreground ring-1 ring-inset ring-border"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-success" : "bg-muted-foreground/60"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function ApiStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    ACTIVE: "bg-success/10 text-success ring-success/20",
    APPROVED: "bg-success/10 text-success ring-success/20",
    PUBLISHED: "bg-success/10 text-success ring-success/20",
    ON_SALE: "bg-success/10 text-success ring-success/20",
    LIVE: "bg-primary/10 text-primary ring-primary/20",
    PENDING: "bg-warning/10 text-warning ring-warning/20",
    PENDING_REVIEW: "bg-warning/10 text-warning ring-warning/20",
    DRAFT: "bg-muted text-muted-foreground ring-border",
    SUSPENDED: "bg-orange-100 text-orange-700 ring-orange-200",
    BANNED: "bg-destructive/10 text-destructive ring-destructive/20",
    REJECTED: "bg-destructive/10 text-destructive ring-destructive/20",
    CANCELLED: "bg-destructive/10 text-destructive ring-destructive/20",
    FAILED: "bg-destructive/10 text-destructive ring-destructive/20",
    REFUNDED: "bg-primary/10 text-primary ring-primary/20",
    PARTIALLY_REFUNDED: "bg-orange-100 text-orange-700 ring-orange-200",
    COMPLETED: "bg-muted text-muted-foreground ring-border",
    ARCHIVED: "bg-muted text-muted-foreground ring-border",
    SOLD_OUT: "bg-orange-100 text-orange-700 ring-orange-200",
  };
  const cls = variants[status] ?? "bg-muted text-muted-foreground ring-border";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${cls}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

export function ColorSwatch({ hex }: { hex: string | null }) {
  if (!hex) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-6 w-6 rounded-lg border border-border shadow-soft"
        style={{ backgroundColor: hex }}
      />
      <span className="text-xs font-mono text-muted-foreground">{hex}</span>
    </div>
  );
}

// ─── No API Placeholder ──────────────────────────────────

export function NoApiPage({ title, subtitle, missingApis }: {
  title: string;
  subtitle: string;
  missingApis: string[];
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card/70 backdrop-blur px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{subtitle}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10">
            <span className="text-2xl">🚧</span>
          </div>
          <h2 className="text-lg font-extrabold text-foreground">Backend API Not Available</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This section requires backend API endpoints that have not been implemented yet.
            Please build the following APIs to enable this feature:
          </p>
          <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-left space-y-1.5">
            {missingApis.map((api) => (
              <div key={api} className="flex items-center gap-2 text-sm font-mono">
                <span className="text-destructive">✗</span>
                <span className="text-foreground">{api}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Once these endpoints are ready, this page will be fully functional.
          </p>
        </div>
      </div>
    </div>
  );
}
