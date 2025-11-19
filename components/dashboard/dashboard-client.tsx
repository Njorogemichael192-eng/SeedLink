"use client";
import { useState } from "react";
import { CreatePostModal } from "@/components/posts/create-post-modal";

export function DashboardClient() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-emerald-600 text-white shadow-xl hover:scale-105 transition-transform"
        aria-label="Create Post"
        onClick={() => setOpen(true)}
      >
        +
      </button>
      <CreatePostModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
