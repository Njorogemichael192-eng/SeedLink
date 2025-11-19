import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireSuperAdmin();
  } catch (e: unknown) {
    const status =
      typeof e === "object" && e !== null && "status" in e &&
      typeof (e as { status?: unknown }).status === "number"
        ? (e as { status?: number }).status!
        : 403;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const rawReports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      post: true,
      user: true,
    },
  });

  const reportedIds = Array.from(
    new Set(
      rawReports
        .map((r) => r.reportedId)
        .filter((id): id is string => typeof id === "string" && !!id),
    ),
  );

  const reportedUsers = reportedIds.length
    ? await prisma.user.findMany({ where: { id: { in: reportedIds } } })
    : [];
  const reportedMap = new Map<string, (typeof reportedUsers)[number]>();
  for (const u of reportedUsers) reportedMap.set(u.id, u);

  const reports = rawReports.map((r) => {
    const reportedUser = r.reportedId ? reportedMap.get(r.reportedId) : undefined;
    return {
      id: r.id,
      postId: r.postId,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
      postTitle: r.post ? r.post.title : null,
      reporter: {
        id: r.user.id,
        fullName: r.user.fullName,
        email: r.user.email,
      },
      reportedUser: reportedUser
        ? {
            id: reportedUser.id,
            fullName: reportedUser.fullName,
            email: reportedUser.email,
          }
        : null,
    };
  });

  return NextResponse.json({ reports });
}

export async function PATCH(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e: unknown) {
    const status =
      typeof e === "object" && e !== null && "status" in e &&
      typeof (e as { status?: unknown }).status === "number"
        ? (e as { status?: number }).status!
        : 403;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }
  const { id, action } = await req.json();
  if (!id || !action) return NextResponse.json({ error: "id and action required" }, { status: 400 });

  if (action === "resolve") {
    await prisma.report.update({ where: { id }, data: { status: "RESOLVED" } });
  } else if (action === "delete") {
    const rep = await prisma.report.findUnique({ where: { id } });
    if (rep?.postId) {
      await prisma.$transaction([
        prisma.comment.deleteMany({ where: { postId: rep.postId } }),
        prisma.post.delete({ where: { id: rep.postId } }),
        prisma.report.update({ where: { id }, data: { status: "RESOLVED" } }),
      ]);
    }
  } else if (action === "block_user") {
    const rep = await prisma.report.findUnique({ where: { id } });
    if (!rep?.reportedId) {
      return NextResponse.json({ error: "report has no reported user" }, { status: 400 });
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: rep.reportedId }, data: { isVerified: false } }),
      prisma.report.update({ where: { id }, data: { status: "RESOLVED" } }),
    ]);
  } else {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

