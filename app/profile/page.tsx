"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PostCard } from "@/components/posts/post-card";
import { BackButton } from "@/components/ui/back-button";
import type { FeedPost } from "@/components/dashboard/feed-client";
import type { EcoBadge } from "@/lib/eco-score";
import { EcoBadgePill } from "@/components/ui/eco-badge";

export default function ProfilePage() {
  const { data, refetch, isLoading } = useQuery<{ profile: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    county: string;
    profilePictureUrl: string;
    bioText: string;
    socials: { whatsapp?: string; facebook?: string };
    ecoBadge?: EcoBadge | null;
  }; posts: FeedPost[] }>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load profile");
      return json;
    },
  });

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [county, setCounty] = useState("");
  const [bioText, setBioText] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [facebook, setFacebook] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setFullName(data.profile.fullName || "");
    setPhoneNumber(data.profile.phoneNumber || "");
    setCounty(data.profile.county || "");
    setBioText(data.profile.bioText || "");
    setWhatsapp(data.profile.socials?.whatsapp || "");
    setFacebook(data.profile.socials?.facebook || "");
    setProfilePictureUrl(data.profile.profilePictureUrl || "");
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      setError(null);
      setSuccess(null);
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phoneNumber,
          county,
          profilePictureUrl: profilePictureUrl || undefined,
          bioText,
          socials: {
            whatsapp: whatsapp || undefined,
            facebook: facebook || undefined,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save profile");
      return json;
    },
    onSuccess: async () => {
      setSuccess("Saved");
      await refetch();
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Failed to save profile"),
  });

  const onPickAvatar = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("files", file);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      const url = (json.uploads?.[0]?.url as string) || "";
      setProfilePictureUrl(url);
      setSuccess("Photo uploaded");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen w-full p-6">
      <div className="mx-auto max-w-5xl mb-4">
        <BackButton label="Back" fallbackHref="/dashboard" />
      </div>
      <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4 rounded-2xl p-6 bg-emerald-800 border border-emerald-600 text-white shadow-lg">
          <div className="text-xl font-semibold mb-4">Profile</div>
          {error ? <div className="mb-2 rounded border border-red-300/40 bg-red-100/40 p-2 text-red-800 text-sm">{error}</div> : null}
          {success ? <div className="mb-2 rounded border border-emerald-300/40 bg-emerald-100/40 p-2 text-emerald-800 text-sm">{success}</div> : null}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Image
                src={profilePictureUrl || "https://placehold.co/128x128?text=Avatar"}
                alt="avatar"
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover bg-emerald-700"
                sizes="64px"
                priority
                unoptimized={!!profilePictureUrl && !profilePictureUrl.startsWith("https://placehold.co")}
              />
              <div className="flex flex-col gap-1">
                <div className="text-base font-medium truncate max-w-40">
                  {data?.profile.fullName || ""}
                </div>
                <EcoBadgePill badge={data?.profile.ecoBadge} />
              </div>
              <label className="text-sm">
                <span className="block mb-1">Change photo</span>
                <input type="file" accept="image/*" onChange={(e) => onPickAvatar((e.target.files && e.target.files[0]) || null)} disabled={uploading} />
              </label>
            </div>
            <label className="space-y-1 block">
              <span className="text-base font-medium">Full name</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full h-12 rounded-xl bg-emerald-700 border border-emerald-500 px-4 py-3 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/50" />
            </label>
            <label className="space-y-1 block">
              <span className="text-base font-medium">Phone</span>
              <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full h-12 rounded-xl bg-emerald-700 border border-emerald-500 px-4 py-3 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/50" />
            </label>
            <label className="space-y-1 block">
              <span className="text-base font-medium">County</span>
              <input value={county} onChange={(e) => setCounty(e.target.value)} className="w-full h-12 rounded-xl bg-emerald-700 border border-emerald-500 px-4 py-3 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/50" />
            </label>
            <label className="space-y-1 block">
              <span className="text-base font-medium">About</span>
              <textarea value={bioText} onChange={(e) => setBioText(e.target.value)} className="w-full rounded-xl bg-emerald-700 border border-emerald-500 px-4 py-3 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 min-h-32" rows={5} />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1 block">
                <span className="text-base font-medium">WhatsApp (optional)</span>
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="https://wa.me/2547..." className="w-full h-12 rounded-xl bg-emerald-700 border border-emerald-500 px-4 py-3 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/50" />
              </label>
              <label className="space-y-1 block">
                <span className="text-base font-medium">Facebook (optional)</span>
                <input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/.." className="w-full h-12 rounded-xl bg-emerald-700 border border-emerald-500 px-4 py-3 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/50" />
              </label>
            </div>
            <div className="flex justify-end">
              <button onClick={() => save.mutate()} disabled={save.isPending} className="px-4 py-2 rounded-lg bg-emerald-600 text-white shadow">
                {save.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 space-y-3">
          <div className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">Your Posts</div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl backdrop-blur-xl bg-white/25 border border-white/20" />
              ))}
            </div>
          ) : (
            (data?.posts || []).map((p) => (
              <PostCard key={p.id} post={p} currentUserId={data?.profile.id} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
