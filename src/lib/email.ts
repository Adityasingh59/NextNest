import { Resend } from "resend";

type Email = { to: string; subject: string; html: string; text: string };

/** Sends through Resend when configured; otherwise logs so local dev works without an account. */
export async function sendEmail(email: Email) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.info(`[email] RESEND_API_KEY not set. Would send to ${email.to}: ${email.subject}\n${email.text}`);
    return { delivered: false as const };
  }

  const from = process.env.EMAIL_FROM || "NextNest <onboarding@resend.dev>";
  const { error } = await new Resend(apiKey).emails.send({ from, ...email });

  if (error) {
    throw new Error(`Email delivery failed: ${error.message}`);
  }

  return { delivered: true as const };
}
