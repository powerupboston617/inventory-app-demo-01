import Link from "next/link";
import { redirect } from "next/navigation";
import { ImportCsvForm } from "@/components/ImportCsvForm";
import { getCurrentUser } from "@/lib/guards";
import { CSV_MAX_ROWS } from "@/lib/csv";

export const metadata = { title: "Import CSV" };

export default async function ImportCsvPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "Admin") redirect("/items");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-navy">Import CSV</h1>
        <p className="mt-1 text-sm text-mute">
          Create new items from a spreadsheet. Max {CSV_MAX_ROWS} rows. Existing
          items are not overwritten.
        </p>
      </div>
      <a
        href="/items/import/template"
        className="inline-flex min-h-11 items-center rounded-xl border border-navy px-4 text-sm font-semibold text-navy"
      >
        Download template CSV
      </a>
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-6">
        <ImportCsvForm />
      </div>
      <p className="text-sm text-mute">
        Headers: name, manufacturer, serialNumber, quantity, reorderPoint,
        location, status, condition, price, notes, category, project.{" "}
        <Link href="/items" className="font-medium text-blue">
          Back to items
        </Link>
      </p>
    </div>
  );
}
