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
  LockKeyhole
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useSimulateSms } from "@workspace/api-client-react";

export default function LandingPage() {
  const [demoInput, setDemoInput] = useState("");
  const [demoMessages, setDemoMessages] = useState<{text: string, isUser: boolean}[]>([
    { text: "Text HELP to see commands.", isUser: false }
  ]);

  const simulateMutation = useSimulateSms();

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInput.trim() || simulateMutation.isPending) return;

    const userMsg = demoInput.trim();
    setDemoMessages(prev => [...prev, { text: userMsg, isUser: true }]);
    setDemoInput("");

    try {
      const res = await simulateMutation.mutateAsync({ data: { userId: 1, command: userMsg } });
      setTimeout(() => {
        setDemoMessages(prev => [...prev, { text: res.response, isUser: false }]);
      }, 600); // slight delay for realism
    } catch (err) {
      setTimeout(() => {
        setDemoMessages(prev => [...prev, { text: "System error. Try again.", isUser: false }]);
      }, 600);
    }
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Hero abstract background" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground border border-border/50 mb-8 text-sm font-medium shadow-sm">
                <ShieldCheck className="w-4 h-4 text-primary" />
                100% Read-Only Access
              </div>
              
              <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
                Check your bank balance with a simple <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">text message.</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                No app required. No internet needed. Connect your bank securely and text commands like BAL or TRANS to get instant updates on your feature phone.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="rounded-full px-8 text-base h-14 hover-elevate shadow-lg shadow-primary/20">
                    Register Your Number
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button size="lg" variant="outline" className="rounded-full px-8 text-base h-14 bg-background/50 backdrop-blur hover-elevate">
                    View Admin Demo
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works & Interactive Demo */}
      <section className="py-24 bg-card relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-display font-bold mb-6">How it works</h2>
              <p className="text-muted-foreground mb-12 text-lg">
                We bridge the gap between modern banking and basic mobile phones, prioritizing security above all else.
              </p>

              <div className="space-y-8">
                {[
                  { icon: Smartphone, title: "1. Register your phone", desc: "Sign up on our secure portal and verify your mobile number." },
                  { icon: LockKeyhole, title: "2. Link your bank safely", desc: "Connect via a secure portal. We never store your credentials and access is read-only." },
                  { icon: MessageSquareText, title: "3. Text commands", desc: "Send BAL for balances, TRANS for recent transactions, or STOP to instantly disconnect." }
                ].map((step, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                      <p className="text-muted-foreground">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Interactive Phone Demo */}
            <div className="flex justify-center">
              <div className="w-[320px] h-[640px] bg-slate-900 rounded-[3rem] p-4 shadow-2xl relative border-8 border-slate-800 flex flex-col">
                <div className="absolute top-0 inset-x-0 h-6 flex justify-center">
                  <div className="w-32 h-4 bg-slate-800 rounded-b-2xl"></div>
                </div>
                
                <div className="flex-1 bg-slate-50 rounded-[2rem] overflow-hidden flex flex-col relative mt-2">
                  <div className="bg-slate-200/80 backdrop-blur p-4 pb-2 text-center border-b border-slate-300">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">TextBank</p>
                  </div>
                  
                  <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                    {demoMessages.map((msg, i) => (
                      <div key={i} className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.isUser ? 'bg-blue-600 text-white self-end rounded-br-sm' : 'bg-slate-200 text-slate-800 self-start rounded-bl-sm'}`}>
                        {msg.text}
                      </div>
                    ))}
                    {simulateMutation.isPending && (
                      <div className="bg-slate-200 text-slate-500 self-start rounded-2xl rounded-bl-sm p-3 text-sm flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200" />
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSimulate} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                    <Input 
                      className="rounded-full bg-slate-100 border-transparent h-10 text-sm focus-visible:ring-blue-500" 
                      placeholder="Try 'BAL' or 'TRANS'"
                      value={demoInput}
                      onChange={e => setDemoInput(e.target.value)}
                      disabled={simulateMutation.isPending}
                    />
                    <Button size="icon" className="rounded-full w-10 h-10 shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50" disabled={!demoInput.trim() || simulateMutation.isPending}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">Built for accessibility</h2>
            <p className="text-muted-foreground text-lg">
              Not everyone has a smartphone or reliable data. TextBank is designed for the millions who rely on basic mobile services.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: WifiOff, title: "No Data Required", desc: "Works entirely over standard cellular SMS. No 4G/5G or WiFi needed." },
              { icon: ShieldCheck, title: "Strictly Read-Only", desc: "Architected so money can never be moved. If your phone is lost, your funds remain secure." },
              { icon: Banknote, title: "Multiple Accounts", desc: "Link checking, savings, and credit cards. Use nicknames like 'BAL checking' to query specific accounts." }
            ].map((feature, i) => (
              <Card key={i} className="p-8 border-border/50 hover:border-primary/20 transition-colors shadow-sm bg-card hover-elevate">
                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-6 text-foreground">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Mock */}
      <section className="py-24 bg-slate-50 border-t border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">Simple Pricing</h2>
            <p className="text-muted-foreground">Transparent plans for individuals and families.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 border-border/50 shadow-sm bg-card">
              <h3 className="text-2xl font-bold mb-2">Basic</h3>
              <div className="text-4xl font-display font-extrabold mb-6">$0<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="w-5 h-5 text-primary" /> Up to 2 linked accounts</li>
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="w-5 h-5 text-primary" /> 50 SMS queries per month</li>
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="w-5 h-5 text-primary" /> Standard support</li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/register">Start Free</Link>
              </Button>
            </Card>

            <Card className="p-8 border-primary shadow-xl bg-card relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-primary" />
              <div className="absolute top-4 right-4 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</div>
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <div className="text-4xl font-display font-extrabold mb-6">$4<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="w-5 h-5 text-primary" /> Unlimited linked accounts</li>
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="w-5 h-5 text-primary" /> Unlimited SMS queries</li>
                <li className="flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="w-5 h-5 text-primary" /> Priority alerts & custom nicknames</li>
              </ul>
              <Button className="w-full" asChild>
                <Link href="/register">Get Premium</Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
