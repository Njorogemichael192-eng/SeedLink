import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type GrowthFreq = "EVERY_3_DAYS" | "WEEKLY" | "EVERY_14_DAYS" | "MONTHLY";

function getIntervalMs(freq: GrowthFreq): number {
  switch (freq) {
    case "EVERY_3_DAYS":
      return 3 * MS_PER_DAY;
    case "WEEKLY":
      return 7 * MS_PER_DAY;
    case "EVERY_14_DAYS":
      return 14 * MS_PER_DAY;
    case "MONTHLY":
      return 30 * MS_PER_DAY;
  }
}

export async function setGrowthReminderFrequency(userId: string, freq: GrowthFreq | null) {
  if (!freq) {
    await prisma.user.update({
      where: { id: userId },
      data: { growthReminderFrequency: null },
    });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      growthReminderFrequency: freq,
      // reset last sent so the next cron run can send a reminder after a full interval
      growthReminderLastSentAt: null,
    },
  });
}

export async function runDueGrowthReminders() {
  const now = new Date();

  const users = await prisma.user.findMany({
    where: { growthReminderFrequency: { not: null } },
    select: {
      id: true,
      fullName: true,
      createdAt: true,
      growthReminderFrequency: true,
      growthReminderLastSentAt: true,
    },
  });

  for (const u of users) {
    const freq = u.growthReminderFrequency as GrowthFreq | null;
    if (!freq) continue;
    const interval = getIntervalMs(freq);
    const last = u.growthReminderLastSentAt ?? u.createdAt;
    const lastTime = last.getTime();
    if (now.getTime() - lastTime < interval) continue;

    const title = "Seedling growth reminder";
    const body = "Take a moment to check on your seedlings and record their growth in the app.";
    await notifyUser(u.id, "reminder", title, body);

    await prisma.user.update({
      where: { id: u.id },
      data: { growthReminderLastSentAt: now },
    });
  }
}
