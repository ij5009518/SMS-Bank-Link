import { Router, type IRouter } from "express";
import { sendContactNotificationEmail } from "../lib/email.js";

const router: IRouter = Router();
const ALLOWED_TYPES = new Set(["contact", "feedback", "bug", "support", "other"]);
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;
const GENERIC_SUCCESS_RESPONSE = {
  success: true,
  message: "Thanks for reaching out. We've received your message.",
};

// POST /api/contact — feedback / bug report / contact form
router.post("/", async (req, res) => {
  const requestId = buildRequestId();
  const { name, email, subject, message, type } = (req.body ?? {}) as {
    name?: string; email?: string; subject?: string; message?: string; type?: string;
  };

  try {
    const sanitized = sanitizeContactPayload({ name, email, subject, message, type });
    if (sanitized.ok === false) {
      console.warn("[Contact] Validation failed", {
        requestId,
        issues: sanitized.issues,
      });
      return res.status(400).json({ error: "bad_request", message: "Invalid contact request." });
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@textbanks.com";
    const sent = await sendContactNotificationEmail({
      to: adminEmail,
      senderName: sanitized.value.name,
      senderEmail: sanitized.value.email,
      subject: sanitized.value.subject,
      type: sanitized.value.type,
      message: sanitized.value.message,
    });

    if (!sent) {
      console.error("[Contact] Notification dispatch failed", {
        requestId,
        type: sanitized.value.type,
        hasEmail: Boolean(sanitized.value.email),
        subjectLength: sanitized.value.subject.length,
        messageLength: sanitized.value.message.length,
      });
    } else {
      console.log("[Contact] Submission accepted", {
        requestId,
        type: sanitized.value.type,
        hasEmail: Boolean(sanitized.value.email),
        subjectLength: sanitized.value.subject.length,
        messageLength: sanitized.value.message.length,
      });
    }
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim() || !type?.trim()) {
    return res.status(400).json({
      error: "bad_request",
      message: "Name, email, subject, message, and type are required.",
    });
  }

  const normalizedEmail = email.trim();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  if (!isValidEmail) {
    return res.status(400).json({
      error: "bad_request",
      message: "A valid email address is required.",
    });
  }

  const payload = {
    name: name.trim(),
    email: normalizedEmail,
    subject: subject.trim(),
    message: message.trim(),
    type: type.trim(),
  };

  const sent = await sendContactNotificationEmail(payload);
  if (!sent) {
    console.error("[Contact] Failed to process contact submission", {
      route: "/api/contact",
      type: payload.type,
      name: payload.name,
      email: payload.email || null,
      subject: payload.subject || null,
      messageLength: payload.message.length,
    });
    return res.status(502).json({ error: "email_delivery_failed", message: "Unable to process your request right now. Please try again shortly." });
  }

  console.log("[Contact] Contact submission processed successfully", {
    route: "/api/contact",
    type: payload.type,
    name: payload.name,
    email: payload.email || null,
    subject: payload.subject || null,
    messageLength: payload.message.length,
  });

    return res.status(200).json(GENERIC_SUCCESS_RESPONSE);
  } catch (err) {
    console.error("[Contact] Unexpected handler error", {
      requestId,
      error: err instanceof Error ? err.message : String(err),
    });
    return res.status(200).json(GENERIC_SUCCESS_RESPONSE);
  }
});

export default router;

type ContactInput = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  type?: string;
};

type SanitizedContact = {
  name: string;
  email: string;
  subject: string;
  message: string;
  type: string;
};

function sanitizeContactPayload(payload: ContactInput): { ok: true; value: SanitizedContact } | { ok: false; issues: string[] } {
  const issues: string[] = [];
  const name = sanitizePlainText(payload.name, MAX_NAME_LENGTH);
  const email = sanitizeEmail(payload.email);
  const subject = sanitizePlainText(payload.subject, MAX_SUBJECT_LENGTH);
  const message = sanitizeMessage(payload.message);
  const type = sanitizeType(payload.type);

  if (!name) issues.push("name_required");
  if (!message) issues.push("message_required");
  if (payload.email && !email) issues.push("email_invalid");

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: { name, email, subject, message, type } };
}

function sanitizePlainText(input: string | undefined, maxLength: number): string {
  if (typeof input !== "string") return "";
  return input.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeMessage(input: string | undefined): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

function sanitizeEmail(input: string | undefined): string {
  if (typeof input !== "string") return "";
  const email = input.trim().slice(0, MAX_EMAIL_LENGTH).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? email : "";
}

function sanitizeType(input: string | undefined): string {
  const normalized = sanitizePlainText(input, 32).toLowerCase();
  return ALLOWED_TYPES.has(normalized) ? normalized : "contact";
}

function buildRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
