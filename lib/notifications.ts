import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";

type Channel = "IN_APP" | "EMAIL";

export async function createNotification(opts: {
  userId: string;
  title: string;
  body: string;
  channel?: Channel;
}) {
  const { userId, title, body, channel = "IN_APP" } = opts;
  const notif = await prisma.notification.create({
    data: { userId, title, body, channel },
  });
  return notif;
}

type Domain = "booking" | "post" | "comment" | "reminder" | "event";

export async function notifyUser(userId: string, domain: Domain, title: string, body: string) {
  // load preferences
  const prefs = await prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  const map: Record<Domain, { inApp: boolean; email: boolean }> = {
    booking: { inApp: prefs.bookingInApp, email: prefs.bookingEmails },
    post: { inApp: prefs.postInApp, email: prefs.postEmails },
    comment: { inApp: prefs.postInApp, email: prefs.postEmails },
    reminder: { inApp: prefs.reminderInApp, email: prefs.reminderEmails },
    event: { inApp: prefs.postInApp, email: prefs.postEmails },
  };

  if (map[domain].inApp) {
    await createNotification({ userId, title, body, channel: "IN_APP" });
  }
  if (map[domain].email) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      await sendMail({ to: user.email, subject: title, html: `<p>${body}</p>` });
    }
  }
}
