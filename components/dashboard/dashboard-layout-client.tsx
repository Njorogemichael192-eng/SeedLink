"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { FeedClient } from "@/components/dashboard/feed-client";

interface UserProfile {
  accountType: string;
  fullName?: string;
}

function formatAccountType(type: string): string {
  const typeMap: Record<string, string> = {
    INDIVIDUAL: "Individual",
    INSTITUTION: "Institution / Club",
    ORGANIZATION: "Organization",
  };
  return typeMap[type] || type;
}

export function DashboardLayoutClient() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const displayName =
    user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress || "Account";

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) return;
        const data = (await res.json()) as { accountType: string | null; role: string | null };
        setAccountType(data.accountType || "INDIVIDUAL");
      } catch (err) {
        console.error("Failed to fetch account type:", err);
        setAccountType("INDIVIDUAL");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen w-full flex justify-center px-3 sm:px-4 py-4">
      <div className="w-full max-w-7xl">
        <div className="flex justify-end mb-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 text-emerald-900 shadow hover:bg-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-medium max-w-[8rem] truncate">{displayName}</span>
            </button>
            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-40 rounded-lg bg-white text-emerald-900 shadow-lg border border-emerald-100 z-10">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-emerald-50"
                >
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:gap-6 md:grid-cols-12">
          {/* Left sidebar: profile summary & navigation (hidden on very small screens) */}
          <motion.aside
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="hidden md:block md:col-span-4 lg:col-span-3 rounded-2xl p-4 bg-emerald-800 border border-emerald-600 text-white shadow-lg"
          >
            <div className="mb-3">
              <div className="text-xs uppercase tracking-wide text-emerald-200/80 mb-1">
                Welcome back
              </div>
              <div className="text-lg font-semibold truncate">{displayName}</div>
              <div className="text-xs text-emerald-200/80 mt-1">
                Account type: {loading ? "Loading..." : (accountType ?? "INDIVIDUAL").toLowerCase()}
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <Link
                href="/profile"
                className="block text-sm px-3 py-2 rounded-lg bg-emerald-700 border border-emerald-500 text-white hover:bg-emerald-600 transition"
              >
                View profile
              </Link>
              <Link
                href="/notifications"
                className="block text-sm px-3 py-2 rounded-lg bg-emerald-700 border border-emerald-500 text-white hover:bg-emerald-600 transition"
              >
                Notifications
              </Link>
            </div>
          </motion.aside>

          <motion.main
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="md:col-span-8 lg:col-span-6 space-y-4"
          >
            {/* Quick actions - full width on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link
                href="/seedlings"
                className="text-sm px-3 py-2 rounded-lg bg-white/30 dark:bg-emerald-900/30 border border-white/20 text-emerald-900 dark:text-emerald-100 hover:scale-105 transition"
              >
                Seedlings
              </Link>
              <Link
                href="/profile"
                className="text-sm px-3 py-2 rounded-lg bg-white/30 dark:bg-emerald-900/30 border border-white/20 text-emerald-900 dark:text-emerald-100 hover:scale-105 transition"
              >
                Profile
              </Link>
              <Link
                href="/about"
                className="text-sm px-3 py-2 rounded-lg bg-white/30 dark:bg-emerald-900/30 border border-white/20 text-emerald-900 dark:text-emerald-100 hover:scale-105 transition"
              >
                About Us
              </Link>
              <Link
                href="/growth"
                className="text-sm px-3 py-2 rounded-lg bg-white/30 dark:bg-emerald-900/30 border border-white/20 text-emerald-900 dark:text-emerald-100 hover:scale-105 transition"
              >
                Growth
              </Link>
              <Link
                href="/leaderboards"
                className="text-sm px-3 py-2 rounded-lg bg-white/30 dark:bg-emerald-900/30 border border-white/20 text-emerald-900 dark:text-emerald-100 hover:scale-105 transition"
              >
                Leaderboard
              </Link>
              <Link
                href="/learn"
                className="text-sm px-3 py-2 rounded-lg bg-white/30 dark:bg-emerald-900/30 border border-white/20 text-emerald-900 dark:text-emerald-100 hover:scale-105 transition"
              >
                Learn
              </Link>
            </div>
            <FeedClient />
          </motion.main>

          {/* Right sidebar: tips / info, only on larger screens to keep mobile clean */}
          <motion.aside
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="hidden lg:block lg:col-span-3 rounded-2xl p-4 bg-emerald-800 border border-emerald-600 text-white shadow-lg"
          >
            <div className="mb-3">
              <div className="text-xs uppercase tracking-wide text-emerald-200/80 mb-1">Tips</div>
              <div className="text-sm text-emerald-50">
                Create events as an institution, club or organization to mobilize your community to
                plant more trees.
              </div>
            </div>
            <div className="mt-3 space-y-2 text-xs text-emerald-100/90">
              <p>• Join upcoming events from the feed to track your impact.</p>
              <p>• Share posts to WhatsApp, Facebook or X to invite more volunteers.</p>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}