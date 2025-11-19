import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { AccountType, BookingStatus as BookingStatusEnum, InventoryStatus, BookingType } from "@/generated/prisma-client/client";
import { notifyUser } from "@/lib/notifications";

const BookingSchema = z.object({
  stationId: z.string().min(1),
  seedlingType: z.string().min(1),
  quantity: z.number().int().positive(),
  scheduledPickupDate: z.string().transform((s) => new Date(s)),
  bookingType: z.enum(["INDIVIDUAL", "INSTITUTION", "CLUB"]).default("INDIVIDUAL"),
  email: z.string().email().optional(),
  institutionName: z.string().optional(),
  institutionEmail: z.string().email().optional(),
  clubName: z.string().optional(),
  clubInstitutionName: z.string().optional(),
  clubEmail: z.string().email().optional(),
  specialRequest: z.string().max(2000).optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const list = await prisma.booking.findMany({
    where: { user: { clerkId: userId } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ bookings: list });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const { stationId, seedlingType, quantity, scheduledPickupDate, bookingType, email, institutionName, institutionEmail, clubName, clubInstitutionName, clubEmail, specialRequest } = parsed.data;

  const now = new Date();
  const minDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const maxDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  if (!(scheduledPickupDate >= minDate && scheduledPickupDate <= maxDate)) {
    return NextResponse.json({ error: "Pickup date must be at least 48h from now and within 14 days" }, { status: 400 });
  }

  // Fetch user with accountType and cooldown
  const user = await prisma.user.findFirst({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Profile not found" }, { status: 400 });
  if (user.cooldownUntil && user.cooldownUntil > now) {
    return NextResponse.json({ error: "You are on booking cooldown. Please try later." }, { status: 403 });
  }

  const bookingLimit = user.accountType === AccountType.INSTITUTION ? 50 : 5;

  // Count outstanding quantities
  const activeBookings = await prisma.booking.findMany({
    where: {
      userId: user.id,
      status: { in: [BookingStatusEnum.PENDING, BookingStatusEnum.CONFIRMED, BookingStatusEnum.READY_FOR_PICKUP] },
    },
    select: { quantity: true },
  });
  const currentTotal = activeBookings.reduce((sum, b) => sum + b.quantity, 0);
  if (currentTotal + quantity > bookingLimit) {
    return NextResponse.json({ error: `Booking limit exceeded (${bookingLimit}).` }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.seedlingInventory.findUnique({
        where: { stationId_seedlingType: { stationId, seedlingType } },
      });
      if (!inv || inv.quantityAvailable < quantity) {
        throw new Error("Insufficient stock");
      }

      // Deduct stock and adjust status
      const newQty = inv.quantityAvailable - quantity;
      await tx.seedlingInventory.update({
        where: { id: inv.id },
        data: {
          quantityAvailable: newQty,
          status:
            newQty <= 0
              ? InventoryStatus.OUT_OF_STOCK
              : newQty <= 10
              ? InventoryStatus.LOW_STOCK
              : InventoryStatus.AVAILABLE,
        },
      });

      const booking = await tx.booking.create({
        data: {
          userId: user.id,
          stationId,
          seedlingType,
          quantity,
          status: BookingStatusEnum.CONFIRMED,
          scheduledPickupDate,
          bookingType: bookingType as BookingType,
          email: bookingType === "INDIVIDUAL" ? email : null,
          institutionName: bookingType === "INSTITUTION" ? institutionName ?? null : null,
          institutionEmail: bookingType === "INSTITUTION" ? institutionEmail ?? null : null,
          clubName: bookingType === "CLUB" ? clubName ?? null : null,
          clubInstitutionName: bookingType === "CLUB" ? clubInstitutionName ?? null : null,
          clubEmail: bookingType === "CLUB" ? clubEmail ?? null : null,
          specialRequest: specialRequest ?? null,
        },
      });

      return booking;
    });

    // Notify user (in-app + email per preferences) outside the transaction to avoid timeouts
    try {
      const station = await prisma.seedlingStation.findUnique({ where: { id: stationId } });
      const dateStr = scheduledPickupDate.toLocaleDateString();
      await notifyUser(
        user.id,
        "booking",
        `Booking confirmed: ${quantity} × ${seedlingType}`,
        `Your booking for ${quantity} × ${seedlingType} at ${station?.name ?? "the station"} is confirmed for ${dateStr}.`
      );
    } catch (_e) {
      // Swallow notification errors so they don't affect booking success
    }

    return NextResponse.json({ booking: result }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Booking failed: " + (e as Error).message }, { status: 400 });
  }
}
