import { Resend } from "resend";

/* ─── Resend client singleton ───────────────────────────────────────────────
   Resend uses HTTPS (port 443) — never blocked by Vercel or any cloud provider.
   API key is set via RESEND_API_KEY in environment variables.

   FROM address notes:
   - Without a verified domain: use "onboarding@resend.dev" (Resend sandbox)
   - With a verified domain:    use any address @yourdomain.com
   Set RESEND_FROM in .env to override the default sender address.
   ─────────────────────────────────────────────────────────────────────────── */
let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY must be set in environment variables.");
  }

  _resend = new Resend(apiKey);
  return _resend;
}

/* ─── sendMail helper ───────────────────────────────────────────────────── */
export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail(options: MailOptions): Promise<void> {
  const resend = getResend();

  // Use a verified domain address if configured, otherwise fall back to Resend sandbox
  const from =
    process.env.RESEND_FROM ?? "Campus ParkGuard UFPS <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
