import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !port || !user || !password) {
    throw new Error('SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD non configurés');
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465, // 465 = SSL implicite, 587 = STARTTLS
    auth: { user, pass: password },
  });

  return transporter;
}

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  await getTransporter().sendMail({ from, to, subject, text });
}
