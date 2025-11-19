import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { stationId, seedlingType } = await req.json();
  if (!stationId || !seedlingType) return NextResponse.json({ error: "stationId and seedlingType required" }, { status: 400 });

  const user = await prisma.user.findFirst({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Profile not found" }, { status: 400 });

  await prisma.restockSubscription.upsert({
    where: { userId_stationId_seedlingType: { userId: user.id, stationId, seedlingType } },
    create: { userId: user.id, stationId, seedlingType },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
