"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BackButton } from "@/components/ui/back-button";
import { Modal } from "@/components/ui/modal";

export default function GrowthPage() {
  // TODO: clarify requirement before implementation — hook reminders (email + in-app) when check-ins are overdue
  const [items, setItems] = useState<Array<{ id: string; title: string; date: string; photoUrl?: string }>>([]);

  const [reminderOpen, setReminderOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFreq, setCurrentFreq] = useState<string | null>(null);

  useEffect(() => {
    const now = Date.now();
    setItems([
      { id: "1", title: "Planted 3 Moringa seedlings", date: new Date(now).toISOString() },
      { id: "2", title: "Watered seedlings — week 2", date: new Date(now - 7 * 24 * 3600 * 1000).toISOString() },
    ]);

    (async () => {
      try {
        const res = await fetch("/api/growth/reminder");
        if (!res.ok) return;
        const json = await res.json();
        setCurrentFreq(json.frequency || null);
      } catch {
        // ignore
      }
    })();
  }, []);

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-emerald-800 via-emerald-600/40 to-sky-700/40 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4">
          <BackButton label="Back" fallbackHref="/dashboard" />
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-wide text-emerald-100">(Growth Tracker)</h1>
        <p className="mt-1 text-sm text-emerald-100/80">
          Reminders: {currentFreq === "EVERY_3_DAYS" ? "Every 3 days" : currentFreq === "WEEKLY" ? "Weekly" : currentFreq === "EVERY_14_DAYS" ? "Every 14 days" : currentFreq === "MONTHLY" ? "Monthly" : "Off"}
        </p>
        <div className="mt-6 relative">
          <div className="absolute left-6 top-0 bottom-0 w-1 bg-white/30 rounded-full" />
          <div className="space-y-6">
            {items.map((it) => (
              <motion.div key={it.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative pl-16">
                <div className="absolute left-2 top-2 h-8 w-8 rounded-full bg-emerald-600 shadow" />
                <div className="rounded-2xl backdrop-blur-xl bg-white/25 border border-white/20 p-4">
                  <div className="text-emerald-950 dark:text-emerald-100 font-semibold">{it.title}</div>
                  <div className="text-xs text-emerald-900/70 dark:text-emerald-100/70">{new Date(it.date).toLocaleString()}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <button
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white shadow hover:scale-105 transition"
            type="button"
            onClick={() => {
              setError(null);
              setReminderOpen(true);
            }}
          >
            Set growth reminders
          </button>
        </div>
      </div>

      <Modal open={reminderOpen} onClose={() => (saving ? null : setReminderOpen(false)) as unknown as void}>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-emerald-950 dark:text-emerald-50">Seedling growth reminders</h2>
          <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80">
            Choose how often you want to be reminded to check on your seedlings and record their growth.
          </p>
          {error ? <div className="text-sm text-red-700">{error}</div> : null}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="growth-reminder"
                value="EVERY_3_DAYS"
                checked={currentFreq === "EVERY_3_DAYS"}
                onChange={(e) => setCurrentFreq(e.target.value)}
              />
              <span>Every 3 days</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="growth-reminder"
                value="WEEKLY"
                checked={currentFreq === "WEEKLY"}
                onChange={(e) => setCurrentFreq(e.target.value)}
              />
              <span>Weekly</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="growth-reminder"
                value="EVERY_14_DAYS"
                checked={currentFreq === "EVERY_14_DAYS"}
                onChange={(e) => setCurrentFreq(e.target.value)}
              />
              <span>Every 14 days</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="growth-reminder"
                value="MONTHLY"
                checked={currentFreq === "MONTHLY"}
                onChange={(e) => setCurrentFreq(e.target.value)}
              />
              <span>Monthly</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="growth-reminder"
                value=""
                checked={currentFreq === null}
                onChange={() => setCurrentFreq(null)}
              />
              <span>No reminders</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-white/70 text-emerald-900 border border-emerald-200"
              disabled={saving}
              onClick={() => setReminderOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white shadow disabled:opacity-60"
              disabled={saving}
              onClick={async () => {
                try {
                  setSaving(true);
                  setError(null);
                  const res = await fetch("/api/growth/reminder", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ frequency: currentFreq }),
                  });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error || "Failed to save reminder");
                  setCurrentFreq(json.frequency || null);
                  setReminderOpen(false);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Failed to save reminder");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
