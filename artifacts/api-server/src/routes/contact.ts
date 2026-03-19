import { Router, type IRouter } from "express";
import { sendWelcomeEmail } from "../lib/email.js";

const router: IRouter = Router();

// POST /api/contact — feedback / bug report / contact form
router.post("/", async (req, res) => {
  const { name, email, subject, message, type } = req.body as {
    name?: string; email?: string; subject?: string; message?: string; type?: string;
  };

  if (!name?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "bad_request", message: "Name and message are required." });
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@textbanks.com";
  const msgType = type || "contact";

  console.log(`[Contact] New ${msgType} from ${name} <${email}>: ${subject || "(no subject)"}`);
  console.log(`[Contact] Message: ${message.slice(0, 200)}`);

  // Try to send email notification to admin (fire-and-forget)
  sendWelcomeEmail(adminEmail, "Admin", "", undefined)
    .catch(() => {});

  return res.json({ success: true, message: "Thank you! We'll get back to you soon." });
});

export default router;
