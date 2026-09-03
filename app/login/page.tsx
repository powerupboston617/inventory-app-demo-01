import { LoginForm } from "@/components/LoginForm";
import { Logo } from "@/components/Logo";
import { googleAuthEnabled, safeFrom } from "@/lib/guards";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const from = safeFrom(typeof sp.from === "string" ? sp.from : undefined);
  const error = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <div className="flex min-h-dvh flex-col bg-navy">
      <header className="flex items-center gap-3 px-5 py-6 text-white">
        <Logo className="h-10 w-10" />
        <div>
          <p className="text-base font-semibold leading-tight">Power Up Boston</p>
          <p className="text-xs font-medium tracking-wide text-sky">Inventory</p>
        </div>
      </header>
      <main className="flex flex-1 flex-col rounded-t-3xl bg-page px-5 py-8">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-2xl font-bold text-navy">Sign in</h1>
          <p className="mt-1 text-sm text-mute">
            Sign in with your email and password.
          </p>
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <LoginForm from={from} googleEnabled={googleAuthEnabled()} error={error} />
          </div>
        </div>
      </main>
    </div>
  );
}
