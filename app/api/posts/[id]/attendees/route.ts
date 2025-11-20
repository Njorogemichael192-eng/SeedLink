import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  if (post.authorId !== dbUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const attendances = await prisma.postAttendance.findMany({
    where: { postId: post.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  const attendees = attendances.map((a) => ({
    id: a.user.id,
    fullName: a.user.fullName,
    county: a.user.county,
    phoneNumber: a.user.phoneNumber,
  }));

  return NextResponse.json({ attendees });
}
