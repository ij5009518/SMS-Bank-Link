import React from 'react';
import './_group.css';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  Smartphone, 
  LockKeyhole, 
  MessageSquareText, 
  WifiOff, 
  Banknote, 
  CheckCircle2, 
  Send 
} from 'lucide-react';

export function SplitEdge() {
  return (
    <div className="min-h-screen font-sans bg-background text-foreground overflow-x-hidden selection:bg-primary/20">
      
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col lg:flex-row relative z-40 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {/* Left: Text */}
        <div className="w-full lg:w-1/2 bg-slate-900 text-white flex flex-col justify-center px-8 lg:px-20 py-24">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white border border-white/20 mb-8 text-sm font-medium backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              100% Read-Only Access
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Check your bank balance with a simple <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">text message.</span>
            </h1>
            
            <p className="text-xl text-slate-400 mb-10 leading-relaxed">
              No app required. No internet needed. Connect your bank securely and text commands like BAL or TRANS to get instant updates on your feature phone.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="rounded-none bg-blue-600 hover:bg-blue-700 text-white text-base h-14 px-8 border-0">
                Register Your Number
              </Button>
              <Button size="lg" variant="outline" className="rounded-none border-slate-700 text-slate-900 hover:text-slate-900 hover:bg-slate-100 text-base h-14 px-8 bg-white">
                View Admin Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Visual */}
        <div className="w-full lg:w-1/2 bg-slate-100 flex items-center justify-center p-8 lg:p-20 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          
          <div className="relative w-full max-w-sm">
            <div className="w-[320px] h-[640px] mx-auto bg-slate-900 rounded-[3rem] p-4 shadow-2xl relative border-8 border-slate-800 flex flex-col transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="absolute top-0 inset-x-0 h-6 flex justify-center">
                <div className="w-32 h-4 bg-slate-800 rounded-b-2xl"></div>
              </div>
              
              <div className="flex-1 bg-slate-50 rounded-[2rem] overflow-hidden flex flex-col relative mt-2">
                <div className="bg-slate-200/80 backdrop-blur p-4 pb-2 text-center border-b border-slate-300">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">TextBank</p>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
                  <div className="max-w-[85%] rounded-2xl p-3 text-sm bg-slate-200 text-slate-800 self-start rounded-bl-sm">
                    Text HELP to see commands.
                  </div>
                  <div className="max-w-[85%] rounded-2xl p-3 text-sm bg-blue-600 text-white self-end rounded-br-sm mt-4">
                    BAL checking
                  </div>
                  <div className="max-w-[85%] rounded-2xl p-3 text-sm bg-slate-200 text-slate-800 self-start rounded-bl-sm">
                    Checking (...1234): $4,250.00
                  </div>
                  <div className="max-w-[85%] rounded-2xl p-3 text-sm bg-blue-600 text-white self-end rounded-br-sm mt-4">
                    TRANS
                  </div>
                  <div className="max-w-[85%] rounded-2xl p-3 text-sm bg-slate-200 text-slate-800 self-start rounded-bl-sm">
                    Recent:
                    1. Target -$45.20
                    2. Starbucks -$4.50
                    3. Payroll +$2100.00
                  </div>
                </div>

                <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                  <div className="flex-1 rounded-full bg-slate-100 h-10 px-4 flex items-center text-sm text-slate-400">
                    Type a message...
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white">
                    <Send className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="min-h-screen flex flex-col lg:flex-row-reverse relative z-30 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
        {/* Left (in visual order): Text */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 lg:px-20 py-24">
          <div className="max-w-xl">
            <h2 className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-4">Process</h2>
            <h3 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-12">How it works</h3>
            
            <div className="space-y-12">
              <div className="flex gap-6 items-start">
                <div className="text-5xl font-black text-slate-200 leading-none">01</div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Register your phone</h4>
                  <p className="text-slate-600 leading-relaxed">Sign up on our secure portal and verify your mobile number. We tie your phone to your account securely.</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="text-5xl font-black text-slate-200 leading-none">02</div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Link your bank safely</h4>
                  <p className="text-slate-600 leading-relaxed">Connect via a secure portal. We never store your credentials and access is strictly read-only.</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="text-5xl font-black text-slate-200 leading-none">03</div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Text commands</h4>
                  <p className="text-slate-600 leading-relaxed">Send BAL for balances, TRANS for recent transactions, or STOP to instantly disconnect at any time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right (in visual order): Visual */}
        <div className="w-full lg:w-1/2 bg-slate-50 flex items-center justify-center p-8 lg:p-20 border-r border-slate-200">
          <div className="grid grid-cols-1 gap-8 w-full max-w-md">
            <div className="bg-white p-8 rounded-none border border-slate-200 shadow-xl flex items-center gap-6 transform -rotate-1">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-8 h-8" />
              </div>
              <div className="font-bold text-lg">Verify Device</div>
            </div>
            <div className="bg-slate-900 text-white p-8 rounded-none shadow-xl flex items-center gap-6 transform translate-x-8">
              <div className="w-16 h-16 bg-slate-800 text-blue-400 flex items-center justify-center shrink-0">
                <LockKeyhole className="w-8 h-8" />
              </div>
              <div className="font-bold text-lg">Secure Read-Only Link</div>
            </div>
            <div className="bg-blue-600 text-white p-8 rounded-none shadow-xl flex items-center gap-6 transform rotate-1">
              <div className="w-16 h-16 bg-blue-500 text-white flex items-center justify-center shrink-0">
                <MessageSquareText className="w-8 h-8" />
              </div>
              <div className="font-bold text-lg">Instant SMS Alerts</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="min-h-screen flex flex-col lg:flex-row relative z-20 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
        {/* Left: Text */}
        <div className="w-full lg:w-1/2 bg-slate-900 text-white flex flex-col justify-center px-8 lg:px-20 py-24">
          <div className="max-w-xl">
            <h2 className="text-sm font-bold tracking-widest text-blue-400 uppercase mb-4">Features</h2>
            <h3 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-12">Built for accessibility</h3>
            
            <div className="space-y-10">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <WifiOff className="w-6 h-6 text-blue-400" />
                  <h4 className="text-2xl font-bold">No Data Required</h4>
                </div>
                <p className="text-slate-400 leading-relaxed pl-10">Works entirely over standard cellular SMS. No 4G/5G or WiFi needed. Perfect for rural areas or basic phone plans.</p>
              </div>
              
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <ShieldCheck className="w-6 h-6 text-blue-400" />
                  <h4 className="text-2xl font-bold">Strictly Read-Only</h4>
                </div>
                <p className="text-slate-400 leading-relaxed pl-10">Architected so money can never be moved via SMS. If your phone is lost or stolen, your funds remain absolutely secure.</p>
              </div>
              
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <Banknote className="w-6 h-6 text-blue-400" />
                  <h4 className="text-2xl font-bold">Multiple Accounts</h4>
                </div>
                <p className="text-slate-400 leading-relaxed pl-10">Link checking, savings, and credit cards. Use nicknames like 'BAL checking' or 'BAL savings' to query specific accounts instantly.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Visual */}
        <div className="w-full lg:w-1/2 bg-blue-600 flex flex-col items-center justify-center p-8 lg:p-20 text-white">
          <div className="max-w-md w-full">
             <div className="text-[12rem] font-black opacity-10 leading-none absolute top-1/2 -translate-y-1/2 text-white">SAFE</div>
             <div className="relative z-10 space-y-6">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8">
                  <div className="font-mono text-sm mb-2 text-blue-200">CONNECTION STATUS</div>
                  <div className="text-3xl font-bold flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span>
                    SECURE LINK
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 ml-8">
                  <div className="font-mono text-sm mb-2 text-blue-200">ENCRYPTION</div>
                  <div className="text-3xl font-bold">BANK-LEVEL</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 ml-16">
                  <div className="font-mono text-sm mb-2 text-blue-200">TRANSACTIONS</div>
                  <div className="text-3xl font-bold">READ-ONLY</div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="min-h-screen flex flex-col lg:flex-row-reverse relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
        {/* Left: Text */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 lg:px-20 py-24">
          <div className="max-w-xl w-full">
            <h2 className="text-sm font-bold tracking-widest text-slate-500 uppercase mb-4">Pricing</h2>
            <h3 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-12">Simple, transparent plans</h3>
            
            <div className="space-y-8">
              {/* Basic Plan */}
              <div className="border border-slate-200 p-8 flex flex-col sm:flex-row gap-6 justify-between items-start hover:border-slate-300 transition-colors">
                <div>
                  <h4 className="text-2xl font-bold mb-1">Basic</h4>
                  <div className="text-slate-500 mb-4">Perfect for getting started</div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Up to 2 linked accounts</li>
                    <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-blue-600" /> 50 SMS queries per month</li>
                  </ul>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-4xl font-black mb-4">$0<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                  <Button variant="outline" className="w-full rounded-none border-slate-300">Start Free</Button>
                </div>
              </div>

              {/* Premium Plan */}
              <div className="border-2 border-slate-900 bg-slate-50 p-8 flex flex-col sm:flex-row gap-6 justify-between items-start relative">
                <div className="absolute top-0 right-0 bg-slate-900 text-white text-xs font-bold px-3 py-1">RECOMMENDED</div>
                <div>
                  <h4 className="text-2xl font-bold mb-1">Premium</h4>
                  <div className="text-slate-500 mb-4">For power users</div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Unlimited linked accounts</li>
                    <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Unlimited SMS queries</li>
                    <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Custom nicknames</li>
                  </ul>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-4xl font-black mb-4">$4<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                  <Button className="w-full rounded-none bg-slate-900 text-white hover:bg-slate-800">Get Premium</Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Visual */}
        <div className="w-full lg:w-1/2 bg-slate-100 flex items-center justify-center p-8 lg:p-20 border-r border-slate-200">
          <div className="text-center space-y-8 max-w-sm">
            <div className="inline-flex w-24 h-24 rounded-full bg-slate-200 items-center justify-center mb-4">
              <Banknote className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-3xl font-bold text-slate-800">No hidden fees</h3>
            <p className="text-slate-500 leading-relaxed">
              We believe in transparent pricing. No setup fees, no cancellation fees, and no surprises on your phone bill. Upgrade or downgrade at any time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-8 lg:px-20 border-t border-slate-800 relative z-0">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-bold text-white tracking-widest uppercase text-xl">
            TextBank
          </div>
          <div className="flex gap-8 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} TextBank Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}
