// Resend email integration via Replit Connectors
// Uses connection:conn_resend_01KKYV66XANXS3AFM3A2RFMHEC

import { Resend } from "resend";

let connectionSettings: { settings: { api_key: string; from_email?: string } } | null = null;

async function getCredentials(): Promise<{ apiKey: string; fromEmail: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (hostname && xReplitToken) {
    // Running inside Replit — use the integration connector
    try {
      const data = await fetch(
        "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
        {
          headers: {
            Accept: "application/json",
            "X-Replit-Token": xReplitToken,
          },
        }
      ).then((res) => res.json()) as { items?: typeof connectionSettings[] };

      connectionSettings = data.items?.[0] ?? null;
    } catch (err) {
      console.warn("[Email] Failed to fetch Resend connector settings:", err instanceof Error ? err.message : err);
    }
  }

  if (connectionSettings?.settings?.api_key) {
    // Always use resend.dev sender — textbanks.com domain is not yet verified in Resend.
    // Switch to "Text Banks <noreply@textbanks.com>" once the domain is verified at resend.com/domains.
    const fromEmail = "Text Banks <onboarding@resend.dev>";
    return { apiKey: connectionSettings.settings.api_key, fromEmail };
  }

  // Fallback: manual RESEND_API_KEY env var (dev / self-hosted)
  const envKey = process.env.RESEND_API_KEY;
  if (envKey) {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Text Banks <onboarding@resend.dev>";
    return { apiKey: envKey, fromEmail };
  }

  throw new Error("Resend not configured — set RESEND_API_KEY or connect Resend via Replit integrations");
}

// WARNING: Never cache this client — tokens expire.
async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return { client: new Resend(apiKey), fromEmail };
}

export async function sendWelcomeEmail(to: string, firstName: string, phoneNumber: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();

    const { error } = await client.emails.send({
      from: fromEmail,
      to,
      subject: "Welcome to Text Banks — you're all set!",
      html: buildWelcomeHtml(firstName, phoneNumber),
    });

    if (error) {
      console.error("[Email] Resend API error:", error);
      return false;
    }

    console.log(`[Email] Welcome email sent to ${to}`);
    return true;
  } catch (err) {
    console.warn("[Email] Could not send welcome email:", err instanceof Error ? err.message : err);
    return false;
  }
}

export async function isEmailConfigured(): Promise<boolean> {
  try {
    await getCredentials();
    return true;
  } catch {
    return false;
  }
}

function buildWelcomeHtml(firstName: string, phoneNumber: string): string {
  const commands = [
    ["BAL", "Get all account balances"],
    ["BAL checking", "Balance for a specific account"],
    ["TRANS", "See recent transactions"],
    ["HELP", "Show all commands"],
    ["STOP", "Unsubscribe from SMS"],
  ];

  const commandRows = commands
    .map(
      ([cmd, desc], i) => `
      <tr style="background:${i % 2 === 0 ? "#f8fafc" : "#ffffff"};">
        <td style="padding:12px 16px;font-family:monospace;font-size:14px;font-weight:700;color:#2563eb;width:160px;">${cmd}</td>
        <td style="padding:12px 16px;font-size:14px;color:#475569;">${desc}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

        <tr>
          <td style="background:#0f172a;padding:28px 40px;text-align:center;">
            <span style="background:#2563eb;border-radius:10px;display:inline-block;width:40px;height:40px;line-height:40px;text-align:center;color:#fff;font-size:20px;font-weight:800;margin-right:10px;vertical-align:middle;">T</span>
            <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;vertical-align:middle;">Text Banks</span>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">Welcome, ${firstName}! 👋</h1>
            <p style="margin:0 0 24px;font-size:16px;color:#64748b;line-height:1.6;">
              Your Text Banks account is ready. Check your balance or transactions anytime by sending a text — no app needed.
            </p>

            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#1d4ed8;">Text this number from your phone</p>
              <p style="margin:0;font-size:30px;font-weight:800;color:#1e3a8a;letter-spacing:1px;">(845) 689-0940</p>
              <p style="margin:6px 0 0;font-size:14px;color:#3b82f6;">Commands sent from <strong>${phoneNumber}</strong> will be recognised automatically.</p>
            </div>

            <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0f172a;">SMS Commands</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:28px;">
              ${commandRows}
            </table>

            <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
              You can link your bank account anytime from your <a href="https://textbanks.app/my-account" style="color:#2563eb;text-decoration:none;font-weight:600;">account dashboard</a> to see real-time balances.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 40px;">
            <a href="https://textbanks.app/my-account" style="display:block;background:#2563eb;color:#ffffff;text-align:center;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;">
              Go to My Account →
            </a>
          </td>
        </tr>

        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.8;">
              Text Banks · Read-only banking by SMS<br/>
              You received this because you signed up at textbanks.app<br/>
              <a href="https://textbanks.app/privacy" style="color:#64748b;text-decoration:none;">Privacy Policy</a>
              &nbsp;·&nbsp;
              <a href="https://textbanks.app/my-account" style="color:#64748b;text-decoration:none;">Manage Account</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
