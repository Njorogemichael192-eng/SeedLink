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

  const items = await prisma.leaderboard.findMany({
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


