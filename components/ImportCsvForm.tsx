"use client";

import { useState, useTransition } from "react";
import { importItemsCsv } from "@/lib/actions-import";

export function ImportCsvForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
    truncated?: boolean;
  } | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const outcome = await importItemsCsv(formData);
      if ("error" in outcome) {
        setError(outcome.error);
        return;
      }
      setResult(outcome);
    });
  }

  return (
    <div className="space-y-4">
      <form action={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="file" className="mb-1.5 block text-sm font-medium text-navy">
            CSV file
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="block w-full min-h-12 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          <p className="mt-1 text-xs text-mute">
            Up to 500 data rows. New items only — existing rows are not updated.
          </p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-orange text-base font-semibold text-white disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {pending ? "Importing…" : "Import CSV"}
        </button>
      </form>

      {error ? (
        <p className="rounded-xl bg-orange/10 px-4 py-3 text-sm font-medium text-orange">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
          <p className="font-semibold text-navy">
            Created {result.created}
            {result.skipped ? ` · skipped ${result.skipped}` : ""}
          </p>
          {result.truncated ? (
            <p className="mt-1 text-sm text-orange">
              File was longer than 500 rows. Extra rows were not read.
            </p>
          ) : null}
          {result.errors.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-mute">
              {result.errors.slice(0, 50).map((err) => (
                <li key={`${err.row}-${err.message}`}>
                  Row {err.row}: {err.message}
                </li>
              ))}
              {result.errors.length > 50 ? (
                <li>…and {result.errors.length - 50} more</li>
              ) : null}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-mute">No row errors.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
