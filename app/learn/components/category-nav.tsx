"use client";

interface CategoryNavProps {
  categories: string[];
  activeCategories: string[];
  onToggleCategory: (category: string) => void;
}

export function CategoryNav({ categories, activeCategories, onToggleCategory }: CategoryNavProps) {
  return (
    <nav aria-label="Browse by category" className="overflow-x-auto">
      <ul className="flex gap-2 pb-1">
        {categories.map((cat) => {
          const active = activeCategories.includes(cat);
          return (
            <li key={cat}>
              <button
                type="button"
                onClick={() => onToggleCategory(cat)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900 ${
                  active
                    ? "bg-emerald-500 text-emerald-950 border-emerald-200"
                    : "bg-black/30 text-emerald-50 border-emerald-400/40 hover:bg-emerald-700/40"
                }`}
              >
                {cat}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
