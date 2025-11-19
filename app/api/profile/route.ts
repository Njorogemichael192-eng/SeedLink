import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { computeIndividualEcoBadge } from "@/lib/eco-score";

function parseBio(bio: string | null | undefined): { bioText: string; socials: { whatsapp?: string; facebook?: string } } {
  if (!bio) return { bioText: "", socials: {} };
  try {
    const parsed = JSON.parse(bio);
    if (parsed && typeof parsed === "object" && "bioText" in parsed) {
      const obj = parsed as { bioText?: unknown; socials?: unknown };
      const bioText = typeof obj.bioText === "string" ? obj.bioText : "";
      const socials = (obj.socials && typeof obj.socials === "object") ? (obj.socials as { whatsapp?: string; facebook?: string }) : {};
      return { bioText, socials };
    }
  } catch {}
  return { bioText: bio, socials: {} };
}

function serializeBio(input: { bioText: string; socials: { whatsapp?: string; facebook?: string } }): string {
  return JSON.stringify(input);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findFirst({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const ecoBadge = await computeIndividualEcoBadge(user.id);

  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
    include: {
      author: true,
      comments: { select: { id: true } },
      attendances: { select: { id: true, userId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const { bioText, socials } = parseBio(user.bio);

  return NextResponse.json({
    profile: {
      id: user.id,
      fullName: user.fullName || "",
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      county: user.county || "",
      profilePictureUrl: user.profilePictureUrl || "",
      bioText,
      socials,
      ecoBadge,
    },
    posts: posts.map((p) => ({
      id: p.id,
      type: p.type,
      title: p.title,
      description: p.description,
      mediaUrls: p.mediaUrls || [],
      location: p.location,
      eventDateTime: p.eventDateTime ? p.eventDateTime.toISOString() : null,
      incentive: p.incentive || null,
      createdAt: p.createdAt.toISOString(),
      author: {
        id: p.author.id,
        fullName: p.author.fullName,
        profilePictureUrl: p.author.profilePictureUrl,
        county: p.author.county,
      },
      commentCount: p.comments.length,
      attendeeCount: p.attendances.length,
      hasJoinedForCurrentUser: true,
    })),
  });
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    fullName,
    phoneNumber,
    county,
    profilePictureUrl,
    bioText,
    socials,
  }: {
    fullName?: string;
    phoneNumber?: string;
    county?: string;
    profilePictureUrl?: string;
    bioText?: string;
    socials?: { whatsapp?: string; facebook?: string };
  } = body || {};

  const user = await prisma.user.findFirst({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const nextBio = serializeBio({ bioText: bioText ?? parseBio(user.bio).bioText, socials: socials ?? parseBio(user.bio).socials });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      fullName: typeof fullName === "string" ? fullName : user.fullName,
      phoneNumber: typeof phoneNumber === "string" ? phoneNumber : user.phoneNumber,
      county: typeof county === "string" ? county : user.county,
      profilePictureUrl: typeof profilePictureUrl === "string" ? profilePictureUrl : user.profilePictureUrl,
      bio: nextBio,
    },
  });

  const { bioText: outBioText, socials: outSocials } = parseBio(updated.bio);

  return NextResponse.json({
    profile: {
      id: updated.id,
      fullName: updated.fullName || "",
      email: updated.email,
      phoneNumber: updated.phoneNumber || "",
      county: updated.county || "",
      profilePictureUrl: updated.profilePictureUrl || "",
      bioText: outBioText,
      socials: outSocials,
    },
  });
}
