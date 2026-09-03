import nodemailer from "nodemailer";

export function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.EMAIL_FROM &&
      (process.env.SMTP_PORT || "587"),
  );
}

export function appUrl() {
  return (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  );
}

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
}

export async function sendMail(options: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  if (!isMailConfigured()) return false;
  const to = Array.isArray(options.to) ? options.to : [options.to];
  if (to.length === 0) return false;
  await transporter().sendMail({
    from: process.env.EMAIL_FROM,
    to: to.join(", "),
    subject: options.subject,
    text: options.text,
    html: options.html ?? `<p>${options.text.replace(/\n/g, "<br/>")}</p>`,
  });
  return true;
}
