import { formatCon, formatEnd } from "@/lib/ussd/helpers";
import { SessionState } from "../session-manager";
import { getUssdUserByPhone } from "@/lib/db";
import { MAIN_MENU_TEXT, USSD_INVALID_INPUT_PREFIX } from "@/lib/ussd/constants";
import bcrypt from "bcryptjs";

export async function handleLoginFlow(params: {
  session: SessionState;
  phoneNumber: string;
  textSegments: string[];
}) {
  const { phoneNumber, textSegments } = params;

  if (textSegments.length === 0) {
    return formatCon("Enter your 4-digit PIN:");
  }

  const pinInput = textSegments[0] ?? "";
  const user = await getUssdUserByPhone(phoneNumber);

  if (!user || !user.pinHash) {
    return formatEnd("User not registered. Please register first.");
  }

  const pinFormatOk = /^[0-9]{4}$/.test(pinInput);
  if (!pinFormatOk) {
    return formatCon(`${USSD_INVALID_INPUT_PREFIX}\nEnter your 4-digit PIN:`);
  }

  const match = await bcrypt.compare(pinInput, user.pinHash as string);
  if (!match) {
    return formatCon(`${USSD_INVALID_INPUT_PREFIX}\nInvalid PIN. Try again:`);
  }

  return formatCon(`Login successful! Main menu...\n${MAIN_MENU_TEXT}`);
}
