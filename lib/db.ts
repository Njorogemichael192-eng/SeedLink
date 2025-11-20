import { prisma } from "@/lib/prisma";
import { BookingStatus, EventStatus } from "@/generated/prisma-client/client";
import bcrypt from "bcryptjs";

export async function getOrCreateUssdUserByPhone(phoneNumber: string, county?: string, name?: string, pinPlain?: string) {
  const normalized = normalizePhone(phoneNumber);
  const existing = await prisma.ussdUser.findUnique({ where: { phoneNumber: normalized } });
  if (existing) {
    if (!existing.county && county) {
      return prisma.ussdUser.update({ where: { id: existing.id }, data: { county } });
    }
    return existing;
  }
  const pinHash = pinPlain ? await bcrypt.hash(pinPlain, 10) : undefined;
  return prisma.ussdUser.create({ data: { phoneNumber: normalized, county, name, pinHash } });
}

export async function getUssdUserByPhone(phoneNumber: string) {
  const normalized = normalizePhone(phoneNumber);
  return prisma.ussdUser.findUnique({ where: { phoneNumber: normalized } });
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("254")) return `+${digits}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `+254${digits}`;
  if (digits.startsWith("+254")) return digits;
  return `+${digits}`;
}

export async function getActiveUssdSession(sessionId: string) {
  return prisma.ussdSession.findUnique({ where: { sessionId } });
}

export async function upsertUssdSession(params: {
  sessionId: string;
  phoneNumber: string;
  ussdUserId?: string | null;
  currentFlow?: string | null;
  currentStep?: string | null;
  data?: unknown;
  isActive?: boolean;
}) {
  const { sessionId, phoneNumber, ussdUserId, currentFlow, currentStep, data, isActive } = params;
  const now = new Date();
  return prisma.ussdSession.upsert({
    where: { sessionId },
    create: {
      sessionId,
      phoneNumber,
      ussdUserId: ussdUserId ?? null,
      currentFlow: currentFlow ?? null,
      currentStep: currentStep ?? null,
      data: data as any,
      isActive: isActive ?? true,
      lastInteraction: now,
    },
    update: {
      phoneNumber,
      ussdUserId: ussdUserId ?? null,
      currentFlow: currentFlow ?? null,
      currentStep: currentStep ?? null,
      data: data as any,
      isActive: isActive ?? true,
      lastInteraction: now,
    },
  });
}

export async function closeUssdSession(sessionId: string) {
  return prisma.ussdSession.update({ where: { sessionId }, data: { isActive: false } });
}

export async function cleanupExpiredUssdSessions(maxMinutes = 5) {
  const threshold = new Date(Date.now() - maxMinutes * 60 * 1000);
  return prisma.ussdSession.updateMany({
    where: { isActive: true, lastInteraction: { lt: threshold } },
    data: { isActive: false },
  });
}

export async function listStationsByCountyWithInventory(county: string) {
  return prisma.seedlingStation.findMany({
    where: { location: { contains: county, mode: "insensitive" } },
    include: { inventory: true },
    orderBy: { name: "asc" },
  });
}

export async function createUssdBookingWithInventoryCheck(params: {
  ussdUserId: string;
  stationId: string;
  seedlingType: string;
  quantity: number;
}) {
  const { ussdUserId, stationId, seedlingType, quantity } = params;
  return prisma.$transaction(async (tx) => {
    const inv = await tx.seedlingInventory.findUnique({
      where: { stationId_seedlingType: { stationId, seedlingType } },
    });
    if (!inv || inv.quantityAvailable < quantity) {
      throw new Error("Insufficient stock");
    }
    const newQty = inv.quantityAvailable - quantity;
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

    const booking = await tx.ussdBooking.create({
      data: {
        ussdUserId,
        stationId,
        seedlingType,
        quantity,
        status: BookingStatus.CONFIRMED,
        scheduledPickup: new Date(),
      },
    });

    return booking;
  });
}

export async function listUpcomingEventsByCounty(county: string) {
  const now = new Date();
  return prisma.event.findMany({
    where: {
      status: EventStatus.UPCOMING,
      eventDateTime: { gte: now },
      location: { contains: county, mode: "insensitive" },
    },
    orderBy: { eventDateTime: "asc" },
    take: 10,
  });
}

export async function createUssdEventRegistration(params: {
  ussdUserId: string;
  eventId: string;
}) {
  const { ussdUserId, eventId } = params;
  return prisma.ussdEventRegistration.upsert({
    where: { ussdUserId_eventId: { ussdUserId, eventId } },
    create: { ussdUserId, eventId },
    update: {},
  });
}
