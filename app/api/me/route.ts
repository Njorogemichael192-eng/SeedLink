import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ accountType: null, role: null }, { status: 200 });
  }

  const user = await prisma.user.findFirst({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ accountType: null, role: null }, { status: 200 });
  }

  return NextResponse.json({ accountType: user.accountType, role: user.role }, { status: 200 });
}
