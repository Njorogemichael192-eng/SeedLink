import { NextResponse } from "next/server";
import { loadSession, updateSession } from "./session-manager";
import { handleRegistrationFlow } from "./flows/registration-flow";
import { handleBookingFlow } from "./flows/booking-flow";
import { handleEventsFlow } from "./flows/events-flow";
import { formatCon, formatEnd, parseTextToSegments } from "@/lib/ussd/helpers";
import { MAIN_MENU_TEXT, USSD_MAX_INVALID_ATTEMPTS, USSD_SESSION_TIMEOUT_MINUTES, USSD_INVALID_INPUT_PREFIX } from "@/lib/ussd/constants";
import { cleanupExpiredUssdSessions, getUssdUserByPhone } from "@/lib/db";
import bcrypt from "bcryptjs";

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

    if (!text || text === "") {
      const existingUser = await getUssdUserByPhone(phoneNumber);
      const userWithPin = existingUser as (typeof existingUser & { pinHash?: string | null });
      if (userWithPin && userWithPin.pinHash) {
        const response = formatCon("Welcome back to SeedLink.\nEnter your 4-digit PIN:");
        await updateSession({
          sessionId,
          phoneNumber,
          ussdUserId: userWithPin.id,
          currentFlow: "LOGIN",
          currentStep: "ENTER_PIN",
          data: { ...previousData, invalidAttempts: 0, loginStep: "ENTER_PIN" },
          isActive: true,
        });
        return textResponse(response);
      }

      const response = formatCon(MAIN_MENU_TEXT);
      await updateSession({
        sessionId,
        phoneNumber,
        currentFlow: "MAIN_MENU",
        currentStep: "ROOT",
        data: { ...previousData, invalidAttempts: 0, loginStep: null },
        isActive: true,
      });
      return textResponse(response);
    }

    // Handle PIN entry step for returning users
    if (previousData.loginStep === "ENTER_PIN") {
      const pinInput = segments[0] ?? "";

      const existingUser = await getUssdUserByPhone(phoneNumber);
      const userWithPin = existingUser as (typeof existingUser & { pinHash?: string | null });
      if (!userWithPin || !userWithPin.pinHash) {
        const response = formatEnd("Account not found. Please register first.");
        await updateSession({
          sessionId,
          phoneNumber,
          currentFlow: null,
          currentStep: "LOGIN_FAILED",
          data: { ...previousData, loginStep: null },
          isActive: false,
        });
        return textResponse(response);
      }

      const pinFormatOk = /^[0-9]{4}$/.test(pinInput);
      let response: string;
      if (!pinFormatOk) {
        response = formatCon(`${USSD_INVALID_INPUT_PREFIX}\nEnter your 4-digit PIN:`);
      } else {
        const match = await bcrypt.compare(pinInput, userWithPin.pinHash as string);
        if (!match) {
          response = formatCon(`${USSD_INVALID_INPUT_PREFIX}\nEnter your 4-digit PIN:`);
        } else {
          response = formatCon(MAIN_MENU_TEXT);

          await updateSession({
            sessionId,
            phoneNumber,
            ussdUserId: userWithPin.id,
            currentFlow: "MAIN_MENU",
            currentStep: "ROOT",
            data: { ...previousData, invalidAttempts: 0, loginStep: null },
            isActive: true,
          });

          return textResponse(response);
        }
      }

      const previousInvalidAttempts = typeof previousData.invalidAttempts === "number" ? previousData.invalidAttempts : 0;
      const isInvalidResponse = response.startsWith(`CON ${USSD_INVALID_INPUT_PREFIX}`);
      let invalidAttempts = isInvalidResponse ? previousInvalidAttempts + 1 : 0;
      let finalResponse = response;
      let isActive = true;

      if (isInvalidResponse && invalidAttempts >= USSD_MAX_INVALID_ATTEMPTS) {
        finalResponse = formatEnd("Too many invalid attempts. Please try again later.");
        invalidAttempts = 0;
        isActive = false;
      }

      await updateSession({
        sessionId,
        phoneNumber,
        ussdUserId: userWithPin.id,
        currentFlow: "LOGIN",
        currentStep: "ENTER_PIN",
        data: { ...previousData, invalidAttempts, loginStep: "ENTER_PIN" },
        isActive,
      });

      return textResponse(finalResponse);
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
      case "4":
        response = formatEnd("Thank you for using SeedLink.");
        break;
      default:
        response = formatCon(`${USSD_INVALID_INPUT_PREFIX}\n${MAIN_MENU_TEXT}`);
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
