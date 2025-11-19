import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { setGrowthReminderFrequency } from "@/lib/growth-reminders";

type GrowthFreq = "EVERY_3_DAYS" | "WEEKLY" | "EVERY_14_DAYS" | "MONTHLY";

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    frequency: user.growthReminderFrequency || null,
  });
}

export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const freq = (body?.frequency || null) as GrowthFreq | null;

  if (freq && !["EVERY_3_DAYS", "WEEKLY", "EVERY_14_DAYS", "MONTHLY"].includes(freq)) {
    return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
  }

  await setGrowthReminderFrequency(user.id, freq);

  const updated = await prisma.user.findUnique({ where: { id: user.id } });

  return NextResponse.json({
    frequency: updated?.growthReminderFrequency || null,
  });
}
