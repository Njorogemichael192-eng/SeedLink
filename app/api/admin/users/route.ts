import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-helpers";

// GET /api/admin/users
// Optional search via ?q= (matches name/email/club/institution)
export async function GET(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e: unknown) {
    const status = typeof (e as { status?: number })?.status === "number" ? (e as { status: number }).status : 403;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();

  const where = q
    ? {
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { clubName: { contains: q, mode: "insensitive" } },
          { institutionName: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ users });
}

// PATCH /api/admin/users
// Body: { id, role?, deactivate?, reactivate? }
export async function PATCH(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e: unknown) {
    const status = typeof (e as { status?: number })?.status === "number" ? (e as { status: number }).status : 403;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const body = await req.json().catch(() => ({}));
  const { id, role, deactivate, reactivate } = body ?? {};
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: Record<string, unknown> = {};

  if (typeof role === "string") {
    // Trust that frontend only sends valid Role enums
    data.role = role;
  }

  if (deactivate === true) {
    data.isVerified = false;
  }
  if (reactivate === true) {
    data.isVerified = true;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no changes requested" }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ user });
}
