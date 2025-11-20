import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: true,
      comments: {
        include: { author: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post, commentCount: post.comments.length });
}

const UpdatePostSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(3).optional(),
  location: z.string().optional().nullable(),
  eventDateTime: z.string().datetime().optional(),
  incentive: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findFirst({ where: { clerkId: userId } });
  if (!dbUser) return NextResponse.json({ error: "Profile not found" }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (post.authorId !== dbUser.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (post.type !== "EVENT")
    return NextResponse.json({ error: "Only events are editable" }, { status: 400 });

  // If there's an event date in the past, edits are not allowed
  if (post.eventDateTime && post.eventDateTime.getTime() <= Date.now()) {
    return NextResponse.json({ error: "Event has passed and cannot be edited" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = UpdatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const { title, description, location, eventDateTime, incentive } = parsed.data;

  const updated = await prisma.post.update({
    where: { id: params.id },
    data: {
      title: title ?? undefined,
      description: description ?? undefined,
      location: location === undefined ? undefined : location || null,
      eventDateTime: eventDateTime ? new Date(eventDateTime) : undefined,
      incentive: incentive === undefined ? undefined : incentive || null,
    },
  });

  return NextResponse.json({ post: updated });
}
