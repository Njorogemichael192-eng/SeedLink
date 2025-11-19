import { Metadata } from "next";
import { MOCK_CONTENT_ITEMS, LEARN_CATEGORIES } from "@/lib/content/data";
import { LearnPageClient } from "./components/learn-page-client";
import { prisma } from "@/lib/prisma";
import type { ContentItem as UiContentItem } from "@/lib/content/types";

export const metadata: Metadata = {
  title: "Learn — SeedLink Environmental Hub",
  description: "Educational videos, guides, and resources for Kenya's Living Chain of Green.",
};

async function fetchContentItems(): Promise<UiContentItem[]> {
  const items = await prisma.contentItem.findMany({ orderBy: { publishDate: "desc" }, take: 100 });
  if (!items.length) return MOCK_CONTENT_ITEMS;
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

export default async function LearnPage() {
  const items = await fetchContentItems();
  return (
    <LearnPageClient items={items} categories={LEARN_CATEGORIES as unknown as string[]} />
  );
}
