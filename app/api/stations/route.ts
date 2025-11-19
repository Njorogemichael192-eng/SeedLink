import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const stations = await prisma.seedlingStation.findMany({
    include: { inventory: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ stations });
}
