"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ContentItem } from "@/lib/content/types";

interface ContentCardProps {
  item: ContentItem;
  onClick?: (item: ContentItem) => void;
}

const platformLabel: Record<string, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  article: "Article",
  pdf: "PDF",
};

const difficultyLabel: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function ContentCard({ item, onClick }: ContentCardProps) {
  const handleClick = () => {
    if (onClick) onClick(item);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-emerald-300/40 bg-white/10 bg-linear-to-br from-emerald-500/10 via-emerald-900/40 to-sky-800/40 backdrop-blur-xl shadow-lg hover:shadow-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-300"
    >
      <div className="relative h-40 w-full overflow-hidden bg-emerald-900/40">
        <Image
          src={item.thumbnailUrl}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-2 left-2 flex gap-2 text-xs">
          <span className="rounded-full bg-black/60 px-2 py-0.5 text-emerald-100 border border-emerald-400/60">
            {platformLabel[item.sourcePlatform] ?? "Resource"}
          </span>
          {item.duration && (
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-emerald-100 border border-emerald-400/60">
              {item.duration}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-wide text-emerald-100/80">
          {item.category.map((cat) => (
            <span
              key={cat}
              className="rounded-full bg-emerald-900/60 px-2 py-0.5 border border-emerald-400/40"
            >
              {cat}
            </span>
          ))}
        </div>
        <h3 className="text-sm font-semibold text-emerald-50 line-clamp-2">{item.title}</h3>
        <p className="text-xs text-emerald-100/80 line-clamp-3 flex-1">{item.description}</p>

        <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-100/70">
          <span>{item.author ?? "SeedLink Resource"}</span>
          <span>{difficultyLabel[item.difficulty] ?? item.difficulty}</span>
        </div>
      </div>

      <Link
        href={item.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        aria-label={`Open resource: ${item.title}`}
        className="absolute inset-0"
      />
    </motion.article>
  );
}
