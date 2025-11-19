import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_CONTENT_ITEMS } from "@/lib/content/data";
import type { ContentItem as UiContentItem } from "@/lib/content/types";

function mapDbToUi(items: Awaited<ReturnType<typeof prisma.contentItem.findMany>>): UiContentItem[] {
  return items.map((it) => ({
    id: it.id,
    title: it.title,
    description: it.description,
    thumbnailUrl: it.thumbnailUrl,
    sourceUrl: it.sourceUrl,
    sourcePlatform: it.sourcePlatform as UiContentItem["sourcePlatform"],
    category: it.categories ?? [],
    duration: it.duration ?? undefined,
    author: it.author ?? undefined,
    publishDate: it.publishDate.toISOString(),
    difficulty: it.difficulty as UiContentItem["difficulty"],
    tags: it.tags ?? [],
  }));
}

export async function GET() {
  const items = await prisma.contentItem.findMany({
    orderBy: { publishDate: "desc" },
    take: 100,
  });

  if (!items.length) {
    return NextResponse.json({ items: MOCK_CONTENT_ITEMS });
  }

  return NextResponse.json({ items: mapDbToUi(items) });
}
