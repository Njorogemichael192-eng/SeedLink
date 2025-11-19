import nodemailer from "nodemailer";

export type MailInput = { to: string; subject: string; html: string };

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null; // email disabled if missing config
  transporter = nodemailer.createTransport({ host, port, auth: { user, pass } });
  return transporter;
}

export async function sendMail({ to, subject, html }: MailInput) {
  const t = getTransporter();
  if (!t) return { ok: false, skipped: true };
  const from = process.env.FROM_EMAIL || "no-reply@seedlink.local";
  await t.sendMail({ from, to, subject, html });
  return { ok: true };
}
