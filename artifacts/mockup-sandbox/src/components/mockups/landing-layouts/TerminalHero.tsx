import React from "react";
import { Terminal, Zap, Lock, Phone, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export function TerminalHero() {
  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-slate-300 selection:bg-emerald-500/30">
      <style>{`
        @keyframes typing {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes blink {
          50% { border-color: transparent; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Terminal animation sequence */
        .typing-1 {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          border-right: 2px solid #34d399;
          animation: typing 0.5s steps(3, end) forwards, blink 1s step-end 2;
          width: 0;
        }
        
        .msg-1 {
          opacity: 0;
          animation: fade-in 0.3s ease-out 1.2s forwards;
        }
        
        .typing-2 {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          border-right: 2px solid transparent;
          animation: typing 0.8s steps(5, end) 2.5s forwards, blink 1s step-end infinite 3.3s;
          width: 0;
        }
        
        .msg-2 {
          opacity: 0;
          animation: fade-in 0.3s ease-out 3.8s forwards;
        }

        .cursor-blink {
          animation: blink 1s step-end infinite;
          border-right: 8px solid currentColor;
        }
        
        .float-1 { animation: float 6s ease-in-out infinite; }
        .float-2 { animation: float 8s ease-in-out infinite 1s; }
        .float-3 { animation: float 7s ease-in-out infinite 2s; }
        .float-4 { animation: float 9s ease-in-out infinite 1.5s; }
        
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>

      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold tracking-tight text-xl">
          <Terminal className="w-6 h-6 text-emerald-400" />
          TextBanks
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="#" className="text-zinc-400 hover:text-white transition-colors">How it works</a>
          <a href="#" className="text-zinc-400 hover:text-white transition-colors">Pricing</a>
          <a href="#" className="text-white hover:text-emerald-400 transition-colors">Sign In</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-12 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="text-center z-10 max-w-3xl mb-16 mt-8">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Banking by <span className="text-emerald-400 font-mono">SMS.</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-10">
            No smartphone. No data plan. Just text your bank.
          </p>
          <button className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-8 py-4 rounded-lg text-lg flex items-center gap-3 mx-auto transition-colors group">
            Try it yourself <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span className="w-2 h-5 bg-transparent inline-block ml-1 cursor-blink text-zinc-950"></span>
          </button>
        </div>

        {/* Giant Centered Phone */}
        <div className="relative z-10 w-full max-w-[340px] h-[680px] mx-auto">
          {/* Floating Chips */}
          <div className="absolute -left-20 top-20 bg-zinc-800/80 backdrop-blur-md border border-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-full flex items-center gap-2 float-1 shadow-xl">
            <Zap className="w-4 h-4 text-emerald-400" /> &lt; 3 sec
          </div>
          <div className="absolute -right-24 top-40 bg-zinc-800/80 backdrop-blur-md border border-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-full flex items-center gap-2 float-2 shadow-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Read-only
          </div>
          <div className="absolute -left-16 bottom-48 bg-zinc-800/80 backdrop-blur-md border border-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-full flex items-center gap-2 float-3 shadow-xl">
            <Phone className="w-4 h-4 text-emerald-400" /> Any phone
          </div>
          <div className="absolute -right-16 bottom-32 bg-zinc-800/80 backdrop-blur-md border border-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-full flex items-center gap-2 float-4 shadow-xl">
            <Lock className="w-4 h-4 text-emerald-400" /> 10,000+ banks
          </div>

          {/* Phone Body */}
          <div className="w-full h-full bg-zinc-900 border-[8px] border-zinc-800 rounded-[3rem] shadow-[0_0_60px_-15px_rgba(52,211,153,0.15)] relative overflow-hidden flex flex-col">
            {/* Top notch area */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-xl z-20" />
            
            {/* Header */}
            <div className="bg-zinc-800/50 pt-10 pb-3 px-6 text-center border-b border-zinc-800">
              <div className="text-emerald-400 font-mono text-xs mb-1">TextBanks</div>
              <div className="text-white font-medium text-sm">(845) 689-0940</div>
            </div>

            {/* Terminal Screen */}
            <div className="flex-1 bg-zinc-950 p-6 font-mono text-sm overflow-hidden flex flex-col gap-6">
              {/* User 1 */}
              <div>
                <div className="text-zinc-500 mb-1 text-xs">You</div>
                <div className="text-emerald-400"><span className="typing-1">BAL</span></div>
              </div>
              
              {/* System 1 */}
              <div className="msg-1">
                <div className="text-zinc-500 mb-1 text-xs">TextBanks</div>
                <div className="text-zinc-300">✓ Chase Checking: $1,247.89</div>
                <div className="text-zinc-300 mt-1">✓ Chase Savings: $4,500.00</div>
              </div>

              {/* User 2 */}
              <div className="mt-2">
                <div className="text-zinc-500 mb-1 text-xs">You</div>
                <div className="text-emerald-400"><span className="typing-2">TRANS</span></div>
              </div>

              {/* System 2 */}
              <div className="msg-2">
                <div className="text-zinc-500 mb-1 text-xs">TextBanks</div>
                <div className="text-zinc-300">Chase Checking (Last 3):</div>
                <div className="text-red-400 mt-1">-$43.20 Whole Foods</div>
                <div className="text-red-400 mt-1">-$12.50 Uber</div>
                <div className="text-emerald-400 mt-1">+$2,400 Payroll</div>
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-zinc-900 p-4 border-t border-zinc-800 pb-8">
              <div className="bg-zinc-950 border border-zinc-800 rounded-full h-10 px-4 flex items-center text-zinc-600 font-mono text-sm">
                Type message...
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Docs / Compare Section */}
      <section className="bg-white text-zinc-900 py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Like an API for your money.</h2>
            <p className="text-xl text-zinc-500">Simple commands. Readable responses.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-10">
              <div className="flex items-start gap-6">
                <div className="bg-zinc-950 text-emerald-400 font-mono px-4 py-2 rounded-lg font-bold shadow-lg mt-1 whitespace-nowrap">
                  BAL
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Check Balances</h3>
                  <p className="text-zinc-600">Get a quick snapshot of all your connected accounts instantly.</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="bg-zinc-950 text-emerald-400 font-mono px-4 py-2 rounded-lg font-bold shadow-lg mt-1 whitespace-nowrap">
                  TRANS
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Recent Activity</h3>
                  <p className="text-zinc-600">Review your latest transactions to spot fraud or check on a deposit.</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="bg-zinc-950 text-emerald-400 font-mono px-4 py-2 rounded-lg font-bold shadow-lg mt-1 whitespace-nowrap">
                  HELP
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Get Support</h3>
                  <p className="text-zinc-600">Forgot a command? Text HELP anytime for a full list of keywords.</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8 shadow-sm font-mono text-sm relative">
              <div className="absolute top-0 right-0 bg-zinc-200 text-zinc-500 text-xs px-3 py-1 rounded-bl-lg font-sans font-medium">Response Example</div>
              <div className="text-zinc-400 mb-4">// Response to TRANS</div>
              <div className="text-zinc-800 leading-loose">
                <div className="font-bold border-b border-zinc-200 pb-2 mb-2">Chase Checking (Last 5):</div>
                <div className="text-red-600 flex justify-between"><span>Netflix</span><span>-$12.99</span></div>
                <div className="text-red-600 flex justify-between"><span>Coffee Shop</span><span>-$4.50</span></div>
                <div className="text-red-600 flex justify-between"><span>Shell Station</span><span>-$62.10</span></div>
                <div className="text-emerald-600 flex justify-between"><span>Venmo Cashout</span><span>+$150.00</span></div>
                <div className="text-red-600 flex justify-between"><span>Electric Bill</span><span>-$105.00</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-zinc-50 py-32 px-4 border-t border-zinc-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-zinc-900">Simple Pricing</h2>
            <p className="text-xl text-zinc-500">No hidden fees. Unsubscribe with one text.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-3xl p-10 border border-zinc-200 shadow-sm flex flex-col">
              <h3 className="text-2xl font-bold text-zinc-900 mb-2">Basic</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-6xl font-extrabold text-zinc-900">$0</span>
                <span className="text-zinc-500 font-medium text-lg">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-zinc-600"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> 1 Bank Account</li>
                <li className="flex items-center gap-3 text-zinc-600"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> 20 SMS queries/mo</li>
                <li className="flex items-center gap-3 text-zinc-600"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Standard speed</li>
              </ul>
              <button className="w-full py-4 rounded-xl border-2 border-zinc-200 text-zinc-900 font-bold hover:border-zinc-300 transition-colors">
                Start Free
              </button>
            </div>

            {/* Premium */}
            <div className="bg-zinc-950 rounded-3xl p-10 border border-zinc-800 shadow-xl flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-zinc-950 text-xs font-bold px-4 py-1.5 rounded-bl-lg">POPULAR</div>
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-6xl font-extrabold text-white">$4</span>
                <span className="text-zinc-400 font-medium text-lg">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-zinc-300"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Unlimited Bank Accounts</li>
                <li className="flex items-center gap-3 text-zinc-300"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Unlimited SMS queries</li>
                <li className="flex items-center gap-3 text-zinc-300"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Priority routing</li>
                <li className="flex items-center gap-3 text-zinc-300"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Custom account aliases</li>
              </ul>
              <button className="w-full py-4 rounded-xl bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 transition-colors">
                Get Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 py-12 px-6 border-t border-zinc-900 text-center md:text-left">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-xl">
            <Terminal className="w-6 h-6 text-emerald-400" />
            TextBanks
          </div>
          <div className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} TextBanks Inc. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
