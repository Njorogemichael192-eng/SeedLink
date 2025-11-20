import axios from "axios";

const DEFAULT_BASE_URL = "https://api.antugrow.com/v1";

interface SendAntugrowSmsParams {
  phoneNumber: string;
  message: string;
}

export async function sendAntugrowSms({ phoneNumber, message }: SendAntugrowSmsParams) {
  const apiKey = process.env.ANTUGROW_API_KEY;
  const baseUrl = process.env.ANTUGROW_BASE_URL || DEFAULT_BASE_URL;

  if (!apiKey) {
    console.error("ANTUGROW_API_KEY is not set. Skipping Antugrow SMS send.");
    return;
  }

  try {
    await axios.post(
      `${baseUrl}/send-sms`,
      {
        phone_number: phoneNumber,
        message,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
      }
    );
  } catch (error) {
    console.error("Failed to send SMS via Antugrow", error);
  }
}
