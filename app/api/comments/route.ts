import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notifyUser } from "@/lib/notifications";

const CreateCommentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { postId },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ comments });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const user = await prisma.user.findFirst({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Profile not found" }, { status: 400 });

  const { postId, content } = parsed.data;
  const comment = await prisma.comment.create({
    data: { postId, authorId: user.id, content },
    include: { author: true },
  });
  // Notify post author of new comment (respect preferences)
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true, title: true } });
  if (post && post.authorId !== user.id) {
    await notifyUser(
      post.authorId,
      "comment",
      "New comment on your post",
      `You received a new comment on: ${post.title}`
    );
  }
  return NextResponse.json({ comment }, { status: 201 });
}
