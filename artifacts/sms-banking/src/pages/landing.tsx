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

const BANK_LOGOS: { name: string; domain: string; color: string; icon?: string }[] = [
  { name: "Chase",            domain: "chase.com",            color: "#117ACA", icon: "chase" },
  { name: "Bank of America",  domain: "bankofamerica.com",    color: "#E31837", icon: "bankofamerica" },
  { name: "Wells Fargo",      domain: "wellsfargo.com",       color: "#D71E28", icon: "wellsfargo" },
  { name: "Citibank",         domain: "citi.com",             color: "#003B70" },
  { name: "Capital One",      domain: "capitalone.com",       color: "#CC0000" },
  { name: "US Bank",          domain: "usbank.com",           color: "#0071CE" },
  { name: "TD Bank",          domain: "td.com",               color: "#34B233" },
  { name: "PNC Bank",         domain: "pnc.com",              color: "#F38400" },
  { name: "Discover",         domain: "discover.com",         color: "#F76619", icon: "discover" },
  { name: "American Express", domain: "americanexpress.com",  color: "#007BC1", icon: "americanexpress" },
  { name: "Goldman Sachs",    domain: "gs.com",               color: "#6699CC", icon: "goldmansachs" },
  { name: "Ally Bank",        domain: "ally.com",             color: "#7D2B8B" },
  { name: "Charles Schwab",   domain: "schwab.com",           color: "#006DB3" },
  { name: "Fidelity",         domain: "fidelity.com",         color: "#65B32E" },
  { name: "Vanguard",         domain: "vanguard.com",         color: "#8B0000" },
  { name: "SoFi",             domain: "sofi.com",             color: "#00A2D4" },
  { name: "USAA",             domain: "usaa.com",             color: "#00406B" },
  { name: "Navy Federal",     domain: "navyfederal.org",      color: "#003F87" },
  { name: "Truist",           domain: "truist.com",           color: "#5C068C" },
  { name: "Fifth Third",      domain: "53.com",               color: "#1B4F72" },
  { name: "Regions Bank",     domain: "regions.com",          color: "#007B40" },
  { name: "KeyBank",          domain: "key.com",              color: "#CC0000" },
  { name: "Huntington",       domain: "huntington.com",       color: "#00843D" },
  { name: "Citizens Bank",    domain: "citizensbank.com",     color: "#007A4C" },
  { name: "BMO",              domain: "bmo.com",              color: "#0079C1" },
  { name: "Chime",            domain: "chime.com",            color: "#1EC677" },
  { name: "Robinhood",        domain: "robinhood.com",        color: "#00C805", icon: "robinhood" },
  { name: "PayPal",           domain: "paypal.com",           color: "#003087", icon: "paypal" },
  { name: "Venmo",            domain: "venmo.com",            color: "#008CFF", icon: "venmo" },
  { name: "Cash App",         domain: "cash.app",             color: "#00D64F", icon: "cashapp" },
  { name: "Revolut",          domain: "revolut.com",          color: "#0075EB", icon: "revolut" },
  { name: "Visa",             domain: "visa.com",             color: "#1A1F71", icon: "visa" },
  { name: "Mastercard",       domain: "mastercard.com",       color: "#EB001B", icon: "mastercard" },
  { name: "Wealthfront",      domain: "wealthfront.com",      color: "#006B54" },
  { name: "Betterment",       domain: "betterment.com",       color: "#0083CF" },
  { name: "Klarna",           domain: "klarna.com",           color: "#FFB3C7", icon: "klarna" },
];

function BankLogoIcon({ bank }: { bank: typeof BANK_LOGOS[0] }) {
  if (bank.icon) {
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
  return (
    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-slate-50 border border-slate-100">
      <img
        src={`https://logo.clearbit.com/${bank.domain}?size=64`}
        alt={bank.name}
        className="w-7 h-7 object-contain"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = "none";
          const parent = target.parentElement!;
          parent.style.backgroundColor = bank.color;
          parent.innerHTML = `<span style="color:white;font-size:10px;font-weight:700;line-height:1">${bank.name.slice(0, 2).toUpperCase()}</span>`;
        }}
      />
    </div>
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
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 md:px-6 py-20 md:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-blue-200 uppercase tracking-widest">
                  Banking by SMS
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-white leading-[1.08] tracking-tight mb-6">
                Check your balance with a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  text message.
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-lg">
                No smartphone. No data plan. No app. Link your bank account once and text{" "}
                <span className="font-mono text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded text-sm">BAL</span>{" "}
                or{" "}
                <span className="font-mono text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded text-sm">TRANS</span>{" "}
                from any phone.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-12 text-base font-semibold shadow-lg shadow-blue-900/40 group"
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/my-account">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl px-8 h-12 text-base"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-6">
                {[
                  { icon: ShieldCheck, text: "Read-only access" },
                  { icon: Lock, text: "Bank-grade security" },
                  { icon: Zap, text: "Instant replies" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-slate-400">
                    <Icon className="w-4 h-4 text-emerald-400" />
                    {text}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Phone mockup */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="flex justify-center lg:justify-end"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600/20 rounded-[3rem] blur-2xl scale-90 translate-y-4" />
                <div className="relative w-[300px] bg-slate-800 rounded-[2.5rem] p-3.5 shadow-2xl border border-slate-700/60">
                  <div className="bg-slate-900 rounded-[2rem] overflow-hidden">
                    {/* Status bar */}
                    <div className="bg-slate-900 px-6 pt-4 pb-2 flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-medium">9:41 AM</span>
                      <div className="flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-emerald-400" />
                        <div className="w-1 h-1 rounded-full bg-emerald-400" />
                        <div className="w-1 h-1 rounded-full bg-emerald-400" />
                      </div>
                    </div>
                    {/* Chat header */}
                    <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 text-center">
                      <p className="text-white font-semibold text-sm">Text Banks</p>
                      <p className="text-xs text-slate-400">(845) 689-0940</p>
                    </div>
                    {/* Messages */}
                    <div className="bg-slate-900 min-h-[280px] p-4 flex flex-col gap-3">
                      {demoMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                            msg.isUser
                              ? "bg-blue-600 text-white self-end rounded-br-sm"
                              : "bg-slate-700 text-slate-100 self-start rounded-bl-sm"
                          }`}
                        >
                          {msg.text}
                        </div>
                      ))}
                      {demoLoading && (
                        <div className="bg-slate-700 self-start rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.1s]" />
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                        </div>
                      )}
                    </div>
                    {/* Input */}
                    <form
                      onSubmit={handleSimulate}
                      className="bg-slate-800 border-t border-slate-700 p-3 flex gap-2 items-center"
                    >
                      <input
                        className="flex-1 bg-slate-700 border-0 rounded-full px-4 py-2 text-xs text-white placeholder:text-slate-500 outline-none"
                        placeholder="Try BAL or TRANS…"
                        value={demoInput}
                        onChange={(e) => setDemoInput(e.target.value)}
                        disabled={demoLoading}
                      />
                      <button
                        type="submit"
                        disabled={!demoInput.trim() || demoLoading}
                        className="w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-full flex items-center justify-center shrink-0 transition-colors"
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

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="bg-slate-50 py-10 border-b border-slate-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-16">
            {[
              { value: "10,000+", label: "Supported banks" },
              { value: "100%", label: "Read-only access" },
              { value: "< 3 sec", label: "Average reply time" },
              { value: "Bank-grade", label: "TLS encryption" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-display font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bank Logos Marquee ── */}
      <section className="bg-white py-10 border-b border-slate-100 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Works with your bank</p>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          <div className="flex gap-3 marquee-track">
            {[...BANK_LOGOS, ...BANK_LOGOS].map((bank, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl border border-slate-200 bg-white shrink-0 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <BankLogoIcon bank={bank} />
                <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{bank.name}</span>
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
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full mb-4">
              How It Works
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
              Up and running in minutes
            </h2>
            <p className="text-slate-500 text-lg">
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
                color: "bg-blue-50 text-blue-700",
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
                  <div className="hidden md:block absolute top-9 left-full w-full h-px border-t-2 border-dashed border-slate-200 z-0 -translate-x-4" />
                )}
                <div className="relative bg-white border border-slate-200 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-xs font-bold text-slate-400 mb-4">{step.step}</div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${step.color}`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full mb-4">
              Why Text Banks
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
              Built for everyone, secured for all
            </h2>
            <p className="text-slate-500 text-lg">
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
                className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.accent}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SMS Command Reference ── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full mb-4">
                SMS Commands
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900">
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
                <span className="text-xs text-slate-500 ml-2">SMS Commands</span>
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
                      <p className="text-slate-500 text-xs mt-1">{desc}</p>
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
      <section className="py-24 bg-slate-50 border-t border-slate-200" id="pricing">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full mb-4">
              Pricing
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
              Transparent, simple pricing
            </h2>
            <p className="text-slate-500 text-lg">
              Start free. Upgrade when you need more.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Basic */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Basic</h3>
                <p className="text-slate-500 text-sm">For individuals getting started</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-display font-extrabold text-slate-900">$0</span>
                <span className="text-slate-500 text-base ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "Up to 2 linked accounts",
                  "50 SMS queries per month",
                  "Balance & transaction checks",
                  "Standard support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl h-11">
                  Start Free
                </Button>
              </Link>
            </div>

            {/* Plus */}
            <div className="bg-blue-700 rounded-2xl p-8 shadow-xl relative overflow-hidden flex flex-col">
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
                <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 rounded-xl h-11 font-semibold shadow-sm">
                  Get Plus
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-xl flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1">Pro</h3>
                <p className="text-slate-400 text-sm">For power users and families</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-display font-extrabold text-white">$9</span>
                <span className="text-slate-400 text-base ml-1">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "Unlimited linked accounts",
                  "Unlimited SMS queries",
                  "AI spending insights",
                  "Custom account nicknames",
                  "Multi-number support",
                  "White-glove onboarding",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-semibold shadow-sm">
                  Go Pro
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 bg-white border-t border-slate-100" id="faq">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full mb-4">
              FAQ
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
              Common questions
            </h2>
            <p className="text-slate-500 text-lg">
              Everything you need to know about Text Banks.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-slate-900 text-sm pr-4">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="py-24 bg-slate-50 border-t border-slate-200" id="contact">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-block text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full mb-4">
                Contact
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
                Get in touch
              </h2>
              <p className="text-slate-500">
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
                <h3 className="text-lg font-bold text-slate-900 mb-2">Message received!</h3>
                <p className="text-slate-500 text-sm">We'll get back to you within 24 hours.</p>
                <button
                  className="mt-5 text-sm text-blue-600 hover:underline"
                  onClick={() => setContactStatus("idle")}
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleContact} className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Your name"
                        className="pl-9 rounded-xl border-slate-200 h-11"
                        value={contactForm.name}
                        onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        className="pl-9 rounded-xl border-slate-200 h-11"
                        value={contactForm.email}
                        onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Message *</label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Textarea
                      placeholder="Tell us what's on your mind…"
                      className="pl-9 rounded-xl border-slate-200 min-h-[120px]"
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
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Register in under two minutes and start checking your balance by text today.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-10 h-13 text-base font-semibold shadow-lg shadow-blue-900/40 group"
            >
              Create Your Account
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
