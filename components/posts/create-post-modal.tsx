"use client";

import { useState } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";


type PostType = "EVENT" | "ACHIEVEMENT";

export function CreatePostModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();

  const { data: me } = useQuery<{ accountType: string | null; role: string | null }>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/me");
      if (!res.ok) return { accountType: null, role: null };
      return res.json();
    },
  });

  const canCreateEvents = !!me && (
    me.accountType === "INSTITUTION" ||
    me.accountType === "ORGANIZATION" ||
    me.role === "CLUB_ADMIN" ||
    me.role === "SUPER_ADMIN"
  );

  const allowedTypes: PostType[] = canCreateEvents ? ["ACHIEVEMENT", "EVENT"] : ["ACHIEVEMENT"];

  const [type, setType] = useState<PostType>("ACHIEVEMENT");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("09:00");
  const [incentive, setIncentive] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetFormForType = () => {
    // Clear all shared fields so values from one type don't appear in the other
    setTitle("");
    setDescription("");
    setLocation("");
    setFiles([]);
    setError(null);

    // Clear event-specific fields as well
    setEventDate("");
    setEventTime("09:00");
    setIncentive("");
  };

  const uploadAndCreate = useMutation({
    mutationFn: async () => {
      let mediaUrls: string[] = [];
      if (files.length) {
        const form = new FormData();
        files.slice(0, 5).forEach((f) => form.append("files", f));
        const up = await fetch("/api/uploads", { method: "POST", body: form });
        const upJson = await up.json();
        if (!up.ok) throw new Error(upJson.error || "Upload failed");
        mediaUrls = upJson.uploads.map((u: { url: string }) => u.url);
      }

      // Build event datetime in ISO if applicable
      let eventDateTimeIso: string | undefined = undefined;
      if (type === "EVENT" && eventDate && eventTime) {
        const local = new Date(`${eventDate}T${eventTime}:00`);
        eventDateTimeIso = local.toISOString();
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          description,
          mediaUrls,
          location: location || undefined,
          eventDateTime: eventDateTimeIso,
          incentive: type === "EVENT" && incentive ? incentive : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create post");
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["feed"] });
      onClose();
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Failed to create post"),
  });

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        <div className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">Create Post</div>
        {error ? <div className="rounded border border-red-300/40 bg-red-100/40 p-2 text-red-800">{error}</div> : null}

        <div className="flex gap-2">
          {allowedTypes.map((t) => (
            <button
              key={t}
              onClick={() => {
                if (t !== type) {
                  resetFormForType();
                }
                setType(t);
              }}
              className={`px-3 py-1 rounded-full border ${type === t ? "bg-emerald-600 text-white" : "bg-white/40 dark:bg-emerald-900/30"}`}
            >
              {t.toLowerCase()}
            </button>
          ))}
        </div>

        <label className="space-y-1 block">
          <span className="text-sm">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2" />
        </label>
        <label className="space-y-1 block">
          <span className="text-sm">Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2" rows={4} />
        </label>
        <label className="space-y-1 block">
          <span className="text-sm">Location</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2" />
        </label>

        {type === "EVENT" ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1 block">
              <span className="text-sm">Event Date</span>
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-sm">Event Time</span>
              <select
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
              >
                {Array.from({ length: 24 }).map((_, h) => {
                  const t = `${String(h).padStart(2, "0")}:00`;
                  return (
                    <option key={t} value={t}>{t}</option>
                  );
                })}
              </select>
            </label>
            <label className="space-y-1 block sm:col-span-2">
              <span className="text-sm">Incentive (optional)</span>
              <input value={incentive} onChange={(e) => setIncentive(e.target.value)} placeholder="e.g., snacks, drinks, certificate" className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2" />
            </label>
          </motion.div>
        ) : null}


        <div
          className={`space-y-1 block border-2 border-dashed rounded-lg p-4 mb-2 transition-all ${dragActive ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-900/40' : 'border-white/30 bg-white/20 dark:bg-emerald-900/20'}`}
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
          onDrop={e => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files) {
              setFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).slice(0, 5));
            }
          }}
        >
          <span className="text-sm block mb-2">Images (up to 5)</span>
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            id="post-image-upload"
            onChange={e => setFiles(Array.from(e.target.files || []).filter(f => f.type.startsWith('image/')).slice(0, 5))}
          />
          <label htmlFor="post-image-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2 py-4">
            <span className="text-emerald-700 dark:text-emerald-200 font-medium">Drag & drop or click to upload</span>
            <span className="text-xs text-emerald-900/70 dark:text-emerald-100/70">Accepted: JPG, PNG, GIF (max 5 images)</span>
            <span className="px-3 py-1 rounded bg-emerald-600 text-white mt-2">Browse files</span>
          </label>
          {files.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {files.map((file, idx) => (
                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-white/30 flex items-center justify-center">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full px-2 py-0.5 text-xs"
                    onClick={e => {
                      e.stopPropagation();
                      setFiles(files.filter((_, i) => i !== idx));
                    }}
                  >Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/30">Cancel</button>
          <button onClick={() => uploadAndCreate.mutate()} disabled={uploadAndCreate.isPending} className="px-4 py-2 rounded-lg bg-emerald-600 text-white shadow">
            {uploadAndCreate.isPending ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
