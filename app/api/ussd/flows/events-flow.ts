import { formatCon, formatEnd, isEmpty, parseIntSafe } from "@/lib/ussd/helpers";
import { SessionState } from "../session-manager";
import { createUssdEventRegistration, getOrCreateUssdUserByPhone, listUpcomingEventsByCounty } from "@/lib/db";

export async function handleEventsFlow(params: {
  session: SessionState;
  phoneNumber: string;
  textSegments: string[];
}) {
  const { phoneNumber, textSegments } = params;

  if (textSegments.length === 0 || isEmpty(textSegments[0])) {
    return formatCon("Enter your county to see upcoming events:");
  }

  const county = textSegments[0].trim();
  const events = await listUpcomingEventsByCounty(county);

  if (!events.length) {
    return formatEnd("No upcoming events in your county.");
  }

  if (textSegments.length === 1) {
    const lines = events.map((e, idx) => {
      const dateStr = e.eventDateTime.toLocaleDateString("en-KE", {
        day: "2-digit",
        month: "short",
      });
      return `${idx + 1}. ${e.title} (${dateStr})`;
    });
    return formatCon(`Select event to join:\n${lines.join("\n")}`);
  }

  const index = parseIntSafe(textSegments[1]);
  if (index < 1 || index > events.length) {
    return formatCon("Invalid choice. Please try again:");
  }

  const ussdUser = await getOrCreateUssdUserByPhone(phoneNumber, county);
  const event = events[index - 1];

  await createUssdEventRegistration({ ussdUserId: ussdUser.id, eventId: event.id });

  return formatEnd(`You have joined: ${event.title}. Thank you for supporting SeedLink.`);
}
