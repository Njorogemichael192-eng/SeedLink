"use client";

import type { EcoBadge } from "@/lib/eco-score";

export function EcoBadgePill({ badge, size = "md" }: { badge: EcoBadge | null | undefined; size?: "sm" | "md" }) {
  if (!badge) return null;

  const tierColors: Record<string, string> = {
    BRONZE: "bg-amber-700/80 text-amber-50",
    SILVER: "bg-slate-300/90 text-slate-900",
    GOLD: "bg-amber-400/90 text-amber-950",
    PLATINUM: "bg-violet-500/90 text-violet-50",
    DIAMOND: "bg-sky-400/90 text-sky-950",
  };

  const iconByTier: Record<string, string> = {
    BRONZE: "🟤",
    SILVER: "⚪",
    GOLD: "🟡",
    PLATINUM: "🟣",
    DIAMOND: "🔷",
  };

  const base = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shadow";
  const sizeClass = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-0.5";
  const colorClass = tierColors[badge.tier] || "bg-emerald-700/80 text-emerald-50";
  const icon = iconByTier[badge.tier] || "";

  return (
    <span className={`${base} ${sizeClass} ${colorClass}`}>
      {icon && <span>{icon}</span>}
      <span className="truncate max-w-[10rem]">{badge.title}</span>
      <span className="opacity-80">· {badge.year}</span>
    </span>
  );
}
