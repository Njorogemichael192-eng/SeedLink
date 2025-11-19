import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-helpers";
import { notifyUser } from "@/lib/notifications";
import { InventoryStatus } from "@/generated/prisma-client/client";

export async function GET() {
  try {
    await requireSuperAdmin();
  } catch (e: unknown) {
    const status = typeof (e as { status?: number })?.status === "number" ? (e as { status: number }).status : 403;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const stations = await prisma.seedlingStation.findMany({ include: { inventory: true }, orderBy: { name: "asc" } });
  return NextResponse.json({ stations });
}

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e: unknown) {
    const status = typeof (e as { status?: number })?.status === "number" ? (e as { status: number }).status : 403;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }
  const { name, location, contactPhone, initialInventory } = await req.json();
  if (!name || !location) return NextResponse.json({ error: "name and location required" }, { status: 400 });

  // Create station
  const station = await prisma.seedlingStation.create({ data: { name, location, contactPhone } });

  // Optionally seed initial inventory
  if (Array.isArray(initialInventory) && initialInventory.length > 0) {
    const toCreate = initialInventory
      .map((raw): { seedlingType: string; quantityAvailable: number; status: InventoryStatus } | null => {
        if (typeof raw !== "object" || raw === null) return null;
        const obj = raw as Record<string, unknown>;
        const st = obj["seedlingType"];
        if (typeof st !== "string") return null;
        const qtyNum = Math.max(0, Number(obj["quantityAvailable"] ?? 0));
        const status =
          qtyNum <= 0
            ? InventoryStatus.OUT_OF_STOCK
            : qtyNum <= 10
            ? InventoryStatus.LOW_STOCK
            : InventoryStatus.AVAILABLE;
        return { seedlingType: st, quantityAvailable: qtyNum, status };
      })
      .filter((x): x is { seedlingType: string; quantityAvailable: number; status: InventoryStatus } => x !== null)
      .map((x) => ({
        stationId: station.id,
        seedlingType: x.seedlingType,
        quantityAvailable: x.quantityAvailable,
        status: x.status,
      }));
    if (toCreate.length > 0) {
      await prisma.seedlingInventory.createMany({ data: toCreate, skipDuplicates: true });
    }
  }

  // Return station with inventory included
  const withInventory = await prisma.seedlingStation.findUnique({ where: { id: station.id }, include: { inventory: true } });
  return NextResponse.json({ station: withInventory }, { status: 201 });
}

export async function PATCH(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e: unknown) {
    const status = typeof (e as { status?: number })?.status === "number" ? (e as { status: number }).status : 403;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }
  const { stationId, seedlingType, quantityDelta, setQuantity } = await req.json();
  if (!stationId || !seedlingType) return NextResponse.json({ error: "stationId and seedlingType required" }, { status: 400 });

  const inv = await prisma.seedlingInventory.upsert({
    where: { stationId_seedlingType: { stationId, seedlingType } },
    create: { stationId, seedlingType, quantityAvailable: Math.max(0, setQuantity ?? quantityDelta ?? 0) },
    update: {
      quantityAvailable:
        setQuantity !== undefined
          ? Math.max(0, setQuantity)
          : { increment: Number(quantityDelta || 0) },
    },
  });

  const newQty = inv.quantityAvailable;
  const status =
    newQty <= 0
      ? InventoryStatus.OUT_OF_STOCK
      : newQty <= 10
      ? InventoryStatus.LOW_STOCK
      : InventoryStatus.AVAILABLE;
  const updated = await prisma.seedlingInventory.update({ where: { id: inv.id }, data: { status } });

  // If restocked (was zero before this PATCH and now > 0), notify subscribers
  // We cannot know the previous qty from upsert directly when create was used; this logic best-effort notifies when newQty > 0 and a previous row existed with 0
  // Fetch subscribers and notify, then clear them
  if (newQty > 0) {
    const subs = await prisma.restockSubscription.findMany({ where: { stationId, seedlingType } });
    if (subs.length > 0) {
      const station = await prisma.seedlingStation.findUnique({ where: { id: stationId } });
      const title = `Restocked: ${seedlingType}`;
      const body = `${seedlingType} is now available at ${station?.name ?? "the station"}.`;
      await Promise.all(subs.map((s: { userId: string }) => notifyUser(s.userId, "reminder", title, body)));
      await prisma.restockSubscription.deleteMany({ where: { stationId, seedlingType } });
    }
  }
  return NextResponse.json({ inventory: updated });
}
