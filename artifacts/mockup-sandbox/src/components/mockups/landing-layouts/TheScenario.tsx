import React from "react";
import {
  MessageSquare,
  Heart,
  AlertCircle,
  CheckCircle2,
  Phone,
  Smile,
  ArrowRight,
  WifiOff,
  Smartphone,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function TheScenario() {
  return (
    <div className="min-h-screen bg-stone-50 font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 px-6 py-6 flex justify-between items-center bg-transparent">
        <div className="text-stone-100 font-bold text-xl tracking-tight flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amber-500" />
          Text Banks
        </div>
        <div className="hidden md:flex gap-6 items-center">
          <Button variant="ghost" className="text-stone-300 hover:text-white hover:bg-white/10">
            Sign In
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold rounded-full px-6">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] bg-slate-950 flex flex-col justify-center items-center px-4 md:px-6 py-32 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8 mt-12">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif italic text-stone-100 leading-tight">
            "It's 11pm. Your card was just declined. You have no idea what's in your account."
          </h1>
          <div className="w-16 h-px bg-amber-500/50 mx-auto mt-8 mb-6" />
          <p className="text-xl md:text-2xl text-stone-400 font-medium">
            That moment is why Text Banks exists.
          </p>
          <div className="pt-8">
            <Button className="bg-amber-500 hover:bg-amber-600 text-stone-950 text-lg font-bold px-8 py-6 rounded-full shadow-lg shadow-amber-500/20 transition-all hover:scale-105">
              Never wonder again — Get Started Free
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-4 md:px-6 bg-slate-950 border-t border-stone-800/50 relative">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 rounded-3xl p-8 relative overflow-hidden group hover:border-stone-700 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors" />
            <Smartphone className="w-10 h-10 text-stone-500 mb-6" />
            <h3 className="text-2xl font-serif text-stone-200 mb-3">No smartphone?</h3>
            <p className="text-stone-400 text-lg">Banks don't care. They expect everyone to have the latest iPhone just to check a balance.</p>
          </div>
          
          <div className="bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 rounded-3xl p-8 relative overflow-hidden group hover:border-stone-700 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors" />
            <WifiOff className="w-10 h-10 text-stone-500 mb-6" />
            <h3 className="text-2xl font-serif text-stone-200 mb-3">No data?</h3>
            <p className="text-stone-400 text-lg">Good luck with their app. When you're out of data or out of range, their fancy apps are useless.</p>
          </div>

          <div className="bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 rounded-3xl p-8 relative overflow-hidden group hover:border-stone-700 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-stone-500/5 rounded-full blur-3xl group-hover:bg-stone-500/10 transition-colors" />
            <AlertCircle className="w-10 h-10 text-stone-500 mb-6" />
            <h3 className="text-2xl font-serif text-stone-200 mb-3">No idea?</h3>
            <p className="text-stone-400 text-lg">Your balance is a mystery. The anxiety of guessing whether a transaction will go through.</p>
          </div>
        </div>
      </section>

      {/* Solution Reveal */}
      <section className="py-32 px-4 md:px-6 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-serif italic text-stone-800 mb-6">There's a better way.</h2>
            <p className="text-xl text-stone-500 max-w-2xl mx-auto">
              A simple text message is all it takes to get peace of mind.
            </p>
          </div>

          <div className="flex justify-center">
            {/* Phone Mockup */}
            <div className="relative w-[320px] bg-slate-900 rounded-[3rem] p-4 shadow-2xl border-4 border-slate-800">
              <div className="bg-slate-950 rounded-[2.5rem] overflow-hidden h-[600px] flex flex-col relative">
                {/* Screen Glare */}
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                
                {/* Header */}
                <div className="bg-slate-900/80 backdrop-blur px-6 py-4 border-b border-stone-800/50 flex flex-col items-center z-10">
                  <span className="text-stone-100 font-semibold">Text Banks</span>
                  <span className="text-xs text-stone-400">SMS</span>
                </div>
                
                {/* Messages */}
                <div className="flex-1 p-5 flex flex-col gap-4 justify-end pb-8">
                  <div className="self-end bg-amber-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[80%] text-sm shadow-md">
                    BAL
                  </div>
                  <div className="self-start bg-stone-800 text-stone-100 px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] text-sm shadow-md border border-stone-700/50">
                    <p className="font-semibold text-amber-400 mb-1">Chase Checking ••••4521</p>
                    <p className="text-lg mb-2">$1,245.50</p>
                    <p className="text-xs text-stone-400">Available Balance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Simple It Is */}
      <section className="py-24 px-4 md:px-6 bg-stone-100 border-y border-stone-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 md:gap-8 relative">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-stone-300" />
            
            <div className="relative text-center z-10">
              <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-serif italic text-amber-600 border-4 border-stone-100 shadow-xl">
                01
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-2">Register</h3>
              <p className="text-stone-500">Sign up securely with your phone number.</p>
            </div>
            
            <div className="relative text-center z-10">
              <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-serif italic text-amber-600 border-4 border-stone-100 shadow-xl">
                02
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-2">Link Bank</h3>
              <p className="text-stone-500">Connect your account. Read-only access.</p>
            </div>
            
            <div className="relative text-center z-10">
              <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-serif italic text-amber-600 border-4 border-stone-100 shadow-xl">
                03
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-2">Text BAL</h3>
              <p className="text-stone-500">Get your balance instantly via SMS.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Human Stories */}
      <section className="py-24 px-4 md:px-6 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif italic text-center text-stone-800 mb-16">
            Real people. Real relief.
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => <Heart key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />)}
              </div>
              <p className="text-stone-600 text-lg italic mb-6">
                "I use an old flip phone because I like things simple. But my bank completely forgot about people like me. Text Banks makes me feel in control again."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-700 font-bold">M</div>
                <div>
                  <p className="font-bold text-stone-800">Maria</p>
                  <p className="text-sm text-stone-500">Feature phone user</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => <Heart key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />)}
              </div>
              <p className="text-stone-600 text-lg italic mb-6">
                "Out here in rural Texas, the data connection is spotty at best. The bank app never loads. But SMS? SMS always goes through. It's a lifesaver."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">D</div>
                <div>
                  <p className="font-bold text-stone-800">David</p>
                  <p className="text-sm text-stone-500">Low-data area</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => <Heart key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />)}
              </div>
              <p className="text-stone-600 text-lg italic mb-6">
                "I manage my elderly mother's account. Setting up Text Banks for her means she can check her balance herself without needing to navigate a confusing app."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">S</div>
                <div>
                  <p className="font-bold text-stone-800">Sarah</p>
                  <p className="text-sm text-stone-500">Caregiver</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-24 px-4 md:px-6 bg-amber-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-serif italic text-stone-950 mb-8">
            Stop wondering. Start texting.
          </h2>
          <Button className="bg-stone-950 hover:bg-stone-900 text-amber-500 text-lg font-bold px-10 py-7 rounded-full shadow-xl transition-all hover:scale-105">
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-950 text-stone-500 border-t border-stone-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-stone-400 font-bold">
            <MessageSquare className="w-5 h-5" />
            Text Banks
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-amber-500 transition-colors">Terms</a>
            <a href="#" className="hover:text-amber-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-amber-500 transition-colors">Security</a>
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} Text Banks. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
