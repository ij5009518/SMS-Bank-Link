import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { CheckCircle2, Mail, MessageCircle, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function ContactPage() {
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleContact = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.message.trim()) return;

    setContactStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      if (res.ok) {
        setContactStatus("sent");
        setContactForm({ name: "", email: "", message: "" });
      } else {
        setContactStatus("error");
      }
    } catch {
      setContactStatus("error");
    }
  };

  return (
    <PublicLayout>
      <section className="bg-[#F8F6F2] py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-xl">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-[#0D0E12] md:text-4xl">Contact support</h1>
              <p className="mt-4 text-base text-[#6B7280]">
                Have a question, feedback, or bug report? Send us a message and we&apos;ll respond soon.
              </p>
            </div>

            {contactStatus === "sent" ? (
              <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
                <h2 className="mb-2 text-lg font-bold text-[#0D0E12]">Message received!</h2>
                <p className="text-sm text-[#7C7C8A]">We&apos;ll get back to you within 24 hours.</p>
                <button className="mt-5 text-sm text-blue-600 hover:underline" onClick={() => setContactStatus("idle")}>
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContact} className="mt-8 space-y-5 rounded-2xl border border-[#E5E0D8] bg-white p-8 shadow-sm">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#2C2C35]">Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9AA8]" />
                      <Input
                        placeholder="Your name"
                        className="h-11 rounded-xl border-[#E5E0D8] pl-9"
                        value={contactForm.name}
                        onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#2C2C35]">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9AA8]" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        className="h-11 rounded-xl border-[#E5E0D8] pl-9"
                        value={contactForm.email}
                        onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#2C2C35]">Message *</label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-[#9A9AA8]" />
                    <Textarea
                      placeholder="Tell us what&apos;s on your mind…"
                      className="min-h-[120px] rounded-xl border-[#E5E0D8] pl-9"
                      value={contactForm.message}
                      onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {contactStatus === "error" && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    Something went wrong. Please try again.
                  </p>
                )}

                <Button type="submit" disabled={contactStatus === "sending"} className="h-11 w-full rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-700">
                  {contactStatus === "sending" ? "Sending…" : "Send message"}
                </Button>
              </form>
            )}

            <div className="mt-8 text-center text-sm text-[#6B7280]">
              Need quick answers first?{" "}
              <Link href="/faq" className="font-medium text-blue-600 hover:underline">
                View FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
