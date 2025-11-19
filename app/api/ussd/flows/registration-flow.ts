import { formatCon, formatEnd, isEmpty } from "@/lib/ussd/helpers";
import { SessionState } from "../session-manager";
import { getOrCreateUssdUserByPhone } from "@/lib/db";

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

  const name = textSegments[0].trim();
  const county = textSegments[1].trim();

  const user = await getOrCreateUssdUserByPhone(phoneNumber, county, name);

  return formatEnd(`Registration complete.\nName: ${user.name ?? name}\nCounty: ${user.county ?? county}`);
}
