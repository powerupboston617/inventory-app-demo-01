"use client";

import { useState, useTransition } from "react";
import { googleLogin, passwordLogin } from "@/lib/actions-auth";

const fieldClass =
  "w-full min-h-12 rounded-xl border border-gray-200 bg-white px-4 text-base text-navy placeholder:text-mute focus:border-blue focus:outline-none focus:ring-2 focus:ring-sky";

export function LoginForm({
  from,
  googleEnabled,
  error,
}: {
  from: string;
  googleEnabled: boolean;
  error?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(
    error === "not-allowed"
      ? "That Google account is not on the team. Ask an admin to add you."
      : error
        ? "Sign-in did not work. Try again."
        : null,
  );

  function onPassword(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await passwordLogin(formData);
      if (result?.error) setMessage(result.error);
    });
  }

  return (
    <div className="space-y-5">
      {message ? (
        <p className="rounded-xl bg-orange/10 px-4 py-3 text-sm font-medium text-orange">
          {message}
        </p>
      ) : null}

      <form action={onPassword} className="space-y-4">
        <input type="hidden" name="from" value={from} />
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={fieldClass}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-orange text-base font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {googleEnabled ? (
        <form action={() => googleLogin(from)}>
          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-semibold text-navy"
          >
            Continue with Google
          </button>
        </form>
      ) : null}
    </div>
  );
}
