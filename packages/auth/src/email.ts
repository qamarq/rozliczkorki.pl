import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "RozliczKorki <noreply@rozliczkorki.pl>";

let client: Resend | null = null;

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  client ??= new Resend(apiKey);
  return client;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const resend = getClient();

  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping send to ${to}: "${subject}"\n${text}`,
    );
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    console.error("[email] failed to send", { to, subject, error });
    throw new Error(error.message);
  }
}

export function actionEmail({
  heading,
  intro,
  buttonLabel,
  url,
  outro,
}: {
  heading: string;
  intro: string;
  buttonLabel: string;
  url: string;
  outro: string;
}) {
  const html = `<!doctype html>
<html lang="pl">
  <body style="margin:0;padding:24px;background:#0b0f17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f8fafc;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#1a2230;border-radius:14px;">
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#818cf8;">RozliczKorki</p>
          <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">${heading}</h1>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#94a3b8;">${intro}</p>
          <a href="${url}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#6366f1;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${buttonLabel}</a>
          <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">${outro}</p>
          <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#64748b;word-break:break-all;">${url}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${heading}\n\n${intro}\n\n${url}\n\n${outro}`;

  return { html, text };
}
