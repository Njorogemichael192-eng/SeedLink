"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BackButton } from "@/components/ui/back-button";
import { EcoBadgePill } from "@/components/ui/eco-badge";
import type { EcoBadge } from "@/lib/eco-score";

export default function LeaderboardsPage() {
  type Scope = "GLOBAL" | "COUNTY" | "INSTITUTION";
  const [scope, setScope] = useState<Scope>("GLOBAL");
  const [filter, setFilter] = useState("");
  const [entries, setEntries] = useState<Array<{ rank: number; name: string; postsCreated: number; seedlingsPlanted: number; eventsHosted: number; participation: number; ecoBadge?: EcoBadge | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ scope });
        if (scope === "COUNTY" && filter) params.set("county", filter);
        if (scope === "INSTITUTION" && filter) params.set("clubId", filter);
        const res = await fetch(`/api/leaderboards?${params.toString()}`, { signal: controller.signal });
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (active) setEntries(data.entries || []);
        } else {
          if (active) setEntries([]);
        }
      } catch (err: unknown) {
        const isAbort = err instanceof DOMException && err.name === "AbortError";
        if (!isAbort) {
          console.error(err);
          if (active) setEntries([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [scope, filter]);

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-emerald-800 via-emerald-600/40 to-sky-700/40 p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <BackButton label="Back" fallbackHref="/dashboard" />
        <h1 className="text-2xl font-bold uppercase tracking-wide text-emerald-100">(Leaderboards)</h1>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl backdrop-blur-xl bg-white/30 dark:bg-emerald-900/30 border border-white/20 p-3">
          <div className="flex gap-2">
            {(["GLOBAL", "COUNTY", "INSTITUTION"] as Scope[]).map((s) => (
              <button key={s} onClick={() => setScope(s)} className={`px-3 py-1 rounded-full text-sm ${scope === s ? "bg-emerald-600 text-white" : "bg-white/40 dark:bg-emerald-900/30"}`}>
                {s.toLowerCase()}
              </button>
            ))}
          </div>
          {scope !== "GLOBAL" ? (
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={scope === "COUNTY" ? "County name" : "Institution (club) ID"}
              className="px-3 py-1 rounded-full text-sm bg-white/60 dark:bg-emerald-900/50 border border-white/30"
            />
          ) : null}
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 rounded-2xl backdrop-blur-xl bg-white/25 border border-white/20" />
              ))}
            </div>
          ) : (
            entries.map((e) => (
              <motion.div key={e.rank} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-2xl backdrop-blur-xl bg-white/25 border border-white/20 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-600 text-white grid place-items-center font-bold">{e.rank}</div>
                  <div>
                    <div className="flex flex-col gap-0.5">
                      <div className="font-semibold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                        <span>{e.name}</span>
                        <EcoBadgePill badge={e.ecoBadge} size="sm" />
                      </div>
                      <div className="text-xs text-emerald-900/70 dark:text-emerald-100/70">
                        posts {e.postsCreated} • seedlings {e.seedlingsPlanted} • events {e.eventsHosted} • participation {e.participation}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-amber-400/80 text-emerald-950 text-xs font-medium shadow">Top 10 — {new Date().toLocaleString(undefined, { month: "long" })}</div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
