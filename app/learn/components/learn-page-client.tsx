"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BackButton } from "@/components/ui/back-button";
import { ContentFilterState, ContentItem } from "@/lib/content/types";
import { filterContent } from "@/lib/content/utils";
import { ContentGrid } from "./../components/content-grid";
import { SearchFilters } from "./../components/search-filters";
import { CategoryNav } from "./../components/category-nav";

interface LearnPageClientProps {
  items: ContentItem[];
  categories: string[];
}

const defaultFilter: ContentFilterState = {
  query: "",
  categories: [],
  sortBy: "newest",
};

export function LearnPageClient({ items, categories }: LearnPageClientProps) {
  const [filter, setFilter] = useState<ContentFilterState>(defaultFilter);

  const filtered = useMemo(() => filterContent(items, filter), [items, filter]);

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-emerald-800 via-emerald-600/40 to-sky-700/40 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-2"
        >
          <BackButton label="Back" fallbackHref="/dashboard" />
          <p className="text-sm text-emerald-100/70">Home / Learn</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-50">
            Learn: Environmental Knowledge Hub
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/80 max-w-2xl">
            Explore videos, guides, and resources on tree planting, water, soil, climate, and more.
          </p>
        </motion.header>

        <SearchFilters
          filter={filter}
          onChange={setFilter}
          categories={categories}
        />

        <CategoryNav
          categories={categories}
          activeCategories={filter.categories}
          onToggleCategory={(cat) =>
            setFilter((prev) => ({
              ...prev,
              categories: prev.categories.includes(cat)
                ? prev.categories.filter((c) => c !== cat)
                : [...prev.categories, cat],
            }))
          }
        />

        <ContentGrid items={filtered} />

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 text-center text-sm text-emerald-50/80"
          >
            No content matches your search yet. Try adjusting your filters or checking another category.
          </motion.div>
        )}
      </div>
    </div>
  );
}
