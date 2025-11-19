import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Prisma, $Enums } from "@/generated/prisma-client/client";
import { computeIndividualEcoBadge } from "@/lib/eco-score";

const PostTypeValues = ["EVENT", "ACHIEVEMENT"] as const;
type PostType = (typeof PostTypeValues)[number];

const CreatePostSchema = z.object({
  type: z.enum(PostTypeValues),
  title: z.string().min(3),
  description: z.string().min(3),
  mediaUrls: z.array(z.string().url()).max(5).default([]),
  location: z.string().optional(),
  eventDateTime: z.string().datetime().optional(),
  incentive: z.string().optional(),
  tags: z.array(z.string()).optional(), // TODO: clarify requirement before implementation
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const { userId } = await auth();
  const type = searchParams.get("type") as PostType | null;
  const county = searchParams.get("county");
  // const club = searchParams.get("club"); // TODO: clarify requirement before implementation

  const where: Prisma.PostWhereInput = {};
  if (type && (PostTypeValues as readonly string[]).includes(type)) {
    where.type = type as $Enums.PostType;
  }

  const posts = await prisma.post.findMany({
    where,
    include: {
      author: true,
      comments: { select: { id: true } },
      attendances: { select: { id: true, userId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const filtered = county
    ? posts.filter((p) => (p.author.county || "").toLowerCase() === county.toLowerCase())
    : posts;

  const dbUser = userId ? await prisma.user.findFirst({ where: { clerkId: userId } }) : null;

  const currentUserDbId = dbUser?.id || null;

  const uniqueAuthorIds = Array.from(new Set(filtered.map((p) => p.authorId)));
  const badgesEntries = await Promise.all(
    uniqueAuthorIds.map(async (id) => ({ id, badge: await computeIndividualEcoBadge(id) })),
  );
  const badgesByAuthorId: Record<string, Awaited<ReturnType<typeof computeIndividualEcoBadge>> | null> = {};
  for (const entry of badgesEntries) {
    badgesByAuthorId[entry.id] = entry.badge;
  }

  return NextResponse.json({
    currentUserId: currentUserDbId,
    posts: filtered.map((p) => {
      const attendeeCount = p.attendances.length;
      const hasJoinedForCurrentUser = !!currentUserDbId && p.attendances.some((a) => a.userId === currentUserDbId);
      return {
        ...p,
        commentCount: p.comments.length,
        attendeeCount,
        hasJoinedForCurrentUser,
        authorBadge: badgesByAuthorId[p.authorId] || null,
        comments: undefined,
        attendances: undefined,
      };
    }),
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const dbUser = await prisma.user.findFirst({ where: { clerkId: userId } });
  if (!dbUser) return NextResponse.json({ error: "Profile not found" }, { status: 400 });

  const { type, title, description, mediaUrls, location, eventDateTime, incentive } = parsed.data;

  // Only institutions/organizations/club-level accounts can create events.
  // Individuals can still create achievement posts and join events.
  if (type === "EVENT") {
    const isInstitutionOrOrg = dbUser.accountType === "INSTITUTION" || dbUser.accountType === "ORGANIZATION";
    const isClubLevel = dbUser.role === "CLUB_ADMIN" || dbUser.role === "SUPER_ADMIN";
    if (!isInstitutionOrOrg && !isClubLevel) {
      return NextResponse.json(
        { error: "Only institutions, organizations, or club admins can create events" },
        { status: 403 },
      );
    }
  }

  const post = await prisma.post.create({
    data: {
      authorId: dbUser.id,
      type,
      title,
      description,
      mediaUrls,
      location,
      eventDateTime: eventDateTime ? new Date(eventDateTime) : undefined,
      incentive,
    },
  });

  // TODO: notify followers/interested parties (in-app + email)
  return NextResponse.json({ post }, { status: 201 });
}
