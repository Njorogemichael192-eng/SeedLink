"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { PostCard } from "@/components/posts/post-card";
import type { EcoBadge } from "@/lib/eco-score";

export type FeedPost = {
  id: string;
  type: "EVENT" | "ACHIEVEMENT";
  title: string;
  description: string;
  mediaUrls: string[];
  location?: string | null;
  eventDateTime?: string | null;
  incentive?: string | null;
  createdAt: string;
  author: { id: string; fullName: string | null; profilePictureUrl: string | null; county: string | null };
  authorBadge?: EcoBadge | null;
  commentCount: number;
  attendeeCount?: number;
  hasJoinedForCurrentUser?: boolean;
};

export function FeedClient() {
  const [type, setType] = useState<"ALL" | "EVENT" | "ACHIEVEMENT">("ALL");
  const [county, setCounty] = useState("");

  const { data, isLoading } = useQuery<{ posts: FeedPost[]; currentUserId: string | null }>({
    queryKey: ["feed", type, county],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (type !== "ALL") qs.set("type", type);
      if (county) qs.set("county", county);
      const res = await fetch(`/api/posts?${qs.toString()}`);
      if (!res.ok) throw new Error("Failed to load feed");
      return res.json();
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl backdrop-blur-xl bg-white/30 dark:bg-emerald-900/30 border border-white/20 p-3">
        <div className="flex gap-2">
          {(["ALL", "EVENT", "ACHIEVEMENT"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1 rounded-full text-sm ${type === t ? "bg-emerald-600 text-white" : "bg-white/40 dark:bg-emerald-900/30"}`}
            >
              {t.toLowerCase()}
            </button>
          ))}
        </div>
        <input
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          placeholder="Filter by county"
          className="px-3 py-1 rounded-full text-sm bg-white/60 dark:bg-emerald-900/50 border border-white/30"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl backdrop-blur-xl bg-white/25 dark:bg-emerald-900/25 border border-white/20" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.posts?.map((p) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <PostCard post={p} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
