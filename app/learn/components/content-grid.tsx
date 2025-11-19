"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ContentItem } from "@/lib/content/types";
import { ContentCard } from "./content-card";

interface ContentGridProps {
  items: ContentItem[];
}

export function ContentGrid({ items }: ContentGridProps) {
  return (
    <section aria-label="Learning resources" className="mt-4">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={items.length}
          layout
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
