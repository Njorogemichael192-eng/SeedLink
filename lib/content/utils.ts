import { ContentFilterState, ContentItem } from "./types";

export function filterContent(items: ContentItem[], filter: ContentFilterState): ContentItem[] {
  const query = filter.query.trim().toLowerCase();

  let result = items.filter((item) => {
    const matchesQuery =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.tags.some((tag) => tag.toLowerCase().includes(query));

    const matchesCategories =
      filter.categories.length === 0 || filter.categories.some((cat) => item.category.includes(cat));

    return matchesQuery && matchesCategories;
  });

  switch (filter.sortBy) {
    case "newest":
      result = [...result].sort((a, b) => Date.parse(b.publishDate) - Date.parse(a.publishDate));
      break;
    case "popular":
      // Placeholder: without analytics, just fall back to newest for now
      result = [...result].sort((a, b) => Date.parse(b.publishDate) - Date.parse(a.publishDate));
      break;
    case "relevance":
      // For now, treat as query-first then newest
      result = [...result].sort((a, b) => Date.parse(b.publishDate) - Date.parse(a.publishDate));
      break;
  }

  return result;
}

export function uniqueTags(items: ContentItem[]): string[] {
  const set = new Set<string>();
  items.forEach((item) => item.tags.forEach((tag) => set.add(tag)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
