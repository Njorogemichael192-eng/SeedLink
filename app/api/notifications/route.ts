import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dbUser = await prisma.user.findFirst({ where: { clerkId: userId } });
  if (!dbUser) return NextResponse.json({ error: "Profile not found" }, { status: 400 });

  const items = await prisma.notification.findMany({ where: { userId: dbUser.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ notifications: items });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dbUser = await prisma.user.findFirst({ where: { clerkId: userId } });
  if (!dbUser) return NextResponse.json({ error: "Profile not found" }, { status: 400 });

  const { ids } = await req.json();
  if (!Array.isArray(ids) || !ids.length) return NextResponse.json({ error: "ids required" }, { status: 400 });

  await prisma.notification.updateMany({ where: { id: { in: ids }, userId: dbUser.id }, data: { read: true } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dbUser = await prisma.user.findFirst({ where: { clerkId: userId } });
  if (!dbUser) return NextResponse.json({ error: "Profile not found" }, { status: 400 });

  const { ids } = await req.json();
  if (!Array.isArray(ids) || !ids.length) return NextResponse.json({ error: "ids required" }, { status: 400 });

  await prisma.notification.deleteMany({ where: { id: { in: ids }, userId: dbUser.id } });
  return NextResponse.json({ ok: true });
}
