import { useState, useEffect, useRef } from "react";
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
  KeyRound,
  CheckCircle2,
  Settings,
  Bell,
  BellOff,
  Zap,
  RefreshCw,
  Check,
  Mail,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { TextBanksLogo } from "@/components/layout/Logo";
import { useGetUserTransactions, useGetSmsLogs, useGetUser, useTellerEnroll, useGetTellerConfig, getGetUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

declare global {
  interface Window {
    TellerConnect?: {
      setup: (opts: {
        applicationId: string;
        environment: string;
        onSuccess: (enrollment: { accessToken: string; enrollment: { id: string; institution: { name: string } } }) => void;
        onExit?: () => void;
      }) => { open: () => void };
    };
  }
}

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
  } catch { return null; }
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
  return { label: "Pending", cls: "bg-slate-100 text-slate-600 border-slate-200" };
};

type Section = "accounts" | "activity" | "sms" | "settings";

export default function MyAccountPage() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [session, setSession] = useState<SessionUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("accounts");

  // Sign-in
  const [signInPhone, setSignInPhone] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign-up
  const [signUpFirst, setSignUpFirst] = useState("");
  const [signUpLast, setSignUpLast] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");
  const [signUpConsent, setSignUpConsent] = useState(false);

  // Settings state
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [smsOptedIn, setSmsOptedIn] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "premium">("basic");

  // Phone management state
  type PhoneSection = "view" | "reverify-otp" | "change-request" | "change-otp";
  const [phoneSection, setPhoneSection] = useState<PhoneSection>("view");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSuccess, setPhoneSuccess] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    if (s) {
      setEditFirstName(s.firstName);
      setEditLastName(s.lastName);
      setSmsOptedIn(!s.optedOut);
    }
  }, []);

  const { data: freshUser } = useGetUser(session?.id ?? 0, { query: { enabled: !!session, refetchInterval: 60000 } });
  const { data: transactions, refetch: refetchTransactions } = useGetUserTransactions(session?.id ?? 0, {}, { query: { enabled: !!session, refetchInterval: 60000 } });
  const { data: smsLogs } = useGetSmsLogs({ userId: session?.id, limit: 20 }, { query: { enabled: !!session, refetchInterval: 15000 } });

  const userAccounts = (freshUser as {
    accounts?: Array<{ id: number; bankName: string; accountType: string; accountLastFour: string; nickname: string; currentBalance: number }>;
  } | undefined)?.accounts ?? [];

  const handleSignIn = async () => {
    setError(null);
    if (!signInPhone.trim() || !signInPassword.trim()) { setError("Please enter your phone number and password."); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: signInPhone, password: signInPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Sign in failed."); return; }
      const user: SessionUser = { id: data.id, firstName: data.firstName, lastName: data.lastName, phoneNumber: data.phoneNumber, onboardingStatus: data.onboardingStatus, optedOut: data.optedOut };
      saveSession(user);
      setSession(user);
      setEditFirstName(user.firstName);
      setEditLastName(user.lastName);
      setSmsOptedIn(!user.optedOut);
    } catch { setError("Network error. Please try again."); }
    finally { setIsLoading(false); }
  };

  const handleSignUp = async () => {
    setError(null);
    if (!signUpFirst || !signUpLast || !signUpPhone || !signUpPassword) { setError("Please fill in all fields."); return; }
    if (signUpEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpEmail)) { setError("Please enter a valid email address."); return; }
    if (signUpPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (signUpPassword !== signUpConfirm) { setError("Passwords do not match."); return; }
    if (!signUpConsent) { setError("You must agree to receive SMS messages."); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: signUpFirst, lastName: signUpLast, email: signUpEmail || undefined, phoneNumber: signUpPhone, password: signUpPassword, smsConsent: true }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Sign up failed."); return; }
      const user: SessionUser = { id: data.id, firstName: data.firstName, lastName: data.lastName, phoneNumber: data.phoneNumber, onboardingStatus: data.onboardingStatus, optedOut: data.optedOut };
      saveSession(user);
      setSession(user);
      setEditFirstName(user.firstName);
      setEditLastName(user.lastName);
      setSmsOptedIn(!user.optedOut);
    } catch { setError("Network error. Please try again."); }
    finally { setIsLoading(false); }
  };

  const handleSignOut = () => {
    clearSession(); setSession(null); setSignInPhone(""); setSignInPassword(""); setError(null);
  };

  const handleSaveSettings = async () => {
    if (!session) return;
    setSettingsSaving(true); setSettingsError(null); setSettingsSaved(false);
    try {
      const res = await fetch(`/api/users/${session.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: editFirstName, lastName: editLastName, optedOut: !smsOptedIn }),
      });
      const data = await res.json();
      if (!res.ok) { setSettingsError(data.message || "Settings update failed."); return; }
      const updated: SessionUser = { ...session, firstName: data.firstName, lastName: data.lastName, optedOut: data.optedOut };
      saveSession(updated);
      setSession(updated);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch { setSettingsError("Network error. Please try again."); }
    finally { setSettingsSaving(false); }
  };

  // ── Phone Management ──
  const handleReverifyPhone = async () => {
    if (!session) return;
    setPhoneLoading(true); setPhoneError(null); setPhoneSuccess(null); setPhoneOtp("");
    try {
      const res = await fetch("/api/auth/reverify-phone", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.id }),
      });
      const data = await res.json();
      if (!res.ok) { setPhoneError(data.message || "Failed to send code."); return; }
      setPhoneSection("reverify-otp");
    } catch { setPhoneError("Network error. Please try again."); }
    finally { setPhoneLoading(false); }
  };

  const handleConfirmReverify = async () => {
    if (!session) return;
    setPhoneLoading(true); setPhoneError(null);
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.id, code: phoneOtp }),
      });
      const data = await res.json();
      if (!res.ok) { setPhoneError(data.message || "Invalid code."); return; }
      if (data.user) {
        const updated: SessionUser = { ...session, onboardingStatus: data.user.onboardingStatus };
        saveSession(updated); setSession(updated);
      }
      setPhoneSuccess("Phone number verified successfully.");
      setPhoneSection("view"); setPhoneOtp("");
    } catch { setPhoneError("Network error. Please try again."); }
    finally { setPhoneLoading(false); }
  };

  const handleRequestPhoneChange = async () => {
    if (!session) return;
    setPhoneLoading(true); setPhoneError(null); setPhoneSuccess(null);
    try {
      const res = await fetch("/api/auth/request-phone-change", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.id, newPhoneNumber: newPhone }),
      });
      const data = await res.json();
      if (!res.ok) { setPhoneError(data.message || "Failed to send code."); return; }
      setPhoneSection("change-otp"); setPhoneOtp("");
    } catch { setPhoneError("Network error. Please try again."); }
    finally { setPhoneLoading(false); }
  };

  const handleConfirmPhoneChange = async () => {
    if (!session) return;
    setPhoneLoading(true); setPhoneError(null);
    try {
      const res = await fetch("/api/auth/confirm-phone-change", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.id, code: phoneOtp }),
      });
      const data = await res.json();
      if (!res.ok) { setPhoneError(data.message || "Invalid code."); return; }
      if (data.user) {
        const updated: SessionUser = { ...session, phoneNumber: data.user.phoneNumber };
        saveSession(updated); setSession(updated);
      }
      setPhoneSuccess("Phone number updated successfully.");
      setPhoneSection("view"); setPhoneOtp(""); setNewPhone("");
    } catch { setPhoneError("Network error. Please try again."); }
    finally { setPhoneLoading(false); }
  };

  // ── Teller Connect (inline bank linking) ──
  const queryClient = useQueryClient();
  const [tellerScriptLoaded, setTellerScriptLoaded] = useState(false);
  const [bankLinkError, setBankLinkError] = useState<string | null>(null);
  const [bankLinkSuccess, setBankLinkSuccess] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const tellerConnectRef = useRef<{ open: () => void } | null>(null);
  const tellerEnrollMutation = useTellerEnroll();
  const { data: tellerConfig } = useGetTellerConfig({ query: { enabled: !!session } });

  // Load Teller Connect script
  useEffect(() => {
    if (document.querySelector('script[src*="teller.io"]')) { setTellerScriptLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.teller.io/connect/connect.js";
    script.async = true;
    script.onload = () => setTellerScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Set up Teller Connect widget when ready
  useEffect(() => {
    if (!tellerScriptLoaded || !tellerConfig?.applicationId || !session?.id) return;
    if (!window.TellerConnect) return;
    tellerConnectRef.current = window.TellerConnect.setup({
      applicationId: tellerConfig.applicationId,
      environment: tellerConfig.environment,
      onSuccess: async (enrollment) => {
        setBankLinkError(null);
        try {
          const result = await tellerEnrollMutation.mutateAsync({
            body: {
              userId: session.id,
              accessToken: enrollment.accessToken,
              enrollmentId: enrollment.enrollment.id,
              institutionName: enrollment.enrollment.institution.name,
            },
          });
          const count = (result as { accountsLinked?: number }).accountsLinked ?? 0;
          // Invalidate cache so the accounts list refreshes immediately
          await queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(session!.id) });
          setBankLinkSuccess(`${enrollment.enrollment.institution.name} connected — ${count} account${count !== 1 ? "s" : ""} linked!`);
          setTimeout(() => setBankLinkSuccess(null), 6000);
        } catch {
          setBankLinkError("Bank was linked but account sync failed. Try syncing below.");
        }
      },
      onExit: () => {},
    });
  }, [tellerScriptLoaded, tellerConfig, session?.id]);

  const openTellerConnect = () => {
    setBankLinkError(null);
    if (tellerConnectRef.current) tellerConnectRef.current.open();
    else setBankLinkError("Bank connection service is loading. Please try again in a moment.");
  };

  const handleSyncAccounts = async () => {
    if (!session) return;
    setIsSyncing(true);
    setBankLinkError(null);
    try {
      const res = await fetch(`/api/teller/sync/${session.id}`, { method: "POST" });
      const data = await res.json() as { accountsLinked?: number; errors?: string[] };
      if (!res.ok) { setBankLinkError("Sync failed. Please reconnect your bank."); return; }
      const count = data.accountsLinked ?? 0;
      await queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(session.id) });
      setBankLinkSuccess(`Sync complete — ${count} account${count !== 1 ? "s" : ""} updated.`);
      setTimeout(() => setBankLinkSuccess(null), 4000);
    } catch {
      setBankLinkError("Network error during sync. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const [isSyncingTxns, setIsSyncingTxns] = useState(false);
  const [txnSyncMessage, setTxnSyncMessage] = useState<string | null>(null);

  const handleSyncTransactions = async () => {
    if (!session) return;
    setIsSyncingTxns(true);
    setTxnSyncMessage(null);
    try {
      const res = await fetch(`/api/teller/sync-transactions/${session.id}`, { method: "POST" });
      const data = await res.json() as { success?: boolean; synced?: number; message?: string };
      if (!res.ok) { setTxnSyncMessage("Sync failed. Make sure your bank is connected."); return; }
      await refetchTransactions();
      setTxnSyncMessage(data.synced ? `${data.synced} transaction${data.synced !== 1 ? "s" : ""} synced.` : (data.message ?? "Up to date."));
      setTimeout(() => setTxnSyncMessage(null), 5000);
    } catch {
      setTxnSyncMessage("Network error. Please try again.");
    } finally {
      setIsSyncingTxns(false);
    }
  };

  // Auto-sync transactions once when dashboard first loads
  const txnSyncedRef = useRef(false);
  useEffect(() => {
    if (!session || txnSyncedRef.current) return;
    txnSyncedRef.current = true;
    fetch(`/api/teller/sync-transactions/${session.id}`, { method: "POST" })
      .then((r) => r.json())
      .then(() => refetchTransactions())
      .catch(() => {});
  }, [session]);

  const navItems: { key: Section; label: string; icon: typeof Building2 }[] = [
    { key: "accounts", label: "Accounts", icon: Building2 },
    { key: "activity", label: "Transactions", icon: CreditCard },
    { key: "sms", label: "SMS", icon: MessageSquare },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <PublicLayout>
      <div className="flex-1 bg-slate-50 min-h-screen">
        <AnimatePresence mode="wait">

          {/* ── Auth Screen ── */}
          {!session && (
            <motion.div key="auth" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center justify-center py-16 px-4 min-h-screen"
            >
              <div className="flex flex-col items-center mb-8">
                <TextBanksLogo size={40} />
                <h1 className="text-2xl font-display font-bold text-slate-900 mt-3 mb-1">Welcome back</h1>
                <p className="text-sm text-slate-500">Sign in to manage your account</p>
              </div>

              <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-100">
                  {(["signin", "signup"] as const).map((t) => (
                    <button key={t} onClick={() => { setTab(t); setError(null); }}
                      className={cn("flex-1 py-3.5 text-sm font-semibold transition-colors",
                        tab === t ? "text-blue-700 border-b-2 border-blue-700 bg-blue-50/30" : "text-slate-500 hover:text-slate-700"
                      )}>
                      {t === "signin" ? "Sign In" : "Create Account"}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {tab === "signin" && (
                    <motion.div key="signin" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                      <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">Mobile Number</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input type="tel" placeholder="(555) 123-4567" value={signInPhone}
                              onChange={(e) => { setSignInPhone(e.target.value); setError(null); }}
                              onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                              className="pl-9 h-10 border-slate-200 rounded-xl text-sm" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input type={showPassword ? "text" : "password"} placeholder="••••••" value={signInPassword}
                              onChange={(e) => { setSignInPassword(e.target.value); setError(null); }}
                              onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                              className="pl-9 pr-10 h-10 border-slate-200 rounded-xl text-sm" />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              onClick={() => setShowPassword((v) => !v)}>
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        {error && <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
                        <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-10 font-semibold text-sm" onClick={handleSignIn} disabled={isLoading}>
                          {isLoading ? "Signing in…" : "Sign In"}
                        </Button>
                        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
                          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                          Your information is kept private and secure.
                        </div>
                        <p className="text-xs text-center text-slate-400">
                          No account?{" "}<Link href="/register" className="text-blue-600 font-medium hover:underline">Sign up free</Link>
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
                          <label className="text-xs font-semibold text-slate-700">Email Address <span className="text-slate-400 font-normal">(optional)</span></label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input type="email" placeholder="jane@example.com" value={signUpEmail} onChange={(e) => { setSignUpEmail(e.target.value); setError(null); }} className="pl-9 h-10 border-slate-200 rounded-xl text-sm" />
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
                            I agree to receive SMS messages from Text Banks. Reply STOP to cancel.
                          </label>
                        </div>
                        {error && <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
                        <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-10 font-semibold text-sm" onClick={handleSignUp} disabled={isLoading}>
                          {isLoading ? "Creating account…" : "Create Account"}
                        </Button>
                        <p className="text-xs text-center text-slate-400">
                          Want to link a bank?{" "}<Link href="/register" className="text-blue-600 hover:underline font-medium">Full sign-up</Link>
                        </p>
                        <p className="text-xs text-center text-slate-400">
                          Already have an account?{" "}<button className="text-blue-600 font-medium hover:underline" onClick={() => { setTab("signin"); setError(null); }}>Sign in</button>
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
            <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              {/* Header */}
              <div className="bg-slate-900 text-white">
                <div className="container mx-auto px-4 md:px-6 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
                        {session.firstName[0]}{session.lastName[0]}
                      </div>
                      <div>
                        <h1 className="text-lg font-bold text-white">{session.firstName} {session.lastName}</h1>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm text-slate-400">{session.phoneNumber}</span>
                          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", statusConfig(session.onboardingStatus).cls)}>
                            {statusConfig(session.onboardingStatus).label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                      <LogOut className="w-4 h-4 mr-1.5" /> Sign out
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
                      <p className="text-xs text-slate-400 mb-1">SMS Status</p>
                      <p className="text-sm font-semibold flex items-center gap-1.5 mt-1">
                        {session.optedOut
                          ? <><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /><span className="text-red-300">Opted Out</span></>
                          : <><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" /><span className="text-emerald-400">Active</span></>
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="container mx-auto px-4 md:px-6 py-8 max-w-3xl">
                {/* Nav tabs */}
                <div className="flex bg-white border border-slate-200 rounded-xl p-1 mb-6 gap-1">
                  {navItems.map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setActiveSection(key)}
                      className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all",
                        activeSection === key ? "bg-blue-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                      )}>
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {/* ── Accounts ── */}
                  {activeSection === "accounts" && (
                    <motion.div key="accounts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">

                      {/* Status notifications */}
                      {bankLinkSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <p className="text-sm text-emerald-800 font-medium">{bankLinkSuccess}</p>
                        </div>
                      )}
                      {bankLinkError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                          <p className="text-sm text-red-700">{bankLinkError}</p>
                        </div>
                      )}

                      {userAccounts.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="w-7 h-7 text-slate-400" />
                          </div>
                          <h3 className="font-bold text-slate-900 mb-1">No bank accounts linked</h3>
                          <p className="text-sm text-slate-500 mb-5">Link a bank to start checking your balance by text.</p>
                          <div className="flex flex-col items-center gap-3">
                            <Button
                              onClick={openTellerConnect}
                              disabled={!tellerScriptLoaded || !tellerConfig || tellerEnrollMutation.isPending}
                              className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6"
                            >
                              {!tellerScriptLoaded ? "Loading…" : tellerEnrollMutation.isPending ? "Connecting…" : "Link a Bank Account"}
                            </Button>
                            <button
                              onClick={handleSyncAccounts}
                              disabled={isSyncing}
                              className="text-sm text-slate-500 hover:text-slate-700 hover:underline flex items-center gap-1.5"
                            >
                              <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
                              {isSyncing ? "Syncing…" : "Already linked? Retry sync"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {userAccounts.map((acct) => (
                            <div key={acct.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-blue-200 hover:shadow-sm transition-all">
                              <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                  <Building2 className="w-5 h-5 text-blue-700" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">
                                    {acct.bankName}<span className="text-slate-400 font-normal ml-1.5">••••{acct.accountLastFour}</span>
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-slate-500 capitalize">{acct.accountType}</span>
                                    <span className="text-slate-300">·</span>
                                    <code className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono">BAL {acct.nickname}</code>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-slate-900 text-base">${Number(acct.currentBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                                <p className="text-xs text-slate-400">available</p>
                              </div>
                            </div>
                          ))}
                          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                            <p className="text-sm text-emerald-800"><strong>Read-only access.</strong> Text Banks can never move money.</p>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={openTellerConnect}
                              disabled={!tellerScriptLoaded || !tellerConfig || tellerEnrollMutation.isPending}
                              className="text-sm text-blue-600 hover:underline font-medium disabled:opacity-50"
                            >
                              {tellerEnrollMutation.isPending ? "Connecting…" : "+ Link another bank account"}
                            </button>
                            <button
                              onClick={handleSyncAccounts}
                              disabled={isSyncing}
                              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5"
                            >
                              <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
                              {isSyncing ? "Syncing…" : "Sync balances"}
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                  {/* ── Transactions ── */}
                  {activeSection === "activity" && (
                    <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">Recent Transactions</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {txnSyncMessage
                                ? <span className="text-emerald-600 font-medium">{txnSyncMessage}</span>
                                : "Synced from your linked bank accounts"}
                            </p>
                          </div>
                          <button
                            onClick={handleSyncTransactions}
                            disabled={isSyncingTxns}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-all disabled:opacity-50"
                          >
                            <RefreshCw className={cn("w-3.5 h-3.5", isSyncingTxns && "animate-spin")} />
                            {isSyncingTxns ? "Syncing…" : "Refresh"}
                          </button>
                        </div>
                        {!transactions || (transactions as unknown[]).length === 0 ? (
                          <div className="py-12 text-center text-slate-400 text-sm">
                            <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-30" />
                            <p className="mb-3">{isSyncingTxns ? "Loading transactions…" : "No transactions on record yet."}</p>
                            {!isSyncingTxns && userAccounts.length > 0 && (
                              <button onClick={handleSyncTransactions} className="text-blue-600 hover:underline text-xs font-medium">
                                Sync now
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {(transactions as Array<{ id: number; merchantName: string; category: string; amount: number; type: string; transactionDate: string }>)
                              .slice(0, 25).map((txn) => {
                                const isCredit = txn.type === "credit";
                                return (
                                  <div key={txn.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", isCredit ? "bg-emerald-50" : "bg-red-50")}>
                                      {isCredit ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-slate-900 text-sm truncate">{txn.merchantName}</p>
                                      <p className="text-xs text-slate-400 capitalize">{txn.category}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className={cn("font-semibold text-sm", isCredit ? "text-emerald-600" : "text-slate-900")}>
                                        {isCredit ? "+" : "-"}${Math.abs(Number(txn.amount)).toFixed(2)}
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
                            <p className="text-xs text-slate-400 mt-0.5">Your recent text exchanges</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                          </div>
                        </div>
                        {!smsLogs || (smsLogs as unknown[]).length === 0 ? (
                          <div className="py-12 text-center text-slate-400 text-sm">
                            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
                            No SMS activity yet. Try texting <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">BAL</code> to get started.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {(smsLogs as Array<{ id: number; direction: string; message: string; command: string | null; status: string; createdAt: string }>)
                              .slice(0, 15).map((log) => {
                                const isIn = log.direction === "inbound";
                                return (
                                  <div key={log.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start gap-3">
                                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", isIn ? "bg-blue-50" : "bg-slate-100")}>
                                        <MessageSquare className={cn("w-4 h-4", isIn ? "text-blue-600" : "text-slate-500")} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <span className={cn("text-xs font-bold uppercase tracking-wide", isIn ? "text-blue-600" : "text-slate-500")}>
                                            {isIn ? "You" : "Text Banks"}
                                          </span>
                                          {log.command && <code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{log.command}</code>}
                                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium ml-auto",
                                            log.status === "sent" || log.status === "delivered" ? "bg-emerald-50 text-emerald-700"
                                              : log.status === "failed" ? "bg-red-50 text-red-600"
                                              : "bg-slate-100 text-slate-500"
                                          )}>{log.status}</span>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{log.message}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                          {new Date(log.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 bg-slate-900 rounded-2xl p-5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">All Commands</p>
                        <div className="grid grid-cols-1 gap-2.5">
                          {[
                            ["BAL", "All account balances"],
                            ["BAL [nickname]", "Balance for one account"],
                            ["TRANS", "Last 5 transactions"],
                            ["TRANS [n]", "Last N transactions (max 10)"],
                            ["LAST", "Single most recent transaction"],
                            ["LIMIT", "Credit card limits & available"],
                            ["SPEND", "This month's spending by category"],
                            ["STOP", "Unsubscribe from SMS"],
                            ["START", "Re-subscribe to SMS"],
                            ["HELP", "Show command list"],
                          ].map(([cmd, desc]) => (
                            <div key={cmd} className="flex items-center gap-3">
                              <code className="text-blue-400 font-mono font-bold text-xs w-28 shrink-0">{cmd}</code>
                              <span className="text-slate-500 text-xs">{desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Settings ── */}
                  {activeSection === "settings" && (
                    <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                      {/* Profile */}
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-500" /> Profile
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">Update your name and display info</p>
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-700">First Name</label>
                              <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className="h-10 border-slate-200 rounded-xl text-sm" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-700">Last Name</label>
                              <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className="h-10 border-slate-200 rounded-xl text-sm" />
                            </div>
                          </div>
                          {/* Phone Number Management */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-slate-700">Mobile Number</label>
                              {phoneSection === "view" && (
                                <div className="flex items-center gap-1.5">
                                  {(freshUser as { phoneVerified?: boolean } | undefined)?.phoneVerified
                                    ? <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                                    : <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"><AlertCircle className="w-3 h-3" /> Unverified</span>
                                  }
                                </div>
                              )}
                            </div>

                            {/* Current number display */}
                            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="text-sm font-mono font-semibold text-slate-800 flex-1">
                                {session.phoneNumber.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, "+$1 ($2) $3-$4")}
                              </span>
                              {phoneSection === "view" && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => { setPhoneSection("change-request"); setPhoneError(null); setPhoneSuccess(null); setNewPhone(""); }}
                                    className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2 transition-colors"
                                  >
                                    Change
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Phone error/success messages */}
                            {phoneError && (
                              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{phoneError}
                              </div>
                            )}
                            {phoneSuccess && (
                              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />{phoneSuccess}
                              </div>
                            )}

                            {/* Re-verify OTP entry */}
                            {phoneSection === "reverify-otp" && (
                              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <p className="text-xs text-blue-800 font-medium">Enter the 6-digit code sent to your current number:</p>
                                <Input
                                  value={phoneOtp}
                                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                  placeholder="000000"
                                  className="h-10 border-blue-300 rounded-xl text-sm font-mono tracking-widest text-center"
                                  maxLength={6}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-9 text-xs font-semibold"
                                    onClick={handleConfirmReverify}
                                    disabled={phoneLoading || phoneOtp.length !== 6}
                                  >
                                    {phoneLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Confirm Code"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="rounded-xl h-9 text-xs border-slate-200"
                                    onClick={() => { setPhoneSection("view"); setPhoneOtp(""); setPhoneError(null); }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Change number — enter new phone */}
                            {phoneSection === "change-request" && (
                              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <p className="text-xs text-slate-600 font-medium">Enter your new mobile number. We'll send a verification code to confirm it.</p>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <Input
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    placeholder="+1 (555) 000-0000"
                                    className="pl-9 h-10 border-slate-200 rounded-xl text-sm"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-9 text-xs font-semibold"
                                    onClick={handleRequestPhoneChange}
                                    disabled={phoneLoading || newPhone.replace(/\D/g, "").length < 10}
                                  >
                                    {phoneLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Send Code"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="rounded-xl h-9 text-xs border-slate-200"
                                    onClick={() => { setPhoneSection("view"); setNewPhone(""); setPhoneError(null); }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Change number — enter OTP sent to new number */}
                            {phoneSection === "change-otp" && (
                              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <p className="text-xs text-blue-800 font-medium">
                                  Enter the 6-digit code sent to <span className="font-mono font-bold">{newPhone}</span>:
                                </p>
                                <Input
                                  value={phoneOtp}
                                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                  placeholder="000000"
                                  className="h-10 border-blue-300 rounded-xl text-sm font-mono tracking-widest text-center"
                                  maxLength={6}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-9 text-xs font-semibold"
                                    onClick={handleConfirmPhoneChange}
                                    disabled={phoneLoading || phoneOtp.length !== 6}
                                  >
                                    {phoneLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Confirm New Number"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="rounded-xl h-9 text-xs border-slate-200"
                                    onClick={() => { setPhoneSection("change-request"); setPhoneOtp(""); setPhoneError(null); }}
                                  >
                                    Back
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Verify / re-verify button (view state) */}
                            {phoneSection === "view" && !(freshUser as { phoneVerified?: boolean } | undefined)?.phoneVerified && (
                              <button
                                onClick={handleReverifyPhone}
                                disabled={phoneLoading}
                                className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl h-9 transition-colors disabled:opacity-50"
                              >
                                {phoneLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                                Send Verification Code to My Number
                              </button>
                            )}
                            {phoneSection === "view" && (freshUser as { phoneVerified?: boolean } | undefined)?.phoneVerified && (
                              <button
                                onClick={handleReverifyPhone}
                                disabled={phoneLoading}
                                className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl h-9 transition-colors disabled:opacity-50"
                              >
                                {phoneLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                                Re-verify My Number
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* SMS Preferences */}
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-slate-500" /> SMS Preferences
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">Control how Text Banks messages you</p>
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", smsOptedIn ? "bg-emerald-50" : "bg-slate-200")}>
                                {smsOptedIn ? <Bell className="w-5 h-5 text-emerald-600" /> : <BellOff className="w-5 h-5 text-slate-400" />}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">SMS Messages</p>
                                <p className="text-xs text-slate-500">{smsOptedIn ? "You will receive SMS replies" : "SMS responses are paused"}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setSmsOptedIn((v) => !v)}
                              className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                smsOptedIn ? "bg-emerald-500" : "bg-slate-300"
                              )}
                            >
                              <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                                smsOptedIn ? "translate-x-6" : "translate-x-1"
                              )} />
                            </button>
                          </div>

                          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm">
                            <p className="text-xs font-semibold text-slate-700 mb-2">Text Banks SMS Number</p>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center">
                                <Phone className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-mono font-bold text-slate-900">(845) 689-0940</p>
                                <p className="text-xs text-slate-500">Text commands to this number</p>
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-slate-400 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            You can also text <code className="font-mono bg-amber-100 px-1 rounded">STOP</code> to (845) 689-0940 at any time to immediately opt out, or <code className="font-mono bg-amber-100 px-1 rounded">START</code> to re-enable.
                          </div>
                        </div>
                      </div>

                      {/* Billing & Plan */}
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <Zap className="w-4 h-4 text-slate-500" /> Plan & Billing
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">Manage your subscription</p>
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            {([
                              { key: "basic" as const, name: "Basic", price: "Free", features: ["2 accounts", "50 SMS/mo", "Standard support"] },
                              { key: "premium" as const, name: "Premium", price: "$4/mo", features: ["Unlimited accounts", "Unlimited SMS", "Priority support"] },
                            ]).map((plan) => (
                              <button
                                key={plan.key}
                                onClick={() => setSelectedPlan(plan.key)}
                                className={cn("relative text-left p-4 rounded-xl border-2 transition-all",
                                  selectedPlan === plan.key
                                    ? "border-blue-600 bg-blue-50"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                                )}
                              >
                                {selectedPlan === plan.key && (
                                  <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}
                                <p className="font-bold text-slate-900 text-sm mb-0.5">{plan.name}</p>
                                <p className={cn("text-base font-bold mb-3", selectedPlan === plan.key ? "text-blue-700" : "text-slate-700")}>{plan.price}</p>
                                <ul className="space-y-1">
                                  {plan.features.map((f) => (
                                    <li key={f} className="flex items-center gap-1.5 text-xs text-slate-500">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      {f}
                                    </li>
                                  ))}
                                </ul>
                              </button>
                            ))}
                          </div>
                          {selectedPlan === "premium" && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                              Payment processing coming soon. Premium features will be unlocked at launch.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Save button + errors */}
                      {settingsError && (
                        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                          <AlertCircle className="w-4 h-4 shrink-0" />{settingsError}
                        </div>
                      )}
                      {settingsSaved && (
                        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                          <CheckCircle2 className="w-4 h-4 shrink-0" /> Settings saved successfully.
                        </div>
                      )}
                      <Button
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-11 font-semibold"
                        onClick={handleSaveSettings}
                        disabled={settingsSaving}
                      >
                        {settingsSaving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Settings"}
                      </Button>
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
