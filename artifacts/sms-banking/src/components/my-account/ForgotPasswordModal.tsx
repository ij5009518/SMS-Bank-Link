import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, KeyRound, Mail, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";

type ForgotStep = "email" | "sms" | "reset";

type Props = {
  open: boolean;
  onClose: () => void;
  forgotStep: ForgotStep;
  setForgotStep: (step: ForgotStep) => void;
  forgotSuccess: string | null;
  forgotError: string | null;
  forgotLoading: boolean;
  forgotEmail: string;
  setForgotEmail: (v: string) => void;
  forgotPhone: string;
  setForgotPhone: (v: string) => void;
  forgotOtp: string;
  setForgotOtp: (v: string) => void;
  forgotNewPw: string;
  setForgotNewPw: (v: string) => void;
  onRequest: () => void;
  onReset: () => void;
};

function cn(...classes: (string | undefined | null | false)[]) { return classes.filter(Boolean).join(" "); }

export function ForgotPasswordModal(props: Props) {
  const { open, onClose, forgotStep, setForgotStep, forgotSuccess, forgotError, forgotLoading, forgotEmail, setForgotEmail, forgotPhone, setForgotPhone, forgotOtp, setForgotOtp, forgotNewPw, setForgotNewPw, onRequest, onReset } = props;
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE8E0]">
              <div><h2 className="text-base font-bold text-[#0D0E12]">Reset Password</h2></div>
              <button onClick={onClose} className="text-[#9A9AA8] hover:text-[#3C3C4A] p-1 rounded-lg hover:bg-[#F0ECE5]"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              {forgotSuccess ? <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4"><CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /><p className="text-xs text-emerald-700">{forgotSuccess}</p></div> : <>
                {forgotStep !== "reset" && <div className="flex rounded-xl overflow-hidden border border-[#E5E0D8]"><button className={cn("flex-1 py-2 text-xs font-semibold", forgotStep === "email" ? "bg-blue-700 text-white" : "text-[#7C7C8A]")} onClick={() => setForgotStep("email")}>Email link</button><button className={cn("flex-1 py-2 text-xs font-semibold", forgotStep === "sms" ? "bg-blue-700 text-white" : "text-[#7C7C8A]")} onClick={() => setForgotStep("sms")}>SMS OTP</button></div>}
                {forgotStep === "email" && <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9AA8]" /><Input type="email" className="pl-9 rounded-xl" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} /></div>}
                {forgotStep === "sms" && <PhoneInput value={forgotPhone} onChange={setForgotPhone} />}
                {forgotStep === "reset" && <><Input value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /><div className="relative"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9AA8]" /><Input type="password" className="pl-9" value={forgotNewPw} onChange={(e) => setForgotNewPw(e.target.value)} /></div></>}
                {forgotError && <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"><AlertCircle className="w-4 h-4 shrink-0" />{forgotError}</div>}
                <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-10" onClick={forgotStep === "reset" ? onReset : onRequest} disabled={forgotLoading}>{forgotLoading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : forgotStep === "reset" ? "Reset Password" : "Continue"}</Button>
              </>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
