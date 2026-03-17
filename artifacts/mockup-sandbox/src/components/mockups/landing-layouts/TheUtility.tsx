import { ChevronRight, Check } from "lucide-react";

export function TheUtility() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-blue-100">
      {/* Navigation */}
      <nav className="border-b border-slate-300 px-6 py-4 flex justify-between items-center max-w-5xl mx-auto">
        <div className="font-medium text-black">Text Banks</div>
        <a href="#" className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center text-sm font-medium">
          Get Started <ChevronRight className="w-4 h-4 ml-0.5" />
        </a>
      </nav>

      <main className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <section className="pt-32 pb-24">
          <h1 className="text-[72px] font-bold leading-[1.05] tracking-tight mb-8 max-w-3xl">
            Your bank balance,<br />by text.
          </h1>
          <p className="text-xl text-slate-600 mb-10 font-normal">
            Register once. Link your bank. Text BAL. Done.
          </p>
          <div className="flex items-center gap-6 text-base">
            <a href="#" className="text-blue-600 hover:text-blue-800 font-medium underline underline-offset-4 decoration-2">
              Create free account
            </a>
            <a href="#how-it-works" className="text-slate-500 hover:text-slate-800 transition-colors">
              See how it works ↓
            </a>
          </div>
        </section>

        {/* Command Reference */}
        <section id="how-it-works" className="py-20 border-t border-slate-300">
          <h2 className="text-2xl font-bold tracking-tight mb-8">Commands</h2>
          <div className="overflow-x-auto text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="py-3 font-medium text-slate-500 w-48">Command</th>
                  <th className="py-3 font-medium text-slate-500">What it does</th>
                  <th className="py-3 font-medium text-slate-500">Example response</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="py-4">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-black">BAL</span>
                  </td>
                  <td className="py-4 text-slate-600">Get all linked account balances</td>
                  <td className="py-4 text-slate-600 font-mono text-xs whitespace-pre-line">
                    Chase Checking •••4521: $2,341.50{"\n"}
                    AmEx Credit •••9911: $891.20
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-4">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-black">BAL [account]</span>
                  </td>
                  <td className="py-4 text-slate-600">Get balance for a specific account</td>
                  <td className="py-4 text-slate-600 font-mono text-xs">
                    Chase Checking •••4521: $2,341.50
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-4">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-black">TRANS</span>
                  </td>
                  <td className="py-4 text-slate-600">View recent transactions</td>
                  <td className="py-4 text-slate-600 font-mono text-xs whitespace-pre-line">
                    Mar 14 Starbucks: -$5.40{"\n"}
                    Mar 13 Payroll: +$2,100.00
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-4">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-black">HELP</span>
                  </td>
                  <td className="py-4 text-slate-600">Show all available commands</td>
                  <td className="py-4 text-slate-600 font-mono text-xs">
                    Commands: BAL, TRANS, STOP...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 border-t border-slate-300">
          <h2 className="text-2xl font-bold tracking-tight mb-8">Features</h2>
          <div className="flex flex-col">
            {[
              { title: "No smartphone required", desc: "Works on any device that can send and receive standard SMS." },
              { title: "No data plan needed", desc: "Uses standard cell network, not mobile data or Wi-Fi." },
              { title: "Bank agnostic", desc: "Connects to over 10,000+ US financial institutions via Teller." },
              { title: "Instant replies", desc: "Responses generated and sent in under 3 seconds." },
              { title: "Universal commands", desc: "Use the same commands regardless of which bank you use." },
              { title: "Instant disconnect", desc: "Text STOP at any time to immediately disable access." },
            ].map((feature, i) => (
              <div key={i} className="py-4 border-b border-slate-300 grid grid-cols-1 md:grid-cols-3 gap-4 last:border-0">
                <div className="font-medium text-black">{feature.title}</div>
                <div className="md:col-span-2 text-slate-600 leading-relaxed">{feature.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Security */}
        <section className="py-20 border-t border-slate-300">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Security</h2>
          <p className="text-slate-600 max-w-2xl leading-[1.7] mb-6">
            We employ bank-grade security protocols to ensure your data remains protected. 
            Text Banks is built as a strictly read-only interface, making it architecturally impossible 
            to initiate transfers or move money.
          </p>
          <div className="flex flex-wrap gap-4 text-sm font-medium text-black">
            <span className="bg-slate-100 px-3 py-1 rounded">mTLS encrypted</span>
            <span className="bg-slate-100 px-3 py-1 rounded">Read-only tokens</span>
            <span className="bg-slate-100 px-3 py-1 rounded">No password stored</span>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 border-t border-slate-300">
          <h2 className="text-2xl font-bold tracking-tight mb-8">Pricing</h2>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="border border-slate-300 p-8 rounded">
              <h3 className="text-xl font-bold mb-2">Basic</h3>
              <div className="text-3xl font-bold mb-6">$0<span className="text-base text-slate-500 font-normal">/mo</span></div>
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-0.5 text-black shrink-0" />
                  <span>Up to 2 linked accounts</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-0.5 text-black shrink-0" />
                  <span>50 SMS queries per month</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-0.5 text-black shrink-0" />
                  <span>Standard support</span>
                </li>
              </ul>
            </div>
            
            <div className="border-2 border-black p-8 rounded relative">
              <div className="absolute top-0 right-0 bg-black text-white text-xs font-bold px-3 py-1 rounded-bl">
                PREMIUM
              </div>
              <h3 className="text-xl font-bold mb-2">Power User</h3>
              <div className="text-3xl font-bold mb-6">$4<span className="text-base text-slate-500 font-normal">/mo</span></div>
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-0.5 text-black shrink-0" />
                  <span>Unlimited linked accounts</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-0.5 text-black shrink-0" />
                  <span>Unlimited SMS queries</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-0.5 text-black shrink-0" />
                  <span>Priority support & alerts</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-0.5 text-black shrink-0" />
                  <span>Custom account nicknames</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 border-t border-slate-300 text-center">
          <h2 className="text-2xl font-bold tracking-tight inline-block mr-3">
            Ready?
          </h2>
          <a href="#" className="text-blue-600 hover:text-blue-800 text-xl font-medium inline-flex items-center group transition-colors">
            Create your free account <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
          </a>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-300 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 gap-4">
          <div>&copy; {new Date().getFullYear()} Text Banks. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-black transition-colors">Terms</a>
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
