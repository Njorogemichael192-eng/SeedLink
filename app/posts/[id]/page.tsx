"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PostCard } from "@/components/posts/post-card";
import { BackButton } from "@/components/ui/back-button";
import type { FeedPost } from "@/components/dashboard/feed-client";

export default function PublicPostPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/posts/${params.id}`);
      let data: { post?: any; commentCount?: number; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // Response body was empty or not JSON; keep data as {} and rely on res.ok
      }
      if (!res.ok || !data.post) {
        setError(data.error || "Not found");
        return;
      }
      const p = data.post;
      const mapped: FeedPost = {
        id: p.id,
        type: p.type,
        title: p.title,
        description: p.description,
        mediaUrls: p.mediaUrls || [],
        location: p.location,
        eventDateTime: p.eventDateTime,
        incentive: p.incentive,
        createdAt: p.createdAt,
        author: {
          id: p.author.id,
          fullName: p.author.fullName,
          profilePictureUrl: p.author.profilePictureUrl,
          county: p.author.county,
        },
        commentCount: data.commentCount || 0,
      };
      setPost(mapped);
    })();
  }, [params.id]);

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-emerald-800 via-emerald-600/40 to-sky-700/40 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4">
          <BackButton label="Back" fallbackHref="/dashboard" />
        </div>
        {error ? (
          <div className="rounded-xl border border-white/20 bg-white/20 p-4 text-red-800">{error}</div>
        ) : post ? (
          <PostCard post={post} />
        ) : (
          <div className="h-48 rounded-2xl backdrop-blur-xl bg-white/25 border border-white/20" />
        )}
      </div>
    </div>
  );
}
