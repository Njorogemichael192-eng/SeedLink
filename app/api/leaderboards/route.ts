import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma-client/client";
import { ScopeType } from "@/generated/prisma-client/enums";
import { computeClubEcoBadgeFromMetrics } from "@/lib/eco-score";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = (searchParams.get("scope") || "GLOBAL").toUpperCase() as
    | "GLOBAL"
    | "COUNTY"
    | "INSTITUTION";
  const county = searchParams.get("county") || undefined;
  const clubId = searchParams.get("clubId") || undefined;

  const now = new Date();
  const month = Number(searchParams.get("month") || now.getMonth() + 1);
  const year = Number(searchParams.get("year") || now.getFullYear());

  // First try to get pre-computed leaderboard data
  const where: Prisma.LeaderboardWhereInput = { periodMonth: month, periodYear: year };
  if (scope === "GLOBAL") {
    where.scopeType = ScopeType.GLOBAL;
  } else if (scope === "COUNTY") {
    where.scopeType = ScopeType.COUNTY;
    if (county) where.scopeCounty = county;
  } else if (scope === "INSTITUTION") {
    where.scopeType = ScopeType.INSTITUTION;
    if (clubId) where.scopeClubId = clubId;
  }

  let items = await prisma.leaderboard.findMany({
    where,
    include: { club: true },
    orderBy: [
      { seedlingsPlanted: "desc" },
      { postsCreated: "desc" },
      { eventsHosted: "desc" },
      { participation: "desc" },
    ],
    take: 10,
  });

  // If no pre-computed data, compute live data from database
  if (!items.length) {
    const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    if (scope === "GLOBAL") {
      // Compute global scores
      const postCount = await prisma.post.count({
        where: { createdAt: { gte: monthStart, lt: monthEnd } },
      });
      const seedlingCount = await prisma.booking.aggregate({
        _sum: { quantity: true },
        where: { status: "COMPLETED", completedAt: { gte: monthStart, lt: monthEnd } },
      });
      const eventCount = await prisma.event.count({
        where: { eventDateTime: { gte: monthStart, lt: monthEnd } },
      });
      const participationCount = await prisma.eventAttendance.count({
        where: { status: "ATTENDED", checkedInAt: { gte: monthStart, lt: monthEnd } },
      });

      const results = [
        {
          rank: 1,
          name: "Global",
          postsCreated: postCount,
          seedlingsPlanted: seedlingCount._sum.quantity || 0,
          eventsHosted: eventCount,
          participation: participationCount,
          ecoBadge: null,
        },
      ];
      return NextResponse.json({ entries: results });
    } else if (scope === "COUNTY" && county) {
      // County-specific scores
      const users = await prisma.user.findMany({
        where: { county: { equals: county, mode: "insensitive" } },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      const postCount = await prisma.post.count({
        where: { authorId: { in: userIds }, createdAt: { gte: monthStart, lt: monthEnd } },
      });
      const seedlingCount = await prisma.booking.aggregate({
        _sum: { quantity: true },
        where: {
          userId: { in: userIds },
          status: "COMPLETED",
          completedAt: { gte: monthStart, lt: monthEnd },
        },
      });
      const eventCount = await prisma.event.count({
        where: {
          creatorId: { in: userIds },
          eventDateTime: { gte: monthStart, lt: monthEnd },
        },
      });
      const participationCount = await prisma.eventAttendance.count({
        where: {
          userId: { in: userIds },
          status: "ATTENDED",
          checkedInAt: { gte: monthStart, lt: monthEnd },
        },
      });

      const results = [
        {
          rank: 1,
          name: county,
          postsCreated: postCount,
          seedlingsPlanted: seedlingCount._sum.quantity || 0,
          eventsHosted: eventCount,
          participation: participationCount,
          ecoBadge: null,
        },
      ];
      return NextResponse.json({ entries: results });
    } else if (scope === "INSTITUTION" && clubId) {
      // Club-specific scores
      const club = await prisma.club.findUnique({ where: { id: clubId } });
      if (!club) return NextResponse.json({ entries: [] });

      const postCount = await prisma.post.count({
        where: {
          author: { associatedClubId: clubId },
          createdAt: { gte: monthStart, lt: monthEnd },
        },
      });
      const seedlingCount = await prisma.booking.aggregate({
        _sum: { quantity: true },
        where: {
          user: { associatedClubId: clubId },
          status: "COMPLETED",
          completedAt: { gte: monthStart, lt: monthEnd },
        },
      });
      const eventCount = await prisma.event.count({
        where: { clubId, eventDateTime: { gte: monthStart, lt: monthEnd } },
      });
      const participationCount = await prisma.eventAttendance.count({
        where: {
          user: { associatedClubId: clubId },
          status: "ATTENDED",
          checkedInAt: { gte: monthStart, lt: monthEnd },
        },
      });

      const ecoBadge = await computeClubEcoBadgeFromMetrics({
        seedlingsPlanted: seedlingCount._sum.quantity || 0,
        postsCreated: postCount,
        eventsHosted: eventCount,
        participation: participationCount,
      });

      const results = [
        {
          rank: 1,
          name: club.name,
          postsCreated: postCount,
          seedlingsPlanted: seedlingCount._sum.quantity || 0,
          eventsHosted: eventCount,
          participation: participationCount,
          ecoBadge,
        },
      ];
      return NextResponse.json({ entries: results });
    }

    return NextResponse.json({ entries: [] });
  }

  const results = await Promise.all(
    items.map(async (it, idx) => {
      const base = {
        rank: idx + 1,
        name:
          it.scopeType === "GLOBAL"
            ? "Global"
            : it.scopeType === "COUNTY"
            ? it.scopeCounty || "Unknown county"
            : it.club?.name || it.scopeClubId || "Institution",
        postsCreated: it.postsCreated,
        seedlingsPlanted: it.seedlingsPlanted,
        eventsHosted: it.eventsHosted,
        participation: it.participation,
      } as const;

      if (it.scopeType !== "INSTITUTION") {
        return { ...base, ecoBadge: null };
      }

      const ecoBadge = await computeClubEcoBadgeFromMetrics({
        seedlingsPlanted: it.seedlingsPlanted,
        postsCreated: it.postsCreated,
        eventsHosted: it.eventsHosted,
        participation: it.participation,
      });

      return { ...base, ecoBadge };
    }),
  );

  return NextResponse.json({ entries: results });
}


