import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-helpers";
import { runDueGrowthReminders } from "@/lib/growth-reminders";

export async function POST() {
  try {
    await requireSuperAdmin();
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status ?? 403;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  await runDueGrowthReminders();

  return NextResponse.json({ ok: true });
}
