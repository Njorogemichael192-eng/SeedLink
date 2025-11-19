import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requireSuperAdmin();
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status ?? 403;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const items = await prisma.contentItem.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status ?? 403;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const body = await req.json().catch(() => ({}));
  const {
    title,
    description,
    thumbnailUrl,
    sourceUrl,
    sourcePlatform,
    categories,
    duration,
    author,
    publishDate,
    difficulty,
    tags,
  } = body || {};

  if (!title || !description || !thumbnailUrl || !sourceUrl || !sourcePlatform || !publishDate || !difficulty) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const item = await prisma.contentItem.create({
    data: {
      title,
      description,
      thumbnailUrl,
      sourceUrl,
      sourcePlatform,
      categories: Array.isArray(categories) ? { set: categories } : undefined,
      duration: duration || null,
      author: author || null,
      publishDate: new Date(publishDate),
      difficulty,
      tags: Array.isArray(tags) ? { set: tags } : undefined,
    },
  });

  return NextResponse.json({ item });
}
