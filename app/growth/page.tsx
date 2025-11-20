"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BackButton } from "@/components/ui/back-button";
import { Modal } from "@/components/ui/modal";

interface GrowthEntry {
  id: string;
  title: string;
  description?: string;
  photoUrl?: string;
  plantingDate: string;
  latitude: number;
  longitude: number;
  aiHealthDiagnosis?: any;
  createdAt: string;
}

interface NdviData {
  timestamp: string;
  ndvi: number;
}

interface LocalConditions {
  precipitation: any;
  temperature: any;
  soilPh: any;
  clay: any;
}

export default function GrowthPage() {
  const [items, setItems] = useState<GrowthEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    photoUrl: "",
    plantingDate: new Date().toISOString().split("T")[0],
  });
  const [geolocation, setGeolocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [reminderOpen, setReminderOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFreq, setCurrentFreq] = useState<string | null>(null);

  // Detail view state
  const [selectedEntry, setSelectedEntry] = useState<GrowthEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [ndviData, setNdviData] = useState<NdviData[] | null>(null);
  const [localConditions, setLocalConditions] = useState<LocalConditions | null>(null);
  const [ndviError, setNdviError] = useState<string | null>(null);
  const [conditionsError, setConditionsError] = useState<string | null>(null);

  // Fetch growth entries on component mount
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // Fetch growth entries
        const entriesRes = await fetch("/api/growth/entries");
        if (entriesRes.ok) {
          const json = await entriesRes.json();
          setItems(json.entries || []);
        }
        // Fetch reminder frequency
        const reminderRes = await fetch("/api/growth/reminder");
        if (reminderRes.ok) {
          const json = await reminderRes.json();
          setCurrentFreq(json.frequency || null);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch detail data when entry is selected
  useEffect(() => {
    if (!selectedEntry) return;

    (async () => {
      try {
        setDetailLoading(true);
        setNdviError(null);
        setConditionsError(null);
        setNdviData(null);
        setLocalConditions(null);

        // Fetch NDVI data
        const ndviRes = await fetch(
          `/api/antugrow/ndvi-history?growthTrackerEntryId=${selectedEntry.id}`
        );
        if (ndviRes.ok) {
          const ndviJson = await ndviRes.json();
          setNdviData(ndviJson.data);
        } else {
          setNdviError("Failed to load satellite health data");
        }

        // Fetch local conditions
        const condRes = await fetch(
          `/api/antugrow/local-conditions?growthTrackerEntryId=${selectedEntry.id}`
        );
        if (condRes.ok) {
          const condJson = await condRes.json();
          setLocalConditions(condJson.data);
        } else {
          setConditionsError("Failed to load climate conditions");
        }
      } catch (err) {
        console.error("Error loading entry details:", err);
        setNdviError("Error loading satellite data");
        setConditionsError("Error loading climate data");
      } finally {
        setDetailLoading(false);
      }
    })();
  }, [selectedEntry]);

  // Request geolocation when modal opens
  useEffect(() => {
    if (!showNewEntryModal) return;

    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }

    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeolocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = "Unable to get your location";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location permission denied. Please enable location access to create an entry.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "The request to get user location timed out.";
        }
        setGeoError(errorMessage);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [showNewEntryModal]);

  const handleCreateEntry = async () => {
    if (!geolocation) {
      setGeoError("Location is required to create an entry. Please enable location access.");
      return;
    }

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/growth/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          photoUrl: formData.photoUrl || undefined,
          plantingDate: new Date(formData.plantingDate).toISOString(),
          latitude: geolocation.latitude,
          longitude: geolocation.longitude,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create entry");
      }

      const data = await res.json();
      
      // Refresh entries list
      const entriesRes = await fetch("/api/growth/entries");
      if (entriesRes.ok) {
        const json = await entriesRes.json();
        setItems(json.entries || []);
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        photoUrl: "",
        plantingDate: new Date().toISOString().split("T")[0],
      });
      setGeolocation(null);
      setShowNewEntryModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entry");
    } finally {
      setSubmitting(false);
    }
  };

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
                <div className="absolute left-2 top-2 h-8 w-8 rounded-full bg-emerald-600 shadow cursor-pointer hover:bg-emerald-500 transition" />
                <div
                  onClick={() => setSelectedEntry(it)}
                  className="rounded-2xl backdrop-blur-xl bg-white/25 border border-white/20 p-4 cursor-pointer hover:bg-white/30 hover:border-white/40 transition"
                >
                  <div className="text-emerald-950 dark:text-emerald-100 font-semibold">{it.title}</div>
                  <div className="text-xs text-emerald-900/70 dark:text-emerald-100/70">
                    📅 {new Date(it.plantingDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-emerald-900/70 dark:text-emerald-100/70 mt-1">
                    📍 {it.latitude.toFixed(4)}, {it.longitude.toFixed(4)}
                  </div>
                  {it.description && (
                    <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80 mt-2">{it.description}</p>
                  )}
                  <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">
                    Click to view satellite health & climate data →
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white shadow hover:scale-105 transition"
            type="button"
            onClick={() => setShowNewEntryModal(true)}
          >
            Add new entry
          </button>
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

      {/* New Entry Modal */}
      <Modal open={showNewEntryModal} onClose={() => (submitting ? null : setShowNewEntryModal(false)) as unknown as void}>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-emerald-950 dark:text-emerald-50">Create New Growth Entry</h2>
          
          {/* Geolocation Status */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/40">
            {geoError ? (
              <div className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                <span>⚠️</span>
                <span>{geoError}</span>
              </div>
            ) : geolocation ? (
              <div className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                <span>✓</span>
                <span>Location captured: {geolocation.latitude.toFixed(4)}, {geolocation.longitude.toFixed(4)}</span>
              </div>
            ) : (
              <div className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <span>📍</span>
                <span>Requesting your location...</span>
              </div>
            )}
          </div>

          {error && <div className="text-sm text-red-700 dark:text-red-300">{error}</div>}

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-emerald-950 dark:text-emerald-100 mb-1">
                Entry Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Initial seedling planted"
                className="w-full px-3 py-2 rounded-lg bg-white/80 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-950 dark:text-emerald-50 placeholder-emerald-600/50"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-950 dark:text-emerald-100 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional: Notes about the planting or observations"
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-white/80 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-950 dark:text-emerald-50 placeholder-emerald-600/50"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-950 dark:text-emerald-100 mb-1">
                Planting Date *
              </label>
              <input
                type="date"
                value={formData.plantingDate}
                onChange={(e) => setFormData({ ...formData, plantingDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/80 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-950 dark:text-emerald-50"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-950 dark:text-emerald-100 mb-1">
                Photo URL
              </label>
              <input
                type="url"
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-3 py-2 rounded-lg bg-white/80 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-950 dark:text-emerald-50 placeholder-emerald-600/50"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-white/70 text-emerald-900 border border-emerald-200"
              disabled={submitting}
              onClick={() => setShowNewEntryModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white shadow disabled:opacity-60"
              disabled={submitting || !geolocation}
              onClick={handleCreateEntry}
            >
              {submitting ? "Creating..." : "Create Entry"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reminder Modal */}
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

      {/* Entry Detail Modal */}
      <Modal open={!!selectedEntry} onClose={() => setSelectedEntry(null)}>
        {selectedEntry && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            <div>
              <h2 className="text-xl font-semibold text-emerald-950 dark:text-emerald-50">
                {selectedEntry.title}
              </h2>
              <p className="text-xs text-emerald-900/70 dark:text-emerald-100/70 mt-1">
                📅 Planted: {new Date(selectedEntry.plantingDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-emerald-900/70 dark:text-emerald-100/70 mt-1">
                📍 Location: {selectedEntry.latitude.toFixed(4)}, {selectedEntry.longitude.toFixed(4)}
              </p>
            </div>

            {selectedEntry.description && (
              <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40">
                <h3 className="text-sm font-medium text-emerald-950 dark:text-emerald-100 mb-1">
                  Notes
                </h3>
                <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80">
                  {selectedEntry.description}
                </p>
              </div>
            )}

            {selectedEntry.photoUrl && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={selectedEntry.photoUrl}
                  alt={selectedEntry.title}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            {/* NDVI Health Score Section */}
            <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/40">
              <h3 className="text-sm font-semibold text-blue-950 dark:text-blue-100 flex items-center gap-2">
                🛰️ Satellite Health Score (NDVI)
              </h3>
              {detailLoading ? (
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">Loading vegetation data...</p>
              ) : ndviError ? (
                <p className="text-xs text-red-700 dark:text-red-300 mt-2">{ndviError}</p>
              ) : ndviData && Array.isArray(ndviData) && ndviData.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    NDVI values &gt; 0.5 indicate healthy, dense vegetation. Your tree's health over time:
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {ndviData.slice(-10).map((d: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-blue-900/70 dark:text-blue-100/70">
                          {new Date(d.timestamp).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-blue-200 dark:bg-blue-900/40 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                d.ndvi > 0.5
                                  ? "bg-green-500"
                                  : d.ndvi > 0.3
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${(d.ndvi / 1) * 100}%` }}
                            />
                          </div>
                          <span className="font-semibold text-blue-900 dark:text-blue-100 w-12 text-right">
                            {d.ndvi.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  No satellite data available yet. Check back later.
                </p>
              )}
            </div>

            {/* Local Conditions Section */}
            <div className="p-4 rounded-lg bg-orange-50/50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/40">
              <h3 className="text-sm font-semibold text-orange-950 dark:text-orange-100 flex items-center gap-2">
                🌍 Climate & Soil Conditions
              </h3>
              {detailLoading ? (
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">Loading climate data...</p>
              ) : conditionsError ? (
                <p className="text-xs text-red-700 dark:text-red-300 mt-2">{conditionsError}</p>
              ) : localConditions ? (
                <div className="mt-3 space-y-2">
                  {localConditions.precipitation && (
                    <div className="p-2 rounded bg-white/50 dark:bg-orange-900/30">
                      <p className="text-xs font-medium text-orange-900 dark:text-orange-100">
                        🌧️ Precipitation (3-year average)
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                        {JSON.stringify(localConditions.precipitation).substring(0, 100)}...
                      </p>
                    </div>
                  )}
                  {localConditions.temperature && (
                    <div className="p-2 rounded bg-white/50 dark:bg-orange-900/30">
                      <p className="text-xs font-medium text-orange-900 dark:text-orange-100">
                        🌡️ Temperature (2-year max/min)
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                        {JSON.stringify(localConditions.temperature).substring(0, 100)}...
                      </p>
                    </div>
                  )}
                  {localConditions.soilPh && (
                    <div className="p-2 rounded bg-white/50 dark:bg-orange-900/30">
                      <p className="text-xs font-medium text-orange-900 dark:text-orange-100">
                        🧪 Soil pH
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                        {JSON.stringify(localConditions.soilPh).substring(0, 100)}...
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                  Climate data not yet available. Check back soon.
                </p>
              )}
            </div>

            {/* AI Health Diagnosis Section */}
            {selectedEntry.aiHealthDiagnosis && (
              <div className="p-4 rounded-lg bg-purple-50/50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/40">
                <h3 className="text-sm font-semibold text-purple-950 dark:text-purple-100 flex items-center gap-2">
                  🤖 AI Health Diagnosis
                </h3>
                <div className="mt-2 p-2 rounded bg-white/50 dark:bg-purple-900/30">
                  <pre className="text-xs text-purple-700 dark:text-purple-300 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                    {typeof selectedEntry.aiHealthDiagnosis === "string"
                      ? selectedEntry.aiHealthDiagnosis
                      : JSON.stringify(selectedEntry.aiHealthDiagnosis, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white shadow hover:bg-emerald-700 transition"
                onClick={() => setSelectedEntry(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
