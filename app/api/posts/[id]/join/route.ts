import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findFirst({ where: { clerkId: userId } });
  if (!dbUser) {
    return NextResponse.json({ error: "Profile not found" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.type !== "EVENT") {
    return NextResponse.json({ error: "Only event posts can be joined" }, { status: 400 });
  }

  if (!post.eventDateTime || post.eventDateTime.getTime() <= Date.now()) {
    return NextResponse.json({ error: "Event has already passed" }, { status: 400 });
  }

  // Upsert attendance so the same user cannot join twice
  await prisma.postAttendance.upsert({
    where: { postId_userId: { postId: post.id, userId: dbUser.id } },
    create: { postId: post.id, userId: dbUser.id },
    update: {},
  });

  const attendeeCount = await prisma.postAttendance.count({ where: { postId: post.id } });

  return NextResponse.json({ attendeeCount }, { status: 200 });
}
