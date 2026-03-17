import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  LogOut,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Eye,
  EyeOff,
  Phone,
  Lock,
  User,
  AlertCircle,
  MessageSquare,
  Bell,
  ChevronRight,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { TextBanksLogo } from "@/components/layout/Logo";
import { useGetUserTransactions, useGetSmsLogs, useGetUser } from "@workspace/api-client-react";

const SESSION_KEY = "textbank_session";

type SessionUser = {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  onboardingStatus: string;
  optedOut: boolean;
};

function getSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}
function saveSession(user: SessionUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const statusConfig = (status: string) => {
  if (status === "active") return { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (status === "bank_linked") return { label: "Bank Linked", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  if (status === "opted_out") return { label: "Opted Out", cls: "bg-red-50 text-red-700 border-red-200" };
  return { label: status, cls: "bg-slate-100 text-slate-600 border-slate-200" };
};

export default function MyAccountPage() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [session, setSession] = useState<SessionUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"accounts" | "activity" | "sms">("accounts");

  const [signInPhone, setSignInPhone] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpFirst, setSignUpFirst] = useState("");
  const [signUpLast, setSignUpLast] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");
  const [signUpConsent, setSignUpConsent] = useState(false);

  useEffect(() => {
    setSession(getSession());
  }, []);

  const { data: freshUser } = useGetUser(session?.id ?? 0, { query: { enabled: !!session } });
  const { data: transactions } = useGetUserTransactions(session?.id ?? 0, {}, { query: { enabled: !!session } });
  const { data: smsLogs } = useGetSmsLogs({ userId: session?.id, limit: 20 }, { query: { enabled: !!session } });

  const userAccounts = (freshUser as {
    accounts?: Array<{ id: number; bankName: string; accountType: string; accountLastFour: string; nickname: string; currentBalance: number }>;
  } | undefined)?.accounts ?? [];

  const handleSignIn = async () => {
    setError(null);
    if (!signInPhone.trim() || !signInPassword.trim()) {
      setError("Please enter your phone number and password.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: signInPhone, password: signInPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Sign in failed."); return; }
      const user: SessionUser = {
        id: data.id, firstName: data.firstName, lastName: data.lastName,
        phoneNumber: data.phoneNumber, onboardingStatus: data.onboardingStatus, optedOut: data.optedOut,
      };
      saveSession(user);
      setSession(user);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError(null);
    if (!signUpFirst || !signUpLast || !signUpPhone || !signUpPassword) { setError("Please fill in all fields."); return; }
    if (signUpPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (signUpPassword !== signUpConfirm) { setError("Passwords do not match."); return; }
    if (!signUpConsent) { setError("You must agree to receive SMS messages."); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: signUpFirst, lastName: signUpLast, phoneNumber: signUpPhone, password: signUpPassword, smsConsent: true }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Sign up failed."); return; }
      const user: SessionUser = {
        id: data.id, firstName: data.firstName, lastName: data.lastName,
        phoneNumber: data.phoneNumber, onboardingStatus: data.onboardingStatus, optedOut: data.optedOut,
      };
      saveSession(user);
      setSession(user);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    clearSession();
    setSession(null);
    setSignInPhone("");
    setSignInPassword("");
    setError(null);
  };

  return (
    <PublicLayout>
      <div className="flex-1 bg-slate-50 min-h-screen">
        <AnimatePresence mode="wait">

          {/* ── Auth screen ── */}
          {!session && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center justify-center py-16 px-4 min-h-screen"
            >
              <div className="flex flex-col items-center mb-8">
                <TextBanksLogo size={40} />
                <h1 className="text-2xl font-display font-bold text-slate-900 mt-3 mb-1">
                  Welcome back
                </h1>
                <p className="text-sm text-slate-500">Sign in to manage your account</p>
              </div>

              <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                  <button
                    onClick={() => { setTab("signin"); setError(null); }}
                    className={cn(
                      "flex-1 py-3.5 text-sm font-semibold transition-colors",
                      tab === "signin" ? "text-blue-700 border-b-2 border-blue-700 bg-blue-50/30" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setTab("signup"); setError(null); }}
                    className={cn(
                      "flex-1 py-3.5 text-sm font-semibold transition-colors",
                      tab === "signup" ? "text-blue-700 border-b-2 border-blue-700 bg-blue-50/30" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Create Account
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {tab === "signin" && (
                    <motion.div key="signin" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                      <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">Mobile Number</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              type="tel" placeholder="(555) 123-4567" value={signInPhone}
                              onChange={(e) => { setSignInPhone(e.target.value); setError(null); }}
                              onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                              className="pl-9 h-10 border-slate-200 rounded-xl text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              type={showPassword ? "text" : "password"} placeholder="••••••" value={signInPassword}
                              onChange={(e) => { setSignInPassword(e.target.value); setError(null); }}
                              onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                              className="pl-9 pr-10 h-10 border-slate-200 rounded-xl text-sm"
                            />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowPassword((v) => !v)}>
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {error && (
                          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                          </div>
                        )}

                        <Button
                          className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-10 font-semibold text-sm"
                          onClick={handleSignIn}
                          disabled={isLoading}
                        >
                          {isLoading ? "Signing in…" : "Sign In"}
                        </Button>

                        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
                          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                          Your information is kept private and secure.
                        </div>

                        <p className="text-xs text-center text-slate-400">
                          Don't have an account?{" "}
                          <button className="text-blue-600 font-medium hover:underline" onClick={() => { setTab("signup"); setError(null); }}>
                            Create one
                          </button>
                          {" "}or{" "}
                          <Link href="/register" className="text-blue-600 font-medium hover:underline">
                            register with bank linking
                          </Link>
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {tab === "signup" && (
                    <motion.div key="signup" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">First Name</label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input placeholder="Jane" value={signUpFirst} onChange={(e) => { setSignUpFirst(e.target.value); setError(null); }} className="pl-9 h-10 border-slate-200 rounded-xl text-sm" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Last Name</label>
                            <Input placeholder="Doe" value={signUpLast} onChange={(e) => { setSignUpLast(e.target.value); setError(null); }} className="h-10 border-slate-200 rounded-xl text-sm" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">Mobile Number</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input type="tel" placeholder="(555) 123-4567" value={signUpPhone} onChange={(e) => { setSignUpPhone(e.target.value); setError(null); }} className="pl-9 h-10 border-slate-200 rounded-xl text-sm" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Password</label>
                            <div className="relative">
                              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input type={showPassword ? "text" : "password"} placeholder="••••••" value={signUpPassword} onChange={(e) => { setSignUpPassword(e.target.value); setError(null); }} className="pl-9 pr-9 h-10 border-slate-200 rounded-xl text-sm" />
                              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowPassword((v) => !v)}>
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Confirm</label>
                            <Input type={showPassword ? "text" : "password"} placeholder="••••••" value={signUpConfirm} onChange={(e) => { setSignUpConfirm(e.target.value); setError(null); }} className="h-10 border-slate-200 rounded-xl text-sm" />
                          </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <Checkbox id="consent" checked={signUpConsent} onCheckedChange={(v) => { setSignUpConsent(!!v); setError(null); }} className="mt-0.5" />
                          <label htmlFor="consent" className="text-xs text-slate-500 leading-relaxed cursor-pointer">
                            I agree to receive SMS messages from Text Banks. Msg & data rates may apply. Reply STOP to cancel.
                          </label>
                        </div>

                        {error && (
                          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                          </div>
                        )}

                        <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-10 font-semibold text-sm" onClick={handleSignUp} disabled={isLoading}>
                          {isLoading ? "Creating account…" : "Create Account"}
                        </Button>

                        <p className="text-xs text-center text-slate-400">
                          Want to link a bank?{" "}
                          <Link href="/register" className="text-blue-600 hover:underline font-medium">
                            Use full registration
                          </Link>
                        </p>

                        <p className="text-xs text-center text-slate-400">
                          Already have an account?{" "}
                          <button className="text-blue-600 font-medium hover:underline" onClick={() => { setTab("signin"); setError(null); }}>
                            Sign in
                          </button>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ── Dashboard ── */}
          {session && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              {/* Dashboard header bar */}
              <div className="bg-slate-900 text-white border-b border-slate-800">
                <div className="container mx-auto px-4 md:px-6 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
                        {session.firstName[0]}{session.lastName[0]}
                      </div>
                      <div>
                        <h1 className="text-lg font-bold text-white">
                          {session.firstName} {session.lastName}
                        </h1>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm text-slate-400">{session.phoneNumber}</span>
                          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", statusConfig(session.onboardingStatus).cls)}>
                            {statusConfig(session.onboardingStatus).label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                    >
                      <LogOut className="w-4 h-4 mr-1.5" />
                      Sign out
                    </Button>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                      <p className="text-xs text-slate-400 mb-1">Linked Accounts</p>
                      <p className="text-2xl font-bold text-white">{userAccounts.length}</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                      <p className="text-xs text-slate-400 mb-1">SMS Messages</p>
                      <p className="text-2xl font-bold text-white">
                        {Array.isArray(smsLogs) ? smsLogs.filter((l: { direction: string }) => l.direction === "inbound").length : 0}
                      </p>
                    </div>
                    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                      <p className="text-xs text-slate-400 mb-1">Status</p>
                      <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                        {session.optedOut ? "Opted Out" : "Active"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="container mx-auto px-4 md:px-6 py-8 max-w-3xl">
                {/* Section tabs */}
                <div className="flex bg-white border border-slate-200 rounded-xl p-1 mb-6 gap-1">
                  {[
                    { key: "accounts" as const, label: "Bank Accounts", icon: Building2 },
                    { key: "activity" as const, label: "Transactions", icon: CreditCard },
                    { key: "sms" as const, label: "SMS Activity", icon: MessageSquare },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveSection(key)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
                        activeSection === key
                          ? "bg-blue-700 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {/* ── Accounts ── */}
                  {activeSection === "accounts" && (
                    <motion.div key="accounts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {userAccounts.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="w-7 h-7 text-slate-400" />
                          </div>
                          <h3 className="font-bold text-slate-900 mb-1">No bank accounts linked</h3>
                          <p className="text-sm text-slate-500 mb-5">
                            Link a bank account to start checking your balance by text.
                          </p>
                          <Link href="/register">
                            <Button className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6">
                              Link a Bank Account
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {userAccounts.map((acct) => (
                            <div
                              key={acct.id}
                              className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-blue-200 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                  <Building2 className="w-5 h-5 text-blue-700" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">
                                    {acct.bankName}
                                    <span className="text-slate-400 font-normal ml-1.5">••••{acct.accountLastFour}</span>
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-slate-500 capitalize">{acct.accountType}</span>
                                    <span className="text-slate-300">·</span>
                                    <code className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                                      BAL {acct.nickname}
                                    </code>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-slate-900 text-base">
                                  ${Number(acct.currentBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-slate-400">available balance</p>
                              </div>
                            </div>
                          ))}

                          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                            <p className="text-sm text-emerald-800">
                              <strong>Read-only access.</strong> Text Banks can never move money from your accounts.
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ── Transactions ── */}
                  {activeSection === "activity" && (
                    <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                          <h3 className="font-bold text-slate-900 text-sm">Recent Transactions</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Last transactions on record</p>
                        </div>
                        {!transactions || (transactions as unknown[]).length === 0 ? (
                          <div className="py-12 text-center text-slate-400 text-sm">
                            <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-30" />
                            No transactions on record yet.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {(transactions as Array<{
                              id: number;
                              merchantName: string;
                              category: string;
                              amount: number;
                              type: string;
                              transactionDate: string;
                            }>).slice(0, 10).map((txn) => {
                              const isCredit = txn.type === "credit";
                              const amt = Number(txn.amount);
                              return (
                                <div key={txn.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                                  <div className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                                    isCredit ? "bg-emerald-50" : "bg-red-50"
                                  )}>
                                    {isCredit
                                      ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                                      : <ArrowUpRight className="w-4 h-4 text-red-500" />
                                    }
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 text-sm truncate">{txn.merchantName}</p>
                                    <p className="text-xs text-slate-400 capitalize">{txn.category}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className={cn("font-semibold text-sm", isCredit ? "text-emerald-600" : "text-slate-900")}>
                                      {isCredit ? "+" : "-"}${Math.abs(amt).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {new Date(txn.transactionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* ── SMS Activity ── */}
                  {activeSection === "sms" && (
                    <motion.div key="sms" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">SMS Activity</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Your recent text messages</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                          </div>
                        </div>

                        {!smsLogs || (smsLogs as unknown[]).length === 0 ? (
                          <div className="py-12 text-center text-slate-400 text-sm">
                            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
                            No SMS activity yet.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {(smsLogs as Array<{
                              id: number;
                              direction: string;
                              message: string;
                              command: string | null;
                              status: string;
                              createdAt: string;
                            }>).slice(0, 15).map((log) => {
                              const isIn = log.direction === "inbound";
                              return (
                                <div key={log.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                                  <div className="flex items-start gap-3">
                                    <div className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                                      isIn ? "bg-blue-50" : "bg-slate-100"
                                    )}>
                                      <MessageSquare className={cn("w-4 h-4", isIn ? "text-blue-600" : "text-slate-500")} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={cn(
                                          "text-xs font-bold uppercase tracking-wide",
                                          isIn ? "text-blue-600" : "text-slate-500"
                                        )}>
                                          {isIn ? "You" : "Text Banks"}
                                        </span>
                                        {log.command && (
                                          <code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                            {log.command}
                                          </code>
                                        )}
                                        <span className={cn(
                                          "text-xs px-2 py-0.5 rounded-full font-medium ml-auto",
                                          log.status === "sent" || log.status === "delivered"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : log.status === "failed"
                                            ? "bg-red-50 text-red-600"
                                            : "bg-slate-100 text-slate-500"
                                        )}>
                                          {log.status}
                                        </span>
                                      </div>
                                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{log.message}</p>
                                      <p className="text-xs text-slate-400 mt-1">
                                        {new Date(log.createdAt).toLocaleString("en-US", {
                                          month: "short", day: "numeric",
                                          hour: "numeric", minute: "2-digit",
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Command reference */}
                      <div className="mt-4 bg-slate-900 rounded-2xl p-5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Commands</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { cmd: "BAL", desc: "All balances" },
                            { cmd: "TRANS", desc: "Recent transactions" },
                            { cmd: "BAL [name]", desc: "Specific account" },
                            { cmd: "STOP", desc: "Unsubscribe" },
                          ].map(({ cmd, desc }) => (
                            <div key={cmd} className="flex items-center gap-2">
                              <code className="text-blue-400 font-mono font-bold text-xs">{cmd}</code>
                              <span className="text-slate-500 text-xs">{desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PublicLayout>
  );
}
