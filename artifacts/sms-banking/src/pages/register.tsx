import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  ShieldCheck,
  ArrowRight,
  Building2,
  CheckCircle,
  LockKeyhole,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Phone,
  User,
  KeyRound,
  SkipForward,
  Mail,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { TextBanksLogo } from "@/components/layout/Logo";
import { useRegisterUser, useGetTellerConfig, useTellerEnroll } from "@workspace/api-client-react";

const schema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  smsConsent: z.boolean().refine((v) => v === true, { message: "You must consent to receive SMS messages" }),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;
type Stage = "form" | "verify" | "bank" | "done";

export default function RegisterPage() {
  const [stage, setStage] = useState<Stage>("form");
  const [showPassword, setShowPassword] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<number | null>(null);
  const [registeredPhone, setRegisteredPhone] = useState("");
  const [registeredUserData, setRegisteredUserData] = useState<{
    id: number; firstName: string; lastName: string; phoneNumber: string; onboardingStatus: string; optedOut: boolean;
  } | null>(null);

  // Verification
  const [verifyCode, setVerifyCode] = useState(["", "", "", "", "", ""]);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Teller
  const [tellerScriptLoaded, setTellerScriptLoaded] = useState(false);
  const [tellerError, setTellerError] = useState<string | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<{ nickname: string; lastFour: string; bankName: string }[]>([]);
  const tellerConnectRef = useRef<{ open: () => void } | null>(null);

  const registerMutation = useRegisterUser();
  const tellerEnrollMutation = useTellerEnroll();
  const { data: tellerConfig } = useGetTellerConfig();

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Load Teller script
  useEffect(() => {
    if (document.querySelector('script[src*="teller.io"]')) { setTellerScriptLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.teller.io/connect/connect.js";
    script.async = true;
    script.onload = () => setTellerScriptLoaded(true);
    script.onerror = () => setTellerError("Could not load bank connection service.");
    document.head.appendChild(script);
  }, []);

  // Set up Teller Connect
  useEffect(() => {
    if (!tellerScriptLoaded || !tellerConfig?.applicationId || !registeredUserId) return;
    if (!window.TellerConnect) { setTellerError("Bank connection service unavailable."); return; }
    tellerConnectRef.current = window.TellerConnect.setup({
      applicationId: tellerConfig.applicationId,
      environment: tellerConfig.environment,
      products: ["balance", "transactions"],
      onSuccess: async (enrollment) => {
        setTellerError(null);
        try {
          const result = await tellerEnrollMutation.mutateAsync({
            data: {
              userId: registeredUserId,
              accessToken: enrollment.accessToken,
              enrollmentId: enrollment.enrollment.id,
              institutionName: enrollment.enrollment.institution.name,
            },
          });
          setLinkedAccounts(result.accounts.map((a) => ({
            nickname: a.nickname, lastFour: a.accountLastFour, bankName: a.bankName,
          })));
          saveSession(registeredUserData ? { ...registeredUserData, onboardingStatus: "active" } : null);
          setStage("done");
        } catch {
          setTellerError("Failed to save your bank connection. Please try again.");
        }
      },
      onExit: () => {},
      onFailure: () => setTellerError("Bank connection failed. Please try again."),
    });
  }, [tellerScriptLoaded, tellerConfig, registeredUserId]);

  const saveSession = (data: typeof registeredUserData) => {
    if (!data) return;
    try { localStorage.setItem("textbank_session", JSON.stringify(data)); } catch { /* best-effort */ }
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", email: "", phoneNumber: "", password: "", confirmPassword: "", smsConsent: false },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const user = await registerMutation.mutateAsync({
        data: { ...values } as Parameters<typeof registerMutation.mutateAsync>[0]["data"],
      });
      setRegisteredUserId(user.id);
      setRegisteredPhone(values.phoneNumber);
      setRegisteredUserData({
        id: user.id,
        firstName: (user as { firstName?: string }).firstName ?? values.firstName,
        lastName: (user as { lastName?: string }).lastName ?? values.lastName,
        phoneNumber: values.phoneNumber,
        onboardingStatus: (user as { onboardingStatus?: string }).onboardingStatus ?? "pending",
        optedOut: false,
      });
      setStage("verify");
      // Focus first code box
      setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
    } catch (e: unknown) {
      const data = (e as { data?: { error?: string; message?: string } })?.data;
      if (data?.error === "duplicate_phone") {
        form.setError("phoneNumber", { message: data.message });
      } else if (data?.error === "duplicate_email") {
        form.setError("email", { message: data.message });
      } else {
        form.setError("root", { message: "Registration failed. Please try again." });
      }
    }
  };

  // Handle 6-digit code input
  const handleCodeChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const newCode = [...verifyCode];
    newCode[index] = char;
    setVerifyCode(newCode);
    setVerifyError(null);
    if (char && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 digits entered
    if (char && index === 5) {
      const full = [...newCode.slice(0, 5), char].join("");
      if (full.length === 6) submitVerification(full);
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !verifyCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setVerifyCode(text.split(""));
      setVerifyError(null);
      setTimeout(() => submitVerification(text), 100);
    }
  };

  const submitVerification = async (code?: string) => {
    const finalCode = code ?? verifyCode.join("");
    if (finalCode.length < 6) { setVerifyError("Please enter the full 6-digit code."); return; }
    if (!registeredUserId) return;
    setVerifyLoading(true);
    setVerifyError(null);
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: registeredUserId, code: finalCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyError(data.message || "Invalid code. Please try again.");
        setVerifyCode(["", "", "", "", "", ""]);
        codeInputRefs.current[0]?.focus();
        return;
      }
      setStage("bank");
    } catch {
      setVerifyError("Network error. Please try again.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const resendCode = async () => {
    if (!registeredUserId || resendCooldown > 0) return;
    setResendLoading(true);
    setVerifyError(null);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: registeredUserId }),
      });
      setResendCooldown(60);
      setVerifyCode(["", "", "", "", "", ""]);
      setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
    } catch { setVerifyError("Could not resend. Please try again."); }
    finally { setResendLoading(false); }
  };

  const openTellerConnect = () => {
    setTellerError(null);
    if (tellerConnectRef.current) {
      tellerConnectRef.current.open();
    } else {
      setTellerError("Bank connection not ready yet. Please wait a moment.");
    }
  };

  // Step indicators
  const steps: { key: Stage; label: string }[] = [
    { key: "form", label: "Account" },
    { key: "verify", label: "Verify" },
    { key: "bank", label: "Bank" },
    { key: "done", label: "Done" },
  ];
  const stageIndex = { form: 0, verify: 1, bank: 2, done: 3 } as Record<Stage, number>;

  return (
    <PublicLayout>
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 bg-slate-50 min-h-screen">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2.5 mb-1.5">
            <TextBanksLogo size={32} />
            <span className="font-display font-bold text-xl text-slate-900">Text Banks</span>
          </div>
          <p className="text-sm text-slate-500">Create your account</p>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-1 mb-8">
          {steps.map((s, i) => {
            const current = stageIndex[stage];
            const done = i < current;
            const active = i === current;
            return (
              <div key={s.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    done ? "bg-emerald-500 border-emerald-500 text-white" :
                    active ? "bg-blue-700 border-blue-700 text-white" :
                    "bg-white border-slate-300 text-slate-400"
                  }`}>
                    {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${active ? "text-blue-700" : done ? "text-emerald-600" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 mb-4 transition-all ${i < current ? "bg-emerald-400" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Stage 1: Registration form ── */}
          {stage === "form" && (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="w-full max-w-md">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-7 pt-7 pb-5">
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Create your account</h2>
                  <p className="text-sm text-slate-500">Enter your details to get started. No credit card required.</p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="px-7 space-y-4">
                      {/* Name row */}
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="firstName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-700">First Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input placeholder="Jane" {...field} className="pl-9 h-10 border-slate-200 rounded-xl text-sm" />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-700">Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} className="h-10 border-slate-200 rounded-xl text-sm" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      </div>

                      {/* Email */}
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-slate-700">Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input type="email" placeholder="jane@example.com" {...field} className="pl-9 h-10 border-slate-200 rounded-xl text-sm" />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs text-slate-400">We'll send a welcome email here.</FormDescription>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )} />

                      {/* Phone */}
                      <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-slate-700">Mobile Number</FormLabel>
                          <FormControl>
                            <PhoneInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="(555) 123-4567"
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-slate-400">
                            We'll text a verification code to this number.
                          </FormDescription>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )} />

                      {/* Password row */}
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="password" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-700">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input type={showPassword ? "text" : "password"} placeholder="••••••" {...field}
                                  className="pl-9 pr-9 h-10 border-slate-200 rounded-xl text-sm" />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                  onClick={() => setShowPassword((v) => !v)}>
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-slate-700">Confirm</FormLabel>
                            <FormControl>
                              <Input type={showPassword ? "text" : "password"} placeholder="••••••" {...field}
                                className="h-10 border-slate-200 rounded-xl text-sm" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )} />
                      </div>

                      {/* SMS Consent */}
                      <FormField control={form.control} name="smsConsent" render={({ field }) => (
                        <FormItem>
                          <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                            </FormControl>
                            <div>
                              <FormLabel className="text-xs font-semibold text-slate-700 block mb-0.5">SMS Consent</FormLabel>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                I agree to receive SMS messages from Text Banks. Msg & data rates may apply. Reply STOP to cancel.{" "}
                                <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                              </p>
                            </div>
                          </div>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )} />

                      {form.formState.errors.root && (
                        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {form.formState.errors.root.message}
                        </div>
                      )}
                    </div>

                    <div className="px-7 py-5 mt-4 border-t border-slate-100">
                      <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-11 font-semibold group"
                        disabled={registerMutation.isPending}>
                        {registerMutation.isPending
                          ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Creating account…</>
                          : <>Create Account <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
                        }
                      </Button>
                      <p className="text-xs text-center text-slate-400 mt-3">
                        Already have an account?{" "}
                        <Link href="/my-account" className="text-blue-600 hover:underline font-medium">Sign in</Link>
                      </p>
                    </div>
                  </form>
                </Form>
              </div>
            </motion.div>
          )}

          {/* ── Stage 2: Phone verification ── */}
          {stage === "verify" && (
            <motion.div key="verify" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="w-full max-w-sm">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-7 pt-7 pb-5 text-center">
                  <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-7 h-7 text-blue-700" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Check your phone</h2>
                  <p className="text-sm text-slate-500">
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-slate-700">{registeredPhone}</span>
                  </p>
                </div>

                <div className="px-7 pb-6">
                  {/* 6-digit code boxes */}
                  <div className="flex gap-2 justify-center mb-4" onPaste={handleCodePaste}>
                    {verifyCode.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { codeInputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(i, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(i, e)}
                        className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all ${
                          verifyError ? "border-red-400 bg-red-50" :
                          digit ? "border-blue-500 bg-blue-50 text-blue-900" :
                          "border-slate-200 bg-white text-slate-900 focus:border-blue-400 focus:bg-blue-50/50"
                        }`}
                      />
                    ))}
                  </div>

                  {verifyError && (
                    <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-4">
                      <AlertCircle className="w-4 h-4 shrink-0" />{verifyError}
                    </div>
                  )}

                  <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-11 font-semibold mb-3"
                    onClick={() => submitVerification()} disabled={verifyLoading || verifyCode.join("").length < 6}>
                    {verifyLoading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Verifying…</> : "Verify Phone Number"}
                  </Button>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Didn't get a code?</span>
                    <button onClick={resendCode} disabled={resendLoading || resendCooldown > 0}
                      className="text-blue-600 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resendLoading ? "Sending…" : "Resend code"}
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                    <button onClick={() => setStage("bank")} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                      Skip verification for now →
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Stage 3: Optional bank connect ── */}
          {stage === "bank" && (
            <motion.div key="bank" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="w-full max-w-md">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3.5 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-sm font-semibold text-emerald-800">Phone verified! One more optional step.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-7 pt-7 pb-5">
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Connect a bank account</h2>
                  <p className="text-sm text-slate-500">
                    Link your bank so you can text <span className="font-mono text-slate-700 bg-slate-100 px-1.5 rounded">BAL</span> to check your balance. You can always do this later.
                  </p>
                </div>

                <div className="px-7 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: LockKeyhole, label: "Bank-grade TLS" },
                      { icon: ShieldCheck, label: "Read-only access" },
                      { icon: Building2, label: "10,000+ banks" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Icon className="w-4.5 h-4.5 text-blue-700" />
                        </div>
                        <span className="text-xs text-slate-500 font-medium leading-tight">{label}</span>
                      </div>
                    ))}
                  </div>

                  {tellerConfig?.environment === "sandbox" && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="font-semibold text-amber-900 text-xs uppercase tracking-wide mb-2">🧪 Sandbox — use test credentials</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs bg-amber-100 rounded-lg p-3 text-amber-900">
                        <span className="text-amber-600">Username</span><span className="font-bold">username</span>
                        <span className="text-amber-600">Password</span><span className="font-bold">password</span>
                        <span className="text-amber-600">OTP</span><span className="font-bold">0000</span>
                        <span className="text-amber-600">Security answer</span><span className="font-bold">blue</span>
                      </div>
                    </div>
                  )}

                  {tellerError && (
                    <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{tellerError}
                    </div>
                  )}
                  {tellerEnrollMutation.isPending && (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-3">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Syncing your accounts…
                    </div>
                  )}
                </div>

                <div className="px-7 py-5 mt-4 border-t border-slate-100 space-y-3">
                  <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-11 font-semibold"
                    onClick={openTellerConnect}
                    disabled={!tellerScriptLoaded || !tellerConfig || tellerEnrollMutation.isPending}>
                    {!tellerScriptLoaded
                      ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Loading…</>
                      : <><Building2 className="w-4 h-4 mr-2" /> Connect Your Bank</>
                    }
                  </Button>
                  <button onClick={() => { saveSession(registeredUserData); setStage("done"); }}
                    className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors py-2">
                    <SkipForward className="w-4 h-4" />
                    Skip for now — I'll do this later
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Stage 4: Done ── */}
          {stage === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-10 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">You're all set!</h2>
                  <p className="text-slate-500 text-sm mb-7">
                    {linkedAccounts.length > 0
                      ? "Your bank is connected. Text your first command to get started."
                      : "Your account is ready. Link a bank anytime from your account settings."}
                  </p>

                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Check your email</p>
                    <p className="text-sm text-slate-600">We sent a welcome email with your SMS commands and account details.</p>
                  </div>

                  {linkedAccounts.length > 0 && (
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Linked Accounts</p>
                      <div className="space-y-2">
                        {linkedAccounts.map((a) => (
                          <div key={a.lastFour} className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">
                              {a.bankName} <span className="text-slate-400 font-normal">••••{a.lastFour}</span>
                            </span>
                            <code className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-mono">BAL {a.nickname}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="w-full bg-slate-900 rounded-xl p-5 mb-7 text-left">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">SMS Commands</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[["BAL", "All balances"], ["TRANS", "Recent transactions"], ["BAL checking", "Specific account"], ["STOP", "Unsubscribe"]].map(([cmd, desc]) => (
                        <div key={cmd} className="flex items-center gap-2">
                          <code className="text-blue-400 font-mono font-bold">{cmd}</code>
                          <span className="text-slate-500">{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Link href="/my-account" className="flex-1">
                      <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-10 text-sm font-semibold">Go to My Account</Button>
                    </Link>
                    <Link href="/" className="flex-1">
                      <Button variant="outline" className="w-full border-slate-200 rounded-xl h-10 text-sm">Back to Home</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PublicLayout>
  );
}
