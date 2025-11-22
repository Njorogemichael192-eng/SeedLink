import { formatCon, formatEnd, isEmpty, parseIntSafe } from "@/lib/ussd/helpers";
import { SessionState } from "../session-manager";
import { createUssdBookingWithInventoryCheck, getOrCreateUssdUserByPhone, listStationsByCountyWithInventory } from "@/lib/db";
import { MAX_USSD_SEEDLING_QUANTITY, USSD_INVALID_INPUT_PREFIX } from "@/lib/ussd/constants";
import { sendAfricaTalkingSms } from "@/lib/sms/africastalking";

export async function handleBookingFlow(params: {
  session: SessionState;
  phoneNumber: string;
  textSegments: string[];
}) {
  const { phoneNumber, textSegments } = params;

  // Step 1: county
  if (textSegments.length === 0 || isEmpty(textSegments[0])) {
    return formatCon("Enter your county:");
  }

  const county = textSegments[0].trim();
  const stations = await listStationsByCountyWithInventory(county);

  if (!stations.length) {
    return formatEnd("No stations available in your county.");
  }

  // Step 2: select station
  if (textSegments.length === 1) {
    const lines = stations.map((s, idx) => {
      const total = s.inventory.reduce((sum, i) => sum + i.quantityAvailable, 0);
      return `${idx + 1}. ${s.name} (${total} seedlings)`;
    });
    return formatCon(`Select a station:\n${lines.join("\n")}`);
  }

  const stationIndex = parseIntSafe(textSegments[1]);
  if (stationIndex < 1 || stationIndex > stations.length) {
    const lines = stations.map((s, idx) => {
      const total = s.inventory.reduce((sum, i) => sum + i.quantityAvailable, 0);
      return `${idx + 1}. ${s.name} (${total} seedlings)`;
    });
    return formatCon(`${USSD_INVALID_INPUT_PREFIX}\nSelect a station:\n${lines.join("\n")}`);
  }
  const station = stations[stationIndex - 1];

  // Step 3: quantity
  if (textSegments.length === 2) {
    return formatCon(`Enter number of seedlings (1-${MAX_USSD_SEEDLING_QUANTITY}):`);
  }

  const quantity = parseIntSafe(textSegments[2]);
  if (quantity < 1 || quantity > MAX_USSD_SEEDLING_QUANTITY) {
    return formatCon(
      `${USSD_INVALID_INPUT_PREFIX}\nEnter number of seedlings (1-${MAX_USSD_SEEDLING_QUANTITY}):`
    );
  }

  // Check total inventory
  const totalAvailable = station.inventory.reduce((sum, i) => sum + i.quantityAvailable, 0);
  if (totalAvailable < quantity) {
    return formatEnd("Insufficient inventory at selected station.");
  }

  // Step 4: pickup date
  if (textSegments.length === 3) {
    return formatCon("Enter pickup date (DD/MM/YYYY):");
  }

  const pickupRaw = textSegments[3].trim();
  const dateMatch = pickupRaw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!dateMatch) {
    return formatCon(`${USSD_INVALID_INPUT_PREFIX}\nEnter pickup date (DD/MM/YYYY):`);
  }

  const [, dd, mm, yyyy] = dateMatch;
  const pickupDate = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (Number.isNaN(pickupDate.getTime())) {
    return formatCon(`${USSD_INVALID_INPUT_PREFIX}\nEnter pickup date (DD/MM/YYYY):`);
  }

  const now = new Date();
  const minPickup = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  if (pickupDate < minPickup) {
    return formatCon("Pickup date must be at least 48 hours from now.\nEnter pickup date (DD/MM/YYYY):");
  }

  // Step 5: confirmation
  if (textSegments.length === 4) {
    const dateLabel = pickupDate.toLocaleDateString("en-KE");
    return formatCon(
      `Confirm booking?\n1. Yes\n2. No\n\nSeedlings: ${quantity}\nStation: ${station.name}\nPickup: ${dateLabel}`
    );
  }

  const confirm = textSegments[4];
  if (confirm !== "1") {
    return formatEnd("Booking cancelled.");
  }

  const ussdUser = await getOrCreateUssdUserByPhone(phoneNumber, station.location);

  try {
    await createUssdBookingWithInventoryCheck({
      ussdUserId: ussdUser.id,
      stationId: station.id,
      seedlingType: "USSD_MIXED",
      quantity,
    });

    const pickupLabel = pickupDate.toLocaleDateString("en-KE");
    const smsMessage = `SeedLink Booking Confirmed🌱\nSeedlings: ${quantity}\nStation: ${station.name}\nPickup: ${pickupLabel}\nThanks for greening Kenya!`;
    if (ussdUser.phoneNumber) {
      await sendAfricaTalkingSms({ to: ussdUser.phoneNumber, message: smsMessage });
    }

    return formatEnd(
      `Booking confirmed!\nSeedlings: ${quantity}\nStation: ${station.name}\nPickup: ${pickupLabel}`
    );
  } catch {
    return formatEnd("Booking failed due to limited stock. Please try a lower quantity or another station.");
  }
}
