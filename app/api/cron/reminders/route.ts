import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { BookingStatus as BookingStatusEnum } from "@/generated/prisma-client/client";

// Invoke this endpoint via a scheduler (e.g., every 15 minutes)
// It will send reminders ~24h before pickup for bookings not yet reminded
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const windowMinutes = Number(searchParams.get("windowMinutes") ?? 60); // default 60-minute window

  const now = new Date();
  const targetStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const targetEnd = new Date(targetStart.getTime() + windowMinutes * 60 * 1000);

  const due = await prisma.booking.findMany({
    where: {
      reminderSent: false,
      status: { in: [BookingStatusEnum.PENDING, BookingStatusEnum.CONFIRMED, BookingStatusEnum.READY_FOR_PICKUP] },
      scheduledPickupDate: { gte: targetStart, lt: targetEnd },
    },
    select: { id: true, userId: true, stationId: true, seedlingType: true, quantity: true, scheduledPickupDate: true },
  });

  if (due.length === 0) return NextResponse.json({ sent: 0 });

  const stations = new Map<string, { name: string | null }>();

  await Promise.all(
    due.map(async (b) => {
      if (!stations.has(b.stationId)) {
        const st = await prisma.seedlingStation.findUnique({ where: { id: b.stationId }, select: { name: true } });
        stations.set(b.stationId, { name: st?.name ?? null });
      }
      const stationName = stations.get(b.stationId)?.name ?? "the station";
      const dateStr = b.scheduledPickupDate.toLocaleDateString();
      await notifyUser(
        b.userId,
        "reminder",
        `Pickup reminder: ${b.quantity} × ${b.seedlingType}`,
        `Reminder: Your seedlings (${b.quantity} × ${b.seedlingType}) will be ready for pickup at ${stationName} on ${dateStr}.`
      );
    })
  );

  await prisma.booking.updateMany({
    where: { id: { in: due.map((b) => b.id) } },
    data: { reminderSent: true },
  });

  return NextResponse.json({ sent: due.length });
}
