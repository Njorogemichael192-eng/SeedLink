import { prisma } from "@/lib/prisma";

export type EcoTier = "NONE" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";

export type EcoBadgeKind = "INDIVIDUAL" | "CLUB";

export interface EcoBadge {
  kind: EcoBadgeKind;
  year: number;
  tier: EcoTier;
  title: string;
}

function getCurrentYearRange() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0));
  return { year, start, end };
}

export async function computeIndividualEcoBadge(userId: string): Promise<EcoBadge | null> {
  const { year, start, end } = getCurrentYearRange();

  const [bookings, posts, attendances] = await Promise.all([
    prisma.booking.aggregate({
      _sum: { quantity: true },
      where: {
        userId,
        status: "COMPLETED",
        completedAt: { gte: start, lt: end },
        bookingType: "INDIVIDUAL",
      },
    }),
    prisma.post.count({
      where: {
        authorId: userId,
        createdAt: { gte: start, lt: end },
      },
    }),
    prisma.eventAttendance.count({
      where: {
        userId,
        checkedInAt: { not: null, gte: start, lt: end },
      },
    }),
  ]);

  const trees = bookings._sum.quantity || 0;
  const postsCount = posts;
  const eventsJoined = attendances;

  const ecoScore = trees * 1 + postsCount * 5 + eventsJoined * 10;

  const { tier, title } = mapIndividualScoreToTier(ecoScore);
  if (tier === "NONE") return null;

  return { kind: "INDIVIDUAL", year, tier, title };
}

export async function computeClubEcoBadgeFromMetrics(args: {
  seedlingsPlanted: number;
  postsCreated: number;
  eventsHosted: number;
  participation: number;
}): Promise<EcoBadge | null> {
  const { year } = getCurrentYearRange();

  const ecoScore =
    args.seedlingsPlanted * 1 +
    args.postsCreated * 5 +
    args.eventsHosted * 25 +
    args.participation * 10;

  const { tier, title } = mapClubScoreToTier(ecoScore);
  if (tier === "NONE") return null;

  return { kind: "CLUB", year, tier, title };
}

function mapIndividualScoreToTier(score: number): { tier: EcoTier; title: string } {
  if (score >= 1200) return { tier: "DIAMOND", title: "Eco Vanguard" };
  if (score >= 700) return { tier: "PLATINUM", title: "Earth Steward" };
  if (score >= 350) return { tier: "GOLD", title: "Nature Guardian" };
  if (score >= 150) return { tier: "SILVER", title: "Green Pathfinder" };
  if (score >= 50) return { tier: "BRONZE", title: "Eco Initiate" };
  return { tier: "NONE", title: "" };
}

function mapClubScoreToTier(score: number): { tier: EcoTier; title: string } {
  if (score >= 2500) return { tier: "DIAMOND", title: "Guardians of the Land" };
  if (score >= 1500) return { tier: "PLATINUM", title: "Earth Conservators" };
  if (score >= 900) return { tier: "GOLD", title: "Forest Alliance" };
  if (score >= 450) return { tier: "SILVER", title: "Green Collective" };
  if (score >= 150) return { tier: "BRONZE", title: "Eco Club Novice" };
  return { tier: "NONE", title: "" };
}
