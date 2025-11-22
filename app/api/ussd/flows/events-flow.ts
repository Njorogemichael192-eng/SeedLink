import { formatCon, formatEnd, isEmpty, parseIntSafe } from "@/lib/ussd/helpers";
import { SessionState } from "../session-manager";
import { createUssdEventRegistration, getOrCreateUssdUserByPhone, listUpcomingEventsByCounty } from "@/lib/db";
import { USSD_INVALID_INPUT_PREFIX } from "@/lib/ussd/constants";
import { sendAfricaTalkingSms } from "@/lib/sms/africastalking";

export async function handleEventsFlow(params: {
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
  // Query upcoming events in county
  const events = await listUpcomingEventsByCounty(county);

  if (!events.length) {
    return formatEnd("No upcoming events in your county.");
  }

  const lines = events.map((e, idx) => {
    const dateStr = e.eventDateTime.toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return `${idx + 1}. ${e.title} (${dateStr})`;
  });

  // Step 2: select event
  if (textSegments.length === 1) {
    return formatCon(`Select event to join:\n${lines.join("\n")}`);
  }

  const index = parseIntSafe(textSegments[1]);
  if (index < 1 || index > events.length) {
    return formatCon(`${USSD_INVALID_INPUT_PREFIX}\nSelect event to join:\n${lines.join("\n")}`);
  }

  const event = events[index - 1];
  const ussdUser = await getOrCreateUssdUserByPhone(phoneNumber, county);

  // Step 3: confirm attendance
  if (textSegments.length === 2) {
    const dateStr = event.eventDateTime.toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const details = `Event: ${event.title}\nDate: ${dateStr}\nLocation: ${event.location}\nDescription: ${event.description}`;
    return formatCon(`${details}\n\nConfirm attendance? 1. Yes 2. No`);
  }

  const confirm = textSegments[2];
  if (confirm !== "1") {
    return formatEnd("You have not been registered for this event.");
  }

  await createUssdEventRegistration({ ussdUserId: ussdUser.id, eventId: event.id });

  const dateStr = event.eventDateTime.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const smsMessage = `SeedLink Event Confirmed📅\nEvent: ${event.title}\nDate: ${dateStr}\nLocation: ${event.location}\nSee you there!`;
  if (ussdUser.phoneNumber) {
    await sendAfricaTalkingSms({ to: ussdUser.phoneNumber, message: smsMessage });
  }

  return formatEnd(`You have joined: ${event.title}. Thank you for supporting SeedLink.`);
}
