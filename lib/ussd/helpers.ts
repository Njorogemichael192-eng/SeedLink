export function formatCon(message: string): string {
  return `CON ${message}`;
}

export function formatEnd(message: string): string {
  return `END ${message}`;
}

export function parseTextToSegments(text: string): string[] {
  if (!text) return [];
  return text.split("*").map((s) => s.trim());
}

export function isEmpty(value?: string | null) {
  return !value || value.trim() === "";
}

export function parseIntSafe(value: string): number {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? -1 : n;
}

export function sanitizeCounty(input: string): string {
  return input.trim();
}

export function normalizeMsisdn(phoneNumber: string): string {
  const digits = phoneNumber.replace(/[^0-9]/g, "");
  if (digits.startsWith("254")) return `+${digits}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `+254${digits}`;
  if (digits.startsWith("+254")) return digits;
  return `+${digits}`;
}
