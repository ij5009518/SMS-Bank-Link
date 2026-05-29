import { Router, type IRouter } from "express";
import { sendContactNotification } from "../lib/email.js";
import { rateLimit } from "../middlewares/rate-limit";

const router: IRouter = Router();

// POST /api/contact — feedback / bug report / contact form
router.post("/", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "contact" }), async (req, res) => {
  const { name, email, subject, message, type } = req.body as {
    name?: string; email?: string; subject?: string; message?: string; type?: string;
  };

  if (!name?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "bad_request", message: "Name and message are required." });
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@textbanks.com";
  const msgType = type || "contact";

  console.log(`[Contact] New ${msgType} from ${name} <${email ?? ""}>: ${subject || "(no subject)"}`);

  // Email the actual submission content to the admin inbox (fire-and-forget).
  sendContactNotification(adminEmail, {
    name: name.trim(),
    email: email?.trim(),
    subject: subject?.trim(),
    message: message.trim(),
    type: msgType,
  }).catch((e) => console.error("[Contact] Failed to send notification:", e instanceof Error ? e.message : e));

  return res.json({ success: true, message: "Thank you! We'll get back to you soon." });
});

export default router;
