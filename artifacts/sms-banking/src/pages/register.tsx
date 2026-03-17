import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

declare global {
  interface Window {
    TellerConnect?: {
      setup: (opts: {
        applicationId: string;
        environment?: string;
        products?: string[];
        onSuccess: (enrollment: { accessToken: string; enrollment: { id: string; institution: { name: string } } }) => void;
        onExit?: () => void;
        onFailure?: (e: unknown) => void;
      }) => { open: () => void };
    };
  }
}

const userSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  smsConsent: z.boolean().refine((val) => val === true, {
    message: "You must consent to receive SMS messages",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const steps = ["Your Info", "Link Bank", "All Done"];

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<number | null>(null);
  const [tellerScriptLoaded, setTellerScriptLoaded] = useState(false);
  const [tellerError, setTellerError] = useState<string | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<{ nickname: string; lastFour: string; bankName: string }[]>([]);
  const tellerConnectRef = useRef<{ open: () => void } | null>(null);

  const registerMutation = useRegisterUser();
  const tellerEnrollMutation = useTellerEnroll();
  const { data: tellerConfig } = useGetTellerConfig();

  useEffect(() => {
    if (document.querySelector('script[src*="teller.io"]')) {
      setTellerScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.teller.io/connect/connect.js";
    script.async = true;
    script.onload = () => setTellerScriptLoaded(true);
    script.onerror = () => setTellerError("Could not load bank connection service. Please try again.");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!tellerScriptLoaded || !tellerConfig?.applicationId || !registeredUserId) return;
    if (!window.TellerConnect) {
      setTellerError("Bank connection service unavailable.");
      return;
    }
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
          setLinkedAccounts(
            result.accounts.map((a) => ({
              nickname: a.nickname,
              lastFour: a.accountLastFour,
              bankName: a.bankName,
            }))
          );
          setStep(3);
        } catch {
          setTellerError("Failed to save your bank connection. Please try again.");
        }
      },
      onExit: () => {},
      onFailure: () => {
        setTellerError("Bank connection failed. Please try again.");
      },
    });
  }, [tellerScriptLoaded, tellerConfig, registeredUserId]);

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      smsConsent: false,
    },
  });

  const onUserSubmit = async (values: z.infer<typeof userSchema>) => {
    try {
      const user = await registerMutation.mutateAsync({
        data: { ...values } as Parameters<typeof registerMutation.mutateAsync>[0]["data"],
      });
      setRegisteredUserId(user.id);
      setStep(2);
    } catch (e: unknown) {
      const data = (e as { data?: { error?: string; message?: string } })?.data;
      if (data?.error === "duplicate_phone") {
        userForm.setError("phoneNumber", { message: data.message });
      } else {
        userForm.setError("root", { message: "Registration failed. Please try again." });
      }
    }
  };

  const openTellerConnect = () => {
    setTellerError(null);
    if (tellerConnectRef.current) {
      tellerConnectRef.current.open();
    } else {
      setTellerError("Bank connection not ready yet. Please wait a moment and try again.");
    }
  };

  return (
    <PublicLayout>
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 bg-slate-50 min-h-screen">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <TextBanksLogo size={32} />
            <span className="font-display font-bold text-xl text-slate-900">Text Banks</span>
          </div>
          <p className="text-sm text-slate-500">Create your account</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {steps.map((label, i) => {
            const idx = i + 1;
            const done = step > idx;
            const active = step === idx;
            return (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                        ? "bg-blue-700 text-white shadow-lg shadow-blue-700/30"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {done ? <CheckCircle className="w-4 h-4" /> : idx}
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-1.5 whitespace-nowrap ${
                      active ? "text-blue-700" : done ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-16 h-px mx-2 mb-4 transition-colors ${
                      step > idx ? "bg-emerald-400" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <AnimatePresence mode="wait">
            {/* ── Step 1: Personal Info ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="px-7 pt-7 pb-5">
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Your information</h2>
                  <p className="text-sm text-slate-500">
                    Enter your details to create your Text Banks account.
                  </p>
                </div>

                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit(onUserSubmit)}>
                    <div className="px-7 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={userForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 text-xs font-semibold">First Name</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <Input placeholder="Jane" {...field} className="pl-9 h-10 border-slate-200 rounded-lg text-sm" />
                                </div>
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 text-xs font-semibold">Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} className="h-10 border-slate-200 rounded-lg text-sm" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={userForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 text-xs font-semibold">Mobile Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input type="tel" placeholder="(555) 123-4567" {...field} className="pl-9 h-10 border-slate-200 rounded-lg text-sm" />
                              </div>
                            </FormControl>
                            <FormDescription className="text-xs text-slate-400">
                              This is the number you'll use to text commands.
                            </FormDescription>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={userForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 text-xs font-semibold">Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••"
                                    {...field}
                                    className="pl-9 pr-10 h-10 border-slate-200 rounded-lg text-sm"
                                  />
                                  <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    onClick={() => setShowPassword((v) => !v)}
                                  >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 text-xs font-semibold">Confirm</FormLabel>
                              <FormControl>
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••"
                                  {...field}
                                  className="h-10 border-slate-200 rounded-lg text-sm"
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={userForm.control}
                        name="smsConsent"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="mt-0.5"
                                />
                              </FormControl>
                              <div>
                                <FormLabel className="text-xs font-semibold text-slate-700 block mb-0.5">
                                  SMS Consent
                                </FormLabel>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  I agree to receive SMS messages from Text Banks. Msg & data rates may apply. Reply STOP to cancel.{" "}
                                  <Link href="/privacy" className="text-blue-600 hover:underline">
                                    Privacy Policy
                                  </Link>
                                </p>
                              </div>
                            </div>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {userForm.formState.errors.root && (
                        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          {userForm.formState.errors.root.message}
                        </div>
                      )}
                    </div>

                    <div className="px-7 py-5 mt-4 border-t border-slate-100">
                      <Button
                        type="submit"
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-11 font-semibold group"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Creating account…</>
                        ) : (
                          <>Continue to Bank Linking <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
                        )}
                      </Button>
                      <p className="text-xs text-center text-slate-400 mt-3">
                        Already have an account?{" "}
                        <Link href="/my-account" className="text-blue-600 hover:underline font-medium">
                          Sign in
                        </Link>
                      </p>
                    </div>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* ── Step 2: Bank Linking ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="px-7 pt-7 pb-5">
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Link your bank</h2>
                  <p className="text-sm text-slate-500">
                    Connect securely through Teller. We only request{" "}
                    <strong className="text-slate-700">read-only</strong> access.
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

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
                    <p className="font-semibold text-blue-900 mb-2 text-xs uppercase tracking-wide">What we access</p>
                    <ul className="text-blue-800 text-xs space-y-1.5">
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-blue-500" /> Account names and last 4 digits</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-blue-500" /> Current balance (read-only)</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-blue-500" /> Recent transaction history</li>
                    </ul>
                    <p className="text-blue-700 text-xs mt-2 pt-2 border-t border-blue-200">
                      We <strong>never</strong> store your credentials or initiate transactions.
                    </p>
                  </div>

                  {tellerConfig?.environment === "sandbox" && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="font-semibold text-amber-900 text-xs uppercase tracking-wide mb-2">🧪 Sandbox — Use test credentials</p>
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
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      {tellerError}
                    </div>
                  )}

                  {tellerEnrollMutation.isPending && (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-3">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Syncing your accounts…
                    </div>
                  )}
                </div>

                <div className="px-7 py-5 mt-4 border-t border-slate-100 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={tellerEnrollMutation.isPending}
                    className="border-slate-200 text-slate-700 rounded-xl h-11"
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-11 font-semibold"
                    onClick={openTellerConnect}
                    disabled={!tellerScriptLoaded || !tellerConfig || tellerEnrollMutation.isPending}
                  >
                    {!tellerScriptLoaded ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Loading…</>
                    ) : (
                      <><Building2 className="w-4 h-4 mr-2" /> Connect Your Bank</>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Success ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="p-10 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">You're all set!</h2>
                  <p className="text-slate-500 text-sm mb-6">
                    Your account is ready. Text your first command to get started.
                  </p>

                  {linkedAccounts.length > 0 && (
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Linked Accounts</p>
                      <div className="space-y-2">
                        {linkedAccounts.map((a) => (
                          <div key={a.lastFour} className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">
                              {a.bankName}{" "}
                              <span className="text-slate-400 font-normal">••••{a.lastFour}</span>
                            </span>
                            <code className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-mono">
                              BAL {a.nickname}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="w-full bg-slate-900 rounded-xl p-5 mb-7 text-left">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Quick Commands</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        ["BAL", "All balances"],
                        ["TRANS", "Recent history"],
                        ["BAL checking", "Specific account"],
                        ["STOP", "Unsubscribe"],
                      ].map(([cmd, desc]) => (
                        <div key={cmd} className="flex items-center gap-2">
                          <code className="text-blue-400 font-mono font-bold">{cmd}</code>
                          <span className="text-slate-500">{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <Link href="/my-account" className="flex-1">
                      <Button variant="outline" className="w-full border-slate-200 rounded-xl h-10 text-sm">
                        View My Account
                      </Button>
                    </Link>
                    <Link href="/" className="flex-1">
                      <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-10 text-sm">
                        Back to Home
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-xs text-slate-400 text-center max-w-xs">
          By registering, you agree to our{" "}
          <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </PublicLayout>
  );
}
