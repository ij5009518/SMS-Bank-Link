// Resend email integration via Replit Connectors
// Uses connection:conn_resend_01KKYV66XANXS3AFM3A2RFMHEC

import { Resend } from "resend";

const WEBSITE_URL = process.env.WEBSITE_URL || "https://textbanks.app";
const SMS_NUMBER = "(845) 689-0940";
const SMS_NUMBER_PLAIN = "8456890940";

let connectionSettings: { settings: { api_key: string; from_email?: string } } | null = null;

async function getCredentials(): Promise<{ apiKey: string; fromEmail: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (hostname && xReplitToken) {
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
    const fromEmail = "Text Banks <info@textbanks.com>";
    return { apiKey: connectionSettings.settings.api_key, fromEmail };
  }

  const envKey = process.env.RESEND_API_KEY;
  if (envKey) {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Text Banks <info@textbanks.com>";
    return { apiKey: envKey, fromEmail };
  }

  throw new Error("Resend not configured — set RESEND_API_KEY or connect Resend via Replit integrations");
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return { client: new Resend(apiKey), fromEmail };
}

export async function sendWelcomeEmail(to: string, firstName: string, phoneNumber: string, emailVerificationToken?: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();

    const { error } = await client.emails.send({
      from: fromEmail,
      to,
      subject: `Welcome to Text Banks, ${firstName} — your account is ready`,
      html: buildWelcomeHtml(firstName, phoneNumber, emailVerificationToken),
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

export async function sendEmailVerificationEmail(to: string, firstName: string, verificationToken: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const verifyUrl = `${WEBSITE_URL}/my-account?email_token=${verificationToken}`;

    const { error } = await client.emails.send({
      from: fromEmail,
      to,
      subject: "Verify your Text Banks email address",
      html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;"><tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);padding:28px 40px;">
        <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Text Banks</span>
      </td></tr>
      <tr><td style="padding:40px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">Verify your email, ${firstName}</h1>
        <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">Click the button below to confirm your email address. This link expires in 72 hours.</p>
        <a href="${verifyUrl}" style="display:block;background:#2563eb;color:#fff;text-align:center;padding:16px 24px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;margin-bottom:24px;">Verify My Email &rarr;</a>
        <p style="margin:0;font-size:12px;color:#94a3b8;">Or copy this link: <span style="color:#2563eb;">${verifyUrl}</span></p>
      </td></tr>
      <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">If you didn't create a Text Banks account, you can safely ignore this email.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
    });

    if (error) { console.error("[Email] Resend error (verify):", error); return false; }
    console.log(`[Email] Verification email sent to ${to}`);
    return true;
  } catch (err) {
    console.warn("[Email] Could not send verification email:", err instanceof Error ? err.message : err);
    return false;
  }
}

export async function sendDeviceVerificationEmail(to: string, firstName: string, code: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();

    const { error } = await client.emails.send({
      from: fromEmail,
      to,
      subject: `${code} — Text Banks device verification`,
      html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;"><tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);padding:28px 40px;">
        <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Text Banks</span>
        <span style="float:right;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);color:#fca5a5;font-size:11px;font-weight:700;letter-spacing:0.06em;border-radius:20px;padding:5px 12px;">NEW DEVICE</span>
      </td></tr>
      <tr><td style="padding:40px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">New device sign-in, ${firstName}</h1>
        <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">Someone is signing in to Text Banks from a new device or browser. If this was you, enter the code below. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1d4ed8;">Your verification code</p>
          <p style="margin:0;font-size:42px;font-weight:900;color:#1e3a8a;letter-spacing:8px;font-family:'Courier New',monospace;">${code}</p>
        </div>
        <div style="background:#fef9ec;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#92400e;">If you did not attempt to sign in, your password may be compromised. Change it immediately.</p>
        </div>
      </td></tr>
      <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">Text Banks &nbsp;·&nbsp; Read-only banking by SMS &nbsp;·&nbsp; <a href="${WEBSITE_URL}" style="color:#94a3b8;text-decoration:none;">textbanks.app</a></p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
    });

    if (error) { console.error("[Email] Resend error (device):", error); return false; }
    console.log(`[Email] Device verification email sent to ${to}`);
    return true;
  } catch (err) {
    console.warn("[Email] Could not send device verification email:", err instanceof Error ? err.message : err);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, firstName: string, resetUrl: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const { error } = await client.emails.send({
      from: fromEmail,
      to,
      subject: `Reset your Text Banks password`,
      html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;"><tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);padding:28px 40px;">
        <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Text Banks</span>
        <span style="float:right;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);color:#fca5a5;font-size:11px;font-weight:700;letter-spacing:0.06em;border-radius:20px;padding:5px 12px;">PASSWORD RESET</span>
      </td></tr>
      <tr><td style="padding:40px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">Reset your password, ${firstName}</h1>
        <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">We received a request to reset your Text Banks password. Click the button below — this link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:block;background:#2563eb;color:#fff;text-align:center;padding:16px 24px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;margin-bottom:24px;">Reset My Password &rarr;</a>
        <div style="background:#fef9ec;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-bottom:20px;">
          <p style="margin:0;font-size:13px;color:#92400e;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
        </div>
        <p style="margin:0;font-size:12px;color:#94a3b8;">Or copy this link: <span style="color:#2563eb;">${resetUrl}</span></p>
      </td></tr>
      <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">If you didn't create a Text Banks account, you can safely ignore this email.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
    });
    if (error) { console.error("[Email] Resend error (pw reset):", error); return false; }
    console.log(`[Email] Password reset email sent to ${to}`);
    return true;
  } catch (err) {
    console.warn("[Email] Could not send password reset email:", err instanceof Error ? err.message : err);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Sends a contact-form / bug-report submission to the admin inbox. */
export async function sendContactNotification(
  adminEmail: string,
  payload: { name: string; email?: string; subject?: string; message: string; type?: string },
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const type = payload.type || "contact";
    const subject = payload.subject?.trim() || "(no subject)";
    const replyTo = payload.email?.trim();

    const { error } = await client.emails.send({
      from: fromEmail,
      to: adminEmail,
      ...(replyTo ? { replyTo } : {}),
      subject: `[Text Banks ${type}] ${subject}`,
      html: `<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">
        <h2 style="margin:0 0 12px;">New ${escapeHtml(type)} submission</h2>
        <p style="margin:4px 0;"><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${escapeHtml(replyTo || "(not provided)")}</p>
        <p style="margin:4px 0;"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;"/>
        <p style="white-space:pre-wrap;font-size:14px;line-height:1.6;">${escapeHtml(payload.message)}</p>
      </body></html>`,
    });

    if (error) { console.error("[Email] Resend error (contact):", error); return false; }
    console.log(`[Email] Contact notification sent to ${adminEmail}`);
    return true;
  } catch (err) {
    console.warn("[Email] Could not send contact notification:", err instanceof Error ? err.message : err);
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

function buildWelcomeHtml(firstName: string, phoneNumber: string, verificationToken?: string): string {
  const verifyUrl = verificationToken ? `${WEBSITE_URL}/my-account?email_token=${verificationToken}` : null;
  const formattedPhone = phoneNumber.replace(/^1?(\d{3})(\d{3})(\d{4})$/, "+1 ($1) $2-$3");

  const steps = [
    {
      num: "1",
      title: "Link your bank account",
      desc: "Sign in to your dashboard and connect your bank via Teller — takes under 2 minutes.",
    },
    {
      num: "2",
      title: "Text BAL to get your balance",
      desc: `Send <strong style="font-family:monospace;color:#1d4ed8;">BAL</strong> from ${formattedPhone} to <strong>${SMS_NUMBER}</strong> and we'll reply instantly.`,
    },
    {
      num: "3",
      title: "Text TRANS for recent activity",
      desc: `Send <strong style="font-family:monospace;color:#1d4ed8;">TRANS</strong> to see your last 5 transactions. No app. No data plan needed.`,
    },
  ];

  const commands = [
    { cmd: "BAL", desc: "All account balances" },
    { cmd: "BAL checking", desc: "Balance for a specific account" },
    { cmd: "TRANS", desc: "Last 5 transactions" },
    { cmd: "TRANS 10", desc: "Last N transactions (up to 10)" },
    { cmd: "LAST", desc: "Most recent single transaction" },
    { cmd: "SPEND", desc: "Monthly spending by category" },
    { cmd: "LIMIT", desc: "Credit card limit & available credit" },
    { cmd: "HELP", desc: "Show all commands" },
    { cmd: "STOP", desc: "Unsubscribe from SMS" },
  ];

  const stepRows = steps
    .map(
      (s) => `
      <tr>
        <td style="padding:0 0 20px;" valign="top">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="40" valign="top">
                <div style="width:32px;height:32px;border-radius:50%;background:#1e40af;color:#fff;font-size:14px;font-weight:800;text-align:center;line-height:32px;">${s.num}</div>
              </td>
              <td style="padding-left:12px;" valign="top">
                <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#0f172a;">${s.title}</p>
                <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">${s.desc}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  const commandRows = commands
    .map(
      (c, i) => `
      <tr style="background:${i % 2 === 0 ? "#f8fafc" : "#ffffff"};">
        <td style="padding:10px 16px;font-family:'Courier New',monospace;font-size:13px;font-weight:700;color:#2563eb;width:140px;white-space:nowrap;">${c.cmd}</td>
        <td style="padding:10px 16px;font-size:13px;color:#475569;">${c.desc}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Welcome to Text Banks</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- ── Header ── -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);padding:32px 40px;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <div style="width:44px;height:44px;border-radius:12px;background:#2563eb;text-align:center;line-height:44px;display:inline-block;vertical-align:middle;">
                          <span style="color:#fff;font-size:22px;font-weight:900;line-height:44px;">&#8482;</span>
                        </div>
                      </td>
                      <td style="padding-left:12px;vertical-align:middle;">
                        <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Text Banks</span><br/>
                        <span style="color:#93c5fd;font-size:12px;font-weight:500;letter-spacing:0.04em;">BANKING BY SMS</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td align="right" valign="middle">
                  <span style="background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.4);color:#6ee7b7;font-size:11px;font-weight:700;letter-spacing:0.06em;border-radius:20px;padding:5px 12px;">ACCOUNT ACTIVE</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Hero ── -->
        <tr>
          <td style="padding:40px 40px 0;">
            <h1 style="margin:0 0 10px;font-size:28px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">Welcome, ${firstName}!</h1>
            <p style="margin:0 0 28px;font-size:16px;color:#64748b;line-height:1.7;">
              Your Text Banks account is live. Link your bank account and you'll be able to check balances and transactions from any phone — just by sending a text.
            </p>

            <!-- Verify Email CTA -->
            ${verifyUrl ? `<table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:14px;">
              <tr><td>
                <a href="${verifyUrl}"
                   style="display:block;background:#059669;color:#fff;text-align:center;padding:16px 24px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;">
                  &#10003;&nbsp; Verify My Email Address
                </a>
              </td></tr>
            </table>` : ""}

            <!-- Dashboard CTA -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:36px;">
              <tr>
                <td>
                  <a href="${WEBSITE_URL}/my-account"
                     style="display:block;background:#2563eb;color:#ffffff;text-align:center;padding:16px 24px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px;">
                    Open My Dashboard &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── SMS Number Box ── -->
        <tr>
          <td style="padding:0 40px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:14px;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#1d4ed8;">Text this number from your phone</p>
                  <p style="margin:0 0 8px;font-size:34px;font-weight:900;color:#1e3a8a;letter-spacing:2px;">${SMS_NUMBER}</p>
                  <p style="margin:0;font-size:13px;color:#3b82f6;">
                    Texts from <strong style="font-family:'Courier New',monospace;">${formattedPhone}</strong> are recognised automatically.
                  </p>
                </td>
                <td align="right" style="padding-right:24px;">
                  <a href="sms:+1${SMS_NUMBER_PLAIN}&body=BAL"
                     style="display:inline-block;background:#1d4ed8;color:#fff;font-size:13px;font-weight:700;padding:10px 18px;border-radius:8px;text-decoration:none;white-space:nowrap;">
                    Text BAL &#8250;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Getting Started ── -->
        <tr>
          <td style="padding:0 40px 36px;">
            <p style="margin:0 0 20px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">Getting Started</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${stepRows}
            </table>
          </td>
        </tr>

        <!-- ── Command Reference ── -->
        <tr>
          <td style="padding:0 40px 36px;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">SMS Command Reference</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
              <tr style="background:#f1f5f9;">
                <td style="padding:8px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">Command</td>
                <td style="padding:8px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;">What it does</td>
              </tr>
              ${commandRows}
            </table>
          </td>
        </tr>

        <!-- ── Website Link ── -->
        <tr>
          <td style="padding:0 40px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#0f172a;">Visit the Text Banks website</p>
                  <p style="margin:0 0 14px;font-size:13px;color:#64748b;line-height:1.6;">
                    Learn more about how Text Banks works, manage your account settings, and link additional bank accounts.
                  </p>
                  <a href="${WEBSITE_URL}"
                     style="color:#2563eb;font-size:13px;font-weight:600;text-decoration:none;">
                    ${WEBSITE_URL.replace("https://", "")} &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;line-height:1.8;">
              <strong style="color:#64748b;">Text Banks</strong> &nbsp;·&nbsp; Read-only banking by SMS<br/>
              You received this email because you signed up at
              <a href="${WEBSITE_URL}" style="color:#64748b;text-decoration:none;">${WEBSITE_URL.replace("https://", "")}</a>
            </p>
            <p style="margin:0;font-size:12px;color:#cbd5e1;">
              <a href="${WEBSITE_URL}/my-account" style="color:#94a3b8;text-decoration:none;">My Account</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="${WEBSITE_URL}/privacy" style="color:#94a3b8;text-decoration:none;">Privacy Policy</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="sms:+1${SMS_NUMBER_PLAIN}&body=STOP" style="color:#94a3b8;text-decoration:none;">Unsubscribe SMS</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
