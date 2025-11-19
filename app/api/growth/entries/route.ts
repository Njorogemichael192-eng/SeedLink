import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentDbUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const CreateGrowthEntrySchema = z.object({
  title: z.string().min(3),
  date: z.string().datetime().optional(),
  photoUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateGrowthEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  // Note: This stores growth entries as comments on a special growth tracking post
  // For now, we'll store them as a pseudo-record. In production, you might create a dedicated model.
  // For MVP, we're creating a hidden post for each user that tracks growth
  const { title, photoUrl } = parsed.data;
  const date = parsed.data.date ? new Date(parsed.data.date) : new Date();

  // Create or find growth tracking post for this user
  let growthPost = await prisma.post.findFirst({
    where: {
      authorId: user.id,
      title: "🌱 Growth Tracking Timeline",
    },
  });

  if (!growthPost) {
    growthPost = await prisma.post.create({
      data: {
        authorId: user.id,
        type: "ACHIEVEMENT",
        title: "🌱 Growth Tracking Timeline",
        description: "Personal growth tracking entries",
        mediaUrls: [],
      },
    });
  }

  // Store entry as a comment on the growth post
  const comment = await prisma.comment.create({
    data: {
      postId: growthPost.id,
      authorId: user.id,
      content: JSON.stringify({
        title,
        date: date.toISOString(),
        photoUrl: photoUrl || null,
      }),
    },
  });

  return NextResponse.json(
    {
      entry: {
        id: comment.id,
        title,
        date: date.toISOString(),
        photoUrl,
      },
    },
    { status: 201 }
  );
}

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get growth tracking post and all comments as entries
  const growthPost = await prisma.post.findFirst({
    where: {
      authorId: user.id,
      title: "🌱 Growth Tracking Timeline",
    },
    include: {
      comments: {
        orderBy: { createdAt: "desc" },
        take: 100,
      },
    },
  });

  if (!growthPost) {
    return NextResponse.json({ entries: [] });
  }

  const entries = growthPost.comments.map((comment) => {
    try {
      const data = JSON.parse(comment.content);
      return {
        id: comment.id,
        title: data.title || "",
        date: data.date || comment.createdAt.toISOString(),
        photoUrl: data.photoUrl || undefined,
      };
    } catch {
      return {
        id: comment.id,
        title: comment.content,
        date: comment.createdAt.toISOString(),
      };
    }
  });

  return NextResponse.json({ entries });
}
