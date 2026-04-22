import nodemailer from "nodemailer";

/* ─── Transporter singleton ─────────────────────────────────────────────────
   Gmail SMTP requires an App Password (not the regular Gmail password).
   Steps to generate one:
     1. Go to myaccount.google.com → Security → 2-Step Verification (enable it)
     2. Go to myaccount.google.com → Security → App Passwords
     3. Select "Mail" + "Other (Custom name)" → name it "ParkGuard"
     4. Copy the 16-character password into EMAIL_PASS in .env
   ─────────────────────────────────────────────────────────────────────────── */
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      "EMAIL_USER and EMAIL_PASS must be set in .env to send emails. " +
        "Use a Gmail App Password (not your regular Gmail password)."
    );
  }

  _transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return _transporter;
}

/* ─── sendMail helper ───────────────────────────────────────────────────── */
export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail(options: MailOptions): Promise<void> {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Campus ParkGuard UFPS" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
