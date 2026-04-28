import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { TextBanksLogo } from "@/components/layout/Logo";

type Props = { children: ReactNode };

export function AuthPanel({ children }: Props) {
  return (
    <motion.div key="auth" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="flex flex-col items-center justify-center py-16 px-4 min-h-screen">
      <div className="flex flex-col items-center mb-8">
        <TextBanksLogo size={40} />
        <h1 className="text-2xl font-display font-bold text-[#0D0E12] mt-3 mb-1">Welcome back</h1>
        <p className="text-sm text-[#7C7C8A]">Sign in to manage your account</p>
      </div>
      {children}
    </motion.div>
  );
}
