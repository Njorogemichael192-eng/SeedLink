import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id?: string }> }) {
  try {
    await requireSuperAdmin();
  } catch (e: unknown) {
    const status = typeof (e as { status?: number })?.status === "number" ? (e as { status: number }).status : 403;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }
  const { id: rawId } = await params;
  const id = typeof rawId === "string" ? rawId : "";
  if (!id) {
    return NextResponse.json({ error: "Missing station id" }, { status: 400 });
  }
  const { name, location, contactPhone } = await req.json();
  if (!name && !location && typeof contactPhone === "undefined") {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  const station = await prisma.seedlingStation.update({
    where: { id },
    data: { ...(name ? { name } : {}), ...(location ? { location } : {}), ...(contactPhone !== undefined ? { contactPhone } : {}) },
  });
  return NextResponse.json({ station });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id?: string }> }) {
  try {
    await requireSuperAdmin();
  } catch (e: unknown) {
    const status = typeof (e as { status?: number })?.status === "number" ? (e as { status: number }).status : 403;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }
  const { id: rawId } = await params;
  const id = typeof rawId === "string" ? rawId : "";
  if (!id) {
    return NextResponse.json({ error: "Missing station id" }, { status: 400 });
  }

  // Block deletion if bookings exist
  const bookingCount = await prisma.booking.count({ where: { stationId: id } });
  if (bookingCount > 0) {
    return NextResponse.json({ error: "Cannot delete station with existing bookings" }, { status: 409 });
  }

  // Delete inventory first due to FK, then the station
  await prisma.seedlingInventory.deleteMany({ where: { stationId: id } });
  await prisma.seedlingStation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
