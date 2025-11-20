"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { FeedPost } from "@/components/dashboard/feed-client";
import { EditPostModal } from "@/components/posts/edit-post-modal";
import { EcoBadgePill } from "@/components/ui/eco-badge";
import { MapPin, Users, Gift, Calendar, MessageCircle, Share2, Flag } from "lucide-react";

export function ContentCard({ post, currentUserId }: { post: FeedPost; currentUserId?: string | null }) {
  const [openComments, setOpenComments] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [comments, setComments] = useState<
    Array<{ id: string; content: string; createdAt: string; author: { fullName: string | null; profilePictureUrl: string | null } }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const shareUrl = useMemo(() => `${typeof window !== 'undefined' ? window.location.origin : ''}/posts/${post.id}`, [post.id]);

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/25 dark:bg-emerald-900/25 border border-white/20 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
    >
      {/* Header with Author Info */}
      <div className="border-b border-white/10 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Author Avatar */}
            <div className="relative h-12 w-12 flex-shrink-0 rounded-full overflow-hidden bg-white/40">
              {post.author.profilePictureUrl ? (
                <Image
                  src={post.author.profilePictureUrl}
                  alt={post.author.fullName || "Author"}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
                  {(post.author.fullName || "U")?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Author Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-emerald-950 dark:text-emerald-100">
                  {post.author.fullName || "Anonymous"}
                </h3>
                <EcoBadgePill badge={post.authorBadge} size="sm" />
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-900/70 dark:text-emerald-100/70">
                {post.author.county && (
                  <>
                    <MapPin className="w-3 h-3" />
                    <span>{post.author.county}</span>
                  </>
                )}
                <span>•</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Type Badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              post.type === "EVENT"
                ? "bg-blue-100/40 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                : "bg-emerald-100/40 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
            }`}>
              {post.type.toLowerCase()}
            </span>
            {canEdit && (
              <button
                onClick={() => setOpenEdit(true)}
                className="px-2 py-1 rounded text-xs bg-white/40 dark:bg-emerald-900/30 hover:bg-white/60 transition-colors"
              >
                edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Title & Description */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-emerald-950 dark:text-emerald-100 mb-2">
          {post.title}
        </h2>
        <p className="text-sm text-emerald-900/90 dark:text-emerald-100/90 leading-relaxed">
          {post.description}
        </p>
      </div>

      {/* Media Gallery */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="border-b border-white/10 bg-black/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
            {post.mediaUrls.slice(0, 4).map((url, idx) => (
              <div
                key={url}
                className={`relative aspect-video overflow-hidden bg-white/10 ${
                  post.mediaUrls.length === 1 ? "sm:col-span-2" : ""
                } ${post.mediaUrls.length === 3 && idx === 2 ? "sm:col-span-2" : ""}`}
              >
                <Image
                  src={url}
                  alt={`Media ${idx + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                {post.mediaUrls.length > 4 && idx === 3 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      +{post.mediaUrls.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Metadata */}
      {post.type === "EVENT" && (post.eventDateTime || post.incentive) && (
        <div className="border-b border-white/10 p-4 bg-white/5">
          <div className="space-y-2">
            {post.eventDateTime && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-emerald-900 dark:text-emerald-100">
                  {new Date(post.eventDateTime).toLocaleString()}
                </span>
              </div>
            )}
            {post.incentive && (
              <div className="flex items-center gap-3 text-sm">
                <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-emerald-900 dark:text-emerald-100">
                  {post.incentive}
                </span>
              </div>
            )}
            {post.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-emerald-900 dark:text-emerald-100">
                  {post.location}
                </span>
              </div>
            )}
            {attendeeCount > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-emerald-900 dark:text-emerald-100">
                  {attendeeCount} {attendeeCount === 1 ? "person" : "people"} attending
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 bg-white/5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={() => setOpenComments((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/40 dark:bg-emerald-900/30 hover:bg-white/60 transition-colors text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Comments ({post.commentCount})</span>
          </button>

          <div className="flex items-center gap-2">
            {post.type === "EVENT" && !isOwner && (
              <button
                type="button"
                disabled={!canJoin || hasJoined}
                onClick={async () => {
                  if (!canJoin || hasJoined) return;
                  try {
                    const res = await fetch(`/api/posts/${post.id}/join`, { method: "POST" });
                    let data: { attendeeCount?: number; error?: string } = {};
                    let fallbackText: string | null = null;
                    try {
                      data = await res.json();
                    } catch {
                      try {
                        fallbackText = await res.text();
                      } catch {
                        // ignore
                      }
                    }

                    if (!res.ok) {
                      const msg = data?.error || fallbackText || res.statusText || "Failed to join event";
                      console.error("Join event failed:", msg, { status: res.status });
                      setError(msg);
                      // show a quick alert for immediate feedback
                      try {
                        window?.alert(msg);
                      } catch {}
                      return;
                    }

                    setHasJoined(true);
                    if (typeof data.attendeeCount === "number") {
                      setAttendeeCount(data.attendeeCount);
                    } else {
                      setAttendeeCount((prev) => prev + 1);
                    }
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : "Failed to join event";
                    console.error(e);
                    setError(msg);
                    try {
                      window?.alert(msg);
                    } catch {}
                  }
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  hasJoined
                    ? "bg-emerald-600/60 text-white"
                    : canJoin
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "opacity-60 cursor-not-allowed bg-emerald-600 text-white"
                }`}
              >
                {hasJoined ? "✓ Joined" : isFutureEvent ? "Join event" : "Event passed"}
              </button>
            )}

            {post.type === "EVENT" && isOwner && attendeeCount > 0 && (
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
                className="px-3 py-2 rounded-lg bg-white/60 dark:bg-emerald-900/40 border border-white/40 text-sm hover:bg-white/80 transition-colors"
              >
                {showAttendees ? "Hide attendees" : "View attendees"}
              </button>
            )}

            {!isOwner && (
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/40 dark:bg-emerald-900/30 hover:bg-red-100/60 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 text-sm transition-colors"
              >
                <Flag className="w-4 h-4" />
                <span>Report</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1 bg-white/20 rounded-lg p-1">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on WhatsApp"
                className="px-2 py-1 rounded hover:bg-white/30 transition-colors"
              >
                <span className="text-xs">WhatsApp</span>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on Facebook"
                className="px-2 py-1 rounded hover:bg-white/30 transition-colors"
              >
                <span className="text-xs">Facebook</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on Twitter"
                className="px-2 py-1 rounded hover:bg-white/30 transition-colors"
              >
                <span className="text-xs">X</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {openComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 overflow-hidden"
          >
            <div className="p-4 space-y-3">
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
                  className="flex-1 rounded-lg bg-white/70 dark:bg-emerald-900/60 border border-white/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                >
                  {submitting ? "..." : "Post"}
                </button>
              </form>

              {loading ? (
                <div className="text-xs text-emerald-900/70 dark:text-emerald-100/70 py-4 text-center">
                  Loading comments...
                </div>
              ) : error ? (
                <div className="text-xs text-red-700 dark:text-red-400 py-2">
                  {error}
                </div>
              ) : comments.length === 0 ? (
                <div className="text-xs text-emerald-900/70 dark:text-emerald-100/70 py-4 text-center">
                  No comments yet. Be the first!
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {comments.map((c) => (
                    <div key={c.id} className="rounded-lg border border-white/20 bg-white/20 p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-emerald-900 dark:text-emerald-100">
                          {c.author.fullName || "User"}
                        </span>
                        <span className="text-xs text-emerald-900/70 dark:text-emerald-100/70">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-emerald-950 dark:text-emerald-100">
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendees Section */}
      {post.type === "EVENT" && isOwner && showAttendees && (
        <div className="border-t border-white/10 p-4 bg-white/5 max-h-64 overflow-y-auto">
          {attendeesLoading ? (
            <div className="text-xs text-center text-emerald-900/70 dark:text-emerald-100/70 py-4">
              Loading attendees...
            </div>
          ) : attendeesError ? (
            <div className="text-xs text-red-700 dark:text-red-400">{attendeesError}</div>
          ) : attendees.length === 0 ? (
            <div className="text-xs text-center text-emerald-900/70 dark:text-emerald-100/70 py-4">
              No attendees yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {attendees.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/10">
                  <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    {a.fullName || "User"}
                  </span>
                  {a.county && (
                    <span className="text-xs text-emerald-900/70 dark:text-emerald-100/70">
                      {a.county}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <EditPostModal
        key={post.id}
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        post={post}
      />

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
            onClick={() => !reportSubmitting && setShowReportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-sm w-full rounded-2xl bg-white dark:bg-emerald-900 text-emerald-900 dark:text-white p-6 shadow-xl"
            >
              <h2 className="font-semibold text-base mb-4">Report this post</h2>
              <div className="space-y-3">
                <label className="block">
                  <span className="block text-sm font-medium mb-2">Reason</span>
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
                    className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-emerald-800 text-emerald-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Spam">Spam</option>
                    <option value="Scam">Scam</option>
                    <option value="Inappropriate Content">Inappropriate Content</option>
                    <option value="False Information">False Information</option>
                  </select>
                </label>
                <label className="block">
                  <span className="block text-sm font-medium mb-2">Details (optional)</span>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-emerald-800 text-emerald-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Describe the issue briefly"
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (reportSubmitting) return;
                    setShowReportModal(false);
                    setReportDetails("");
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-800/50 text-emerald-900 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={reportSubmitting}
                  onClick={submitReport}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                >
                  {reportSubmitting ? "Submitting..." : "Submit report"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
