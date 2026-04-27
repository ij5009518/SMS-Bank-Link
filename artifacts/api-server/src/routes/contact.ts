import { Router, type IRouter } from "express";
import { sendContactNotificationEmail } from "../lib/email.js";

const router: IRouter = Router();

// POST /api/contact — feedback / bug report / contact form
router.post("/", async (req, res) => {
  const { name, email, subject, message, type } = req.body as {
    name?: string; email?: string; subject?: string; message?: string; type?: string;
  };

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

  return res.json({ success: true, message: "Thank you! We'll get back to you soon." });
});

export default router;
