import {
  MessageSquareText,
  ShieldCheck,
  Smartphone,
  WifiOff,
  Banknote,
  Send,
  CheckCircle2,
  LockKeyhole,
  ArrowRight,
  Database,
  Building2,
  TerminalSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import './_group.css';

export function CardStack() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header / Nav Card */}
        <Card className="rounded-2xl border-slate-200 shadow-sm p-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2 font-display font-bold text-xl tracking-tight text-slate-900">
            <MessageSquareText className="w-6 h-6 text-primary" />
            TextBank
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-primary transition-colors">How it works</a>
            <a href="#" className="hover:text-primary transition-colors">Features</a>
            <a href="#" className="hover:text-primary transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden sm:inline-flex rounded-full">Sign In</Button>
            <Button className="rounded-full">Get Started</Button>
          </div>
        </Card>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Hero Card */}
          <Card className="rounded-3xl border-0 shadow-lg p-8 md:p-12 lg:col-span-8 bg-primary text-white relative overflow-hidden flex flex-col justify-center min-h-[500px]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-8 text-sm font-medium backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-blue-300" />
                100% Read-Only Access
              </div>
              
              <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[1.1] mb-6">
                Check your bank balance with a simple text message.
              </h1>
              
              <p className="text-xl text-blue-100 mb-10 max-w-xl leading-relaxed">
                No app required. No internet needed. Connect your bank securely and text commands to get instant updates on any basic mobile phone.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button size="lg" className="rounded-full px-8 text-base h-14 bg-white text-primary hover:bg-slate-100 w-full sm:w-auto font-semibold">
                  Register Your Number
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 text-base h-14 border-white/30 text-white hover:bg-white/10 w-full sm:w-auto backdrop-blur-sm">
                  View Demo
                </Button>
              </div>
            </div>
          </Card>

          {/* Right Hero Cards */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Phone Demo Card */}
            <Card className="rounded-3xl border-slate-200 shadow-sm p-6 bg-white flex-1 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-[260px] h-[480px] bg-slate-900 rounded-[2.5rem] p-3 shadow-xl relative border-[6px] border-slate-800 flex flex-col">
                <div className="absolute top-0 inset-x-0 h-5 flex justify-center">
                  <div className="w-24 h-3 bg-slate-800 rounded-b-xl"></div>
                </div>
                
                <div className="flex-1 bg-slate-50 rounded-[1.8rem] overflow-hidden flex flex-col relative mt-1">
                  <div className="bg-slate-200/80 backdrop-blur p-3 pb-2 text-center border-b border-slate-300">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">TextBank</p>
                  </div>
                  
                  <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2">
                    <div className="bg-slate-200 text-slate-800 self-start rounded-2xl rounded-bl-sm p-2.5 text-xs max-w-[85%]">
                      Text HELP to see commands.
                    </div>
                    <div className="bg-blue-600 text-white self-end rounded-2xl rounded-br-sm p-2.5 text-xs max-w-[85%] mt-2">
                      BAL
                    </div>
                    <div className="bg-slate-200 text-slate-800 self-start rounded-2xl rounded-bl-sm p-2.5 text-xs max-w-[85%] mt-1 space-y-1">
                      <p>CHKG ...1234: $4,250.00</p>
                      <p>SAV ...5678: $12,400.00</p>
                      <p className="text-[10px] text-slate-500">Reply TRANS for history.</p>
                    </div>
                  </div>

                  <div className="p-2 bg-white border-t border-slate-200 flex gap-2">
                    <div className="flex-1 rounded-full bg-slate-100 border-transparent h-8 flex items-center px-3 text-xs text-slate-400">
                      Try 'BAL'
                    </div>
                    <div className="rounded-full w-8 h-8 shrink-0 bg-blue-600 flex items-center justify-center text-white">
                      <Send className="w-3 h-3 ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Trust Statement Card */}
            <Card className="rounded-3xl border-slate-200 shadow-sm p-6 bg-slate-900 text-white flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <LockKeyhole className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Read-Only. Always.</h3>
                <p className="text-slate-400 text-sm mt-1">We can never move your money.</p>
              </div>
            </Card>
          </div>
        </div>

        {/* How it Works - 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-3xl border-slate-200 shadow-sm p-8 bg-white relative overflow-hidden group hover:border-blue-200 transition-colors">
            <div className="absolute -right-4 -bottom-4 text-9xl font-display font-black text-slate-50 opacity-50 group-hover:text-blue-50 transition-colors pointer-events-none">1</div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Register phone</h3>
              <p className="text-slate-500 leading-relaxed">Sign up on our secure portal and verify your mobile number to get started.</p>
            </div>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-sm p-8 bg-white relative overflow-hidden group hover:border-blue-200 transition-colors">
            <div className="absolute -right-4 -bottom-4 text-9xl font-display font-black text-slate-50 opacity-50 group-hover:text-blue-50 transition-colors pointer-events-none">2</div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Link bank safely</h3>
              <p className="text-slate-500 leading-relaxed">Connect via Plaid. We never store your credentials and access is purely read-only.</p>
            </div>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-sm p-8 bg-white relative overflow-hidden group hover:border-blue-200 transition-colors">
            <div className="absolute -right-4 -bottom-4 text-9xl font-display font-black text-slate-50 opacity-50 group-hover:text-blue-50 transition-colors pointer-events-none">3</div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
                <MessageSquareText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Text commands</h3>
              <p className="text-slate-500 leading-relaxed">Send BAL for balances, TRANS for transactions, or STOP to instantly disconnect.</p>
            </div>
          </Card>
        </div>

        {/* Features Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 min-h-[400px]">
          {/* Large Card (spans 2x2) */}
          <Card className="rounded-3xl border-slate-200 shadow-sm p-8 bg-slate-900 text-white md:col-span-2 md:row-span-2 relative overflow-hidden flex flex-col justify-end">
            <div className="absolute top-8 right-8 w-64 h-64 bg-slate-800 rounded-full blur-3xl" />
            <div className="relative z-10 mt-auto">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md">
                <WifiOff className="w-7 h-7 text-blue-300" />
              </div>
              <h3 className="text-3xl font-display font-bold mb-4">No Data Required</h3>
              <p className="text-slate-300 text-lg leading-relaxed max-w-sm">
                Works entirely over standard cellular SMS. No 4G/5G, WiFi, or smartphone apps needed. Accessible anywhere you have a signal.
              </p>
            </div>
          </Card>

          {/* Medium Card 1 (spans 2 cols) */}
          <Card className="rounded-3xl border-slate-200 shadow-sm p-6 bg-blue-50 md:col-span-2 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <LockKeyhole className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Strictly Read-Only</h3>
              <p className="text-slate-600">Architected so money can never be moved. If your phone is lost, your funds remain absolutely secure.</p>
            </div>
          </Card>

          {/* Medium Card 2 (spans 1 col) */}
          <Card className="rounded-3xl border-slate-200 shadow-sm p-6 bg-white md:col-span-1 flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
              <Banknote className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2 mt-auto">Multiple Accounts</h3>
            <p className="text-sm text-slate-500">Link checking, savings, and credit cards with custom nicknames.</p>
          </Card>

          {/* Small Stat Cards (stacked in 1 col) */}
          <div className="md:col-span-1 grid grid-rows-2 gap-6">
            <Card className="rounded-3xl border-slate-200 shadow-sm p-5 bg-white flex flex-col justify-center items-center text-center">
              <TerminalSquare className="w-6 h-6 text-primary mb-2" />
              <div className="font-display font-bold text-2xl">6+</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">SMS Commands</div>
            </Card>
            <Card className="rounded-3xl border-slate-200 shadow-sm p-5 bg-white flex flex-col justify-center items-center text-center">
              <Building2 className="w-6 h-6 text-primary mb-2" />
              <div className="font-display font-bold text-2xl">50+</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Supported Banks</div>
            </Card>
          </div>
        </div>

        {/* Pricing & Trust Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Pricing Cards */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Basic Pricing Card */}
            <Card className="rounded-3xl border-slate-200 shadow-sm p-8 bg-white flex flex-col">
              <h3 className="text-xl font-bold mb-2">Basic</h3>
              <div className="text-5xl font-display font-extrabold mb-6">$0<span className="text-lg text-slate-500 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" /> 
                  <span>Up to 2 linked accounts</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" /> 
                  <span>50 SMS queries per month</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" /> 
                  <span>Standard community support</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full rounded-full h-12 font-semibold">
                Start Free
              </Button>
            </Card>

            {/* Premium Pricing Card */}
            <Card className="rounded-3xl border-0 shadow-lg p-8 bg-slate-900 text-white relative flex flex-col overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-400 to-indigo-500" />
              <div className="absolute top-6 right-6 bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">PRO</div>
              
              <h3 className="text-xl font-bold mb-2">Premium</h3>
              <div className="text-5xl font-display font-extrabold mb-6">$4<span className="text-lg text-slate-400 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" /> 
                  <span>Unlimited linked accounts</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" /> 
                  <span>Unlimited SMS queries</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" /> 
                  <span>Priority alerts & custom nicknames</span>
                </li>
              </ul>
              <Button className="w-full rounded-full h-12 bg-white text-slate-900 hover:bg-slate-100 font-bold">
                Get Premium
              </Button>
            </Card>
          </div>

          {/* Trust Row / Footer Cards */}
          <div className="lg:col-span-4 flex flex-col gap-4 justify-center">
            <Card className="rounded-2xl border-slate-200 shadow-sm p-4 bg-white flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-semibold text-slate-700">Bank-grade encryption</span>
            </Card>
            
            <Card className="rounded-2xl border-slate-200 shadow-sm p-4 bg-white flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <LockKeyhole className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-semibold text-slate-700">Read-only by design</span>
            </Card>
            
            <Card className="rounded-2xl border-slate-200 shadow-sm p-4 bg-white flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="font-semibold text-slate-700">Never stores credentials</span>
            </Card>
          </div>

        </div>
        
        {/* Simple Footer Note */}
        <div className="text-center py-8 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} TextBank. A secure bridge for basic mobile banking.</p>
        </div>

      </div>
    </div>
  );
}
