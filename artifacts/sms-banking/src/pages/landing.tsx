import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  MessageSquareText,
  ShieldCheck,
  Smartphone,
  WifiOff,
  Banknote,
  Send,
  CheckCircle2,
  ArrowRight,
  Building2,
  Lock,
  Zap,
  ChevronDown,
  Star,
  Mail,
  User,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PublicLayout } from "@/components/layout/PublicLayout";

const SI_CDN = "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons";

const BANK_LOGOS: { name: string; color: string; icon: string }[] = [
  { name: "Chase",            color: "#117ACA", icon: "chase" },
  { name: "Bank of America",  color: "#E31837", icon: "bankofamerica" },
  { name: "Wells Fargo",      color: "#D71E28", icon: "wellsfargo" },
  { name: "Discover",         color: "#F76619", icon: "discover" },
  { name: "American Express", color: "#007BC1", icon: "americanexpress" },
  { name: "Goldman Sachs",    color: "#375EA2", icon: "goldmansachs" },
  { name: "PayPal",           color: "#003087", icon: "paypal" },
  { name: "Venmo",            color: "#008CFF", icon: "venmo" },
  { name: "Cash App",         color: "#00D64F", icon: "cashapp" },
  { name: "Revolut",          color: "#0075EB", icon: "revolut" },
  { name: "Robinhood",        color: "#00C805", icon: "robinhood" },
  { name: "Visa",             color: "#1A1F71", icon: "visa" },
  { name: "Mastercard",       color: "#EB001B", icon: "mastercard" },
  { name: "Klarna",           color: "#FF69A5", icon: "klarna" },
  { name: "Stripe",           color: "#635BFF", icon: "stripe" },
  { name: "Zelle",            color: "#6D1ED4", icon: "zelle" },
  { name: "Google Pay",       color: "#4285F4", icon: "googlepay" },
  { name: "Monzo",            color: "#E4465E", icon: "monzo" },
  { name: "N26",              color: "#00C896", icon: "n26" },
];

function BankLogoIcon({ bank }: { bank: typeof BANK_LOGOS[0] }) {
  return (
    <div
      className="w-7 h-7 shrink-0"
      style={{
        backgroundColor: bank.color,
        maskImage: `url(${SI_CDN}/${bank.icon}.svg)`,
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
        WebkitMaskImage: `url(${SI_CDN}/${bank.icon}.svg)`,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        WebkitMaskSize: "contain",
      } as React.CSSProperties}
    />
  );
}

const FAQ_ITEMS = [
  {
    q: "Is it safe to link my bank account?",
    a: "Yes. We use Teller, a bank-grade API with read-only access. We never see or store your login credentials, and it's architecturally impossible for us to move or transfer money.",
  },
  {
    q: "Which banks are supported?",
    a: "Over 10,000 US banks and credit unions are supported, including Chase, Bank of America, Wells Fargo, Citibank, Capital One, and most regional banks and credit unions.",
  },
  {
    q: "Do I need a smartphone to use Text Banks?",
    a: "No. Text Banks works on any mobile phone — from basic feature phones to the latest smartphones — using standard SMS. No internet or data plan required.",
  },
  {
    q: "How fast are replies?",
    a: "Most replies arrive in under 3 seconds. We process your text command, query your bank in real-time, and send the response back immediately.",
  },
  {
    q: "Can someone use my phone to access my accounts?",
    a: "Only the registered phone number can query your account. You can add a PIN for extra security. And remember — we're strictly read-only, so even if someone texts from your phone, they can't move money.",
  },
  {
    q: "How do I cancel?",
    a: "Just text STOP to unsubscribe instantly. You can also delete your account from your account settings at any time.",
  },
];

export default function LandingPage() {
  const [demoInput, setDemoInput] = useState("");
  const [demoMessages, setDemoMessages] = useState<{ text: string; isUser: boolean }[]>([
    { text: "Welcome to Text Banks. Reply HELP for commands.", isUser: false },
  ]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const [demoLoading, setDemoLoading] = useState(false);

  const handleContact = async (e: React.FormEvent) => {
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

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInput.trim() || demoLoading) return;
    const userMsg = demoInput.trim();
    setDemoMessages((prev) => [...prev, { text: userMsg, isUser: true }]);
    setDemoInput("");
    setDemoLoading(true);
    try {
      const res = await fetch("/api/sms/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: userMsg }),
      });
      const data = await res.json() as { response: string };
      setTimeout(() => {
        setDemoMessages((prev) => [...prev, { text: data.response, isUser: false }]);
        setDemoLoading(false);
      }, 500);
    } catch {
      setTimeout(() => {
        setDemoMessages((prev) => [...prev, { text: "Something went wrong. Please try again.", isUser: false }]);
        setDemoLoading(false);
      }, 500);
    }
  };

  return (
    <PublicLayout>
      {/* ── Hero ── */}
      <section className="relative bg-[#0B0C0F] overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-white/5 to-transparent" />

        <div className="container mx-auto px-4 md:px-6 py-20 md:py-28 relative z-10">
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-white/60 uppercase tracking-[0.12em]">
                  Banking by SMS
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.02] mb-6">
                Check your balance
                <br />
                with a{" "}
                <span className="text-[#4D9BFF]">
                  text.
                </span>
              </h1>

              <p className="text-base text-white/50 mb-10 leading-[1.75] max-w-md">
                No smartphone. No data plan. No app. Link your bank once and text{" "}
                <code className="text-white/80 bg-white/8 border border-white/10 px-1.5 py-0.5 rounded text-sm font-mono">BAL</code>{" "}
                or{" "}
                <code className="text-white/80 bg-white/8 border border-white/10 px-1.5 py-0.5 rounded text-sm font-mono">TRANS</code>{" "}
                from any phone.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-[#2563EB] hover:bg-[#1D58D8] text-white rounded-lg px-7 h-11 text-sm font-semibold group border-0"
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
                <Link href="/my-account">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-white/60 hover:text-white hover:bg-white/8 rounded-lg px-7 h-11 text-sm"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-5 pt-10 border-t border-white/8">
                {[
                  { icon: ShieldCheck, text: "Read-only access" },
                  { icon: Lock, text: "Bank-grade security" },
                  { icon: Zap, text: "Instant replies" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-white/40">
                    <Icon className="w-3.5 h-3.5 text-white/30" />
                    {text}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Phone mockup */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex justify-center lg:justify-end"
            >
              <div className="relative">
                <div className="relative w-[288px] bg-[#161719] rounded-[2.25rem] p-3 shadow-2xl border border-white/10 ring-1 ring-white/5">
                  <div className="bg-[#0F1011] rounded-[1.75rem] overflow-hidden">
                    <div className="px-6 pt-4 pb-2 flex justify-between items-center">
                      <span className="text-[11px] text-white/30 font-medium tabular-nums">9:41 AM</span>
                      <div className="flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <div className="w-1 h-1 rounded-full bg-emerald-400" />
                      </div>
                    </div>
                    <div className="border-b border-white/6 px-4 py-3 text-center">
                      <p className="text-white/90 font-semibold text-sm">Text Banks</p>
                      <p className="text-[11px] text-white/30 mt-0.5">(845) 689-0940</p>
                    </div>
                    <div className="min-h-[280px] p-4 flex flex-col gap-3 bg-[#0F1011]">
                      {demoMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed ${
                            msg.isUser
                              ? "bg-[#2563EB] text-white self-end rounded-br-sm"
                              : "bg-[#1E2025] text-white/80 self-start rounded-bl-sm border border-white/6"
                          }`}
                        >
                          {msg.text}
                        </div>
                      ))}
                      {demoLoading && (
                        <div className="bg-[#1E2025] border border-white/6 self-start rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" />
                          <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:0.1s]" />
                          <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:0.2s]" />
                        </div>
                      )}
                    </div>
                    <form
                      onSubmit={handleSimulate}
                      className="border-t border-white/6 bg-[#161719] p-3 flex gap-2 items-center"
                    >
                      <input
                        className="flex-1 bg-white/5 border border-white/8 rounded-full px-4 py-2 text-[12px] text-white placeholder:text-white/25 outline-none focus:border-white/20 transition-colors"
                        placeholder="Try BAL or TRANS…"
                        value={demoInput}
                        onChange={(e) => setDemoInput(e.target.value)}
                        disabled={demoLoading}
                      />
                      <button
                        type="submit"
                        disabled={!demoInput.trim() || demoLoading}
                        className="w-8 h-8 bg-[#2563EB] hover:bg-[#1D58D8] disabled:opacity-30 rounded-full flex items-center justify-center shrink-0 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5 text-white" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/6" />
      </section>

      {/* ── Trust bar ── */}
      <section className="bg-[#F8F6F2] py-10 border-b border-[#E5E0D8]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-16">
            {[
              { value: "10,000+", label: "Supported banks" },
              { value: "100%", label: "Read-only access" },
              { value: "< 3 sec", label: "Average reply time" },
              { value: "Bank-grade", label: "TLS encryption" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-display font-bold text-[#0D0E12]">{stat.value}</p>
                <p className="text-sm text-[#7C7C8A] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bank Logos Marquee ── */}
      <section className="bg-[#F8F6F2] py-10 border-b border-[#EDE8E0] overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#9A9AA8]">Works with your bank</p>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F8F6F2] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F8F6F2] to-transparent z-10 pointer-events-none" />
          <div className="flex gap-3 marquee-track">
            {[...BANK_LOGOS, ...BANK_LOGOS].map((bank, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-[#E5E0D8] bg-white shrink-0 hover:border-[#D6CFC5] hover:shadow-sm transition-all"
              >
                <BankLogoIcon bank={bank} />
                <span className="text-sm font-semibold text-[#2C2C35] whitespace-nowrap">{bank.name}</span>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          .marquee-track {
            animation: marquee 40s linear infinite;
            width: max-content;
          }
          .marquee-track:hover { animation-play-state: paused; }
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 bg-[#FAFAF7]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-[#1D4ED8] bg-[#EBF2FF] px-3 py-1.5 rounded-full mb-4">
              How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[#0D0E12] mb-4">
              Up and running in minutes
            </h2>
            <p className="text-[#7C7C8A] text-lg">
              Three simple steps to access your finances from any mobile phone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                icon: Smartphone,
                title: "Register your number",
                desc: "Sign up on our secure web portal with your name and the phone number you'll use to send texts.",
                color: "bg-blue-50 text-[#1D4ED8]",
              },
              {
                step: "02",
                icon: Building2,
                title: "Link your bank",
                desc: "Connect securely via Teller. We request read-only access only — your credentials are never stored.",
                color: "bg-indigo-50 text-indigo-700",
              },
              {
                step: "03",
                icon: MessageSquareText,
                title: "Start texting",
                desc: "Text BAL for balances, TRANS for recent transactions, or STOP to instantly disconnect at any time.",
                color: "bg-emerald-50 text-emerald-700",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {i < 2 && (
                  <div className="hidden md:block absolute top-9 left-full w-full h-px border-t-2 border-dashed border-[#E5E0D8] z-0 -translate-x-4" />
                )}
                <div className="relative bg-white border border-[#E5E0D8] rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-xs font-bold text-[#9A9AA8] mb-4">{step.step}</div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${step.color}`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0D0E12] mb-2">{step.title}</h3>
                  <p className="text-[#7C7C8A] text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 bg-[#F8F6F2] border-y border-[#E5E0D8]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-[#1D4ED8] bg-[#EBF2FF] px-3 py-1.5 rounded-full mb-4">
              Why Text Banks
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[#0D0E12] mb-4">
              Built for everyone, secured for all
            </h2>
            <p className="text-[#7C7C8A] text-lg">
              Financial access shouldn't require a smartphone or a data plan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: WifiOff,
                title: "No Internet Required",
                desc: "Works over standard SMS on any mobile phone — from basic feature phones to the latest smartphones. No WiFi or data plan needed.",
                accent: "text-orange-600 bg-orange-50",
              },
              {
                icon: ShieldCheck,
                title: "Strictly Read-Only",
                desc: "Architecturally impossible to move money. Even if your phone is lost or stolen, your funds are completely safe. No transactions, ever.",
                accent: "text-emerald-600 bg-emerald-50",
              },
              {
                icon: Banknote,
                title: "All Your Accounts",
                desc: "Link checking, savings, and credit cards across multiple banks. Use BAL checking or BAL savings to query specific accounts by nickname.",
                accent: "text-blue-600 bg-blue-50",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white border border-[#E5E0D8] rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.accent}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0D0E12] mb-3">{feature.title}</h3>
                <p className="text-[#7C7C8A] leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SMS Command Reference ── */}
      <section className="py-24 bg-[#FAFAF7]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block text-xs font-bold uppercase tracking-widest text-[#1D4ED8] bg-[#EBF2FF] px-3 py-1.5 rounded-full mb-4">
                SMS Commands
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-[#0D0E12]">
                Simple commands. Instant answers.
              </h2>
            </div>

            <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl">
              <div className="border-b border-slate-800 px-6 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                </div>
                <span className="text-xs text-[#7C7C8A] ml-2">SMS Commands</span>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { cmd: "BAL", desc: "Get all account balances", resp: "Chase Checking ••••4521: $2,341.50\nAmEx Credit ••••9911: $891.20" },
                  { cmd: "BAL checking", desc: "Get balance of a specific account", resp: "Chase Checking ••••4521: $2,341.50" },
                  { cmd: "TRANS", desc: "View last 5 transactions", resp: "Mar 14 Starbucks: -$5.40\nMar 13 Payroll: +$2,100.00\n..." },
                  { cmd: "HELP", desc: "Show all commands", resp: "Text Banks Commands: BAL, TRANS, STOP..." },
                  { cmd: "STOP", desc: "Immediately unsubscribe", resp: "You have been unsubscribed." },
                ].map(({ cmd, desc, resp }) => (
                  <div key={cmd} className="grid md:grid-cols-3 gap-3 md:items-start border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                    <div>
                      <code className="text-blue-400 font-mono font-bold text-sm">{cmd}</code>
                      <p className="text-[#7C7C8A] text-xs mt-1">{desc}</p>
                    </div>
                    <div className="md:col-span-2">
                      <div className="bg-slate-800 rounded-lg px-3 py-2">
                        <p className="text-emerald-400 font-mono text-xs whitespace-pre-line leading-relaxed">{resp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 bg-[#F8F6F2] border-t border-[#E5E0D8]" id="pricing">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-[#1D4ED8] bg-[#EBF2FF] px-3 py-1.5 rounded-full mb-4">
              Pricing
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[#0D0E12] mb-4">
              Transparent, simple pricing
            </h2>
            <p className="text-[#7C7C8A] text-lg">
              Start free. Upgrade when you need more.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Basic */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-8 shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#0D0E12] mb-1">Basic</h3>
                <p className="text-[#7C7C8A] text-sm">For individuals getting started</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-display font-extrabold text-[#0D0E12]">$0</span>
                <span className="text-[#7C7C8A] text-base ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "Up to 2 linked accounts",
                  "50 SMS queries per month",
                  "Balance & transaction checks",
                  "Standard support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-[#3C3C4A]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full border-[#D6CFC5] text-[#2C2C35] hover:bg-[#F0ECE5] rounded-xl h-11">
                  Start Free
                </Button>
              </Link>
            </div>

            {/* Plus */}
            <div className="bg-[#1D4ED8] rounded-2xl p-8 shadow-xl relative overflow-hidden flex flex-col">
              <div className="absolute top-4 right-4 bg-white/15 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> POPULAR
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Plus</h3>
                <p className="text-blue-200 text-sm">For regular users who want more</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-display font-extrabold text-white">$4</span>
                <span className="text-blue-200 text-base ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "Up to 10 linked accounts",
                  "500 SMS queries per month",
                  "Spending categories",
                  "Balance alerts via SMS",
                  "Priority support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-blue-100">
                    <CheckCircle2 className="w-4 h-4 text-blue-300 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full bg-white text-[#1D4ED8] hover:bg-[#EBF2FF] rounded-xl h-11 font-semibold shadow-sm">
                  Get Plus
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-xl flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-transparent to-transparent pointer-events-none" />
              <div className="relative">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">Pro</h3>
                  <p className="text-[#9A9AA8] text-sm">For power users who want full control</p>
                </div>
                <div className="mb-8">
                  <span className="text-5xl font-display font-extrabold text-white">$9</span>
                  <span className="text-[#9A9AA8] text-base ml-1">/month</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    { label: "Real-time dashboard — total balance & credit debt across all accounts" },
                    { label: "AI spending breakdown by category (gas, food, home, etc.) — today & this month" },
                    { label: "Edit & create custom spending categories" },
                    { label: "Proactive SMS alerts — low balance, credit limit near max, transfer cleared & more" },
                    { label: "Unlimited linked accounts & SMS queries" },
                    { label: "Multi-number support" },
                  ].map(({ label }) => (
                    <li key={label} className="flex items-start gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      {label}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 font-semibold shadow-sm">
                    Go Pro
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 bg-[#FAFAF7] border-t border-[#EDE8E0]" id="faq">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-[#1D4ED8] bg-[#EBF2FF] px-3 py-1.5 rounded-full mb-4">
              FAQ
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-[#0D0E12] mb-4">
              Common questions
            </h2>
            <p className="text-[#7C7C8A] text-lg">
              Everything you need to know about Text Banks.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border border-[#E5E0D8] rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#F0ECE5] transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-[#0D0E12] text-sm pr-4">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#9A9AA8] shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-[#3C3C4A] leading-relaxed border-t border-[#EDE8E0] pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="py-24 bg-[#F8F6F2] border-t border-[#E5E0D8]" id="contact">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-block text-xs font-bold uppercase tracking-widest text-[#1D4ED8] bg-[#EBF2FF] px-3 py-1.5 rounded-full mb-4">
                Contact
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-[#0D0E12] mb-4">
                Get in touch
              </h2>
              <p className="text-[#7C7C8A]">
                Have a question, feedback, or want to report a bug? We'd love to hear from you.
              </p>
            </div>

            {contactStatus === "sent" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center"
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-[#0D0E12] mb-2">Message received!</h3>
                <p className="text-[#7C7C8A] text-sm">We'll get back to you within 24 hours.</p>
                <button
                  className="mt-5 text-sm text-blue-600 hover:underline"
                  onClick={() => setContactStatus("idle")}
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleContact} className="bg-white border border-[#E5E0D8] rounded-2xl p-8 shadow-sm space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#2C2C35] mb-1.5">Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9AA8]" />
                      <Input
                        placeholder="Your name"
                        className="pl-9 rounded-xl border-[#E5E0D8] h-11"
                        value={contactForm.name}
                        onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#2C2C35] mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9AA8]" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        className="pl-9 rounded-xl border-[#E5E0D8] h-11"
                        value={contactForm.email}
                        onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2C2C35] mb-1.5">Message *</label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-3 w-4 h-4 text-[#9A9AA8]" />
                    <Textarea
                      placeholder="Tell us what's on your mind…"
                      className="pl-9 rounded-xl border-[#E5E0D8] min-h-[120px]"
                      value={contactForm.message}
                      onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                {contactStatus === "error" && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    Something went wrong. Please try again.
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={contactStatus === "sending"}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-semibold"
                >
                  {contactStatus === "sending" ? "Sending…" : "Send Message"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 bg-[#0B0C0F] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-white">
            Ready to get started?
          </h2>
          <p className="text-white/40 text-lg mb-8 max-w-xl mx-auto">
            Register in under two minutes and start checking your balance by text today.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-[#2563EB] hover:bg-[#1D58D8] text-white rounded-lg px-8 h-11 text-sm font-semibold border-0 group"
            >
              Create Your Account
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
