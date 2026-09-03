"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteItem, deleteProject } from "@/lib/actions";

type Props = {
  id: string;
  name: string;
  kind?: "item" | "project";
};

export function DeleteButton({ id, name, kind = "item" }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result =
        kind === "project" ? await deleteProject(id) : await deleteItem(id);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-orange/30 bg-white px-4 text-sm font-semibold text-orange hover:bg-orange/5"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
          >
            <h2 id="delete-title" className="text-lg font-semibold text-navy">
              Delete {kind === "project" ? "project" : "item"}?
            </h2>
            <p className="mt-2 text-sm text-mute">
              {kind === "project" ? (
                <>
                  Delete <span className="font-medium text-navy">{name}</span>?
                  Items on this project stay in inventory, they just won’t be
                  assigned to it anymore. This cannot be undone.
                </>
              ) : (
                <>
                  Delete <span className="font-medium text-navy">{name}</span>?
                  This cannot be undone.
                </>
              )}
            </p>
            {error ? (
              <p className="mt-3 text-sm font-medium text-orange">{error}</p>
            ) : null}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={pending}
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-navy"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={confirm}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-orange px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
