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
      <header className="sticky top-0 z-50 w-full border-b border-[#E5E0D8] bg-[#FAF8F5]/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity">
              <TextBanksLogo size={32} />
              <span className="font-display font-bold text-[17px] text-[#0D0E12]">
                Text Banks
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span className="text-[11px] font-semibold text-emerald-700 tracking-wide">Read-Only Service</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  location === link.href
                    ? "text-[#2563EB]"
                    : "text-[#5C5C6A] hover:text-[#0D0E12]"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/my-account">
              <Button size="sm" variant="ghost" className="text-sm text-[#5C5C6A] hover:text-[#0D0E12] h-9 px-4 rounded-lg">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-[#2563EB] hover:bg-[#1D58D8] text-white rounded-lg px-4 h-9 text-sm font-medium border-0 shadow-none">
                Get Started
              </Button>
            </Link>
          </nav>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-[#F0ECE5] transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="w-5 h-5 text-[#5C5C6A]" /> : <Menu className="w-5 h-5 text-[#5C5C6A]" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-[#E5E0D8] bg-[#FAF8F5] px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2.5 px-3 text-sm font-medium text-[#3C3C4A] hover:text-[#2563EB] hover:bg-[#F0ECE5] rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/my-account" onClick={() => setMobileOpen(false)}>
              <div className="py-2.5 px-3 text-sm font-medium text-[#3C3C4A] hover:text-[#2563EB] hover:bg-[#F0ECE5] rounded-lg transition-colors cursor-pointer">
                Sign In
              </div>
            </Link>
            <div className="pt-2">
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full bg-[#2563EB] hover:bg-[#1D58D8] text-white rounded-lg border-0">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col relative">
        {children}
      </main>

      <footer className="bg-[#0B0C0F] text-white/40">
        <div className="container mx-auto px-4 md:px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <TextBanksLogo size={28} />
                <span className="font-display font-bold text-base text-white/90">Text Banks</span>
              </div>
              <p className="text-white/40 max-w-xs leading-relaxed text-sm">
                Financial visibility through simple text messages. No smartphone or data plan required — designed for everyone.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-medium text-white/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                100% Read-Only. Your money is never at risk.
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white/70 mb-4 text-xs uppercase tracking-widest">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/" className="hover:text-white/80 transition-colors">How it works</Link></li>
                <li><Link href="/register" className="hover:text-white/80 transition-colors">Register</Link></li>
                <li><Link href="/my-account" className="hover:text-white/80 transition-colors">My Account</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white/70 mb-4 text-xs uppercase tracking-widest">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/privacy" className="hover:text-white/80 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white/80 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/25">
            <p>© {new Date().getFullYear()} Text Banks Inc. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
              Secured by bank-grade encryption
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
