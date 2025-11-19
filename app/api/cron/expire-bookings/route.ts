import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import { notifyUser } from "@/lib/notifications";

export async function POST() {
  const now = new Date();
  const graceHours = Math.max(0, Number(process.env.BOOKING_EXPIRE_GRACE_HOURS || 24));
  const threshold = new Date(now.getTime() - graceHours * 60 * 60 * 1000);

  const candidates = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      scheduledPickupDate: { lt: threshold },
    },
    select: { id: true, userId: true, stationId: true, seedlingType: true, quantity: true },
  });

  let expired = 0;
  for (const b of candidates) {
    await prisma.$transaction(async (tx) => {
      // expire booking
      await tx.booking.update({ where: { id: b.id }, data: { status: "EXPIRED" } });

      // restore stock
      const inv = await tx.seedlingInventory.findUnique({
        where: { stationId_seedlingType: { stationId: b.stationId, seedlingType: b.seedlingType } },
      });
      if (inv) {
        const newQty = inv.quantityAvailable + b.quantity;
        await tx.seedlingInventory.update({
          where: { id: inv.id },
          data: {
            quantityAvailable: newQty,
            status:
              newQty <= 0
                ? "OUT_OF_STOCK"
                : newQty <= 10
                ? "LOW_STOCK"
                : "AVAILABLE",
          },
        });
      }

      // apply cooldown: 31 days from now (configurable later if needed)
      await tx.user.update({ where: { id: b.userId }, data: { cooldownUntil: addDays(now, 31) } });
    });
    // Notify user after transaction completes
    await notifyUser(
      b.userId,
      "booking",
      "Booking expired",
      `Your booking for ${b.quantity} × ${b.seedlingType} has expired and stock was returned to the station.`
    );
    expired++;
  }

  return NextResponse.json({ expired });
}
