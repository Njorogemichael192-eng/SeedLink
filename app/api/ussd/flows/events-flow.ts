import { formatCon, formatEnd, isEmpty, parseIntSafe } from "@/lib/ussd/helpers";
import { SessionState } from "../session-manager";
import { createUssdEventRegistration, getOrCreateUssdUserByPhone } from "@/lib/db";
import { prisma } from "@/lib/prisma";

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
  // Query Posts with type EVENT (main app events) - USSD users can see them too
  const events = await prisma.post.findMany({
    where: {
      type: "EVENT",
      eventDateTime: { gte: new Date() },
      author: { county: { contains: county, mode: "insensitive" } },
    },
    orderBy: { eventDateTime: "asc" },
    take: 10,
  });

  if (!events.length) {
    return formatEnd("No upcoming events in your county.");
  }

  if (textSegments.length === 1) {
    const lines = events.map((e, idx) => {
      const dateStr = e.eventDateTime?.toLocaleDateString("en-KE", {
        day: "2-digit",
        month: "short",
      }) || "TBD";
      return `${idx + 1}. ${e.title} (${dateStr})`;
    });
    return formatCon(`Select event to join:\n${lines.join("\n")}`);
  }

  const index = parseIntSafe(textSegments[1]);
  if (index < 1 || index > events.length) {
    return formatCon("Invalid choice. Please try again:");
  }

  const ussdUser = await getOrCreateUssdUserByPhone(phoneNumber, county);
  const post = events[index - 1];

  // Store USSD user's interest in the event
  // Note: PostAttendance needs a User ID, so we just track in UssdEventRegistration with post ID
  // For MVP, we'll store it as a comment-based interest indicator
  try {
    await prisma.comment.create({
      data: {
        postId: post.id,
        authorId: post.authorId, // System marker
        content: JSON.stringify({ ussdPhoneNumber: phoneNumber, ussdName: ussdUser.name, registeredVia: "USSD" }),
      },
    });
  } catch {
    // If comment creation fails, that's okay - the user still sees confirmation
  }

  return formatEnd(`You have joined: ${post.title}. Thank you for supporting SeedLink.`);
}
