import { ContentItem } from "./types";

export const LEARN_CATEGORIES = [
  "Tree Planting Techniques",
  "Soil Conservation",
  "Water Management",
  "Climate Change",
  "Sustainable Agriculture",
  "Wildlife Conservation",
  "Waste Management",
  "Renewable Energy",
] as const;

export const MOCK_CONTENT_ITEMS: ContentItem[] = [
  {
    id: "tree-planting-arid-areas",
    title: "Proper Tree Planting Techniques in Arid Areas",
    description:
      "Step-by-step guidance on how to plant and care for trees in Kenya's semi-arid and arid regions.",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    sourcePlatform: "youtube",
    category: ["Tree Planting Techniques"],
    duration: "12:45",
    author: "Kenya Forest Service",
    publishDate: new Date("2024-02-10").toISOString(),
    difficulty: "beginner",
    tags: ["tree planting", "arid", "Kenya", "drylands"],
  },
  {
    id: "soil-conservation-smallholder",
    title: "Soil Conservation Methods for Smallholder Farmers",
    description:
      "Practical soil conservation techniques that smallholder farmers in Kenya can implement with minimal cost.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1598966574511-7c9c1caa7330?auto=format&fit=crop&w=800&q=80",
    sourceUrl: "https://example.org/articles/soil-conservation-smallholder-farmers",
    sourcePlatform: "article",
    category: ["Soil Conservation", "Sustainable Agriculture"],
    author: "AgriLearn Africa",
    publishDate: new Date("2023-11-05").toISOString(),
    difficulty: "intermediate",
    tags: ["soil", "farming", "erosion control", "mulching"],
  },
  {
    id: "rainwater-harvesting-pdf",
    title: "Rainwater Harvesting Systems PDF",
    description:
      "Downloadable guide on designing and maintaining rainwater harvesting systems for schools and communities.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1524592714635-5f845df59232?auto=format&fit=crop&w=800&q=80",
    sourceUrl: "https://example.org/resources/rainwater-harvesting-systems.pdf",
    sourcePlatform: "pdf",
    category: ["Water Management"],
    author: "Water for All Kenya",
    publishDate: new Date("2023-08-20").toISOString(),
    difficulty: "beginner",
    tags: ["water", "rainwater harvesting", "schools", "infrastructure"],
  },
];
