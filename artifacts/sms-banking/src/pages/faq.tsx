import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";

const FAQ_ITEMS = [
  {
    q: "Is it safe to link my bank account?",
    a: "Yes. We use Teller, a bank-grade API with read-only access. We never see or store your login credentials, and it's architecturally impossible for us to move or transfer money.",
  },
  {
    q: "Which banks are supported?",
    a: "Over 10,000 US banks and credit unions are supported, including Chase, Bank of America, Wells Fargo, Citibank, Capital One, and most regional banks and credit unions.",
  },
  {
    q: "Do I need a smartphone to use Text Banks?",
    a: "No. Text Banks works on any mobile phone — from basic feature phones to the latest smartphones — using standard SMS. No internet or data plan required.",
  },
  {
    q: "How fast are replies?",
    a: "Most replies arrive in under 3 seconds. We process your text command, query your bank in real-time, and send the response back immediately.",
  },
  {
    q: "Can someone use my phone to access my accounts?",
    a: "Only the registered phone number can query your account. You can add a PIN for extra security. And remember — we're strictly read-only, so even if someone texts from your phone, they can't move money.",
  },
  {
    q: "How do I cancel?",
    a: "Just text STOP to unsubscribe instantly. You can also delete your account from your account settings at any time.",
  },
];

export default function FaqPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <PublicLayout>
      <section className="bg-[#FAFAF7] py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold text-[#0D0E12] md:text-4xl">Frequently asked questions</h1>
            <p className="mt-4 text-base text-[#6B7280]">Everything you need to know about Text Banks.</p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={item.q} className="overflow-hidden rounded-xl border border-[#E5E0D8] bg-white">
                <button
                  className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-[#F0ECE5]"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="pr-4 text-sm font-semibold text-[#0D0E12]">{item.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-[#9A9AA8] transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="border-t border-[#EDE8E0] px-6 pb-5 pt-4 text-sm leading-relaxed text-[#3C3C4A]">{item.a}</div>}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/contact">
              <Button className="h-11 rounded-lg bg-[#2563EB] px-6 text-sm font-semibold text-white hover:bg-[#1D58D8]">
                Contact support
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
