import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { ShieldCheck, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextBanksLogo } from "./Logo";

export function PublicLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: "Home" },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <TextBanksLogo size={34} />
              <span className="font-display font-bold text-[18px] tracking-tight text-slate-900">
                Text Banks
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">Read-Only Service</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  location === link.href
                    ? "text-blue-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/register">
              <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-5 shadow-sm">
                Get Started
              </Button>
            </Link>
          </nav>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-sm font-medium text-slate-700 hover:text-blue-700"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/register" onClick={() => setMobileOpen(false)}>
              <Button size="sm" className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-lg">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col relative">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-400">
        <div className="container mx-auto px-4 md:px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <TextBanksLogo size={30} />
                <span className="font-display font-bold text-lg text-white">Text Banks</span>
              </div>
              <p className="text-slate-400 max-w-xs leading-relaxed text-sm">
                Financial visibility through simple text messages. No smartphone or data plan required — designed for everyone.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                100% Read-Only. Your money is never at risk.
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/" className="hover:text-white transition-colors">How it works</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Register</Link></li>
                <li><Link href="/my-account" className="hover:text-white transition-colors">My Account</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Text Banks Inc. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Secured by bank-grade encryption
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
