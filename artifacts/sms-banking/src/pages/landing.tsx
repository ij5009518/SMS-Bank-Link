import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Send, ShieldCheck, Lock, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";

const MAX_VISIBLE_DEMO_MESSAGES = 6;

export default function LandingPage() {
  const [demoInput, setDemoInput] = useState("");
  const [demoMessages, setDemoMessages] = useState<{ text: string; isUser: boolean }[]>([
    { text: "Welcome to Text Banks. Reply HELP for commands.", isUser: false },
  ]);
  const [demoLoading, setDemoLoading] = useState(false);

  const appendDemoMessage = (text: string, isUser: boolean) => {
    setDemoMessages((prev) => [...prev, { text, isUser }].slice(-MAX_VISIBLE_DEMO_MESSAGES));
  };

  const handleSimulate = async (e: FormEvent) => {
    e.preventDefault();
    if (!demoInput.trim() || demoLoading) return;

    const userMsg = demoInput.trim();
    appendDemoMessage(userMsg, true);
    setDemoInput("");
    setDemoLoading(true);

    try {
      const res = await fetch("/api/sms/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: userMsg }),
      });
      const data = (await res.json()) as { response: string };
      setTimeout(() => {
        appendDemoMessage(data.response, false);
        setDemoLoading(false);
      }, 500);
    } catch {
      setTimeout(() => {
        appendDemoMessage("Something went wrong. Please try again.", false);
        setDemoLoading(false);
      }, 500);
    }
  };

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-[#0B0C0F]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />

        <div className="container relative z-10 mx-auto px-4 py-20 md:px-6 md:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="max-w-2xl"
            >
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60">Banking by SMS</span>
              </div>

              <h1 className="mb-6 text-5xl font-bold leading-[1.02] text-white md:text-6xl lg:text-7xl">
                Check your balance
                <br />
                with a <span className="text-[#4D9BFF]">text.</span>
              </h1>

              <p className="mb-10 max-w-md text-base leading-[1.75] text-white/50">
                No smartphone. No data plan. No app. Link your bank once and text <code className="rounded border border-white/10 bg-white/8 px-1.5 py-0.5 font-mono text-sm text-white/80">BAL</code> or <code className="rounded border border-white/10 bg-white/8 px-1.5 py-0.5 font-mono text-sm text-white/80">TRANS</code> from any phone.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/register">
                  <Button size="lg" className="group h-11 rounded-lg border-0 bg-[#2563EB] px-7 text-sm font-semibold text-white hover:bg-[#1D58D8]">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href="/my-account">
                  <Button size="lg" variant="ghost" className="h-11 rounded-lg px-7 text-sm text-white/60 hover:bg-white/8 hover:text-white">
                    Sign In
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex justify-center lg:justify-end"
            >
              <div className="relative w-[288px] rounded-[2.25rem] border border-white/10 bg-[#161719] p-3 shadow-2xl ring-1 ring-white/5">
                <div className="overflow-hidden rounded-[1.75rem] bg-[#0F1011]">
                  <div className="flex items-center justify-between px-6 pb-2 pt-4">
                    <span className="text-[11px] font-medium tabular-nums text-white/30">9:41 AM</span>
                    <div className="flex gap-1">
                      <div className="h-1 w-1 rounded-full bg-white/20" />
                      <div className="h-1 w-1 rounded-full bg-white/20" />
                      <div className="h-1 w-1 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                  <div className="border-b border-white/6 px-4 py-3 text-center">
                    <p className="text-sm font-semibold text-white/90">Text Banks</p>
                    <p className="mt-0.5 text-[11px] text-white/30">(845) 689-0940</p>
                  </div>
                  <div className="flex min-h-[280px] flex-col gap-3 bg-[#0F1011] p-4">
                    {demoMessages.map((msg, i) => (
                      <div
                        key={`${msg.text}-${i}`}
                        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed ${
                          msg.isUser
                            ? "self-end rounded-br-sm bg-[#2563EB] text-white"
                            : "self-start rounded-bl-sm border border-white/6 bg-[#1E2025] text-white/80"
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                    {demoLoading && (
                      <div className="flex gap-1 self-start rounded-2xl rounded-bl-sm border border-white/6 bg-[#1E2025] px-3.5 py-2.5">
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/30" />
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/30 [animation-delay:0.1s]" />
                        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/30 [animation-delay:0.2s]" />
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleSimulate} className="flex items-center gap-2 border-t border-white/6 bg-[#161719] p-3">
                    <input
                      className="flex-1 rounded-full border border-white/8 bg-white/5 px-4 py-2 text-[12px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/20"
                      placeholder="Try BAL or TRANS…"
                      value={demoInput}
                      onChange={(e) => setDemoInput(e.target.value)}
                      disabled={demoLoading}
                    />
                    <button
                      type="submit"
                      disabled={!demoInput.trim() || demoLoading}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB] transition-colors hover:bg-[#1D58D8] disabled:opacity-30"
                    >
                      <Send className="h-3.5 w-3.5 text-white" />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#E5E0D8] bg-[#F8F6F2] py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { icon: ShieldCheck, text: "Read-only access" },
              { icon: Lock, text: "Bank-grade security" },
              { icon: Zap, text: "Instant replies" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 rounded-full border border-[#E5E0D8] bg-white px-4 py-2 text-sm text-[#4B5563]">
                <Icon className="h-4 w-4 text-[#1D4ED8]" />
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[#E5E0D8] bg-[#FAFAF7] py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-bold text-[#0D0E12] md:text-3xl">See product details</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#6B7280] md:text-base">
              Need deeper guidance before signing up? Browse complete docs and support resources.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/faq">
                <Button variant="outline" className="h-11 rounded-lg border-[#D6CFC5] px-6 text-[#2C2C35] hover:bg-[#F0ECE5]">
                  View FAQ
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="h-11 rounded-lg border-[#D6CFC5] px-6 text-[#2C2C35] hover:bg-[#F0ECE5]">
                  Contact support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0B0C0F] py-20 text-white md:py-24">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="container relative z-10 mx-auto px-4 text-center md:px-6">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Ready to get started?</h2>
          <p className="mx-auto mb-8 max-w-xl text-base text-white/50 md:text-lg">
            Register in under two minutes and start checking your balance by text today.
          </p>
          <Link href="/register">
            <Button size="lg" className="group h-11 rounded-lg border-0 bg-[#2563EB] px-8 text-sm font-semibold text-white hover:bg-[#1D58D8]">
              Create Your Account
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
