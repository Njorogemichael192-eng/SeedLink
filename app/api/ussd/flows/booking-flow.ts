import { formatCon, formatEnd, isEmpty, parseIntSafe } from "@/lib/ussd/helpers";
import { SessionState } from "../session-manager";
import { createUssdBookingWithInventoryCheck, getOrCreateUssdUserByPhone, listStationsByCountyWithInventory } from "@/lib/db";
import { MAX_USSD_SEEDLING_QUANTITY, USSD_INVALID_INPUT_PREFIX } from "@/lib/ussd/constants";
import { sendAntugrowSms } from "@/lib/sms/antugrow";

export async function handleBookingFlow(params: {
  session: SessionState;
  phoneNumber: string;
  textSegments: string[];
}) {
  const { phoneNumber, textSegments } = params;

  if (textSegments.length === 0 || isEmpty(textSegments[0])) {
    return formatCon("Enter your county to see available stations:");
  }

  const county = textSegments[0].trim();
  const stations = await listStationsByCountyWithInventory(county);

  if (!stations.length) {
    return formatEnd("No stations found in your county. Try again later.");
  }

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

  if (textSegments.length === 2) {
    const invLines = station.inventory
      .filter((i) => i.quantityAvailable > 0)
      .map((i, idx) => `${idx + 1}. ${i.seedlingType} (${i.quantityAvailable})`);
    if (!invLines.length) {
      return formatEnd("Selected station has no available seedlings.");
    }
    return formatCon(`Select seedling type:\n${invLines.join("\n")}`);
  }

  const availableTypes = station.inventory.filter((i) => i.quantityAvailable > 0);
  const typeIndex = parseIntSafe(textSegments[2]);
  if (typeIndex < 1 || typeIndex > availableTypes.length) {
    const invLines = availableTypes.map((i, idx) => `${idx + 1}. ${i.seedlingType} (${i.quantityAvailable})`);
    return formatCon(`${USSD_INVALID_INPUT_PREFIX}\nSelect seedling type:\n${invLines.join("\n")}`);
  }
  const selectedInv = availableTypes[typeIndex - 1];

  if (textSegments.length === 3) {
    return formatCon(`Enter quantity (1-${MAX_USSD_SEEDLING_QUANTITY}):`);
  }

  const quantity = parseIntSafe(textSegments[3]);
  if (quantity < 1 || quantity > MAX_USSD_SEEDLING_QUANTITY) {
    return formatCon(
      `${USSD_INVALID_INPUT_PREFIX}\nEnter quantity (1-${MAX_USSD_SEEDLING_QUANTITY}):`
    );
  }

  const ussdUser = await getOrCreateUssdUserByPhone(phoneNumber, station.location);

  try {
    const booking = await createUssdBookingWithInventoryCheck({
      ussdUserId: ussdUser.id,
      stationId: station.id,
      seedlingType: selectedInv.seedlingType,
      quantity,
    });

    const pickupDate = booking.scheduledPickup?.toLocaleDateString("en-KE") ?? "soon";
    const smsMessage = `SeedLink booking confirmed. ${quantity} ${selectedInv.seedlingType} seedling(s) at ${station.name}. Pickup date: ${pickupDate}. Station: ${station.location}. Ref: ${booking.id}`;
    if (ussdUser.phoneNumber) {
      await sendAntugrowSms({ phoneNumber: ussdUser.phoneNumber, message: smsMessage });
    }

    return formatEnd(
      `Booking confirmed!\nStation: ${station.name}\nType: ${selectedInv.seedlingType}\nQuantity: ${quantity}\nRef: ${booking.id}`
    );
  } catch {
    return formatEnd("Booking failed due to limited stock. Please try a lower quantity or another station.");
  }
}
