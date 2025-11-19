"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedPost } from "@/components/dashboard/feed-client";
import { Modal } from "@/components/ui/modal";

export function EditPostModal({
  open,
  onClose,
  post,
}: {
  open: boolean;
  onClose: () => void;
  post: FeedPost;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(() => post.title);
  const [description, setDescription] = useState(() => post.description);
  const [location, setLocation] = useState(() => post.location || "");
  const [eventDateTime, setEventDateTime] = useState(() =>
    post.eventDateTime ? new Date(post.eventDateTime).toISOString().slice(0, 16) : ""
  );
  const [incentive, setIncentive] = useState(() => post.incentive || "");
  const [error, setError] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: async () => {
      setError(null);
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          location: location || null,
          eventDateTime: eventDateTime ? new Date(eventDateTime).toISOString() : undefined,
          incentive: incentive || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update post");
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["feed"] });
      onClose();
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Failed to update post"),
  });

  const disabled = update.isPending;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4">
        <div className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">Edit Event</div>
        {error ? (
          <div className="rounded border border-red-300/40 bg-red-100/40 p-2 text-red-800 text-sm">{error}</div>
        ) : null}

        <label className="space-y-1 block">
          <span className="text-sm">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
          />
        </label>
        <label className="space-y-1 block">
          <span className="text-sm">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
            rows={4}
          />
        </label>
        <label className="space-y-1 block">
          <span className="text-sm">Location</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1 block">
            <span className="text-sm">Event Date & Time</span>
            <input
              type="datetime-local"
              value={eventDateTime}
              onChange={(e) => setEventDateTime(e.target.value)}
              className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
            />
          </label>
          <label className="space-y-1 block">
            <span className="text-sm">Incentive (optional)</span>
            <input
              value={incentive}
              onChange={(e) => setIncentive(e.target.value)}
              className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
              placeholder="e.g., snacks, drinks, certificate"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/30" disabled={disabled}>
            Cancel
          </button>
          <button
            onClick={() => update.mutate()}
            disabled={disabled}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white shadow"
          >
            {disabled ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
