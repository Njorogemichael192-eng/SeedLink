import { formatCon, formatEnd } from "@/lib/ussd/helpers";
import { SessionState } from "../session-manager";
import { MAIN_MENU_TEXT } from "@/lib/ussd/constants";

export async function handleMainMenu(params: {
  session: SessionState;
  phoneNumber: string;
  textSegments: string[];
}) {
  const { textSegments } = params;

  if (textSegments.length === 0 || textSegments[0] === "") {
    return formatCon(MAIN_MENU_TEXT);
  }

  const choice = textSegments[0];
  switch (choice) {
    case "1":
      return formatCon("Enter your full name:");
    case "2":
      return formatCon("Enter your county (e.g. Nairobi, Kiambu):");
    case "3":
      return formatCon("Enter your county to see seedling stations:");
    case "4":
      return formatCon("Enter your county to see upcoming events:");
    default:
      return formatCon("Invalid choice.\n" + MAIN_MENU_TEXT);
  }
}

export function mainMenuText() {
  return MAIN_MENU_TEXT;
}

export function endWithGoodbye() {
  return formatEnd("Thank you for using SeedLink.");
}
