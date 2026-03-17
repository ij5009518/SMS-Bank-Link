const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Text Banks <noreply@textbanks.app>";

if (!RESEND_API_KEY) {
  console.warn("[Email] RESEND_API_KEY not set — welcome emails will be skipped");
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn(`[Email] Skipping email to ${to} — no API key configured`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[Email] Resend API error ${res.status}: ${body}`);
      return false;
    }

    const data = await res.json() as { id?: string };
    console.log(`[Email] Sent to ${to} — ID: ${data.id}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send:", err instanceof Error ? err.message : err);
    return false;
  }
}

export async function sendWelcomeEmail(to: string, firstName: string, phoneNumber: string): Promise<boolean> {
  const subject = "Welcome to Text Banks — you're all set!";
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Text Banks</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:12px;">
              <div style="background:#2563eb;border-radius:10px;width:40px;height:40px;display:inline-block;text-align:center;line-height:40px;">
                <span style="color:#fff;font-size:20px;font-weight:800;">T</span>
              </div>
              <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Text Banks</span>
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">Welcome, ${firstName}! 👋</h1>
            <p style="margin:0 0 24px;font-size:16px;color:#64748b;line-height:1.6;">
              Your Text Banks account is ready. You can now check your bank balance and recent transactions by simply sending a text message.
            </p>

            <!-- Highlight box -->
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1d4ed8;">Your SMS Number</p>
              <p style="margin:0;font-size:28px;font-weight:800;color:#1e3a8a;letter-spacing:1px;">(845) 689-0940</p>
              <p style="margin:6px 0 0;font-size:14px;color:#3b82f6;">Text commands to this number from <strong>${phoneNumber}</strong></p>
            </div>

            <!-- Commands -->
            <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#0f172a;">SMS Commands</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
              ${[
                ["BAL", "Get all account balances"],
                ["BAL checking", "Get balance for a specific account"],
                ["TRANS", "See recent transactions"],
                ["HELP", "Show all commands"],
                ["STOP", "Unsubscribe from SMS"],
              ].map(([cmd, desc], i) => `
              <tr style="background:${i % 2 === 0 ? "#f8fafc" : "#ffffff"};">
                <td style="padding:12px 16px;font-family:monospace;font-size:14px;font-weight:700;color:#2563eb;width:140px;">${cmd}</td>
                <td style="padding:12px 16px;font-size:14px;color:#475569;">${desc}</td>
              </tr>`).join("")}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 40px 40px;">
            <a href="https://textbanks.app/my-account" style="display:block;background:#2563eb;color:#ffffff;text-align:center;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;">
              View My Account →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#94a3b8;">
              Text Banks · Read-only banking by SMS<br />
              You received this because you signed up at textbanks.app<br />
              <a href="https://textbanks.app/privacy" style="color:#64748b;">Privacy Policy</a> · 
              <a href="https://textbanks.app/my-account" style="color:#64748b;">Manage Account</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();

  return sendEmail(to, subject, html);
}

export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY;
}
