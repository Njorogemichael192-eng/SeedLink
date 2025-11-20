"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";

type Station = {
  id: string;
  name: string;
  location: string;
};

type InventoryItem = {
  seedlingType: string;
  quantityAvailable: number;
  status: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK";
};

export function BookingModal({
  open,
  onClose,
  station,
  inventory,
  defaultType,
}: {
  open: boolean;
  onClose: () => void;
  station: Station;
  inventory: InventoryItem[];
  defaultType?: string;
}) {
  const qc = useQueryClient();
  const [seedlingType, setSeedlingType] = useState(defaultType || inventory[0]?.seedlingType || "");
  const [quantity, setQuantity] = useState(1);
  const [scheduledPickupDate, setScheduledPickupDate] = useState("");
  const [bookingType, setBookingType] = useState<"INDIVIDUAL" | "INSTITUTION" | "CLUB">("INDIVIDUAL");
  const [email, setEmail] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [institutionEmail, setInstitutionEmail] = useState("");
  const [clubName, setClubName] = useState("");
  const [clubInstitutionName, setClubInstitutionName] = useState("");
  const [clubEmail, setClubEmail] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const today = new Date();
  const minDateObj = new Date(today.getTime() + 48 * 60 * 60 * 1000);
  const maxDateObj = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  const minDateStr = minDateObj.toISOString().split("T")[0];
  const maxDateStr = maxDateObj.toISOString().split("T")[0];

  const mutation = useMutation({
    mutationFn: async () => {
      // basic client-side guards
      const today = new Date();
      const minDate = new Date(today.getTime() + 48 * 60 * 60 * 1000);
      const maxDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      const picked = scheduledPickupDate ? new Date(scheduledPickupDate) : null;
      if (!picked || picked < minDate || picked > maxDate) {
        throw new Error("Pick-up date must be ≥ 48h from now and within 14 days.");
      }
      const sel = inventory.find((i) => i.seedlingType === seedlingType);
      if (!sel) throw new Error("Invalid seedling type");
      if (sel.status === "OUT_OF_STOCK") throw new Error("Selected seedling is out of stock");
      if (quantity < 1 || quantity > sel.quantityAvailable) throw new Error("Invalid quantity");
      // Conditional validations per booking type
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (bookingType === "INDIVIDUAL") {
        if (!email || !emailRegex.test(email)) throw new Error("Enter a valid email");
      } else if (bookingType === "INSTITUTION") {
        if (!institutionName.trim()) throw new Error("Enter institution name");
        if (!institutionEmail || !emailRegex.test(institutionEmail)) throw new Error("Enter a valid institution email");
      } else if (bookingType === "CLUB") {
        if (!clubName.trim()) throw new Error("Enter club name");
        if (!clubInstitutionName.trim()) throw new Error("Enter institution name");
        if (!clubEmail || !emailRegex.test(clubEmail)) throw new Error("Enter a valid club email");
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationId: station.id,
          seedlingType,
          quantity,
          scheduledPickupDate,
          bookingType,
          email: bookingType === "INDIVIDUAL" ? email : undefined,
          institutionName: bookingType === "INSTITUTION" ? institutionName : undefined,
          institutionEmail: bookingType === "INSTITUTION" ? institutionEmail : undefined,
          clubName: bookingType === "CLUB" ? clubName : undefined,
          clubInstitutionName: bookingType === "CLUB" ? clubInstitutionName : undefined,
          clubEmail: bookingType === "CLUB" ? clubEmail : undefined,
          specialRequest: specialRequest || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      return data;
    },
    onSuccess: async () => {
      setSuccess("Booking confirmed! Check your notifications and email.");
      setError(null);
      await qc.invalidateQueries({ queryKey: ["stations"] });
      // Reset form after 1.5 seconds and close modal
      setTimeout(() => {
        setSeedlingType(inventory[0]?.seedlingType || "");
        setQuantity(1);
        setScheduledPickupDate("");
        setBookingType("INDIVIDUAL");
        setEmail("");
        setInstitutionName("");
        setInstitutionEmail("");
        setClubName("");
        setClubInstitutionName("");
        setClubEmail("");
        setSpecialRequest("");
        onClose();
      }, 1500);
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Booking failed";
      setError(msg);
      setSuccess(null);
    },
  });

  const selected = inventory.find((i) => i.seedlingType === seedlingType);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <div className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">Book Seedlings</div>
          <div className="text-sm text-emerald-900/70 dark:text-emerald-100/70">{station.name} — {station.location}</div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-300/40 bg-red-100/40 p-2 text-red-800">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-lg border border-emerald-300/40 bg-emerald-100/40 p-2 text-emerald-900">{success}</div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm text-emerald-900 dark:text-emerald-100">Booking Type</span>
            <select
              value={bookingType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setBookingType(e.target.value as "INDIVIDUAL" | "INSTITUTION" | "CLUB")
              }
              className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="INSTITUTION">Institution</option>
              <option value="CLUB">Club</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-emerald-900 dark:text-emerald-100">Quantity</span>
            <input
              type="number"
              min={1}
              max={selected?.quantityAvailable ?? 1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value || "1", 10))}
              className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
            />
            <div className="text-xs text-emerald-900/70 dark:text-emerald-100/70">Available: {selected?.quantityAvailable ?? 0}</div>
          </label>

          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm text-emerald-900 dark:text-emerald-100">Pick-up Date</span>
            <input
              type="date"
              value={scheduledPickupDate}
              min={minDateStr}
              max={maxDateStr}
              onChange={(e) => setScheduledPickupDate(e.target.value)}
              className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
            />
            <div className="text-xs text-emerald-900/70 dark:text-emerald-100/70">Must be ≥ 48h from now and within 14 days.</div>
          </label>

          {bookingType === "INDIVIDUAL" ? (
            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm text-emerald-900 dark:text-emerald-100">Email for confirmation and reminders</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
              />
            </label>
          ) : null}

          {bookingType === "INSTITUTION" ? (
            <>
              <label className="space-y-1">
                <span className="text-sm text-emerald-900 dark:text-emerald-100">Institution Name</span>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-emerald-900 dark:text-emerald-100">Institution Email</span>
                <input
                  type="email"
                  value={institutionEmail}
                  onChange={(e) => setInstitutionEmail(e.target.value)}
                  placeholder="institution@example.com"
                  className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
                />
              </label>
            </>
          ) : null}

          {bookingType === "CLUB" ? (
            <>
              <label className="space-y-1">
                <span className="text-sm text-emerald-900 dark:text-emerald-100">Club Name</span>
                <input
                  type="text"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-emerald-900 dark:text-emerald-100">Institution Name</span>
                <input
                  type="text"
                  value={clubInstitutionName}
                  onChange={(e) => setClubInstitutionName(e.target.value)}
                  className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
                />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm text-emerald-900 dark:text-emerald-100">Club Email</span>
                <input
                  type="email"
                  value={clubEmail}
                  onChange={(e) => setClubEmail(e.target.value)}
                  placeholder="club@example.com"
                  className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
                />
              </label>
            </>
          ) : null}

          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm text-emerald-900 dark:text-emerald-100">Special Request (optional)</span>
            <textarea
              value={specialRequest}
              onChange={(e) => setSpecialRequest(e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-white/60 dark:bg-emerald-900/50 border border-white/30 p-2"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/30">Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white shadow hover:scale-105 transition"
          >
            {mutation.isPending ? "Booking..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
