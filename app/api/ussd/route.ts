import { NextResponse } from "next/server";
import { loadSession, updateSession } from "./session-manager";
import { handleRegistrationFlow } from "./flows/registration-flow";
import { handleBookingFlow } from "./flows/booking-flow";
import { handleEventsFlow } from "./flows/events-flow";
import { formatCon, formatEnd, parseTextToSegments } from "@/lib/ussd/helpers";
import { MAIN_MENU_TEXT, USSD_SESSION_TIMEOUT_MINUTES } from "@/lib/ussd/constants";
import { cleanupExpiredUssdSessions } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const searchParams = new URLSearchParams(bodyText);
    const sessionId = searchParams.get("sessionId") ?? "";
    const phoneNumber = searchParams.get("phoneNumber") ?? "";
    const text = searchParams.get("text") ?? "";

    if (!sessionId || !phoneNumber) {
      return textResponse(formatEnd("Invalid request."));
    }

    await cleanupExpiredUssdSessions(USSD_SESSION_TIMEOUT_MINUTES);

    const session = await loadSession(sessionId, phoneNumber);
    const segments = parseTextToSegments(text);

    if (!text || text === "") {
      return textResponse(formatCon(MAIN_MENU_TEXT));
    }

    const rootChoice = segments[0];
    let response: string;

    switch (rootChoice) {
      case "1":
        response = await handleRegistrationFlow({ session, phoneNumber, textSegments: segments.slice(1) });
        break;
      case "2":
        response = await handleBookingFlow({ session, phoneNumber, textSegments: segments.slice(1) });
        break;
      case "3":
        response = await handleEventsFlow({ session, phoneNumber, textSegments: segments.slice(1) });
        break;
      default:
        response = formatCon("Invalid choice.\n" + MAIN_MENU_TEXT);
    }

    await updateSession({
      sessionId,
      phoneNumber,
      currentFlow: rootChoice,
      currentStep: segments.join("*"),
      data: {},
      isActive: !response.startsWith("END"),
    });

    return textResponse(response);
  } catch (e) {
    console.error("USSD handler error", e);
    return textResponse(formatEnd("An error occurred. Please try again later."));
  }
}

function textResponse(body: string) {
  return new NextResponse(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
