"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { FeedPost } from "@/components/dashboard/feed-client";
import { EditPostModal } from "@/components/posts/edit-post-modal";
import { EcoBadgePill } from "@/components/ui/eco-badge";

export function PostCard({ post, currentUserId }: { post: FeedPost; currentUserId?: string | null }) {
  const [openComments, setOpenComments] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [comments, setComments] = useState<
    Array<{ id: string; content: string; createdAt: string; author: { fullName: string | null; profilePictureUrl: string | null } }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const shareUrl = useMemo(() => `${window.location.origin}/posts/${post.id}`, [post.id]);

  useEffect(() => {
    if (!openComments) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/comments?postId=${post.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load comments");
        setComments(data.comments);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load comments");
      } finally {
        setLoading(false);
      }
    })();
  }, [openComments, post.id]);

  const eventDate = post.eventDateTime ? new Date(post.eventDateTime) : null;
  const isFutureEvent = post.type === "EVENT" && eventDate ? eventDate.getTime() > Date.now() : false;
  const isOwner = !!currentUserId && currentUserId === post.author.id;
  const canEdit = isOwner && post.type === "EVENT";
  const initialAttendeeCount = typeof post.attendeeCount === "number" ? post.attendeeCount : 0;
  const [attendeeCount, setAttendeeCount] = useState(initialAttendeeCount);
  const [hasJoined, setHasJoined] = useState(!!post.hasJoinedForCurrentUser);
  const canJoin = post.type === "EVENT" && !isOwner && isFutureEvent;
  const [showAttendees, setShowAttendees] = useState(false);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeesError, setAttendeesError] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<
    Array<{ id: string; fullName: string | null; county: string | null; phoneNumber: string | null }>
  >([]);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<
    "Spam" | "Scam" | "Inappropriate Content" | "False Information"
  >("Inappropriate Content");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const submitReport = async () => {
    if (isOwner || reportSubmitting) return;
    try {
      setReportSubmitting(true);
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          reportedUserId: post.author.id,
          reason: reportReason,
          details: reportDetails.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Failed to submit report", data);
        window.alert("Could not submit report. Please try again.");
        return;
      }
      window.alert("Thank you. Your report has been submitted to the moderators.");
      setShowReportModal(false);
      setReportDetails("");
    } catch (e) {
      console.error(e);
      window.alert("Could not submit report. Please try again.");
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/25 dark:bg-emerald-900/25 border border-white/20 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-white/40 overflow-hidden" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-emerald-950 dark:text-emerald-100 font-semibold">{post.title}</div>
              <div className="flex items-center gap-2 text-xs text-emerald-900/70 dark:text-emerald-100/70">
                <span>
                  {post.author.fullName || "Unknown"} {post.location ? `• ${post.location}` : ""}
                </span>
                <EcoBadgePill badge={post.authorBadge} size="sm" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {post.type === "EVENT" ? (
                <span className="px-2 py-1 rounded-full bg-white/40 dark:bg-emerald-900/40 border border-white/20">event</span>
              ) : (
                <span className="px-2 py-1 rounded-full bg-white/40 dark:bg-emerald-900/40 border border-white/20">achievement</span>
              )}
              {canEdit ? (
                <button onClick={() => setOpenEdit(true)} className="px-2 py-1 rounded bg-white/40 dark:bg-emerald-900/30">
                  edit
                </button>
              ) : null}
            </div>
          </div>

          {post.mediaUrls?.length ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {post.mediaUrls.slice(0, 4).map((u) => (
                <div key={u} className="relative aspect-video rounded-lg overflow-hidden bg-white/30">
                  <Image src={u} alt="media" fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}

          <p className="mt-3 text-sm text-emerald-900/90 dark:text-emerald-100/90">{post.description}</p>

          {post.type === "EVENT" && (post.eventDateTime || post.incentive || attendeeCount > 0) ? (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {post.eventDateTime ? (
                <span className="px-2 py-1 rounded-full bg-white/40 dark:bg-emerald-900/40 border border-white/20">
                  {new Date(post.eventDateTime).toLocaleString()}
                </span>
              ) : null}
              {post.incentive ? (
                <span className="px-2 py-1 rounded-full bg-white/40 dark:bg-emerald-900/40 border border-white/20">{post.incentive}</span>
              ) : null}
              {attendeeCount > 0 ? (
                <span className="px-2 py-1 rounded-full bg-white/40 dark:bg-emerald-900/40 border border-white/20">
                  {attendeeCount} {attendeeCount === 1 ? "person going" : "people going"}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-between text-sm">
            <button onClick={() => setOpenComments((v) => !v)} className="px-3 py-1 rounded bg-white/40 dark:bg-emerald-900/30">
              comments ({post.commentCount})
            </button>
            <div className="flex items-center gap-2">
              {post.type === "EVENT" && !isOwner ? (
                <button
                  type="button"
                  disabled={!canJoin || hasJoined}
                  onClick={async () => {
                    if (!canJoin || hasJoined) return;
                    try {
                      const res = await fetch(`/api/posts/${post.id}/join`, { method: "POST" });
                      let data: { attendeeCount?: number; error?: string } = {};
                      try {
                        data = await res.json();
                      } catch {
                        // Response body was empty or not JSON; keep data as {} and rely on res.ok
                      }
                      if (!res.ok) throw new Error(data.error || "Failed to join event");
                      setHasJoined(true);
                      if (typeof data.attendeeCount === "number") {
                        setAttendeeCount(data.attendeeCount);
                      } else {
                        setAttendeeCount((prev) => prev + 1);
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-60"
                >
                  {hasJoined ? "Joined" : isFutureEvent ? "Join event" : "Event passed"}
                </button>
              ) : null}
              {post.type === "EVENT" && isOwner && attendeeCount > 0 ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!showAttendees && attendees.length === 0 && !attendeesLoading) {
                      try {
                        setAttendeesLoading(true);
                        setAttendeesError(null);
                        const res = await fetch(`/api/posts/${post.id}/attendees`);
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || "Failed to load attendees");
                        setAttendees(data.attendees || []);
                      } catch (e) {
                        setAttendeesError(e instanceof Error ? e.message : "Failed to load attendees");
                      } finally {
                        setAttendeesLoading(false);
                      }
                    }
                    setShowAttendees((prev) => !prev);
                  }}
                  className="px-3 py-1 rounded bg-white/60 dark:bg-emerald-900/40 border border-white/40"
                >
                  {showAttendees ? "Hide attendees" : "View attendees"}
                </button>
              ) : null}
              {!isOwner ? (
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="px-3 py-1 rounded bg-white/40 dark:bg-emerald-900/30 text-red-700 dark:text-red-300 text-xs"
                >
                  Report post
                </button>
              ) : null}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded bg-white/40 dark:bg-emerald-900/30"
              >
                WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded bg-white/40 dark:bg-emerald-900/30"
              >
                Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded bg-white/40 dark:bg-emerald-900/30"
              >
                X
              </a>
            </div>
          </div>

          <AnimatePresence>
            {openComments ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="space-y-2">
                  <form
                    className="flex gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newComment.trim() || submitting) return;
                      try {
                        setSubmitting(true);
                        setError(null);
                        const res = await fetch("/api/comments", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ postId: post.id, content: newComment.trim() }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || "Failed to add comment");
                        const created = data.comment as {
                          id: string;
                          content: string;
                          createdAt: string;
                          author: { fullName: string | null; profilePictureUrl: string | null };
                        };
                        setComments((prev) => [...prev, created]);
                        setNewComment("");
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Failed to add comment");
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                  >
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 rounded-lg bg-white/70 dark:bg-emerald-900/60 border border-white/40 px-2 py-1 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !newComment.trim()}
                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-60"
                    >
                      {submitting ? "Posting..." : "Post"}
                    </button>
                  </form>

                  {loading ? (
                    <div className="text-xs text-emerald-900/70 dark:text-emerald-100/70">Loading comments...</div>
                  ) : error ? (
                    <div className="text-xs text-red-700">{error}</div>
                  ) : (
                    <div className="space-y-2">
                      {comments.map((c) => (
                        <div key={c.id} className="rounded-lg border border-white/20 bg-white/20 p-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs text-emerald-900/70 dark:text-emerald-100/70">
                              {c.author.fullName || "User"} — {new Date(c.createdAt).toLocaleString()}
                            </div>
                            <button
                              type="button"
                              onClick={() => setNewComment((prev) => (prev ? prev + " " : "") + `@${c.author.fullName || "user"} `)}
                              className="text-[10px] px-2 py-0.5 rounded bg-white/40 dark:bg-emerald-900/40"
                            >
                              Reply
                            </button>
                          </div>
                          <div className="text-sm text-emerald-950 dark:text-emerald-100">{c.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {post.type === "EVENT" && isOwner && showAttendees ? (
            <div className="mt-3 rounded-xl border border-white/30 bg-white/40 dark:bg-emerald-900/40 p-3 text-xs">
              {attendeesLoading ? (
                <div>Loading attendees...</div>
              ) : attendeesError ? (
                <div className="text-red-700">{attendeesError}</div>
              ) : attendees.length === 0 ? (
                <div>No attendees yet.</div>
              ) : (
                <ul className="space-y-1">
                  {attendees.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2">
                      <span>{a.fullName || "User"}</span>
                      <span className="text-emerald-900/70 dark:text-emerald-100/70">
                        {a.county || ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          <EditPostModal
            key={post.id}
            open={openEdit}
            onClose={() => setOpenEdit(false)}
            post={post}
          />

          <AnimatePresence>
            {showReportModal ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
              >
                <div className="max-w-sm w-full rounded-2xl bg-white text-emerald-900 p-4 shadow-xl">
                  <div className="font-semibold text-sm mb-2">Report this post</div>
                  <div className="space-y-2 text-xs">
                    <label className="block">
                      <span className="block mb-1">Reason</span>
                      <select
                        value={reportReason}
                        onChange={(e) =>
                          setReportReason(
                            e.target.value as
                              | "Spam"
                              | "Scam"
                              | "Inappropriate Content"
                              | "False Information",
                          )
                        }
                        className="w-full px-2 py-1 rounded border border-emerald-200 text-xs"
                      >
                        <option value="Spam">Spam</option>
                        <option value="Scam">Scam</option>
                        <option value="Inappropriate Content">Inappropriate Content</option>
                        <option value="False Information">False Information</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="block mb-1">Details (optional)</span>
                      <textarea
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                        rows={3}
                        className="w-full px-2 py-1 rounded border border-emerald-200 text-xs resize-none"
                        placeholder="Describe the issue briefly"
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        if (reportSubmitting) return;
                        setShowReportModal(false);
                        setReportDetails("");
                      }}
                      className="px-3 py-1 rounded bg-emerald-50 text-emerald-900 border border-emerald-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={reportSubmitting}
                      onClick={submitReport}
                      className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-60"
                    >
                      {reportSubmitting ? "Submitting..." : "Submit report"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
