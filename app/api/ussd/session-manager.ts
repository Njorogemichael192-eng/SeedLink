import { UssdSession } from "@/generated/prisma-client/models";
import { cleanupExpiredUssdSessions, getActiveUssdSession, upsertUssdSession } from "@/lib/db";

export interface SessionState extends UssdSession {}

export async function loadSession(sessionId: string, phoneNumber: string) {
  await cleanupExpiredUssdSessions();
  const existing = await getActiveUssdSession(sessionId);
  if (existing && existing.isActive) {
    return existing;
  }
  return upsertUssdSession({ sessionId, phoneNumber, currentFlow: null, currentStep: null, data: null, isActive: true });
}

export async function updateSession(params: {
  sessionId: string;
  phoneNumber: string;
  ussdUserId?: string | null;
  currentFlow?: string | null;
  currentStep?: string | null;
  data?: unknown;
  isActive?: boolean;
}) {
  return upsertUssdSession(params);
}
