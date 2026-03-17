import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  Lock, 
  Zap, 
  Users, 
  Globe,
  Smartphone,
  Server,
  KeyRound,
  FileBadge2
} from 'lucide-react';

export function TheProof() {
  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-900 selection:bg-blue-200">
      
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Text Banks</span>
        </div>
        <Button className="bg-white text-slate-900 hover:bg-slate-100 font-semibold rounded-full px-6">
          Get Started
        </Button>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
          <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 mb-8 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-300">Bank-grade security protocol active</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-8 leading-[1.1]">
            Trusted by <span className="text-blue-400">10,000+</span> accounts across <span className="text-blue-400">500+</span> banks.
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 mb-16 max-w-3xl mx-auto leading-relaxed">
            The most secure way to check your balance without an app. Zero internet required, read-only access guaranteed.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 max-w-4xl mx-auto border-y border-slate-800 py-10">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white tabular-nums mb-2">10,000+</div>
              <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Supported Banks</div>
            </div>
            <div className="text-center md:border-x border-slate-800">
              <div className="text-4xl md:text-5xl font-bold text-emerald-400 tabular-nums mb-2">100%</div>
              <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Read-Only Security</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white tabular-nums mb-2">&lt; 3s</div>
              <div className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Avg. Response Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="bg-slate-900 py-8 border-b border-slate-800">
        <div className="container mx-auto px-6 overflow-hidden">
          <div className="flex flex-wrap justify-center items-center gap-4 opacity-70">
            {['Chase', 'Wells Fargo', 'Bank of America', 'Citi', 'US Bank', 'Capital One', 'PNC Bank', 'TD Bank'].map((bank) => (
              <div key={bank} className="px-5 py-2.5 bg-slate-800 rounded-full text-slate-300 font-semibold text-sm tracking-wide">
                {bank}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News Strip */}
      <section className="bg-slate-100 py-12 border-b border-slate-200">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">As featured in</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center grayscale opacity-60">
            {/* Fake logos using text for styling */}
            <span className="text-2xl font-black tracking-tighter text-slate-800">TechCrunch</span>
            <span className="text-2xl font-serif italic font-bold text-slate-800">Forbes</span>
            <span className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white text-sm">P</div> Product Hunt
            </span>
            <span className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Wired</span>
          </div>
        </div>
      </section>

      {/* How it Works - Trust Focused */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">How we protect your data at every step</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Our architecture ensures that we never see your banking credentials, and you can never move money via SMS.
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-100 -translate-x-1/2"></div>
            
            <div className="space-y-16 relative">
              {/* Step 1 */}
              <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-16">
                <div className="md:w-1/2 md:text-right">
                  <div className="inline-block bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full text-xs mb-4">Step 01</div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Device Authentication</h3>
                  <p className="text-slate-600 leading-relaxed">
                    We securely tie your account to your specific phone number. Requests originating from any other number are automatically rejected by our servers.
                  </p>
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white border-4 border-slate-100 rounded-full hidden md:flex items-center justify-center z-10">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div className="md:w-1/2">
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="font-semibold text-sm">Number Verification Required</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="font-semibold text-sm">Anti-spoofing measures active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col md:flex-row-reverse items-center gap-8 md:gap-16">
                <div className="md:w-1/2">
                  <div className="inline-block bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full text-xs mb-4">Step 02</div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Zero-Knowledge Linking</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Your credentials are never stored. Teller's 256-bit encrypted vault handles all bank connections directly. We only receive a secure read-only token.
                  </p>
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white border-4 border-slate-100 rounded-full hidden md:flex items-center justify-center z-10">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                </div>
                <div className="md:w-1/2">
                  <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl text-white">
                    <div className="flex items-center gap-3 mb-4 opacity-80">
                      <ShieldCheck className="w-5 h-5 text-blue-400" />
                      <span className="font-mono text-sm">Token generated</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-emerald-400" />
                      <span className="font-mono text-sm">Credentials bypass Text Banks</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-16">
                <div className="md:w-1/2 md:text-right">
                  <div className="inline-block bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full text-xs mb-4">Step 03</div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Read-Only Operations</h3>
                  <p className="text-slate-600 leading-relaxed">
                    By design, our system cannot initiate transfers or payments. It is physically and architecturally impossible to move money using Text Banks.
                  </p>
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white border-4 border-slate-100 rounded-full hidden md:flex items-center justify-center z-10">
                  <FileBadge2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="md:w-1/2">
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm">
                     <div className="space-y-3">
                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100">
                          <span className="text-sm font-semibold text-slate-600">GET /balances</span>
                          <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded">ALLOWED</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100">
                          <span className="text-sm font-semibold text-slate-600">POST /transfers</span>
                          <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">BLOCKED</span>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Security Deep Dive */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Enterprise-grade infrastructure</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              We employ the same security standards used by major financial institutions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Server,
                title: "mTLS Architecture",
                desc: "Mutual TLS ensures both client and server authenticate each other before sharing any data."
              },
              {
                icon: Lock,
                title: "TLS 1.3 Encryption",
                desc: "All data in transit is encrypted using the latest and most secure cryptographic protocols."
              },
              {
                icon: ShieldCheck,
                title: "Teller Secure Tokens",
                desc: "We utilize Teller's secure token system. We never touch, see, or store your passwords."
              },
              {
                icon: Globe,
                title: "SOC2 Compliant Partners",
                desc: "Our infrastructure runs on data centers and partners that maintain strict SOC2 compliance."
              }
            ].map((item, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl hover:bg-slate-800 transition-colors">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                  <item.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Simple, predictable pricing</h2>
            <p className="text-lg text-slate-500">No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Basic Tier */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-sm flex flex-col">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Basic</h3>
              <p className="text-slate-500 mb-6">For individuals needing quick checks.</p>
              
              <div className="mb-8">
                <span className="text-5xl font-bold text-slate-900">$0</span>
                <span className="text-slate-500">/mo</span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {['Up to 2 linked accounts', '50 SMS queries per month', 'Standard support', 'Bank-grade security'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full h-14 rounded-xl text-lg font-semibold border-slate-300 text-slate-700 hover:bg-slate-50">
                Start Free
              </Button>
            </div>

            {/* Premium Tier */}
            <div className="bg-slate-900 border-2 border-blue-500 rounded-3xl p-8 md:p-10 shadow-xl flex flex-col relative text-white">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <p className="text-slate-400 mb-6">Unlimited access for peace of mind.</p>
              
              <div className="mb-8">
                <span className="text-5xl font-bold text-white">$4</span>
                <span className="text-slate-400">/mo</span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {['Unlimited linked accounts', 'Unlimited SMS queries', 'Priority support', 'Custom account nicknames', 'Bank-grade security'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full h-14 rounded-xl text-lg font-semibold bg-blue-600 hover:bg-blue-500 text-white">
                Get Premium
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-blue-600 to-blue-700" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight max-w-3xl mx-auto">
            Ready for stress-free banking access?
          </h2>
          <Button className="bg-white text-blue-700 hover:bg-slate-50 h-16 px-8 rounded-full text-xl font-bold shadow-xl shadow-blue-900/20 group">
            <Users className="w-5 h-5 mr-3 text-blue-500" />
            Join 10,000+ users already checking by text
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-12 text-slate-400 border-t border-slate-900">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white">
            <Lock className="w-5 h-5 text-blue-500" />
            <span className="font-bold tracking-tight">Text Banks</span>
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security Details</a>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Text Banks. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
