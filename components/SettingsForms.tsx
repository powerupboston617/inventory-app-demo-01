"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import {
  createUser,
  setUserDisabled,
  setUserRole,
  updateUser,
} from "@/lib/actions-users";

const fieldClass =
  "w-full min-h-12 rounded-xl border border-gray-200 bg-white px-4 text-base text-navy placeholder:text-mute focus:border-blue focus:outline-none focus:ring-2 focus:ring-sky";
const labelClass = "mb-1.5 block text-sm font-medium text-navy";

export function AddUserForm() {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    setOk(false);
    startTransition(async () => {
      const result = await createUser(formData);
      if (result.error) setError(result.error);
      else setOk(true);
    });
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <div>
        <label htmlFor="add-name" className={labelClass}>
          Name
        </label>
        <input
          id="add-name"
          name="name"
          required
          autoComplete="name"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="add-email" className={labelClass}>
          Email
        </label>
        <input
          id="add-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="add-password" className={labelClass}>
          Password
        </label>
        <input
          id="add-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="add-role" className={labelClass}>
          Role
        </label>
        <select
          id="add-role"
          name="role"
          defaultValue="Tech"
          className={fieldClass}
        >
          <option value="Tech">Tech</option>
          <option value="Admin">Admin</option>
        </select>
      </div>
      {error ? (
        <p className="text-sm font-medium text-orange">{error}</p>
      ) : null}
      {ok ? (
        <p className="text-sm font-medium text-navy">User added.</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-orange text-base font-semibold text-white disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? "Saving…" : "Add user"}
      </button>
    </form>
  );
}

export function UserRowActions({
  id,
  name,
  email,
  role,
  disabled,
  isSelf,
  isLastAdmin,
}: {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Tech";
  disabled: boolean;
  isSelf: boolean;
  isLastAdmin: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const lockAdmin = isLastAdmin;

  function onDisable() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setUserDisabled(id, !disabled);
      if (result.error) setError(result.error);
    });
  }

  function onRole(next: "Admin" | "Tech") {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setUserRole(id, next);
      if (result.error) setError(result.error);
    });
  }

  function onEdit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateUser(id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      setEditing(false);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={role}
        disabled={pending || lockAdmin}
        onChange={(event) => {
          onRole(event.target.value === "Admin" ? "Admin" : "Tech");
        }}
        className="min-h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm"
        aria-label="Role"
      >
        <option value="Tech">Tech</option>
        <option value="Admin">Admin</option>
      </select>
      <button
        type="button"
        disabled={pending || isSelf || (lockAdmin && !disabled)}
        onClick={onDisable}
        className="inline-flex min-h-11 items-center rounded-xl border border-gray-200 px-3 text-sm font-semibold text-navy disabled:opacity-40"
      >
        {disabled ? "Enable" : "Disable"}
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(true);
          setError(null);
        }}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-navy"
      >
        <Pencil className="h-4 w-4" />
        Edit
      </button>
      {saved ? (
        <p className="w-full text-xs font-medium text-navy">Saved.</p>
      ) : null}
      {error && !editing ? (
        <p className="w-full text-xs font-medium text-orange">{error}</p>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-navy/50"
            onClick={() => setEditing(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`edit-user-${id}`}
            className="relative z-10 max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
          >
            <h2
              id={`edit-user-${id}`}
              className="text-lg font-semibold text-navy"
            >
              Edit user
            </h2>
            <form action={onEdit} className="mt-4 space-y-3">
              <div>
                <label htmlFor={`edit-name-${id}`} className={labelClass}>
                  Name
                </label>
                <input
                  id={`edit-name-${id}`}
                  name="name"
                  required
                  defaultValue={name}
                  autoComplete="name"
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor={`edit-email-${id}`} className={labelClass}>
                  Email
                </label>
                <input
                  id={`edit-email-${id}`}
                  name="email"
                  type="email"
                  required
                  defaultValue={email}
                  autoComplete="email"
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor={`edit-password-${id}`} className={labelClass}>
                  New password
                </label>
                <input
                  id={`edit-password-${id}`}
                  name="password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Leave blank to keep current"
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor={`edit-confirm-${id}`} className={labelClass}>
                  Confirm new password
                </label>
                <input
                  id={`edit-confirm-${id}`}
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Only if changing password"
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor={`edit-role-${id}`} className={labelClass}>
                  Role
                </label>
                <select
                  id={`edit-role-${id}`}
                  name="role"
                  defaultValue={role}
                  disabled={lockAdmin}
                  className={fieldClass}
                >
                  <option value="Tech">Tech</option>
                  <option value="Admin">Admin</option>
                </select>
                {lockAdmin ? (
                  <input type="hidden" name="role" value="Admin" />
                ) : null}
              </div>
              {error ? (
                <p className="text-sm font-medium text-orange">{error}</p>
              ) : null}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-orange px-4 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {pending ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
