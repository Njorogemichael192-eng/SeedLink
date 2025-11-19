"use client";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/ui/back-button";

export default function NotificationsPage() {
  const [items, setItems] = useState<Array<{ id: string; title: string; body: string; read: boolean; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  type Prefs = {
    id: string;
    userId: string;
    bookingEmails: boolean;
    bookingInApp: boolean;
    postEmails: boolean;
    postInApp: boolean;
    reminderEmails: boolean;
    reminderInApp: boolean;
  } | null;
  const [prefs, setPrefs] = useState<Prefs>(null);
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [nRes, pRes] = await Promise.all([fetch("/api/notifications"), fetch("/api/notifications/preferences")]);
      const nJson = await nRes.json();
      const pJson = await pRes.json();
      if (nRes.ok) setItems(nJson.notifications);
      if (pRes.ok) setPrefs(pJson.preferences);
      setLoading(false);
    })();
  }, []);

  const markRead = async () => {
    const ids = Object.entries(sel).filter(([, v]) => v).map(([k]) => k);
    if (!ids.length) return;
    const res = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    if (res.ok) {
      setItems((prev) => prev.map((it) => (ids.includes(it.id) ? { ...it, read: true } : it)));
      setSel({});
    }
  };

  const deleteSelected = async () => {
    const ids = Object.entries(sel).filter(([, v]) => v).map(([k]) => k);
    if (!ids.length) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => !ids.includes(it.id)));
        setSel({});
      }
    } finally {
      setDeleting(false);
    }
  };

  const togglePref = async (key: keyof NonNullable<Prefs>) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await fetch("/api/notifications/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-emerald-800 via-emerald-600/40 to-sky-700/40 p-6">
      <div className="mx-auto max-w-5xl mb-4">
        <BackButton label="Back" fallbackHref="/dashboard" />
      </div>
      <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4 backdrop-blur-xl bg-white/30 dark:bg-emerald-900/30 border border-white/20 rounded-2xl p-4">
          <div className="text-lg font-semibold text-emerald-950 dark:text-emerald-100 mb-3">Preferences</div>
          {prefs ? (
            <div className="space-y-2 text-sm">
              {([
                "bookingEmails",
                "bookingInApp",
                "postEmails",
                "postInApp",
                "reminderEmails",
                "reminderInApp",
              ] as const).map((k) => (
                <label key={k} className="flex items-center gap-2">
                  <input type="checkbox" checked={!!prefs[k]} onChange={() => togglePref(k)} />
                  <span className="capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="h-20 rounded-lg bg-white/20" />
          )}
        </div>

        <div className="md:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-emerald-950 dark:text-emerald-100">Notifications</div>
            <div className="flex items-center gap-2">
              <button
                onClick={markRead}
                className="px-3 py-1 rounded-full bg-emerald-600 text-white disabled:opacity-50"
                disabled={!Object.values(sel).some(Boolean)}
              >
                Mark as read
              </button>
              <button
                onClick={deleteSelected}
                className="px-3 py-1 rounded-full bg-red-600 text-white disabled:opacity-50"
                disabled={!Object.values(sel).some(Boolean) || deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl backdrop-blur-xl bg-white/25 border border-white/20" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((n) => (
                <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl backdrop-blur-xl border border-white/20 ${n.read ? "bg-white/20" : "bg-white/40"}`}>
                  <input type="checkbox" checked={!!sel[n.id]} onChange={(e) => setSel((s) => ({ ...s, [n.id]: e.target.checked }))} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-emerald-950 dark:text-emerald-100">{n.title}</div>
                    <div className="text-xs text-emerald-900/70 dark:text-emerald-100/70">{n.body}</div>
                  </div>
                  <div className="text-[10px] text-emerald-900/60 dark:text-emerald-100/60">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
