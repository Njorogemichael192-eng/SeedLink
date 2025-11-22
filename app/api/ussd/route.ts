import { NextResponse } from "next/server";
import { loadSession, updateSession } from "./session-manager";
import { handleRegistrationFlow } from "./flows/registration-flow";
import { handleBookingFlow } from "./flows/booking-flow";
import { handleEventsFlow } from "./flows/events-flow";
import { handleLoginFlow } from "./flows/login-flow";
import { formatCon, formatEnd, parseTextToSegments } from "@/lib/ussd/helpers";
import { MAIN_MENU_TEXT, USSD_MAX_INVALID_ATTEMPTS, USSD_SESSION_TIMEOUT_MINUTES, USSD_INVALID_INPUT_PREFIX, WELCOME_MENU_TEXT } from "@/lib/ussd/constants";
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

    const rawData = (session.data as { invalidAttempts?: number; loginStep?: string | null } | null) ?? null;
    const previousData: { invalidAttempts?: number; loginStep?: string | null } = rawData ?? {};

    // Level 0: Welcome menu
    if (!text || text === "") {
      const response = formatCon(WELCOME_MENU_TEXT);
      await updateSession({
        sessionId,
        phoneNumber,
        currentFlow: "WELCOME",
        currentStep: "ROOT",
        data: { ...previousData, invalidAttempts: 0, loginStep: null },
        isActive: true,
      });
      return textResponse(response);
    }

    // Dedicated login flow (handles PIN entry and attempts)
    if (session.currentFlow === "LOGIN" || segments[0] === "2") {
      const response = await handleLoginFlow({ session, phoneNumber, textSegments: segments.slice(segments[0] === "2" ? 1 : 0) });

      const previousInvalidAttempts = typeof previousData.invalidAttempts === "number" ? previousData.invalidAttempts : 0;
      const isInvalidResponse = response.startsWith(`CON ${USSD_INVALID_INPUT_PREFIX}`);
      let invalidAttempts = isInvalidResponse ? previousInvalidAttempts + 1 : 0;
      let isActive = !response.startsWith("END");

      if (isInvalidResponse && invalidAttempts >= USSD_MAX_INVALID_ATTEMPTS) {
        invalidAttempts = 0;
        isActive = false;
      }

      await updateSession({
        sessionId,
        phoneNumber,
        currentFlow: isActive ? "LOGIN" : null,
        currentStep: "LOGIN",
        data: { ...previousData, invalidAttempts },
        isActive,
      });

      return textResponse(response);
    }

    const rootChoice = segments[0];
    let response: string;

    switch (rootChoice) {
      case "1":
        // Registration flow
        response = await handleRegistrationFlow({ session, phoneNumber, textSegments: segments.slice(1) });
        break;
      case "00":
        // Global exit/logout
        response = formatEnd("Thank you for using SeedLink! Goodbye.");
        break;
      case "3":
        // Explicit exit from main menu
        response = formatEnd("Thank you for using SeedLink! Goodbye.");
        break;
      case "2":
        // From main menu: booking/events are handled after login; here we treat as main menu selection
        response = formatCon(MAIN_MENU_TEXT);
        break;
      default:
        // Level 2 main menu options
        if (rootChoice === "1") {
          response = await handleBookingFlow({ session, phoneNumber, textSegments: segments.slice(1) });
        } else if (rootChoice === "2") {
          response = await handleEventsFlow({ session, phoneNumber, textSegments: segments.slice(1) });
        } else {
          response = formatCon(`${USSD_INVALID_INPUT_PREFIX}\n${MAIN_MENU_TEXT}`);
        }
    }
    const previousInvalidAttempts = typeof previousData.invalidAttempts === "number" ? previousData.invalidAttempts : 0;
    const isInvalidResponse = response.startsWith(`CON ${USSD_INVALID_INPUT_PREFIX}`);

    let invalidAttempts = isInvalidResponse ? previousInvalidAttempts + 1 : 0;
    let finalResponse = response;
    let isActive = !response.startsWith("END");

    if (isInvalidResponse && invalidAttempts >= USSD_MAX_INVALID_ATTEMPTS) {
      finalResponse = formatEnd("Too many invalid attempts. Please try again later.");
      invalidAttempts = 0;
      isActive = false;
    }

    await updateSession({
      sessionId,
      phoneNumber,
      currentFlow: rootChoice,
      currentStep: segments.join("*"),
      data: { ...previousData, invalidAttempts },
      isActive,
    });

    return textResponse(finalResponse);
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
