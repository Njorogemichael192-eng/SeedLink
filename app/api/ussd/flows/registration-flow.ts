import { formatCon, formatEnd, isEmpty } from "@/lib/ussd/helpers";
import { SessionState } from "../session-manager";
import { getOrCreateUssdUserByPhone } from "@/lib/db";
import { USSD_INVALID_INPUT_PREFIX } from "@/lib/ussd/constants";

export async function handleRegistrationFlow(params: {
  session: SessionState;
  phoneNumber: string;
  textSegments: string[];
}) {
  const { phoneNumber, textSegments } = params;

  if (textSegments.length === 0 || isEmpty(textSegments[0])) {
    return formatCon("Please enter your full name:");
  }

  if (textSegments.length === 1) {
    return formatCon("Enter your county (e.g. Nairobi, Kiambu):");
  }

  if (textSegments.length === 2) {
    return formatCon("Create a 4-digit PIN you will use to log in:");
  }

  const name = textSegments[0].trim();
  const county = textSegments[1].trim();
  const pinInput = textSegments[2].trim();

  const pinIsFourDigits = /^[0-9]{4}$/.test(pinInput);
  if (!pinIsFourDigits) {
    return formatCon(`${USSD_INVALID_INPUT_PREFIX}\nCreate a 4-digit PIN you will use to log in:`);
  }

  const user = await getOrCreateUssdUserByPhone(phoneNumber, county, name, pinInput);

  return formatEnd(`Registration complete.\nName: ${user.name ?? name}\nCounty: ${user.county ?? county}`);
}
