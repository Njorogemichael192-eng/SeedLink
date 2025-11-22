import { formatCon, formatEnd, isEmpty } from "@/lib/ussd/helpers";
import { SessionState } from "../session-manager";
import { getOrCreateUssdUserByPhone, getUssdUserByPhone } from "@/lib/db";
import { KENYA_COUNTIES, MAIN_MENU_TEXT, USSD_INVALID_INPUT_PREFIX } from "@/lib/ussd/constants";

export async function handleRegistrationFlow(params: {
  session: SessionState;
  phoneNumber: string;
  textSegments: string[];
}) {
  const { phoneNumber, textSegments } = params;

  // Step 1: full name
  if (textSegments.length === 0 || isEmpty(textSegments[0])) {
    return formatCon("Enter your full name:");
  }

  const name = textSegments[0].trim();
  if (name.length < 2) {
    return formatCon(`${USSD_INVALID_INPUT_PREFIX}\nEnter your full name:`);
  }

  // Step 2: county
  if (textSegments.length === 1 || isEmpty(textSegments[1])) {
    return formatCon("Enter your location/county:");
  }

  const county = textSegments[1].trim();
  const countyValid = KENYA_COUNTIES.some((c) => c.toLowerCase() === county.toLowerCase());
  if (!countyValid) {
    return formatCon(`${USSD_INVALID_INPUT_PREFIX}\nEnter your location/county:`);
  }

  // Step 3: PIN
  if (textSegments.length === 2 || isEmpty(textSegments[2])) {
    return formatCon("Create 4-digit PIN:");
  }

  const pinInput = textSegments[2].trim();
  const pinIsFourDigits = /^[0-9]{4}$/.test(pinInput);
  if (!pinIsFourDigits) {
    return formatCon(`${USSD_INVALID_INPUT_PREFIX}\nCreate 4-digit PIN:`);
  }

  const existing = await getUssdUserByPhone(phoneNumber);
  if (existing && existing.pinHash) {
    return formatEnd("You are already registered. Please login instead.");
  }

  await getOrCreateUssdUserByPhone(phoneNumber, county, name, pinInput);

  return formatCon(`Registration complete! Main menu...\n${MAIN_MENU_TEXT}`);
}
