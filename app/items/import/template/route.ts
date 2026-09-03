import { CSV_TEMPLATE } from "@/lib/csv";
import { getCurrentUser } from "@/lib/guards";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "Admin") {
    return new Response("Forbidden", { status: 403 });
  }
  return new Response(CSV_TEMPLATE, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pub-inventory-template.csv"',
    },
  });
}
