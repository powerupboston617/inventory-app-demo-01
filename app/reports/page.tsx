import { redirect } from "next/navigation";
import { AiStatusLine } from "@/components/AiStatusLine";
import { ReportsForm } from "@/components/ReportsForm";
import { getCurrentUser } from "@/lib/guards";
import { isMailConfigured } from "@/lib/mail";
import { loadReportSettings } from "@/lib/actions-reports";
import { REPORT_TZ } from "@/lib/reports";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "Admin") redirect("/");

  const settings = await loadReportSettings();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-navy">Reports</h1>
        <p className="mt-1 text-sm text-mute">
          Email a short stock summary. Timezone {REPORT_TZ}. Weekly goes out
          Monday morning.
        </p>
        <AiStatusLine />
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-6">
        <ReportsForm
          frequency={settings.frequency}
          extraEmail={settings.extraEmail}
          mailConfigured={isMailConfigured()}
          lastSentAt={settings.lastSentAt?.toISOString() ?? null}
        />
      </div>
    </div>
  );
}
