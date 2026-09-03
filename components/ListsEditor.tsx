"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  addCatalogCategory,
  createItemName,
  createManufacturer,
  deleteCategory,
  deleteItemName,
  deleteManufacturer,
  renameCategory,
  renameItemName,
  renameManufacturer,
} from "@/lib/actions-catalog";

export type ListRow = { id: string; name: string; count: number };
type Tab = "names" | "makers" | "categories";

const fieldClass =
  "w-full min-h-12 rounded-xl border border-gray-200 bg-white px-4 text-base text-navy placeholder:text-mute focus:border-blue focus:outline-none focus:ring-2 focus:ring-sky";

export function ListsEditor({
  itemNames,
  manufacturers,
  categories,
}: {
  itemNames: ListRow[];
  manufacturers: ListRow[];
  categories: ListRow[];
}) {
  const [tab, setTab] = useState<Tab>("names");
  const [query, setQuery] = useState("");
  const [addValue, setAddValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteRow, setDeleteRow] = useState<ListRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rows = tab === "names" ? itemNames : tab === "makers" ? manufacturers : categories;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(q));
  }, [rows, query]);

  const emptyCopy =
    tab === "names"
      ? "No item names yet. Add one here or from Add Item."
      : tab === "makers"
        ? "No manufacturers yet. Add one here or from Add Item."
        : "No categories yet.";

  function add() {
    setError(null);
    startTransition(async () => {
      const result =
        tab === "names"
          ? await createItemName(addValue)
          : tab === "makers"
            ? await createManufacturer(addValue)
            : await addCatalogCategory(addValue);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAddValue("");
    });
  }

  function saveRename(id: string) {
    setError(null);
    startTransition(async () => {
      const result =
        tab === "names"
          ? await renameItemName(id, editValue)
          : tab === "makers"
            ? await renameManufacturer(id, editValue)
            : await renameCategory(id, editValue);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditingId(null);
    });
  }

  function confirmDelete() {
    if (!deleteRow) return;
    setError(null);
    startTransition(async () => {
      const result =
        tab === "names"
          ? await deleteItemName(deleteRow.id)
          : tab === "makers"
            ? await deleteManufacturer(deleteRow.id)
            : await deleteCategory(deleteRow.id);
      if (!result.ok) {
        setError(result.error);
        setDeleteRow(null);
        return;
      }
      setDeleteRow(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["names", "Item names"],
            ["makers", "Manufacturers"],
            ["categories", "Categories"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setQuery("");
              setEditingId(null);
              setError(null);
            }}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold ${
              tab === key ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-black/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search this list"
        className={fieldClass}
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={addValue}
          onChange={(e) => setAddValue(e.target.value)}
          placeholder={
            tab === "names"
              ? "New item name"
              : tab === "makers"
                ? "New manufacturer"
                : "New category"
          }
          className={fieldClass}
        />
        <button
          type="button"
          disabled={pending}
          onClick={add}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-orange px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {error ? (
        <p className="rounded-xl bg-orange/10 px-4 py-3 text-sm font-medium text-orange">
          {error}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-mute">
          {emptyCopy}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((row) => (
            <li
              key={row.id}
              className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
            >
              {editingId === row.id ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className={fieldClass}
                  />
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => saveRename(row.id)}
                    className="min-h-12 rounded-xl bg-navy px-4 text-sm font-semibold text-white"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="min-h-12 rounded-xl px-4 text-sm font-semibold text-mute"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy">{row.name}</p>
                    <p className="text-xs text-mute">
                      Used by {row.count} {row.count === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(row.id);
                        setEditValue(row.name);
                        setError(null);
                      }}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-navy hover:bg-page"
                      aria-label={`Rename ${row.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteRow(row);
                        setError(null);
                      }}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-orange hover:bg-orange/10"
                      aria-label={`Delete ${row.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {deleteRow ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-navy">Delete {deleteRow.name}?</h2>
            <p className="mt-2 text-sm text-mute">
              {deleteRow.count > 0
                ? `Used by ${deleteRow.count} ${deleteRow.count === 1 ? "item" : "items"} — reassign or delete those items first.`
                : "This cannot be undone."}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteRow(null)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-navy"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending || deleteRow.count > 0}
                onClick={confirmDelete}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-orange px-4 text-sm font-semibold text-white disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
