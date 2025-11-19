export type ContentSourcePlatform = "youtube" | "vimeo" | "article" | "pdf";

export type ContentDifficulty = "beginner" | "intermediate" | "advanced";

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  sourceUrl: string;
  sourcePlatform: ContentSourcePlatform;
  category: string[];
  duration?: string;
  author?: string;
  publishDate: string;
  difficulty: ContentDifficulty;
  tags: string[];
}

export interface ContentFilterState {
  query: string;
  categories: string[];
  sortBy: "newest" | "popular" | "relevance";
}
