"use client";

import { useState, useTransition } from "react";
import { createProject, updateProject } from "@/lib/actions";
import { PROJECT_STATUSES, type ProjectStatusValue } from "@/lib/constants";

const fieldClass =
  "w-full min-h-12 rounded-xl border border-gray-200 bg-white px-4 text-base text-navy placeholder:text-mute focus:border-blue focus:outline-none focus:ring-2 focus:ring-sky";
const labelClass = "mb-1.5 block text-sm font-medium text-navy";

export type ProjectFormValues = {
  id: string;
  name: string;
  client: string | null;
  status: ProjectStatusValue;
  notes: string | null;
};

export function ProjectForm({ project }: { project?: ProjectFormValues }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = project
        ? await updateProject(project.id, formData)
        : await createProject(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className={labelClass}>
          Name <span className="text-orange">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={project?.name ?? ""}
          placeholder="e.g. Harborview clinic refresh"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="client" className={labelClass}>
          Client
        </label>
        <input
          id="client"
          name="client"
          defaultValue={project?.client ?? ""}
          placeholder="Optional"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="status" className={labelClass}>
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={project?.status ?? "Active"}
          className={fieldClass}
        >
          {PROJECT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={project?.notes ?? ""}
          placeholder="Job notes, site access, etc."
          className={`${fieldClass} py-3`}
        />
      </div>
      {error ? (
        <p className="rounded-xl bg-orange/10 px-4 py-3 text-sm font-medium text-orange">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-orange text-base font-semibold text-white disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? "Saving…" : project ? "Save project" : "Create project"}
      </button>
    </form>
  );
}
