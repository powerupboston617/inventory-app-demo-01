"use client";

import { useState, useTransition } from "react";
import { saveReportSettings, sendTestReport } from "@/lib/actions-reports";

const fieldClass =
  "w-full min-h-12 rounded-xl border border-gray-200 bg-white px-4 text-base text-navy placeholder:text-mute focus:border-blue focus:outline-none focus:ring-2 focus:ring-sky";
const labelClass = "mb-1.5 block text-sm font-medium text-navy";

export function ReportsForm({
  frequency,
  extraEmail,
  mailConfigured,
  lastSentAt,
}: {
  frequency: string;
  extraEmail: string | null;
  mailConfigured: boolean;
  lastSentAt: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSave(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveReportSettings(formData);
      if (result.ok) {
        setMessage(
          result.mail
            ? "Saved."
            : "Saved. Email is not configured — reports will not send.",
        );
      }
    });
  }

  function onTest() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await sendTestReport();
      if ("error" in result && result.error) setError(result.error);
      else setMessage("Test report sent.");
    });
  }

  return (
    <div className="space-y-5">
      {!mailConfigured ? (
        <p className="rounded-xl bg-orange/10 px-4 py-3 text-sm font-medium text-orange">
          Email not configured — reports will not send. Add SMTP settings in
          .env.
        </p>
      ) : null}

      <form action={onSave} className="space-y-4">
        <div>
          <label htmlFor="frequency" className={labelClass}>
            Frequency
          </label>
          <select
            id="frequency"
            name="frequency"
            defaultValue={frequency}
            className={fieldClass}
          >
            <option value="Off">Off</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly (Monday morning)</option>
          </select>
          <p className="mt-1 text-xs text-mute">
            Timezone America/New_York. Daily/weekly sends after 6:00 AM once a
            cron job hits /api/cron/reports.
          </p>
        </div>
        <div>
          <label htmlFor="extraEmail" className={labelClass}>
            Extra recipient
          </label>
          <input
            id="extraEmail"
            name="extraEmail"
            type="email"
            defaultValue={extraEmail ?? ""}
            placeholder="Optional extra email"
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-mute">
            All Admin users are included automatically.
          </p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-navy text-base font-semibold text-white disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </form>

      <button
        type="button"
        disabled={pending}
        onClick={onTest}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-orange text-base font-semibold text-white disabled:opacity-60 sm:w-auto sm:px-8"
      >
        Send test report
      </button>

      {lastSentAt ? (
        <p className="text-sm text-mute">
          Last scheduled send: {new Date(lastSentAt).toLocaleString("en-US")}
        </p>
      ) : (
        <p className="text-sm text-mute">No scheduled report has been sent yet.</p>
      )}

      {message ? (
        <p className="rounded-xl bg-sky/20 px-4 py-3 text-sm font-medium text-navy">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-orange/10 px-4 py-3 text-sm font-medium text-orange">
          {error}
        </p>
      ) : null}
    </div>
  );
}
