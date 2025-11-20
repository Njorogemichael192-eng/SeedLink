import axios from "axios";

const AT_BASE_URL = "https://api.africastalking.com/version1/messaging";

export async function sendAfricaTalkingSms(params: { to: string; message: string; from?: string }) {
  const { to, message, from } = params;
  const username = process.env.AFRICASTALKING_USERNAME;
  const apiKey = process.env.AFRICASTALKING_API_KEY;

  if (!username || !apiKey) {
    console.error("Africa's Talking SMS missing credentials. Skipping SMS send.");
    return;
  }

  const payload = new URLSearchParams();
  payload.append("username", username);
  payload.append("to", to);
  payload.append("message", message);
  if (from) {
    payload.append("from", from);
  }

  try {
    await axios.post(AT_BASE_URL, payload.toString(), {
      headers: {
        apikey: apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
    });
  } catch (err) {
    console.error("Failed to send Africa's Talking SMS", err);
  }
}
