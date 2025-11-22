import nodemailer from "nodemailer";
import { env } from "../config/env";

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const hasSmtpConfig = () =>
  Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.EMAIL_FROM);

const createTransporter = () =>
  nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

let cachedTransporter: any | null = null;

const getTransporter = () => {
  if (!hasSmtpConfig()) {
    return null;
  }
  if (!cachedTransporter) {
    cachedTransporter = createTransporter();
  }
  return cachedTransporter;
};

export const sendEmail = async ({ to, subject, text, html }: SendEmailOptions) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.info(`[EMAIL:DEV] To: ${to} | Subject: ${subject} | Body: ${text}`);
    return;
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
};

export const sendOtpEmail = async (to: string, otpCode: string, purpose: string) => {
  const subject = `MÃ£ OTP ${purpose === "register" ? "Ä‘Äƒng kÃ½" : "Ä‘Äƒng nháº­p"}`;
  const minutes = env.OTP_TTL_MINUTES;
  const text = `MÃ£ OTP cá»§a báº¡n lÃ  ${otpCode}. MÃ£ sáº½ háº¿t háº¡n sau ${minutes} phÃºt.`;
  const html = `<p>MÃ£ OTP cá»§a báº¡n lÃ  <strong>${otpCode}</strong>.</p><p>MÃ£ sáº½ háº¿t háº¡n sau ${minutes} phÃºt.</p>`;

  await sendEmail({ to, subject, text, html });
};


