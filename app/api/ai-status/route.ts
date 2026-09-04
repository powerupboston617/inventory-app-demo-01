import { NextResponse } from "next/server";
import { aiEnabled } from "@/lib/ai-suggest";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { enabled: aiEnabled() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
