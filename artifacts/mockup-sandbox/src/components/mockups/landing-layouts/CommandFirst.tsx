import './_group.css';
import { 
  MessageSquareText, 
  ShieldCheck, 
  Smartphone, 
  WifiOff, 
  Banknote,
  CheckCircle2,
  LockKeyhole,
  Terminal,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function CommandFirst() {
  return (
    <div className="min-h-screen font-sans bg-slate-50 text-slate-900 selection:bg-blue-200">
      {/* Hero Section */}
      <section className="bg-[#0a0f1a] text-white pt-24 pb-32 px-4 md:px-6 flex flex-col items-center justify-center min-h-[80vh] border-b border-slate-800">
        <div className="max-w-4xl w-full mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm font-mono mb-4">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span>v1.0.0-stable</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-medium tracking-tight leading-tight">
            Banking, minimized to <br className="hidden md:block"/> a single text command.
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
            No app. No internet. Connect your bank securely and use simple text commands to manage your finances from any mobile phone.
          </p>

          <div className="mt-12 w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-lg overflow-hidden text-left font-mono text-sm shadow-2xl shadow-black/50">
            <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
              <span className="ml-2 text-slate-500">TextBank SMS Interface</span>
            </div>
            <div className="p-6 text-slate-300 space-y-4">
              <div className="text-slate-500 mb-2"># Text any of these commands to get started</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-4 p-3 bg-slate-950 rounded border border-slate-800/50">
                  <span className="text-blue-400 font-bold w-12 shrink-0">BAL</span>
                  <span className="text-slate-400">Get your current account balances instantly.</span>
                </div>
                <div className="flex gap-4 p-3 bg-slate-950 rounded border border-slate-800/50">
                  <span className="text-green-400 font-bold w-12 shrink-0">TRANS</span>
                  <span className="text-slate-400">View your most recent transactions.</span>
                </div>
                <div className="flex gap-4 p-3 bg-slate-950 rounded border border-slate-800/50">
                  <span className="text-yellow-400 font-bold w-12 shrink-0">HELP</span>
                  <span className="text-slate-400">List all available commands and formats.</span>
                </div>
                <div className="flex gap-4 p-3 bg-slate-950 rounded border border-slate-800/50">
                  <span className="text-red-400 font-bold w-12 shrink-0">STOP</span>
                  <span className="text-slate-400">Disconnect your account immediately.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-none bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 font-mono">
              Register Number <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-none border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-8 h-12 font-mono">
              View Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works - Minimal Strip */}
      <section className="bg-white border-b border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            <div className="flex flex-col gap-2 pt-6 md:pt-0 md:pr-12 first:pt-0">
              <span className="font-mono text-sm text-blue-600 font-bold">01 / REGISTER</span>
              <h3 className="text-lg font-medium">Verify your phone</h3>
              <p className="text-sm text-slate-500">Sign up on our secure portal and verify your mobile number. No app download required.</p>
            </div>
            <div className="flex flex-col gap-2 pt-6 md:pt-0 md:px-12">
              <span className="font-mono text-sm text-blue-600 font-bold">02 / LINK</span>
              <h3 className="text-lg font-medium">Connect your bank</h3>
              <p className="text-sm text-slate-500">Link accounts via our secure partner portal. We never store credentials and access is strictly read-only.</p>
            </div>
            <div className="flex flex-col gap-2 pt-6 md:pt-0 md:pl-12">
              <span className="font-mono text-sm text-blue-600 font-bold">03 / QUERY</span>
              <h3 className="text-lg font-medium">Text commands</h3>
              <p className="text-sm text-slate-500">Send simple text commands like BAL or TRANS to receive immediate account updates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Horizontal alternating rows */}
      <section className="bg-slate-50">
        <div className="max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="flex flex-col md:flex-row border-b border-slate-200">
            <div className="w-full md:w-1/2 p-12 md:p-24 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center bg-white">
              <WifiOff className="w-8 h-8 text-slate-900 mb-6" />
              <h2 className="text-2xl font-display font-medium mb-2">No Data Required</h2>
            </div>
            <div className="w-full md:w-1/2 p-12 md:p-24 flex items-center bg-slate-50">
              <p className="text-lg text-slate-600 leading-relaxed">
                TextBank operates entirely over standard cellular SMS infrastructure. You don't need 4G, 5G, or a WiFi connection to check your balance. If you have cellular signal, you have banking access.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col md:flex-row-reverse border-b border-slate-200">
            <div className="w-full md:w-1/2 p-12 md:p-24 border-b md:border-b-0 md:border-l border-slate-200 flex flex-col justify-center bg-white">
              <ShieldCheck className="w-8 h-8 text-slate-900 mb-6" />
              <h2 className="text-2xl font-display font-medium mb-2">Strictly Read-Only</h2>
            </div>
            <div className="w-full md:w-1/2 p-12 md:p-24 flex items-center bg-slate-50">
              <p className="text-lg text-slate-600 leading-relaxed">
                Our architecture guarantees that money can never be moved through TextBank. It is a one-way mirror into your finances. If your phone is lost or stolen, your funds remain absolutely secure.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col md:flex-row border-b border-slate-200">
            <div className="w-full md:w-1/2 p-12 md:p-24 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center bg-white">
              <Banknote className="w-8 h-8 text-slate-900 mb-6" />
              <h2 className="text-2xl font-display font-medium mb-2">Multiple Accounts</h2>
            </div>
            <div className="w-full md:w-1/2 p-12 md:p-24 flex items-center bg-slate-50">
              <p className="text-lg text-slate-600 leading-relaxed">
                Link checking, savings, and credit cards from different institutions. Use simple modifiers like <span className="font-mono bg-slate-200 px-1 py-0.5 rounded text-sm">BAL CHECKING</span> or <span className="font-mono bg-slate-200 px-1 py-0.5 rounded text-sm">BAL CREDIT</span> to query specific accounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - Comparison Table */}
      <section className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-display font-medium text-center mb-16">Plans & Pricing</h2>
          
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 divide-x divide-slate-200">
              <div className="p-6">
                {/* Empty corner */}
              </div>
              <div className="p-6 text-center bg-white">
                <h3 className="font-mono font-bold text-slate-900 mb-2">BASIC</h3>
                <div className="text-3xl font-light mb-4">$0<span className="text-sm text-slate-500">/mo</span></div>
                <Button variant="outline" className="w-full rounded-none font-mono text-xs">Start Free</Button>
              </div>
              <div className="p-6 text-center bg-slate-900 text-white">
                <h3 className="font-mono font-bold text-blue-400 mb-2">PREMIUM</h3>
                <div className="text-3xl font-light mb-4">$4<span className="text-sm text-slate-400">/mo</span></div>
                <Button className="w-full rounded-none bg-blue-600 hover:bg-blue-700 font-mono text-xs text-white">Subscribe</Button>
              </div>
            </div>
            
            <div className="divide-y divide-slate-200">
              <div className="grid grid-cols-3 divide-x divide-slate-200">
                <div className="p-4 text-sm font-medium text-slate-600 flex items-center">Monthly SMS Queries</div>
                <div className="p-4 text-sm text-center bg-white">50</div>
                <div className="p-4 text-sm text-center font-medium bg-slate-50">Unlimited</div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-slate-200">
                <div className="p-4 text-sm font-medium text-slate-600 flex items-center">Linked Accounts</div>
                <div className="p-4 text-sm text-center bg-white">Up to 2</div>
                <div className="p-4 text-sm text-center font-medium bg-slate-50">Unlimited</div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-slate-200">
                <div className="p-4 text-sm font-medium text-slate-600 flex items-center">Custom Account Nicknames</div>
                <div className="p-4 text-sm text-center bg-white text-slate-300">-</div>
                <div className="p-4 text-sm text-center font-medium bg-slate-50 flex justify-center"><CheckCircle2 className="w-4 h-4 text-blue-600" /></div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-slate-200">
                <div className="p-4 text-sm font-medium text-slate-600 flex items-center">Priority Alerts</div>
                <div className="p-4 text-sm text-center bg-white text-slate-300">-</div>
                <div className="p-4 text-sm text-center font-medium bg-slate-50 flex justify-center"><CheckCircle2 className="w-4 h-4 text-blue-600" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commands Reference Grid */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="mb-12">
            <h2 className="text-2xl font-display font-medium mb-4">Command Reference</h2>
            <p className="text-slate-600">Complete list of available SMS commands and their expected outputs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
            {/* Command Item */}
            <div className="border border-slate-200 bg-white p-6 rounded">
              <div className="flex justify-between items-start mb-4">
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">BAL</span>
                <span className="text-xs text-slate-400 uppercase">Core</span>
              </div>
              <p className="text-slate-600 mb-4 font-sans text-sm">Retrieves the current balance for all linked accounts. Truncates account numbers for security.</p>
              <div className="bg-slate-50 p-3 rounded border border-slate-100 text-xs text-slate-500">
                Output: "CHK...1234: $1,240.50 | SAV...9988: $5,000.00"
              </div>
            </div>

            {/* Command Item */}
            <div className="border border-slate-200 bg-white p-6 rounded">
              <div className="flex justify-between items-start mb-4">
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">BAL [NICKNAME]</span>
                <span className="text-xs text-slate-400 uppercase">Premium</span>
              </div>
              <p className="text-slate-600 mb-4 font-sans text-sm">Retrieves the balance for a specific account using a custom nickname.</p>
              <div className="bg-slate-50 p-3 rounded border border-slate-100 text-xs text-slate-500">
                Example: "BAL CHK"<br/>
                Output: "CHK...1234 Balance: $1,240.50. Available: $1,200.00"
              </div>
            </div>

            {/* Command Item */}
            <div className="border border-slate-200 bg-white p-6 rounded">
              <div className="flex justify-between items-start mb-4">
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">TRANS</span>
                <span className="text-xs text-slate-400 uppercase">Core</span>
              </div>
              <p className="text-slate-600 mb-4 font-sans text-sm">Lists the 3 most recent transactions across all accounts.</p>
              <div className="bg-slate-50 p-3 rounded border border-slate-100 text-xs text-slate-500">
                Output: "-$4.50 STARBUCKS | +$1200.00 PAYROLL | -$50.00 ATM"
              </div>
            </div>

            {/* Command Item */}
            <div className="border border-slate-200 bg-white p-6 rounded">
              <div className="flex justify-between items-start mb-4">
                <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded">STOP</span>
                <span className="text-xs text-slate-400 uppercase">System</span>
              </div>
              <p className="text-slate-600 mb-4 font-sans text-sm">Immediately revokes all bank access and unlinks your phone number.</p>
              <div className="bg-slate-50 p-3 rounded border border-slate-100 text-xs text-slate-500">
                Output: "TextBank access revoked. All data deleted. Text START to re-register."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-[#0a0f1a] text-slate-400 py-12 text-center text-sm font-mono border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center">
          <Terminal className="w-6 h-6 text-slate-600 mb-6" />
          <p>© {new Date().getFullYear()} TextBank. All rights reserved.</p>
          <div className="mt-4 flex gap-6">
            <span className="hover:text-white cursor-pointer">Terms</span>
            <span className="hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-white cursor-pointer">Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
