"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { BackButton } from "@/components/ui/back-button";
import { BookingModal } from "@/components/seedlings/booking-modal";

type Inventory = { seedlingType: string; quantityAvailable: number; status: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK" };
type Station = { id: string; name: string; location: string; inventory: Inventory[] };

export default function SeedlingsPage() {
  const { data } = useQuery<{ stations: Station[] }>({
    queryKey: ["stations"],
    queryFn: async () => {
      const res = await fetch("/api/stations");
      if (!res.ok) throw new Error("Failed to load stations");
      return res.json();
    },
  });

  const [openFor, setOpenFor] = useState<null | (Station & { defaultType?: string })>(null);
  const subscribe = useMutation({
    mutationFn: async (payload: { stationId: string; seedlingType: string }) => {
      const res = await fetch("/api/restock-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Subscription failed");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-emerald-800 via-emerald-600/40 to-sky-700/40 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4">
          <BackButton label="Back" fallbackHref="/dashboard" />
        </div>
        <h1 className="text-3xl font-bold uppercase tracking-wide text-emerald-100 mb-6">(Find Seedlings)</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data?.stations?.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl backdrop-blur-xl bg-white/20 dark:bg-emerald-900/30 border border-white/20 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">{s.name}</div>
                  <div className="text-sm text-emerald-900/70 dark:text-emerald-100/70">{s.location}</div>
                </div>
                <button
                  onClick={() => setOpenFor(s)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white shadow hover:scale-105 transition"
                >
                  Book
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {s.inventory.map((i: Inventory) => (
                  <div key={i.seedlingType} className="rounded-lg border border-white/20 bg-white/20 p-3">
                    <div className="text-emerald-900 dark:text-emerald-100 font-medium">{i.seedlingType}</div>
                    <div className="text-xs text-emerald-900/70 dark:text-emerald-100/70">Available: {i.quantityAvailable}</div>
                    <div className="text-xs">Status: {i.status.toLowerCase()}</div>
                    <div className="mt-2">
                      {i.status === "OUT_OF_STOCK" ? (
                        <button
                          className="text-sm px-3 py-1 rounded bg-emerald-700 text-white disabled:opacity-50"
                          disabled={subscribe.isPending}
                          onClick={() => subscribe.mutate({ stationId: s.id, seedlingType: i.seedlingType })}
                        >
                          {subscribe.isPending ? "Subscribing..." : "Notify me on restock"}
                        </button>
                      ) : (
                        <button
                          className="text-sm px-3 py-1 rounded bg-emerald-700 text-white disabled:opacity-50"
                          disabled={false}
                          onClick={() => setOpenFor({ ...s, defaultType: i.seedlingType })}
                        >
                          Book this
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {openFor ? (
        <BookingModal
          open
          onClose={() => setOpenFor(null)}
          station={{ id: openFor.id, name: openFor.name, location: openFor.location }}
          inventory={openFor.inventory}
          defaultType={openFor.defaultType}
        />
      ) : null}
    </div>
  );
}
