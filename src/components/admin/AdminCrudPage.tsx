import { useState } from "react";
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

interface AdminCrudPageProps {
  title: string;
  subtitle: string;
  table: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  orderBy?: string;
  ascending?: boolean;
  initialData: Record<string, any>[];
}

// ─── Component ───────────────────────────────────────────

export function AdminCrudPage({
  title,
  subtitle,
  table,
  columns,
  fields,
  orderBy,
  ascending,
  initialData,
}: AdminCrudPageProps) {
  const [data, setData] = useState<Record<string, any>[]>(initialData);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const createFn = useServerFn(createRecord);
  const updateFn = useServerFn(updateRecord);
  const deleteFn = useServerFn(deleteRecord);
  const toggleFn = useServerFn(toggleField);

  const refresh = async () => {
    try {
      const rows = await listRecords({ data: { table, orderBy, ascending } });
      setData(rows);
    } catch {}
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
    try {
      if (editing) {
        await updateFn({ data: { table, id: editing.id, updates: formData } });
      } else {
        await createFn({ data: { table, record: formData } });
      }
      setShowForm(false);
      await refresh();
    } catch (err: any) {
      alert(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await deleteFn({ data: { table, id: deleteId } });
      setDeleteId(null);
      await refresh();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, field: string, value: boolean) => {
    try {
      await toggleFn({ data: { table, id, field, value } });
      await refresh();
    } catch {}
  };

  return (
    <>
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-md admin-gradient px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
        >
          <Plus size={16} />
          Add New
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Search */}
        <div className="mb-4 relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {columns.map((col) => (
                    <th key={col.key} className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                      No records found
                    </td>
                  </tr>
                )}
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-foreground">
                        {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(row)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(row.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{filtered.length} record(s)</p>
      </div>

      {/* Create/Edit Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {editing ? "Edit Record" : "Create Record"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
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
                        formData[field.key] ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
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
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : field.type === "color" ? "color" : "text"}
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
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-md admin-gradient px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {editing ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl mx-4">
            <h2 className="text-lg font-semibold text-foreground">Delete Record</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
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
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        active
          ? "bg-success/10 text-success"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function ColorSwatch({ hex }: { hex: string | null }) {
  if (!hex) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-5 w-5 rounded-md border border-border"
        style={{ backgroundColor: hex }}
      />
      <span className="text-xs text-muted-foreground">{hex}</span>
    </div>
  );
}
