import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-helpers";
import { Prisma } from "@/generated/prisma-client/client";

function getMonthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0)); // exclusive
  return { start, end };
}

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status ?? 403;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const now = new Date();
  const body = await req.json().catch(() => ({}));
  const month = Number(body?.month || now.getUTCMonth() + 1);
  const year = Number(body?.year || now.getUTCFullYear());
  const { start, end } = getMonthRange(year, month);

  // PostsCreated by scope
  const posts = await prisma.post.findMany({
    where: { createdAt: { gte: start, lt: end } },
    select: { id: true, author: { select: { county: true, associatedClubId: true } } },
  });

  // SeedlingsPlanted from completed bookings
  const bookings = await prisma.booking.findMany({
    where: { status: "COMPLETED", completedAt: { gte: start, lt: end } },
    select: { quantity: true, user: { select: { county: true, associatedClubId: true } } },
  });

  // EventsHosted by creator/club within month
  const events = await prisma.event.findMany({
    where: { eventDateTime: { gte: start, lt: end } },
    select: { id: true, clubId: true, creator: { select: { county: true, associatedClubId: true } } },
  });

  // Participation from attendances (ATTENDED) within month
  const attends = await prisma.eventAttendance.findMany({
    where: { status: "ATTENDED", checkedInAt: { not: null, gte: start, lt: end } },
    select: { user: { select: { county: true, associatedClubId: true } } },
  });

  // Accumulators
  let globalPosts = 0,
    globalSeedlings = 0,
    globalEvents = 0,
    globalParticipation = 0;
  const countyAgg = new Map<string, { posts: number; seedlings: number; events: number; participation: number }>();
  const clubAgg = new Map<string, { posts: number; seedlings: number; events: number; participation: number }>();

  // Posts
  for (const p of posts) {
    globalPosts += 1;
    const county = (p.author.county || "").trim();
    if (county) countyAgg.set(county, { ...(countyAgg.get(county) || { posts: 0, seedlings: 0, events: 0, participation: 0 }), posts: (countyAgg.get(county)?.posts || 0) + 1 });
    const clubId = (p.author.associatedClubId || "").trim();
    if (clubId) clubAgg.set(clubId, { ...(clubAgg.get(clubId) || { posts: 0, seedlings: 0, events: 0, participation: 0 }), posts: (clubAgg.get(clubId)?.posts || 0) + 1 });
  }

  // Bookings
  for (const b of bookings) {
    globalSeedlings += b.quantity;
    const county = (b.user.county || "").trim();
    if (county) countyAgg.set(county, { ...(countyAgg.get(county) || { posts: 0, seedlings: 0, events: 0, participation: 0 }), seedlings: (countyAgg.get(county)?.seedlings || 0) + b.quantity });
    const clubId = (b.user.associatedClubId || "").trim();
    if (clubId) clubAgg.set(clubId, { ...(clubAgg.get(clubId) || { posts: 0, seedlings: 0, events: 0, participation: 0 }), seedlings: (clubAgg.get(clubId)?.seedlings || 0) + b.quantity });
  }

  // Events hosted
  for (const ev of events) {
    globalEvents += 1;
    const county = (ev.creator.county || "").trim();
    if (county) countyAgg.set(county, { ...(countyAgg.get(county) || { posts: 0, seedlings: 0, events: 0, participation: 0 }), events: (countyAgg.get(county)?.events || 0) + 1 });
    const clubId = (ev.clubId || ev.creator.associatedClubId || "").trim();
    if (clubId) clubAgg.set(clubId, { ...(clubAgg.get(clubId) || { posts: 0, seedlings: 0, events: 0, participation: 0 }), events: (clubAgg.get(clubId)?.events || 0) + 1 });
  }

  // Participation
  for (const at of attends) {
    globalParticipation += 1;
    const county = (at.user.county || "").trim();
    if (county) countyAgg.set(county, { ...(countyAgg.get(county) || { posts: 0, seedlings: 0, events: 0, participation: 0 }), participation: (countyAgg.get(county)?.participation || 0) + 1 });
    const clubId = (at.user.associatedClubId || "").trim();
    if (clubId) clubAgg.set(clubId, { ...(clubAgg.get(clubId) || { posts: 0, seedlings: 0, events: 0, participation: 0 }), participation: (clubAgg.get(clubId)?.participation || 0) + 1 });
  }

  // Upserts (manual to support NULLs in composite key)
  const ops: Prisma.PrismaPromise<unknown>[] = [];
  // Global row (scopeCounty = null, scopeClubId = null)
  ops.push((async () => {
    const existing = await prisma.leaderboard.findFirst({
      where: { scopeType: "GLOBAL", scopeCounty: null, scopeClubId: null, periodMonth: month, periodYear: year },
    });
    if (existing) {
      return prisma.leaderboard.update({
        where: { id: existing.id },
        data: { postsCreated: globalPosts, seedlingsPlanted: globalSeedlings, eventsHosted: globalEvents, participation: globalParticipation },
      });
    }
    return prisma.leaderboard.create({
      data: { scopeType: "GLOBAL", scopeCounty: null, scopeClubId: null, periodMonth: month, periodYear: year, postsCreated: globalPosts, seedlingsPlanted: globalSeedlings, eventsHosted: globalEvents, participation: globalParticipation },
    });
  })() as unknown as Prisma.PrismaPromise<unknown>);

  // County rows (scopeClubId = null)
  for (const [county, v] of countyAgg.entries()) {
    ops.push((async () => {
      const existing = await prisma.leaderboard.findFirst({
        where: { scopeType: "COUNTY", scopeCounty: county, scopeClubId: null, periodMonth: month, periodYear: year },
      });
      if (existing) {
        return prisma.leaderboard.update({
          where: { id: existing.id },
          data: { postsCreated: v.posts, seedlingsPlanted: v.seedlings, eventsHosted: v.events, participation: v.participation },
        });
      }
      return prisma.leaderboard.create({
        data: { scopeType: "COUNTY", scopeCounty: county, scopeClubId: null, periodMonth: month, periodYear: year, postsCreated: v.posts, seedlingsPlanted: v.seedlings, eventsHosted: v.events, participation: v.participation },
      });
    })() as unknown as Prisma.PrismaPromise<unknown>);
  }

  // Club rows (scopeCounty = null)
  for (const [clubId, v] of clubAgg.entries()) {
    ops.push((async () => {
      const existing = await prisma.leaderboard.findFirst({
        where: { scopeType: "INSTITUTION", scopeCounty: null, scopeClubId: clubId, periodMonth: month, periodYear: year },
      });
      if (existing) {
        return prisma.leaderboard.update({
          where: { id: existing.id },
          data: { postsCreated: v.posts, seedlingsPlanted: v.seedlings, eventsHosted: v.events, participation: v.participation },
        });
      }
      return prisma.leaderboard.create({
        data: { scopeType: "INSTITUTION", scopeCounty: null, scopeClubId: clubId, periodMonth: month, periodYear: year, postsCreated: v.posts, seedlingsPlanted: v.seedlings, eventsHosted: v.events, participation: v.participation },
      });
    })() as unknown as Prisma.PrismaPromise<unknown>);
  }

  await Promise.all(ops);

  return NextResponse.json({ ok: true, month, year, counts: { globalPosts, globalSeedlings, globalEvents, globalParticipation, county: countyAgg.size, club: clubAgg.size } });
}
