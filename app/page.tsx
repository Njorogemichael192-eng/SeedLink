"use client";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Calendar, MapPin, Gift } from "lucide-react";

type LandingEvent = {
  id: string;
  title: string;
  description: string;
  location?: string | null;
  eventDateTime?: string | null;
  incentive?: string | null;
  mediaUrls?: string[];
  author: {
    fullName: string | null;
  };
};

export default function Home() {
  const { openSignIn, openSignUp } = useClerk();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<LandingEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingEvents(true);
        const res = await fetch("/api/posts?type=EVENT");
        if (!res.ok) return;
        const data: {
          posts: Array<{
            id: string;
            title: string;
            description: string;
            location?: string | null;
            eventDateTime?: string | null;
            incentive?: string | null;
            mediaUrls?: string[];
            author: {
              fullName: string | null;
            };
          }>;
        } = await res.json();
        const mapped: LandingEvent[] = (data.posts || []).map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          location: p.location,
          eventDateTime: p.eventDateTime,
          incentive: p.incentive,
          mediaUrls: p.mediaUrls,
          author: p.author,
        }));
        setEvents(mapped);
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, []);

  const handleEventClick = () => {
    if (isSignedIn) {
      router.push("/dashboard");
    } else {
      openSignIn({ afterSignInUrl: "/dashboard", afterSignUpUrl: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-emerald-700 via-lime-500/30 to-sky-600/40 dark:from-emerald-900 dark:via-emerald-800/40 dark:to-sky-900/50">
      <div className="relative mx-auto max-w-6xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="backdrop-blur-xl bg-white/30 dark:bg-emerald-900/30 border border-white/20 rounded-3xl shadow-2xl p-10"
        >
          <div className="flex flex-col items-center text-center gap-6">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wide uppercase text-emerald-900 dark:text-emerald-100">
              (Join the Green Revolution)
            </h1>
            <p className="max-w-2xl text-emerald-900/80 dark:text-emerald-100/80 text-lg">
              A digital platform connecting people, seedlings, and forests through continuous community action.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => (isSignedIn ? router.push("/dashboard") : openSignIn({ afterSignInUrl: "/dashboard" }))}
                className="px-6 py-3 rounded-full bg-emerald-700 text-white shadow-lg hover:scale-105 transition-transform"
              >
                Get started
              </button>
              <button
                onClick={() => (isSignedIn ? router.push("/dashboard") : openSignUp({ afterSignUpUrl: "/onboarding" }))}
                className="px-6 py-3 rounded-full border border-emerald-700/40 text-emerald-900 dark:text-emerald-100 hover:bg-white/40"
              >
                Create account
              </button>
            </div>
          </div>
        </motion.div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-6">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingEvents && events.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl backdrop-blur-xl bg-white/25 dark:bg-emerald-900/25 border border-white/20 p-6 h-80 animate-pulse"
                />
              ))
            ) : events.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3 text-center text-emerald-900/80 dark:text-emerald-100/80 text-sm py-12">
                No upcoming events yet. <button onClick={() => isSignedIn ? router.push("/dashboard") : openSignIn()} className="underline">Sign in to create the first one.</button>
              </div>
            ) : (
              events.slice(0, 6).map((ev) => (
                <motion.button
                  key={ev.id}
                  type="button"
                  onClick={handleEventClick}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="text-left rounded-2xl backdrop-blur-xl bg-white/25 dark:bg-emerald-900/25 border border-white/20 overflow-hidden hover:scale-[1.02] transition-transform group"
                >
                  {/* Image */}
                  {ev.mediaUrls && ev.mediaUrls.length > 0 ? (
                    <div className="relative w-full h-40 overflow-hidden bg-gradient-to-br from-emerald-400 to-sky-500">
                      <Image
                        src={ev.mediaUrls[0]}
                        alt={ev.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center">
                      <span className="text-4xl">🌱</span>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <div className="text-xs uppercase tracking-wide text-emerald-900/70 dark:text-emerald-100/70">
                      Upcoming event
                    </div>
                    <div className="font-semibold text-emerald-950 dark:text-emerald-50 line-clamp-2">
                      {ev.title}
                    </div>
                    <p className="text-xs text-emerald-900/70 dark:text-emerald-100/70 line-clamp-2">
                      {ev.description}
                    </p>
                    
                    {/* Metadata */}
                    <div className="space-y-1 pt-2 border-t border-white/20">
                      {ev.eventDateTime && (
                        <div className="flex items-center gap-2 text-xs text-emerald-900/80 dark:text-emerald-100/80">
                          <Calendar className="w-3 h-3" />
                          {new Date(ev.eventDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {ev.location && (
                        <div className="flex items-center gap-2 text-xs text-emerald-900/80 dark:text-emerald-100/80 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      )}
                      {ev.incentive && (
                        <div className="flex items-center gap-2 text-xs text-emerald-900/80 dark:text-emerald-100/80">
                          <Gift className="w-3 h-3" />
                          {ev.incentive}
                        </div>
                      )}
                      {ev.author?.fullName && (
                        <div className="text-xs text-emerald-900/60 dark:text-emerald-100/60 pt-1">
                          By {ev.author.fullName}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
