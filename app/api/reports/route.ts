import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { notifyUser } from "@/lib/notifications";

const ReportReason = ["Spam", "Scam", "Inappropriate Content", "False Information"] as const;

const CreateReportSchema = z.object({
  postId: z.string().optional(),
  reportedUserId: z.string().optional(),
  reason: z.enum(ReportReason),
  details: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findFirst({ where: { clerkId: userId } });
  if (!dbUser) return NextResponse.json({ error: "Profile not found" }, { status: 400 });

  const body = await req.json();
  const parsed = CreateReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const { postId, reportedUserId, reason, details } = parsed.data;
  if (!postId && !reportedUserId) {
    return NextResponse.json({ error: "postId or reportedUserId required" }, { status: 400 });
  }

  const report = await prisma.report.create({
    data: {
      postId: postId ?? null,
      userId: dbUser.id,
      reportedId: reportedUserId ?? null,
      reason: details ? `${reason}: ${details}` : reason,
      status: "PENDING",
    },
  });

  // Notify moderators (SUPER_ADMINs)
  const supers = await prisma.user.findMany({ where: { role: "SUPER_ADMIN" }, select: { id: true } });
  await Promise.allSettled(
    supers.map((u) =>
      notifyUser(
        u.id,
        "post",
        "New report submitted",
        `A new report was submitted (${reason}). Report ID: ${report.id}${postId ? `, Post ID: ${postId}` : ""}${reportedUserId ? `, Reported User ID: ${reportedUserId}` : ""}.`
      )
    )
  );
  return NextResponse.json({ report }, { status: 201 });
}
