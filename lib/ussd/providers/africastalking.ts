export interface AfricaTalkingUssdRequest {
  sessionId: string;
  serviceCode: string;
  phoneNumber: string;
  text: string;
  networkCode?: string;
}

export function parseAfricaTalkingPayload(bodyText: string): AfricaTalkingUssdRequest {
  const params = new URLSearchParams(bodyText);
  return {
    sessionId: params.get("sessionId") ?? "",
    serviceCode: params.get("serviceCode") ?? "",
    phoneNumber: params.get("phoneNumber") ?? "",
    text: params.get("text") ?? "",
    networkCode: params.get("networkCode") ?? undefined,
  };
}

export function buildUssdResponse(message: string, end = false): string {
  const prefix = end ? "END" : "CON";
  return `${prefix} ${message}`;
}

export const AFRICA_TALKING_CALLBACK_ENV = {
  USERNAME: "AFRICASTALKING_USERNAME",
  API_KEY: "AFRICASTALKING_API_KEY",
};
