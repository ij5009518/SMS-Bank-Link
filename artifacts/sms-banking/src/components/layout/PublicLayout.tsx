import { ReactNode } from "react";
import { Link } from "wouter";
import { ShieldCheck, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-foreground">
                TextBank
              </span>
            </Link>
            <Badge variant="secondary" className="hidden md:flex gap-1.5 items-center bg-secondary/50 text-secondary-foreground border-border/50">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-medium text-xs">Read-Only Service</span>
            </Badge>
          </div>

          <nav className="flex items-center gap-2 md:gap-4">
            <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Admin Demo
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-full px-5 hover-elevate">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative">
        {children}
      </main>

      <footer className="border-t border-border/50 bg-card py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <span className="font-display font-bold text-lg text-foreground">TextBank</span>
              </div>
              <p className="text-muted-foreground max-w-xs leading-relaxed text-sm">
                Providing essential financial visibility through simple SMS messages. Designed for accessibility, built for security.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="w-4 h-4" />
                100% Read-Only. No money movement possible.
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/" className="hover:text-primary transition-colors">How it works</Link></li>
                <li><Link href="/register" className="hover:text-primary transition-colors">Register</Link></li>
                <li><Link href="/admin" className="hover:text-primary transition-colors">Admin Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} TextBank Inc. All rights reserved.</p>
            <p>Mock Application MVP</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
