import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireSuperAdmin();
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status ?? 403;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const { id } = await params;
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

  const data: Record<string, unknown> = {};
  if (typeof title === "string") data.title = title;
  if (typeof description === "string") data.description = description;
  if (typeof thumbnailUrl === "string") data.thumbnailUrl = thumbnailUrl;
  if (typeof sourceUrl === "string") data.sourceUrl = sourceUrl;
  if (typeof sourcePlatform === "string") data.sourcePlatform = sourcePlatform;
  if (Array.isArray(categories)) data.categories = { set: categories };
  if (typeof duration === "string" || duration === null) data.duration = duration ?? null;
  if (typeof author === "string" || author === null) data.author = author ?? null;
  if (typeof publishDate === "string") data.publishDate = new Date(publishDate);
  if (typeof difficulty === "string") data.difficulty = difficulty;
  if (Array.isArray(tags)) data.tags = { set: tags };

  const item = await prisma.contentItem.update({ where: { id }, data });
  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireSuperAdmin();
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status ?? 403;
    return NextResponse.json({ error: "Forbidden" }, { status });
  }

  const { id } = await params;
  await prisma.contentItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
