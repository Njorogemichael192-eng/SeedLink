"use client";

import { ContentFilterState } from "@/lib/content/types";

interface SearchFiltersProps {
  filter: ContentFilterState;
  onChange: (value: ContentFilterState) => void;
  categories: string[];
}

export function SearchFilters({ filter, onChange, categories }: SearchFiltersProps) {
  return (
    <section
      aria-label="Search and filter learning content"
      className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="flex-1">
        <label className="block text-xs font-medium text-emerald-50/80 mb-1" htmlFor="learn-search">
          Search content
        </label>
        <input
          id="learn-search"
          type="search"
          value={filter.query}
          onChange={(e) => onChange({ ...filter, query: e.target.value })}
          className="w-full rounded-xl border border-white/30 bg-black/20 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-100/50 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          placeholder="Search by title, topic, or tags..."
        />
      </div>

      <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:items-end">
        <div>
          <label className="block text-xs font-medium text-emerald-50/80 mb-1" htmlFor="learn-category">
            Quick category
          </label>
          <select
            id="learn-category"
            className="rounded-xl border border-white/30 bg-black/20 px-3 py-2 text-sm text-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-300 min-w-[10rem]"
            value=""
            onChange={(e) => {
              const value = e.target.value;
              if (!value) return;
              onChange({
                ...filter,
                categories: filter.categories.includes(value)
                  ? filter.categories
                  : [...filter.categories, value],
              });
            }}
          >
            <option value="" className="bg-emerald-900">
              All categories
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-emerald-900">
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-emerald-50/80 mb-1" htmlFor="learn-sort">
            Sort by
          </label>
          <select
            id="learn-sort"
            className="rounded-xl border border-white/30 bg-black/20 px-3 py-2 text-sm text-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-300 min-w-[9rem]"
            value={filter.sortBy}
            onChange={(e) => onChange({ ...filter, sortBy: e.target.value as ContentFilterState["sortBy"] })}
          >
            <option value="newest">Newest</option>
            <option value="popular">Most popular</option>
            <option value="relevance">Relevance</option>
          </select>
        </div>
      </div>
    </section>
  );
}
