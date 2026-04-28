import { useState, useEffect, useRef, useCallback } from "react";
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
  Plus,
  Trash2,
  Smartphone,
  ChevronDown,
  Bug,
  X,
  Clock,
  PieChart,
  Pencil,
  Tag,
  Wallet,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  BellRing,
  ArrowRightLeft,
  Landmark,
  Save,
  Crown,
  Star,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetUserTransactions, useGetSmsLogs, useGetUser, useTellerEnroll, useGetTellerConfig, getGetUserQueryKey } from "@workspace/api-client-react";
import { TextBanksLogo } from "@/components/layout/Logo";
import {
  useGetUserTransactions,
  useGetSmsLogs,
  useGetUser,
  useTellerEnroll,
  useGetTellerConfig,
  getGetUserQueryKey,
  getGetUserTransactionsQueryKey,
  getGetSmsLogsQueryKey,
  getGetTellerConfigQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AccountsSection } from "@/components/my-account/AccountsSection";
import { ActivitySection } from "@/components/my-account/ActivitySection";
import { SpendingSection } from "@/components/my-account/SpendingSection";
import { AlertsSection } from "@/components/my-account/AlertsSection";
import { SmsLogsSection } from "@/components/my-account/SmsLogsSection";
import { SettingsSection } from "@/components/my-account/SettingsSection";
import { AuthPanel } from "@/components/my-account/AuthPanel";
import { DeviceVerifyModal } from "@/components/my-account/DeviceVerifyModal";
import { ForgotPasswordModal } from "@/components/my-account/ForgotPasswordModal";

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

// Device trust token helpers (per-user, 30-day localStorage token)
const deviceTokenKey = (userId: number) => `tb_device_${userId}`;
function getDeviceToken(userId: number) { return localStorage.getItem(deviceTokenKey(userId)); }
function saveDeviceToken(userId: number, token: string) { localStorage.setItem(deviceTokenKey(userId), token); }
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const statusConfig = (status: string) => {
  if (status === "active") return { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (status === "bank_linked") return { label: "Bank Linked", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  if (status === "opted_out") return { label: "Opted Out", cls: "bg-red-50 text-red-700 border-red-200" };
  return { label: "Pending", cls: "bg-[#F0ECE5] text-[#3C3C4A] border-[#E5E0D8]" };
};

type Section = "accounts" | "activity" | "spend" | "alerts" | "sms" | "settings";

type Category = { id: number; name: string; color: string; icon: string; keywords: string[]; isSystem: boolean };
type AlertRow = { id: number; alertType: string; threshold: string | null; channel: string; enabled: boolean };

export default function MyAccountPage() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [session, setSession] = useState<SessionUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("accounts");

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [editingCat, setEditingCat] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatColor, setEditCatColor] = useState("#3b82f6");
  const [editCatKeywords, setEditCatKeywords] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#3b82f6");
  const [newCatKeywords, setNewCatKeywords] = useState("");
  const [catSaving, setCatSaving] = useState(false);
  const [spendPeriod, setSpendPeriod] = useState<"today" | "month">("month");

  // Alerts
  const [alertRows, setAlertRows] = useState<AlertRow[]>([]);
  const [alertSaving, setAlertSaving] = useState<Record<string, boolean>>({});

  // Sign-in
  const [signInPhone, setSignInPhone] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Google Sign-In
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [googleStep, setGoogleStep] = useState<"idle" | "needs_phone">("idle");
  const [googleProfile, setGoogleProfile] = useState<{ googleId: string; email: string; firstName: string; lastName: string } | null>(null);
  const [googlePhone, setGooglePhone] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Device verification state (shown after correct password on new device)
  const [deviceStep, setDeviceStep] = useState<"idle" | "verify">("idle");
  const [deviceUserId, setDeviceUserId] = useState<number | null>(null);
  const [deviceFirstName, setDeviceFirstName] = useState("");
  const [deviceEmailMasked, setDeviceEmailMasked] = useState<string | null>(null);
  const [deviceCode, setDeviceCode] = useState("");
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // Email verification state
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);
  const [emailVerifyStatus, setEmailVerifyStatus] = useState<"idle" | "success" | "error">("idle");
  const [emailVerifyMsg, setEmailVerifyMsg] = useState<string | null>(null);

  // Sign-up
  const [signUpFirst, setSignUpFirst] = useState("");
  const [signUpLast, setSignUpLast] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");
  const [signUpConsent, setSignUpConsent] = useState(false);

  // Forgot password
  const [showForgotPw, setShowForgotPw] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "sms" | "reset">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotUserId, setForgotUserId] = useState<number | null>(null);
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPw, setForgotNewPw] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Auto-logout inactivity (30 min)
  const INACTIVITY_MS = 30 * 60 * 1000;
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const warningActiveRef = useRef(false);

  // Profile dropdown
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Report Bug
  const [showReportBug, setShowReportBug] = useState(false);
  const [bugReport, setBugReport] = useState("");
  const [bugReportStatus, setBugReportStatus] = useState<"idle" | "sending" | "sent">("idle");

  // Settings state
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [smsOptedIn, setSmsOptedIn] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "pro" | "premium">("basic");

  // Phone management state (primary number)
  type PhoneSection = "view" | "reverify-otp" | "change-request" | "change-otp";
  const [phoneSection, setPhoneSection] = useState<PhoneSection>("view");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSuccess, setPhoneSuccess] = useState<string | null>(null);

  // Linked phones (secondary numbers — premium)
  type LinkedPhone = { id: number; phoneNumber: string; label: string | null; verified: boolean };
  const [linkedPhones, setLinkedPhones] = useState<LinkedPhone[]>([]);
  const [linkedPhonesLoading, setLinkedPhonesLoading] = useState(false);
  const [addPhoneStep, setAddPhoneStep] = useState<"idle" | "form" | "verify">("idle");
  const [addPhoneNumber, setAddPhoneNumber] = useState("");
  const [addPhoneLabel, setAddPhoneLabel] = useState("");
  const [addPhoneId, setAddPhoneId] = useState<number | null>(null);
  const [addPhoneOtp, setAddPhoneOtp] = useState("");
  const [addPhoneLoading, setAddPhoneLoading] = useState(false);
  const [addPhoneError, setAddPhoneError] = useState<string | null>(null);
  const [addPhoneSuccess, setAddPhoneSuccess] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    if (s) {
      setEditFirstName(s.firstName);
      setEditLastName(s.lastName);
      setSmsOptedIn(!s.optedOut);
    }

    // Check for email verification token in URL
    const params = new URLSearchParams(window.location.search);
    const emailToken = params.get("email_token");
    if (emailToken) {
      setEmailVerifyLoading(true);
      fetch("/api/auth/verify-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: emailToken }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setEmailVerifyStatus("success");
            setEmailVerifyMsg("Your email has been verified successfully.");
          } else {
            setEmailVerifyStatus("error");
            setEmailVerifyMsg(data.message || "Email verification failed.");
          }
        })
        .catch(() => { setEmailVerifyStatus("error"); setEmailVerifyMsg("Network error during email verification."); })
        .finally(() => setEmailVerifyLoading(false));
      // Strip token from URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const { data: freshUser } = useGetUser(session?.id ?? 0, {
    query: {
      queryKey: getGetUserQueryKey(session?.id ?? 0),
      enabled: !!session,
      refetchInterval: 60000,
    },
  });

  // Sync plan from DB whenever freshUser loads
  useEffect(() => {
    const fp = freshUser as { plan?: string } | undefined;
    if (fp?.plan === "basic" || fp?.plan === "pro" || fp?.plan === "premium") {
      setSelectedPlan(fp.plan as "basic" | "pro" | "premium");
    }
  }, [freshUser]);

  // Fetch linked (secondary) phones when session is available
  const fetchLinkedPhones = async () => {
    if (!session) return;
    setLinkedPhonesLoading(true);
    try {
      const res = await fetch(`/api/users/${session.id}/phones`);
      if (res.ok) setLinkedPhones(await res.json());
    } catch { /* noop */ } finally { setLinkedPhonesLoading(false); }
  };

  useEffect(() => {
    if (session?.id) fetchLinkedPhones();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  const { data: transactions, refetch: refetchTransactions } = useGetUserTransactions(
    session?.id ?? 0,
    {},
    {
      query: {
        queryKey: getGetUserTransactionsQueryKey(session?.id ?? 0, {}),
        enabled: !!session,
        refetchInterval: 60000,
      },
    },
  );
  const { data: smsLogs } = useGetSmsLogs(
    { userId: session?.id, limit: 20 },
    {
      query: {
        queryKey: getGetSmsLogsQueryKey({ userId: session?.id, limit: 20 }),
        enabled: !!session,
        refetchInterval: 15000,
      },
    },
  );

  const fetchCategories = async () => {
    if (!session) return;
    setCatLoading(true);
    try {
      const res = await fetch(`/api/users/${session.id}/categories`);
      if (res.ok) setCategories(await res.json());
    } catch { /* noop */ } finally { setCatLoading(false); }
  };

  const fetchAlerts = async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/users/${session.id}/alerts`);
      if (res.ok) setAlertRows(await res.json());
    } catch { /* noop */ }
  };

  useEffect(() => {
    if (session?.id) { fetchCategories(); fetchAlerts(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  const userAccounts = (freshUser as {
    accounts?: Array<{ id: number; bankName: string; accountType: string; accountLastFour: string; nickname: string; currentBalance: number }>;
  } | undefined)?.accounts ?? [];

  // ── Google Sign-In initialization ─────────────────────────────────────────
  useEffect(() => {
    fetch("/api/auth/google/config").then((r) => r.json()).then((data: { clientId: string | null }) => {
      setGoogleClientId(data.clientId);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!googleClientId || !googleBtnRef.current || session) return;
    const g = (window as Window & { google?: { accounts: { id: { initialize: (o: Record<string, unknown>) => void; renderButton: (el: HTMLElement, o: Record<string, unknown>) => void } } } }).google;
    if (!g) return;
    g.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
      auto_select: false,
    });
    if (googleBtnRef.current) {
      googleBtnRef.current.innerHTML = "";
      g.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: 320,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleClientId, session, tab]);

  const handleGoogleCredential = async (response: { credential: string }) => {
    setGoogleError(null); setGoogleLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) { setGoogleError(data.message || "Google sign-in failed."); return; }
      if (data.needs_phone) {
        setGoogleProfile({ googleId: data.google_id, email: data.email, firstName: data.first_name, lastName: data.last_name });
        setGoogleStep("needs_phone");
        return;
      }
      if (data.user) {
        const u = data.user;
        const sess: SessionUser = { id: u.id, firstName: u.firstName, lastName: u.lastName, phoneNumber: u.phoneNumber, onboardingStatus: u.onboardingStatus, optedOut: u.optedOut };
        saveSession(sess); setSession(sess);
      }
    } catch { setGoogleError("Network error. Please try again."); }
    finally { setGoogleLoading(false); }
  };

  const handleGoogleComplete = async () => {
    if (!googleProfile) return;
    setGoogleLoading(true); setGoogleError(null);
    try {
      const res = await fetch("/api/auth/google/complete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...googleProfile, phoneNumber: googlePhone }),
      });
      const data = await res.json();
      if (!res.ok) { setGoogleError(data.message || "Could not complete sign-up."); return; }
      if (data.user) {
        const u = data.user;
        const sess: SessionUser = { id: u.id, firstName: u.firstName, lastName: u.lastName, phoneNumber: u.phoneNumber, onboardingStatus: u.onboardingStatus, optedOut: u.optedOut };
        saveSession(sess); setSession(sess);
        setGoogleStep("idle"); setGoogleProfile(null); setGooglePhone("");
      }
    } catch { setGoogleError("Network error. Please try again."); }
    finally { setGoogleLoading(false); }
  };

  const handleSignIn = async () => {
    setError(null);
    if (!signInPhone.trim() || !signInPassword.trim()) { setError("Please enter your phone number and password."); return; }
    setIsLoading(true);
    try {
      // Try to find a saved device token for any existing account
      // We don't know the userId yet, so we send without token first,
      // then handle device_unverified to get the userId
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: signInPhone, password: signInPassword }),
      });
      const data = await res.json();

      // If device_unverified: password was correct but device needs verification
      if (res.status === 403 && data.error === "device_unverified") {
        // Check if we already have a stored device token for this user
        const storedToken = getDeviceToken(data.userId);
        if (storedToken) {
          // Try again with the stored token
          const res2 = await fetch("/api/auth/login", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phoneNumber: signInPhone, password: signInPassword, deviceToken: storedToken }),
          });
          const data2 = await res2.json();
          if (res2.ok) {
            const user: SessionUser = { id: data2.id, firstName: data2.firstName, lastName: data2.lastName, phoneNumber: data2.phoneNumber, onboardingStatus: data2.onboardingStatus, optedOut: data2.optedOut };
            saveSession(user); setSession(user);
            setEditFirstName(user.firstName); setEditLastName(user.lastName); setSmsOptedIn(!user.optedOut);
            return;
          }
        }
        // No valid stored token — show device verification screen
        setDeviceStep("verify");
        setDeviceUserId(data.userId);
        setDeviceFirstName(data.firstName);
        setDeviceEmailMasked(data.email ?? null);
        setDeviceCode("");
        setDeviceError(null);
        // Auto-fire: send the device code immediately
        fetch("/api/auth/send-device-code", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.userId }),
        }).catch(() => {});
        return;
      }

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

  const handleVerifyDevice = async () => {
    if (!deviceUserId || !deviceCode.trim()) return;
    setDeviceLoading(true); setDeviceError(null);
    try {
      const deviceName = `${navigator.platform || "Browser"} — ${new Date().toLocaleDateString()}`;
      const res = await fetch("/api/auth/verify-device", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deviceUserId, code: deviceCode, deviceName }),
      });
      const data = await res.json();
      if (!res.ok) { setDeviceError(data.message || "Invalid code."); return; }
      // Save device token for future logins
      saveDeviceToken(deviceUserId, data.deviceToken);
      // Log the user in
      const u = data.user;
      const user: SessionUser = { id: u.id, firstName: u.firstName, lastName: u.lastName, phoneNumber: u.phoneNumber, onboardingStatus: u.onboardingStatus, optedOut: u.optedOut };
      saveSession(user); setSession(user);
      setEditFirstName(user.firstName); setEditLastName(user.lastName); setSmsOptedIn(!user.optedOut);
      setDeviceStep("idle"); setDeviceCode("");
    } catch { setDeviceError("Network error. Please try again."); }
    finally { setDeviceLoading(false); }
  };

  const handleResendDeviceCode = async () => {
    if (!deviceUserId) return;
    setDeviceLoading(true); setDeviceError(null);
    try {
      await fetch("/api/auth/send-device-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deviceUserId }),
      });
    } catch { setDeviceError("Could not resend code. Please try again."); }
    finally { setDeviceLoading(false); }
  };

  const handleResendEmailVerification = async () => {
    if (!session) return;
    setEmailVerifyLoading(true);
    try {
      const res = await fetch("/api/auth/resend-email-verification", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.id }),
      });
      const data = await res.json();
      setEmailVerifyStatus(res.ok ? "success" : "error");
      setEmailVerifyMsg(res.ok ? "Verification email sent — check your inbox." : (data.message || "Failed to send."));
    } catch { setEmailVerifyStatus("error"); setEmailVerifyMsg("Network error."); }
    finally { setEmailVerifyLoading(false); }
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

  // ── Auto-logout on inactivity ──────────────────────────────────────────────
  const resetInactivityTimer = useCallback(() => {
    // Don't reset while the warning dialog is showing — let the countdown run
    if (warningActiveRef.current) return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      warningActiveRef.current = true;
      setShowInactivityWarning(true);
      // Give them 60 seconds to respond, then log out
      inactivityTimer.current = setTimeout(() => {
        warningActiveRef.current = false;
        clearSession(); setSession(null); setShowInactivityWarning(false);
      }, 60_000);
    }, INACTIVITY_MS);
  }, [INACTIVITY_MS]);

  useEffect(() => {
    if (!session) return;
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [session, resetInactivityTimer]);

  // ── Profile dropdown close on outside click ─────────────────────────────
  useEffect(() => {
    if (!showProfileMenu) return;
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showProfileMenu]);

  // ── Forgot Password ─────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    setForgotError(null); setForgotLoading(true);
    try {
      if (forgotStep === "email") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail }),
        });
        const data = await res.json();
        if (!res.ok) { setForgotError(data.message || "Could not find account."); return; }
        setForgotSuccess("Password reset link sent — check your email.");
      } else if (forgotStep === "sms") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: forgotPhone }),
        });
        const data = await res.json();
        if (!res.ok) { setForgotError(data.message || "Could not find account."); return; }
        setForgotUserId(data.userId);
        setForgotStep("reset");
      }
    } catch { setForgotError("Network error. Please try again."); }
    finally { setForgotLoading(false); }
  };

  const handleForgotOtpReset = async () => {
    if (!forgotUserId) return;
    setForgotError(null); setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: forgotUserId, otp: forgotOtp, newPassword: forgotNewPw }),
      });
      const data = await res.json();
      if (!res.ok) { setForgotError(data.message || "Reset failed."); return; }
      setForgotSuccess("Password reset successfully! You can now sign in.");
      setShowForgotPw(false);
    } catch { setForgotError("Network error. Please try again."); }
    finally { setForgotLoading(false); }
  };

  // ── Report Bug ───────────────────────────────────────────────────────────
  const handleReportBug = async () => {
    if (!bugReport.trim()) return;
    setBugReportStatus("sending");
    try {
      await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: session ? `${session.firstName} ${session.lastName}` : "Unknown", message: bugReport, type: "bug", subject: "Bug Report" }),
      });
      setBugReportStatus("sent");
      setBugReport("");
      setTimeout(() => { setShowReportBug(false); setBugReportStatus("idle"); }, 2500);
    } catch { setBugReportStatus("idle"); }
  };

  const handleSignOut = () => {
    warningActiveRef.current = false;
    clearSession(); setSession(null); setSignInPhone(""); setSignInPassword(""); setError(null);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    setShowInactivityWarning(false);
  };

  const handleSaveSettings = async () => {
    if (!session) return;
    setSettingsSaving(true); setSettingsError(null); setSettingsSaved(false);
    try {
      const res = await fetch(`/api/users/${session.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: editFirstName, lastName: editLastName, optedOut: !smsOptedIn, plan: selectedPlan }),
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

  // ── Linked Phone Handlers ──
  const handleAddPhone = async () => {
    if (!session) return;
    setAddPhoneLoading(true); setAddPhoneError(null);
    try {
      const res = await fetch(`/api/users/${session.id}/phones`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: addPhoneNumber, label: addPhoneLabel }),
      });
      const data = await res.json();
      if (!res.ok) { setAddPhoneError(data.message || "Failed to add phone."); return; }
      setAddPhoneId(data.id);
      setAddPhoneStep("verify");
      setAddPhoneOtp("");
    } catch { setAddPhoneError("Network error. Please try again."); }
    finally { setAddPhoneLoading(false); }
  };

  const handleVerifyLinkedPhone = async () => {
    if (!session || addPhoneId === null) return;
    setAddPhoneLoading(true); setAddPhoneError(null);
    try {
      const res = await fetch(`/api/users/${session.id}/phones/${addPhoneId}/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: addPhoneOtp }),
      });
      const data = await res.json();
      if (!res.ok) { setAddPhoneError(data.message || "Invalid code."); return; }
      setAddPhoneStep("idle"); setAddPhoneNumber(""); setAddPhoneLabel(""); setAddPhoneId(null); setAddPhoneOtp("");
      setAddPhoneSuccess("Phone number linked and verified.");
      setTimeout(() => setAddPhoneSuccess(null), 5000);
      await fetchLinkedPhones();
    } catch { setAddPhoneError("Network error. Please try again."); }
    finally { setAddPhoneLoading(false); }
  };

  const handleResendLinkedPhoneOtp = async () => {
    if (!session || addPhoneId === null) return;
    setAddPhoneLoading(true); setAddPhoneError(null);
    try {
      const res = await fetch(`/api/users/${session.id}/phones/${addPhoneId}/resend`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) setAddPhoneError(data.message || "Failed to resend.");
    } catch { setAddPhoneError("Network error."); }
    finally { setAddPhoneLoading(false); }
  };

  const handleRemoveLinkedPhone = async (phoneId: number) => {
    if (!session) return;
    try {
      const res = await fetch(`/api/users/${session.id}/phones/${phoneId}`, { method: "DELETE" });
      if (res.ok) setLinkedPhones((prev) => prev.filter((p) => p.id !== phoneId));
    } catch { /* noop */ }
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
  const { data: tellerConfig } = useGetTellerConfig({
    query: { queryKey: getGetTellerConfigQueryKey(), enabled: !!session },
  });

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
            data: {
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

  const navItems: { key: Section; label: string; icon: typeof Building2; pro?: boolean }[] = [
    { key: "accounts", label: "Accounts", icon: Building2 },
    { key: "activity", label: "Transactions", icon: CreditCard },
    { key: "spend", label: "Spending", icon: PieChart, pro: true },
    { key: "alerts", label: "Alerts", icon: Bell, pro: true },
    { key: "sms", label: "SMS", icon: MessageSquare },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <PublicLayout>
      <div className="flex-1 bg-[#F8F6F2] min-h-screen">
        <AnimatePresence mode="wait">

          {/* ── Auth Screen ── */}
          {!session && (
            <AuthPanel>
              <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E5E0D8] shadow-sm overflow-hidden">
                <div className="flex border-b border-[#EDE8E0]">
                  {(["signin", "signup"] as const).map((t) => (
                    <button key={t} onClick={() => { setTab(t); setError(null); }}
                      className={cn("flex-1 py-3.5 text-sm font-semibold transition-colors",
                        tab === t ? "text-blue-700 border-b-2 border-blue-700 bg-blue-50/30" : "text-[#7C7C8A] hover:text-[#2C2C35]"
                      )}>
                      {t === "signin" ? "Sign In" : "Create Account"}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {/* ── Device Verification Screen ── */}
                  {deviceStep === "verify" && (
                    <motion.div key="device-verify" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <DeviceVerifyModal
                        deviceFirstName={deviceFirstName}
                        deviceEmailMasked={deviceEmailMasked}
                        deviceCode={deviceCode}
                        setDeviceCode={setDeviceCode}
                        deviceError={deviceError}
                        deviceLoading={deviceLoading}
                        onVerify={handleVerifyDevice}
                        onResend={handleResendDeviceCode}
                        onBack={() => { setDeviceStep("idle"); setDeviceCode(""); setDeviceError(null); }}
                      />
                    </motion.div>
                  )}

                  {tab === "signin" && deviceStep === "idle" && googleStep === "needs_phone" && googleProfile && (
                    <motion.div key="google-phone" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-[#F8F6F2] border border-[#E5E0D8] rounded-xl">
                          <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-sm text-blue-700">
                            {googleProfile.firstName?.[0] || googleProfile.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#0D0E12]">{googleProfile.firstName} {googleProfile.lastName}</p>
                            <p className="text-xs text-[#7C7C8A]">{googleProfile.email}</p>
                          </div>
                        </div>
                        <p className="text-xs text-[#3C3C4A]">One more step — we need your mobile number so you can text banking commands.</p>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#2C2C35]">Mobile Number</label>
                          <PhoneInput
                            value={googlePhone}
                            onChange={(v) => { setGooglePhone(v); setGoogleError(null); }}
                            onKeyDown={(e) => e.key === "Enter" && googlePhone.replace(/\D/g, "").length >= 10 && handleGoogleComplete()}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        {googleError && <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5"><AlertCircle className="w-4 h-4 shrink-0" />{googleError}</div>}
                        <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-10 font-semibold text-sm" onClick={handleGoogleComplete}
                          disabled={googleLoading || googlePhone.replace(/\D/g, "").length < 10}>
                          {googleLoading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Creating account…</> : "Complete Sign-Up"}
                        </Button>
                        <button className="w-full text-center text-xs text-[#9A9AA8] hover:text-[#3C3C4A]" onClick={() => { setGoogleStep("idle"); setGoogleProfile(null); setGoogleError(null); }}>
                          Use a different account
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {tab === "signin" && deviceStep === "idle" && googleStep === "idle" && (
                    <motion.div key="signin" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                      <div className="p-6 space-y-4">
                        {/* Google Sign-In */}
                        {googleClientId && (
                          <div className="space-y-3">
                            {googleError && (
                              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                                <AlertCircle className="w-4 h-4 shrink-0" />{googleError}
                              </div>
                            )}
                            <div ref={googleBtnRef} className="flex justify-center" />
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-px bg-slate-200" />
                              <span className="text-xs text-[#9A9AA8] font-medium">or sign in with phone</span>
                              <div className="flex-1 h-px bg-slate-200" />
                            </div>
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#2C2C35]">Mobile Number</label>
                          <PhoneInput
                            value={signInPhone}
                            onChange={(v) => { setSignInPhone(v); setError(null); }}
                            onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#2C2C35]">Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9AA8]" />
                            <Input type={showPassword ? "text" : "password"} placeholder="••••••" value={signInPassword}
                              onChange={(e) => { setSignInPassword(e.target.value); setError(null); }}
                              onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                              className="pl-9 pr-10 h-10 border-[#E5E0D8] rounded-xl text-sm" />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9AA8] hover:text-[#3C3C4A]"
                              onClick={() => setShowPassword((v) => !v)}>
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        {error && <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
                        <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-10 font-semibold text-sm" onClick={handleSignIn} disabled={isLoading}>
                          {isLoading ? "Signing in…" : "Sign In"}
                        </Button>
                        <div className="flex justify-center">
                          <button
                            type="button"
                            className="text-xs text-blue-600 hover:underline font-medium"
                            onClick={() => { setShowForgotPw(true); setForgotStep("email"); setForgotEmail(""); setForgotPhone(""); setForgotError(null); setForgotSuccess(null); }}
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#9A9AA8] bg-[#F8F6F2] rounded-lg p-3">
                          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                          Your information is kept private and secure.
                        </div>
                        <p className="text-xs text-center text-[#9A9AA8]">
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
                            <label className="text-xs font-semibold text-[#2C2C35]">First Name</label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9AA8]" />
                              <Input placeholder="Jane" value={signUpFirst} onChange={(e) => { setSignUpFirst(e.target.value); setError(null); }} className="pl-9 h-10 border-[#E5E0D8] rounded-xl text-sm" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#2C2C35]">Last Name</label>
                            <Input placeholder="Doe" value={signUpLast} onChange={(e) => { setSignUpLast(e.target.value); setError(null); }} className="h-10 border-[#E5E0D8] rounded-xl text-sm" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#2C2C35]">Email Address <span className="text-[#9A9AA8] font-normal">(optional)</span></label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9AA8]" />
                            <Input type="email" placeholder="jane@example.com" value={signUpEmail} onChange={(e) => { setSignUpEmail(e.target.value); setError(null); }} className="pl-9 h-10 border-[#E5E0D8] rounded-xl text-sm" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#2C2C35]">Mobile Number</label>
                          <PhoneInput
                            value={signUpPhone}
                            onChange={(v) => { setSignUpPhone(v); setError(null); }}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#2C2C35]">Password</label>
                            <div className="relative">
                              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A9AA8]" />
                              <Input type={showPassword ? "text" : "password"} placeholder="••••••" value={signUpPassword} onChange={(e) => { setSignUpPassword(e.target.value); setError(null); }} className="pl-9 pr-9 h-10 border-[#E5E0D8] rounded-xl text-sm" />
                              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9AA8] hover:text-[#3C3C4A]" onClick={() => setShowPassword((v) => !v)}>
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#2C2C35]">Confirm</label>
                            <Input type={showPassword ? "text" : "password"} placeholder="••••••" value={signUpConfirm} onChange={(e) => { setSignUpConfirm(e.target.value); setError(null); }} className="h-10 border-[#E5E0D8] rounded-xl text-sm" />
                          </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-xl border border-[#E5E0D8] bg-[#F8F6F2] p-3">
                          <Checkbox id="consent" checked={signUpConsent} onCheckedChange={(v) => { setSignUpConsent(!!v); setError(null); }} className="mt-0.5" />
                          <label htmlFor="consent" className="text-xs text-[#7C7C8A] leading-relaxed cursor-pointer">
                            I agree to receive SMS messages from Text Banks. Reply STOP to cancel.
                          </label>
                        </div>
                        {error && <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
                        <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-10 font-semibold text-sm" onClick={handleSignUp} disabled={isLoading}>
                          {isLoading ? "Creating account…" : "Create Account"}
                        </Button>
                        <p className="text-xs text-center text-[#9A9AA8]">
                          Want to link a bank?{" "}<Link href="/register" className="text-blue-600 hover:underline font-medium">Full sign-up</Link>
                        </p>
                        <p className="text-xs text-center text-[#9A9AA8]">
                          Already have an account?{" "}<button className="text-blue-600 font-medium hover:underline" onClick={() => { setTab("signin"); setError(null); }}>Sign in</button>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </AuthPanel>
          )}

          {/* ── Dashboard ── */}
          {session && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              {/* Clean top bar */}
              <div className="bg-white border-b border-[#E5E0D8] sticky top-0 z-30">
                <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                  <div className="flex items-center justify-between h-14">
                    {/* Left: avatar + name */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {session.firstName[0]}{session.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0D0E12] leading-none">{session.firstName} {session.lastName}</p>
                        <p className="text-[11px] text-[#9A9AA8] mt-0.5">{session.phoneNumber}</p>
                      </div>
                      <span className={cn("hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full border", statusConfig(session.onboardingStatus).cls)}>
                        {statusConfig(session.onboardingStatus).label}
                      </span>
                    </div>
                    {/* Right: profile dropdown */}
                    <div className="relative" ref={profileMenuRef}>
                      <button
                        onClick={() => setShowProfileMenu((v) => !v)}
                        className="flex items-center gap-1.5 text-[#7C7C8A] hover:text-[#0D0E12] transition-colors px-2 py-1.5 rounded-lg hover:bg-[#F8F6F2]"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {showProfileMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-[#E5E0D8] overflow-hidden z-50"
                          >
                            <div className="px-4 py-3 border-b border-[#EDE8E0] bg-[#F8F6F2]">
                              <p className="text-sm font-bold text-[#0D0E12]">{session.firstName} {session.lastName}</p>
                              <p className="text-xs text-[#7C7C8A]">{session.phoneNumber}</p>
                            </div>
                            <div className="py-1">
                              <button
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#2C2C35] hover:bg-[#F8F6F2] transition-colors"
                                onClick={() => { setActiveSection("settings"); setShowProfileMenu(false); }}
                              >
                                <Settings className="w-4 h-4 text-[#9A9AA8]" /> Settings
                              </button>
                              <button
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#2C2C35] hover:bg-[#F8F6F2] transition-colors"
                                onClick={() => { setShowReportBug(true); setShowProfileMenu(false); }}
                              >
                                <Bug className="w-4 h-4 text-[#9A9AA8]" /> Report a bug
                              </button>
                            </div>
                            <div className="border-t border-[#EDE8E0] py-1">
                              <button
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                onClick={handleSignOut}
                              >
                                <LogOut className="w-4 h-4" /> Sign out
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

              <div className="container mx-auto px-4 md:px-6 py-6 max-w-3xl">

                {/* Email verification token result banner */}
                {emailVerifyStatus === "success" && (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-emerald-800">Email verified!</p>
                      <p className="text-xs text-emerald-700">{emailVerifyMsg}</p>
                    </div>
                    <button onClick={() => setEmailVerifyStatus("idle")} className="text-emerald-400 hover:text-emerald-600 text-xs">Dismiss</button>
                  </div>
                )}
                {emailVerifyStatus === "error" && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-800">Verification failed</p>
                      <p className="text-xs text-red-700">{emailVerifyMsg}</p>
                    </div>
                    <button onClick={() => setEmailVerifyStatus("idle")} className="text-red-400 hover:text-red-600 text-xs">Dismiss</button>
                  </div>
                )}

                {/* Email not-verified nudge banner */}
                {(freshUser as { emailVerified?: boolean; email?: string } | undefined)?.email &&
                  !(freshUser as { emailVerified?: boolean } | undefined)?.emailVerified &&
                  emailVerifyStatus === "idle" && (
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                    <Mail className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-900">Please verify your email address</p>
                      <p className="text-xs text-amber-700 mt-0.5">Check your inbox for a verification link, or resend it below.</p>
                    </div>
                    <button
                      onClick={handleResendEmailVerification}
                      disabled={emailVerifyLoading}
                      className="text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {emailVerifyLoading ? "Sending…" : "Resend link"}
                    </button>
                  </div>
                )}

                {/* ── Onboarding Progress ── */}
                {session.onboardingStatus !== "active" && (() => {
                  const steps = [
                    { label: "Account created", done: true },
                    { label: "Phone verified", done: ["phone_verified", "bank_linked", "active"].includes(session.onboardingStatus) },
                    { label: "Bank linked", done: ["bank_linked", "active"].includes(session.onboardingStatus) },
                    { label: "Ready to text!", done: session.onboardingStatus === "active" },
                  ];
                  const doneCount = steps.filter((s) => s.done).length;
                  const pct = Math.round((doneCount / steps.length) * 100);
                  return (
                    <div className="bg-white border border-blue-100 rounded-xl p-5 mb-5 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-[#0D0E12]">Setup progress</p>
                          <p className="text-xs text-[#7C7C8A]">{doneCount} of {steps.length} steps complete</p>
                        </div>
                        <span className="text-sm font-bold text-blue-700">{pct}%</span>
                      </div>
                      <div className="h-2 bg-[#F0ECE5] rounded-full overflow-hidden mb-4">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {steps.map((step, i) => (
                          <div key={i} className="flex flex-col items-center gap-1.5 text-center">
                            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                              step.done ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-[#E5E0D8] text-[#9A9AA8]"
                            )}>
                              {step.done ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                            </div>
                            <span className={cn("text-xs leading-tight", step.done ? "text-[#2C2C35] font-medium" : "text-[#9A9AA8]")}>{step.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Real-time Financial Summary ── */}
                {userAccounts.length > 0 && (() => {
                  const depositAccounts = userAccounts.filter((a) => a.accountType !== "credit_card");
                  const creditAccounts = userAccounts.filter((a) => a.accountType === "credit_card");
                  const totalBalance = depositAccounts.reduce((s, a) => s + Number(a.currentBalance), 0);
                  const totalDebt = creditAccounts.reduce((s, a) => s + Math.max(0, -Number(a.currentBalance)), 0);
                  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  return (
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-5 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <Wallet className="w-4 h-4 text-blue-300" />
                          <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Total Balance</span>
                        </div>
                        <p className="text-2xl font-bold tracking-tight">{fmt(totalBalance)}</p>
                        <p className="text-xs text-blue-300 mt-1">{depositAccounts.length} account{depositAccounts.length !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="w-4 h-4 text-red-400" />
                          <span className="text-xs font-semibold text-[#7C7C8A] uppercase tracking-wide">Credit Debt</span>
                        </div>
                        <p className={cn("text-2xl font-bold tracking-tight", totalDebt > 0 ? "text-red-600" : "text-emerald-600")}>{fmt(totalDebt)}</p>
                        <p className="text-xs text-[#9A9AA8] mt-1">{creditAccounts.length} card{creditAccounts.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Nav tabs — underline style */}
                <div className="flex border-b border-[#E5E0D8] mb-6 overflow-x-auto no-scrollbar -mx-4 md:-mx-6 px-4 md:px-6">
                  {navItems.map(({ key, label, icon: Icon, pro }) => (
                    <button
                      key={key}
                      onClick={() => setActiveSection(key)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors shrink-0",
                        activeSection === key
                          ? "border-blue-700 text-blue-700"
                          : "border-transparent text-[#9A9AA8] hover:text-[#2C2C35] hover:border-[#C8C0B5]"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                      {pro && <Crown className="w-3 h-3 text-amber-500" />}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {/* ── Accounts ── */}
                  {activeSection === "accounts" && (
                    <AccountsSection>
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
                        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-12 text-center">
                          <div className="w-14 h-14 bg-[#F0ECE5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="w-7 h-7 text-[#9A9AA8]" />
                          </div>
                          <h3 className="font-bold text-[#0D0E12] mb-1">No bank accounts linked</h3>
                          <p className="text-sm text-[#7C7C8A] mb-5">Link a bank to start checking your balance by text.</p>
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
                              className="text-sm text-[#7C7C8A] hover:text-[#2C2C35] hover:underline flex items-center gap-1.5"
                            >
                              <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
                              {isSyncing ? "Syncing…" : "Already linked? Retry sync"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {userAccounts.map((acct) => (
                            <div key={acct.id} className="bg-white border border-[#E5E0D8] rounded-2xl p-5 flex items-center justify-between hover:border-blue-200 hover:shadow-sm transition-all">
                              <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                  <Building2 className="w-5 h-5 text-blue-700" />
                                </div>
                                <div>
                                  <p className="font-semibold text-[#0D0E12] text-sm">
                                    {acct.bankName}<span className="text-[#9A9AA8] font-normal ml-1.5">••••{acct.accountLastFour}</span>
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-[#7C7C8A] capitalize">{acct.accountType}</span>
                                    <span className="text-slate-300">·</span>
                                    <code className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono">BAL {acct.nickname}</code>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-[#0D0E12] text-base">${Number(acct.currentBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                                <p className="text-xs text-[#9A9AA8]">available</p>
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
                              className="text-sm text-[#7C7C8A] hover:text-[#2C2C35] flex items-center gap-1.5"
                            >
                              <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
                              {isSyncing ? "Syncing…" : "Sync balances"}
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                    </AccountsSection>
                  )}

                  {/* ── Transactions ── */}
                  {activeSection === "activity" && (
                    <ActivitySection>
                    <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-[#EDE8E0] flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-[#0D0E12] text-sm">Recent Transactions</h3>
                            <p className="text-xs text-[#9A9AA8] mt-0.5">
                              {txnSyncMessage
                                ? <span className="text-emerald-600 font-medium">{txnSyncMessage}</span>
                                : "Synced from your linked bank accounts"}
                            </p>
                          </div>
                          <button
                            onClick={handleSyncTransactions}
                            disabled={isSyncingTxns}
                            className="flex items-center gap-1.5 text-xs text-[#7C7C8A] hover:text-[#2C2C35] font-medium px-3 py-1.5 rounded-lg border border-[#E5E0D8] hover:border-slate-300 transition-all disabled:opacity-50"
                          >
                            <RefreshCw className={cn("w-3.5 h-3.5", isSyncingTxns && "animate-spin")} />
                            {isSyncingTxns ? "Syncing…" : "Refresh"}
                          </button>
                        </div>
                        {!transactions || (transactions as unknown[]).length === 0 ? (
                          <div className="py-12 text-center text-[#9A9AA8] text-sm">
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
                                  <div key={txn.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F8F6F2] transition-colors">
                                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", isCredit ? "bg-emerald-50" : "bg-red-50")}>
                                      {isCredit ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-[#0D0E12] text-sm truncate">{txn.merchantName}</p>
                                      <p className="text-xs text-[#9A9AA8] capitalize">{txn.category}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className={cn("font-semibold text-sm", isCredit ? "text-emerald-600" : "text-[#0D0E12]")}>
                                        {isCredit ? "+" : "-"}${Math.abs(Number(txn.amount)).toFixed(2)}
                                      </p>
                                      <p className="text-xs text-[#9A9AA8]">
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
                    </ActivitySection>
                  )}

                  {/* ── Spending Analysis ── */}
                  {activeSection === "spend" && (
                    <SpendingSection>
                    <motion.div key="spend" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                      {/* Period toggle */}
                      <div className="flex bg-white border border-[#E5E0D8] rounded-xl p-1 gap-1">
                        {([["today", "Today"], ["month", "This Month"]] as const).map(([v, l]) => (
                          <button key={v} onClick={() => setSpendPeriod(v)}
                            className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
                              spendPeriod === v ? "bg-blue-700 text-white shadow-sm" : "text-[#7C7C8A] hover:text-[#2C2C35]"
                            )}>
                            {l}
                          </button>
                        ))}
                      </div>

                      {/* Spending breakdown */}
                      {(() => {
                        const txns = (transactions as Array<{ id: number; merchantName: string; category: string; amount: number; type: string; transactionDate: string }> | undefined) ?? [];
                        const now = new Date();
                        const filtered = txns.filter((t) => {
                          if (t.type !== "debit") return false;
                          const d = new Date(t.transactionDate);
                          if (spendPeriod === "today") {
                            return d.toDateString() === now.toDateString();
                          }
                          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-12 text-center">
                              <BarChart3 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                              <p className="font-semibold text-[#2C2C35] mb-1">No spending {spendPeriod === "today" ? "today" : "this month"}</p>
                              <p className="text-xs text-[#9A9AA8]">Transactions will appear here as they sync from your bank.</p>
                            </div>
                          );
                        }

                        const catMap: Record<string, number> = {};
                        for (const t of filtered) {
                          const cat = t.category || "other";
                          catMap[cat] = (catMap[cat] ?? 0) + Math.abs(Number(t.amount));
                        }
                        const total = Object.values(catMap).reduce((a, b) => a + b, 0);
                        const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

                        const catColors: Record<string, string> = {
                          food: "#f97316", dining: "#f97316", groceries: "#84cc16",
                          transport: "#3b82f6", gas: "#6366f1", travel: "#8b5cf6",
                          entertainment: "#ec4899", shopping: "#f59e0b",
                          utilities: "#14b8a6", health: "#10b981", medical: "#10b981",
                          housing: "#64748b", rent: "#64748b",
                          education: "#0ea5e9", personal: "#a78bfa",
                          other: "#94a3b8",
                        };

                        const getCatColor = (cat: string) => {
                          const userCat = categories.find((c) => c.name.toLowerCase() === cat.toLowerCase());
                          return userCat?.color ?? catColors[cat.toLowerCase()] ?? "#94a3b8";
                        };

                        return (
                          <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-[#EDE8E0] flex items-center justify-between">
                              <div>
                                <h3 className="font-bold text-[#0D0E12] text-sm">
                                  Spending {spendPeriod === "today" ? "Today" : "This Month"}
                                </h3>
                                <p className="text-xs text-[#9A9AA8] mt-0.5">
                                  Total: <span className="font-semibold text-[#2C2C35]">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                  {" "}· {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-full">
                                <PieChart className="w-3.5 h-3.5" /> AI
                              </div>
                            </div>
                            <div className="divide-y divide-slate-100">
                              {sorted.map(([cat, amt]) => {
                                const pct = Math.round((amt / total) * 100);
                                const color = getCatColor(cat);
                                return (
                                  <div key={cat} className="px-5 py-3.5">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                                        <span className="text-sm font-medium text-[#2C2C35] capitalize">{cat}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs text-[#9A9AA8]">{pct}%</span>
                                        <span className="text-sm font-bold text-[#0D0E12]">${amt.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                      </div>
                                    </div>
                                    <div className="h-1.5 bg-[#F0ECE5] rounded-full overflow-hidden">
                                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Categories Management */}
                      <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-[#EDE8E0] flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-[#0D0E12] text-sm flex items-center gap-2">
                              <Tag className="w-4 h-4 text-[#7C7C8A]" /> Spending Categories
                            </h3>
                            <p className="text-xs text-[#9A9AA8] mt-0.5">Customize how transactions are grouped</p>
                          </div>
                          {catLoading && <RefreshCw className="w-4 h-4 text-[#9A9AA8] animate-spin" />}
                        </div>

                        {/* Category list */}
                        <div className="divide-y divide-slate-100">
                          {categories.map((cat) => (
                            <div key={cat.id} className="px-5 py-3.5">
                              {editingCat === cat.id ? (
                                <div className="space-y-2.5">
                                  <div className="flex items-center gap-2">
                                    <input type="color" value={editCatColor} onChange={(e) => setEditCatColor(e.target.value)}
                                      className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0.5 bg-transparent" />
                                    <Input value={editCatName} onChange={(e) => setEditCatName(e.target.value)}
                                      placeholder="Category name" className="h-9 border-[#E5E0D8] rounded-lg text-sm flex-1" />
                                  </div>
                                  <Input value={editCatKeywords} onChange={(e) => setEditCatKeywords(e.target.value)}
                                    placeholder="Keywords (comma-separated): coffee, starbucks, cafe" className="h-9 border-[#E5E0D8] rounded-lg text-sm" />
                                  <div className="flex gap-2">
                                    <Button size="sm" disabled={catSaving || !editCatName.trim()}
                                      className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg h-8 text-xs px-3"
                                      onClick={async () => {
                                        if (!session) return;
                                        setCatSaving(true);
                                        try {
                                          const res = await fetch(`/api/users/${session.id}/categories/${cat.id}`, {
                                            method: "PATCH", headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ name: editCatName.trim(), color: editCatColor, keywords: editCatKeywords.split(",").map((k) => k.trim()).filter(Boolean) }),
                                          });
                                          if (res.ok) { await fetchCategories(); setEditingCat(null); }
                                        } finally { setCatSaving(false); }
                                      }}>
                                      <Save className="w-3 h-3 mr-1" />{catSaving ? "Saving…" : "Save"}
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 text-xs px-3 rounded-lg text-[#7C7C8A]" onClick={() => setEditingCat(null)}>Cancel</Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color || "#94a3b8" }} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#1A1A24]">{cat.name}</p>
                                    {cat.keywords.length > 0 && (
                                      <p className="text-xs text-[#9A9AA8] mt-0.5 truncate">{cat.keywords.join(", ")}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {cat.isSystem && <span className="text-[10px] text-[#9A9AA8] bg-[#F0ECE5] px-1.5 py-0.5 rounded">built-in</span>}
                                    <button className="p-1.5 hover:bg-[#F0ECE5] rounded-lg text-[#9A9AA8] hover:text-blue-600 transition-colors"
                                      onClick={() => { setEditingCat(cat.id); setEditCatName(cat.name); setEditCatColor(cat.color || "#94a3b8"); setEditCatKeywords(cat.keywords.join(", ")); }}>
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    {!cat.isSystem && (
                                      <button className="p-1.5 hover:bg-red-50 rounded-lg text-[#9A9AA8] hover:text-red-500 transition-colors"
                                        onClick={async () => {
                                          if (!session || !confirm(`Delete "${cat.name}"?`)) return;
                                          await fetch(`/api/users/${session.id}/categories/${cat.id}`, { method: "DELETE" });
                                          fetchCategories();
                                        }}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add new category */}
                        <div className="px-5 py-4 border-t border-[#EDE8E0] bg-[#F8F6F2] space-y-2.5">
                          <p className="text-xs font-semibold text-[#3C3C4A]">Add Custom Category</p>
                          <div className="flex items-center gap-2">
                            <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)}
                              className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0.5 bg-transparent" />
                            <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                              placeholder="Category name (e.g. Subscriptions)" className="h-9 border-[#E5E0D8] rounded-lg text-sm flex-1" />
                          </div>
                          <Input value={newCatKeywords} onChange={(e) => setNewCatKeywords(e.target.value)}
                            placeholder="Keywords: netflix, spotify, hulu" className="h-9 border-[#E5E0D8] rounded-lg text-sm" />
                          <Button size="sm" disabled={catSaving || !newCatName.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-8 text-xs px-4"
                            onClick={async () => {
                              if (!session) return;
                              setCatSaving(true);
                              try {
                                const res = await fetch(`/api/users/${session.id}/categories`, {
                                  method: "POST", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ name: newCatName.trim(), color: newCatColor, keywords: newCatKeywords.split(",").map((k) => k.trim()).filter(Boolean) }),
                                });
                                if (res.ok) { await fetchCategories(); setNewCatName(""); setNewCatColor("#3b82f6"); setNewCatKeywords(""); }
                              } finally { setCatSaving(false); }
                            }}>
                            <Plus className="w-3 h-3 mr-1" />{catSaving ? "Adding…" : "Add Category"}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                    </SpendingSection>
                  )}

                  {/* ── Alerts Configuration ── */}
                  {activeSection === "alerts" && (
                    <AlertsSection>
                    <motion.div key="alerts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
                        <BellRing className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900">Proactive SMS Alerts</p>
                          <p className="text-xs text-blue-700 mt-0.5">Get a text message when something important happens with your accounts — before you even have to ask.</p>
                        </div>
                      </div>

                      {alertRows.length === 0 ? (
                        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-10 text-center">
                          <Bell className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                          <p className="font-semibold text-[#2C2C35] mb-2">No alerts configured</p>
                          <p className="text-xs text-[#9A9AA8] mb-4">Click the button below to set up your first alert.</p>
                          <Button
                            className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm px-5"
                            onClick={async () => {
                              if (!session) return;
                              const defaults = [
                                { alertType: "low_balance", threshold: "100", channel: "sms", enabled: true },
                                { alertType: "credit_near_limit", threshold: "90", channel: "sms", enabled: true },
                                { alertType: "large_transaction", threshold: "500", channel: "sms", enabled: true },
                                { alertType: "transfer_cleared", threshold: null, channel: "sms", enabled: false },
                              ];
                              for (const d of defaults) {
                                await fetch(`/api/users/${session.id}/alerts`, {
                                  method: "POST", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify(d),
                                });
                              }
                              fetchAlerts();
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" /> Set Up Alerts
                          </Button>
                        </div>
                      ) : (
                        <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden divide-y divide-slate-100">
                          {alertRows.map((alert) => {
                            const alertMeta: Record<string, { label: string; desc: string; icon: typeof Bell; thresholdLabel?: string; thresholdSuffix?: string }> = {
                              low_balance: { label: "Low Balance Alert", desc: "Get notified when any account balance drops below a threshold.", icon: AlertTriangle, thresholdLabel: "Alert when balance falls below", thresholdSuffix: "$" },
                              credit_near_limit: { label: "Credit Limit Warning", desc: "Get notified when your credit utilization exceeds a percentage.", icon: CreditCard, thresholdLabel: "Alert when utilization exceeds", thresholdSuffix: "%" },
                              large_transaction: { label: "Large Transaction", desc: "Get alerted when a single charge or transfer is unusually large.", icon: Landmark, thresholdLabel: "Alert for transactions over", thresholdSuffix: "$" },
                              transfer_cleared: { label: "Transfer Cleared", desc: "Get a confirmation SMS when a transfer or deposit clears.", icon: ArrowRightLeft, thresholdLabel: undefined },
                            };
                            const meta = alertMeta[alert.alertType] ?? { label: alert.alertType, desc: "", icon: Bell };
                            const IconEl = meta.icon;
                            const isSavingThis = alertSaving[alert.alertType];
                            const saveAlert = async (patch: Partial<AlertRow>) => {
                              if (!session) return;
                              setAlertSaving((prev) => ({ ...prev, [alert.alertType]: true }));
                              try {
                                await fetch(`/api/users/${session.id}/alerts/${alert.id}`, {
                                  method: "PATCH", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify(patch),
                                });
                                await fetchAlerts();
                              } finally { setAlertSaving((prev) => ({ ...prev, [alert.alertType]: false })); }
                            };
                            return (
                              <div key={alert.id} className={cn("px-5 py-4 transition-colors", !alert.enabled && "opacity-60")}>
                                <div className="flex items-start gap-4">
                                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5", alert.enabled ? "bg-blue-50" : "bg-[#F0ECE5]")}>
                                    <IconEl className={cn("w-5 h-5", alert.enabled ? "text-blue-700" : "text-[#9A9AA8]")} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-3 mb-0.5">
                                      <p className="font-semibold text-[#0D0E12] text-sm">{meta.label}</p>
                                      <button
                                        disabled={isSavingThis}
                                        onClick={() => saveAlert({ enabled: !alert.enabled })}
                                        className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none",
                                          alert.enabled ? "bg-emerald-500" : "bg-slate-200",
                                          isSavingThis && "opacity-50 cursor-not-allowed"
                                        )}>
                                        <span className={cn("inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform",
                                          alert.enabled ? "translate-x-5" : "translate-x-0"
                                        )} />
                                      </button>
                                    </div>
                                    <p className="text-xs text-[#7C7C8A] mb-3">{meta.desc}</p>
                                    {meta.thresholdLabel && alert.enabled && (
                                      <div className="flex items-center gap-2">
                                        <label className="text-xs font-medium text-[#3C3C4A] whitespace-nowrap">{meta.thresholdLabel}</label>
                                        <div className="flex items-center border border-[#E5E0D8] rounded-lg overflow-hidden h-8 bg-[#F8F6F2] w-28">
                                          {meta.thresholdSuffix === "$" && <span className="text-sm text-[#7C7C8A] pl-2.5 pr-1">$</span>}
                                          <input
                                            type="number"
                                            defaultValue={alert.threshold ?? ""}
                                            onBlur={(e) => saveAlert({ threshold: e.target.value })}
                                            className="flex-1 h-full text-sm px-1.5 bg-transparent outline-none text-[#1A1A24] w-full"
                                            min={0}
                                          />
                                          {meta.thresholdSuffix === "%" && <span className="text-sm text-[#7C7C8A] pr-2.5">%</span>}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="bg-[#F8F6F2] border border-[#E5E0D8] rounded-xl p-4 flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-[#7C7C8A] leading-relaxed">Alerts are sent via SMS to your registered phone number. Standard messaging rates may apply. You can turn off all alerts by texting <code className="bg-slate-200 text-[#2C2C35] px-1.5 py-0.5 rounded font-mono text-[11px]">STOP</code> at any time.</p>
                      </div>
                    </motion.div>
                    </AlertsSection>
                  )}

                  {/* ── SMS Activity ── */}
                  {activeSection === "sms" && (
                    <SmsLogsSection>
                    <motion.div key="sms" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-[#EDE8E0] flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-[#0D0E12] text-sm">SMS Activity</h3>
                            <p className="text-xs text-[#9A9AA8] mt-0.5">Your recent text exchanges</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                          </div>
                        </div>
                        {!smsLogs || (smsLogs as unknown[]).length === 0 ? (
                          <div className="py-12 text-center text-[#9A9AA8] text-sm">
                            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
                            No SMS activity yet. Try texting <code className="bg-[#F0ECE5] px-1.5 py-0.5 rounded text-[#3C3C4A]">BAL</code> to get started.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {(smsLogs as Array<{ id: number; direction: string; message: string; command: string | null; status: string; createdAt: string }>)
                              .slice(0, 15).map((log) => {
                                const isIn = log.direction === "inbound";
                                return (
                                  <div key={log.id} className="px-5 py-3.5 hover:bg-[#F8F6F2] transition-colors">
                                    <div className="flex items-start gap-3">
                                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", isIn ? "bg-blue-50" : "bg-[#F0ECE5]")}>
                                        <MessageSquare className={cn("w-4 h-4", isIn ? "text-blue-600" : "text-[#7C7C8A]")} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <span className={cn("text-xs font-bold uppercase tracking-wide", isIn ? "text-blue-600" : "text-[#7C7C8A]")}>
                                            {isIn ? "You" : "Text Banks"}
                                          </span>
                                          {log.command && <code className="text-xs bg-[#F0ECE5] text-[#3C3C4A] px-1.5 py-0.5 rounded font-mono">{log.command}</code>}
                                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium ml-auto",
                                            log.status === "sent" || log.status === "delivered" ? "bg-emerald-50 text-emerald-700"
                                              : log.status === "failed" ? "bg-red-50 text-red-600"
                                              : "bg-[#F0ECE5] text-[#7C7C8A]"
                                          )}>{log.status}</span>
                                        </div>
                                        <p className="text-sm text-[#2C2C35] leading-relaxed whitespace-pre-line">{log.message}</p>
                                        <p className="text-xs text-[#9A9AA8] mt-1">
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
                        <p className="text-xs font-bold text-[#9A9AA8] uppercase tracking-widest mb-4">All Commands</p>
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
                              <span className="text-[#7C7C8A] text-xs">{desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                    </SmsLogsSection>
                  )}

                  {/* ── Settings ── */}
                  {activeSection === "settings" && (
                    <SettingsSection onOpenReportBug={() => setShowReportBug(true)}>
                    <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

                      {/* Profile */}
                      <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#EDE8E0]">
                          <h3 className="font-bold text-[#0D0E12] text-sm flex items-center gap-2">
                            <User className="w-4 h-4 text-[#7C7C8A]" /> Profile
                          </h3>
                          <p className="text-xs text-[#9A9AA8] mt-0.5">Update your name and display info</p>
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-[#2C2C35]">First Name</label>
                              <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className="h-10 border-[#E5E0D8] rounded-xl text-sm" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-[#2C2C35]">Last Name</label>
                              <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className="h-10 border-[#E5E0D8] rounded-xl text-sm" />
                            </div>
                          </div>
                          {/* Email — read-only display */}
                          {(freshUser as { email?: string } | undefined)?.email && (
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-[#2C2C35]">Email Address</label>
                              <div className="flex items-center gap-2 h-10 px-3 bg-[#F8F6F2] border border-[#E5E0D8] rounded-xl">
                                <Mail className="w-4 h-4 text-[#9A9AA8] shrink-0" />
                                <span className="text-sm text-[#2C2C35] flex-1 truncate">
                                  {(freshUser as { email?: string }).email}
                                </span>
                                {(freshUser as { emailVerified?: boolean }).emailVerified
                                  ? <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">Verified</span>
                                  : <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">Unverified</span>
                                }
                              </div>
                            </div>
                          )}
                          {/* Phone Number Management */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-[#2C2C35]">Mobile Number</label>
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
                            <div className="flex items-center gap-2 p-3 bg-[#F8F6F2] border border-[#E5E0D8] rounded-xl">
                              <Phone className="w-4 h-4 text-[#9A9AA8] shrink-0" />
                              <span className="text-sm font-mono font-semibold text-[#1A1A24] flex-1">
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
                                    className="rounded-xl h-9 text-xs border-[#E5E0D8]"
                                    onClick={() => { setPhoneSection("view"); setPhoneOtp(""); setPhoneError(null); }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Change number — enter new phone */}
                            {phoneSection === "change-request" && (
                              <div className="space-y-3 p-4 bg-[#F8F6F2] border border-[#E5E0D8] rounded-xl">
                                <p className="text-xs text-[#3C3C4A] font-medium">Enter your new mobile number. We'll send a verification code to confirm it.</p>
                                <PhoneInput
                                  value={newPhone}
                                  onChange={setNewPhone}
                                  placeholder="(555) 000-0000"
                                />
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
                                    className="rounded-xl h-9 text-xs border-[#E5E0D8]"
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
                                    className="rounded-xl h-9 text-xs border-[#E5E0D8]"
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
                                className="w-full flex items-center justify-center gap-2 text-xs font-medium text-[#7C7C8A] hover:text-[#2C2C35] bg-[#F8F6F2] hover:bg-[#F0ECE5] border border-[#E5E0D8] rounded-xl h-9 transition-colors disabled:opacity-50"
                              >
                                {phoneLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                                Re-verify My Number
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Linked Phone Numbers (Premium) */}
                      <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#EDE8E0] flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-[#0D0E12] text-sm flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-[#7C7C8A]" /> Linked Phone Numbers
                              <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">Premium</span>
                            </h3>
                            <p className="text-xs text-[#9A9AA8] mt-0.5">Text bank commands from any linked number</p>
                          </div>
                        </div>
                        <div className="p-6 space-y-4">
                          {selectedPlan !== "premium" ? (
                            <div className="flex flex-col items-center text-center p-6 bg-[#F8F6F2] rounded-xl border border-[#E5E0D8] space-y-3">
                              <div className="w-10 h-10 bg-white border border-[#E5E0D8] rounded-xl flex items-center justify-center">
                                <Crown className="w-5 h-5 text-amber-500" />
                              </div>
                              <div>
                                <p className="font-bold text-[#0D0E12] text-sm">Premium Feature</p>
                                <p className="text-xs text-[#7C7C8A] mt-1">Upgrade to Premium to link additional phone numbers — family members or backup phones can all query your account via SMS.</p>
                              </div>
                              <button
                                onClick={() => { setSelectedPlan("premium"); window.scrollTo({ top: 9999, behavior: "smooth" }); }}
                                className="text-xs font-semibold text-[#0D0E12] hover:text-blue-700 bg-white hover:bg-blue-50 border border-[#E5E0D8] hover:border-blue-300 rounded-xl px-4 py-2 transition-colors"
                              >
                                View Premium Plan
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Success banner */}
                              {addPhoneSuccess && (
                                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />{addPhoneSuccess}
                                </div>
                              )}
                              {addPhoneError && (
                                <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{addPhoneError}
                                </div>
                              )}

                              {/* List of existing secondary phones */}
                              {linkedPhonesLoading ? (
                                <div className="flex items-center justify-center py-4 text-xs text-[#9A9AA8] gap-2">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading…
                                </div>
                              ) : linkedPhones.length === 0 && addPhoneStep === "idle" ? (
                                <div className="text-xs text-[#9A9AA8] text-center py-3">No additional numbers linked yet.</div>
                              ) : (
                                <div className="space-y-2">
                                  {linkedPhones.map((p) => (
                                    <div key={p.id} className="flex items-center gap-3 p-3 bg-[#F8F6F2] border border-[#E5E0D8] rounded-xl">
                                      <Phone className="w-4 h-4 text-[#9A9AA8] shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-mono font-semibold text-[#1A1A24] truncate">
                                          {p.phoneNumber.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, "+$1 ($2) $3-$4")}
                                        </p>
                                        {p.label && <p className="text-[10px] text-[#9A9AA8]">{p.label}</p>}
                                      </div>
                                      {p.verified
                                        ? <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">Verified</span>
                                        : <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">Unverified</span>
                                      }
                                      <button
                                        onClick={() => handleRemoveLinkedPhone(p.id)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                                        title="Remove"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add number flow */}
                              {addPhoneStep === "idle" && (
                                <button
                                  onClick={() => { setAddPhoneStep("form"); setAddPhoneError(null); setAddPhoneNumber(""); setAddPhoneLabel(""); }}
                                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 border-dashed rounded-xl h-10 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Phone Number
                                </button>
                              )}

                              {addPhoneStep === "form" && (
                                <div className="space-y-3 p-4 bg-[#F8F6F2] border border-[#E5E0D8] rounded-xl">
                                  <p className="text-xs text-[#3C3C4A] font-medium">Enter the new number. We'll send a 6-digit code to verify it.</p>
                                  <div className="space-y-2">
                                    <PhoneInput
                                      value={addPhoneNumber}
                                      onChange={setAddPhoneNumber}
                                      placeholder="(555) 000-0000"
                                    />
                                    <Input
                                      value={addPhoneLabel}
                                      onChange={(e) => setAddPhoneLabel(e.target.value)}
                                      placeholder="Label (optional — e.g. Mom's phone)"
                                      className="h-10 border-[#E5E0D8] rounded-xl text-sm"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-9 text-xs font-semibold"
                                      onClick={handleAddPhone}
                                      disabled={addPhoneLoading || addPhoneNumber.replace(/\D/g, "").length < 10}
                                    >
                                      {addPhoneLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Send Code"}
                                    </Button>
                                    <Button variant="outline" className="rounded-xl h-9 text-xs border-[#E5E0D8]"
                                      onClick={() => { setAddPhoneStep("idle"); setAddPhoneError(null); }}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {addPhoneStep === "verify" && (
                                <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                  <p className="text-xs text-blue-800 font-medium">
                                    Enter the 6-digit code sent to <span className="font-mono font-bold">{addPhoneNumber}</span>:
                                  </p>
                                  <Input
                                    value={addPhoneOtp}
                                    onChange={(e) => setAddPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder="000000"
                                    className="h-10 border-blue-300 rounded-xl text-sm font-mono tracking-widest text-center"
                                    maxLength={6}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-9 text-xs font-semibold"
                                      onClick={handleVerifyLinkedPhone}
                                      disabled={addPhoneLoading || addPhoneOtp.length !== 6}
                                    >
                                      {addPhoneLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Verify & Link"}
                                    </Button>
                                    <Button variant="outline" className="rounded-xl h-9 text-xs border-[#E5E0D8]"
                                      onClick={() => { setAddPhoneStep("form"); setAddPhoneOtp(""); setAddPhoneError(null); }}>
                                      Back
                                    </Button>
                                  </div>
                                  <button
                                    onClick={handleResendLinkedPhoneOtp}
                                    disabled={addPhoneLoading}
                                    className="w-full text-center text-[11px] text-blue-600 hover:text-blue-800 font-medium transition-colors disabled:opacity-50"
                                  >
                                    Resend code
                                  </button>
                                </div>
                              )}

                              <p className="text-[10px] text-[#9A9AA8] text-center">Verified numbers can text any command and receive balance/transaction info just like the primary number.</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* SMS Preferences */}
                      <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#EDE8E0]">
                          <h3 className="font-bold text-[#0D0E12] text-sm flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-[#7C7C8A]" /> SMS Preferences
                          </h3>
                          <p className="text-xs text-[#9A9AA8] mt-0.5">Control how Text Banks messages you</p>
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between p-4 bg-[#F8F6F2] rounded-xl border border-[#E5E0D8]">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", smsOptedIn ? "bg-emerald-50" : "bg-slate-200")}>
                                {smsOptedIn ? <Bell className="w-5 h-5 text-emerald-600" /> : <BellOff className="w-5 h-5 text-[#9A9AA8]" />}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-[#0D0E12]">SMS Messages</p>
                                <p className="text-xs text-[#7C7C8A]">{smsOptedIn ? "You will receive SMS replies" : "SMS responses are paused"}</p>
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

                          <div className="bg-[#F8F6F2] rounded-xl border border-[#E5E0D8] p-4 text-sm">
                            <p className="text-xs font-semibold text-[#2C2C35] mb-2">Text Banks SMS Number</p>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center">
                                <Phone className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-mono font-bold text-[#0D0E12]">(845) 689-0940</p>
                                <p className="text-xs text-[#7C7C8A]">Text commands to this number</p>
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-[#9A9AA8] bg-amber-50 border border-amber-200 rounded-lg p-3">
                            You can also text <code className="font-mono bg-amber-100 px-1 rounded">STOP</code> to (845) 689-0940 at any time to immediately opt out, or <code className="font-mono bg-amber-100 px-1 rounded">START</code> to re-enable.
                          </div>
                        </div>
                      </div>

                      {/* Billing & Plan */}
                      <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#EDE8E0]">
                          <h3 className="font-bold text-[#0D0E12] text-sm flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-[#7C7C8A]" /> Plan &amp; Billing
                          </h3>
                          <p className="text-xs text-[#9A9AA8] mt-0.5">Manage your subscription</p>
                        </div>
                        <div className="p-6 space-y-4">
                          {/* Current plan badge */}
                          <div className="flex items-center gap-2 px-3 py-2 bg-[#F8F6F2] border border-[#E5E0D8] rounded-xl">
                            <div className={cn("w-2 h-2 rounded-full", selectedPlan === "basic" ? "bg-slate-400" : selectedPlan === "pro" ? "bg-amber-400" : "bg-blue-500")} />
                            <span className="text-xs text-[#7C7C8A]">Current plan:</span>
                            <span className="text-xs font-bold text-[#0D0E12] capitalize">{selectedPlan === "pro" ? "Pro" : selectedPlan === "premium" ? "Premium" : "Basic (Free)"}</span>
                          </div>

                          {/* Plan cards */}
                          <div className="space-y-2.5">
                            {([
                              {
                                key: "basic" as const,
                                name: "Basic",
                                price: "Free",
                                accent: "border-[#E5E0D8]",
                                selectedAccent: "border-slate-400 bg-slate-50",
                                checkColor: "bg-slate-500",
                                features: ["2 linked bank accounts", "50 SMS commands/month", "Balance & transaction queries", "1 phone number"],
                              },
                              {
                                key: "pro" as const,
                                name: "Pro",
                                price: "$9.99/mo",
                                badge: "Most Popular",
                                accent: "border-[#E5E0D8]",
                                selectedAccent: "border-amber-400 bg-amber-50/40",
                                checkColor: "bg-amber-500",
                                features: ["Unlimited bank accounts", "Unlimited SMS commands", "AI spending categories", "Proactive alerts & notifications", "Spending analytics dashboard"],
                              },
                              {
                                key: "premium" as const,
                                name: "Premium",
                                price: "$19.99/mo",
                                accent: "border-[#E5E0D8]",
                                selectedAccent: "border-blue-500 bg-blue-50/40",
                                checkColor: "bg-blue-600",
                                features: ["Everything in Pro", "Multiple phone numbers", "Family / household access", "Priority SMS support", "Early access to new features"],
                              },
                            ]).map((plan) => (
                              <button
                                key={plan.key}
                                onClick={() => setSelectedPlan(plan.key)}
                                className={cn("relative w-full text-left p-4 rounded-xl border-2 transition-all",
                                  selectedPlan === plan.key ? plan.selectedAccent : "border-[#E5E0D8] bg-white hover:border-[#C8C0B5]"
                                )}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[#0D0E12] text-sm">{plan.name}</span>
                                    {"badge" in plan && plan.badge && (
                                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">{plan.badge}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-[#0D0E12]">{plan.price}</span>
                                    {selectedPlan === plan.key && (
                                      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", plan.checkColor)}>
                                        <Check className="w-3 h-3 text-white" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <ul className="space-y-1">
                                  {plan.features.map((f) => (
                                    <li key={f} className="flex items-center gap-1.5 text-xs text-[#7C7C8A]">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                      {f}
                                    </li>
                                  ))}
                                </ul>
                              </button>
                            ))}
                          </div>

                          {selectedPlan !== "basic" && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                              <span className="font-semibold">Coming soon:</span> Stripe billing will be enabled at launch. Your plan selection is saved and features will be unlocked automatically.
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
                    </SettingsSection>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ForgotPasswordModal
        open={showForgotPw}
        onClose={() => setShowForgotPw(false)}
        forgotStep={forgotStep}
        setForgotStep={setForgotStep}
        forgotSuccess={forgotSuccess}
        forgotError={forgotError}
        forgotLoading={forgotLoading}
        forgotEmail={forgotEmail}
        setForgotEmail={setForgotEmail}
        forgotPhone={forgotPhone}
        setForgotPhone={setForgotPhone}
        forgotOtp={forgotOtp}
        setForgotOtp={setForgotOtp}
        forgotNewPw={forgotNewPw}
        setForgotNewPw={setForgotNewPw}
        onRequest={handleForgotPassword}
        onReset={handleForgotOtpReset}
      />

      {/* ── Report Bug Modal ── */}
      <AnimatePresence>
        {showReportBug && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowReportBug(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE8E0]">
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4 text-red-500" />
                  <h2 className="text-base font-bold text-[#0D0E12]">Report a Bug</h2>
                </div>
                <button onClick={() => setShowReportBug(false)} className="text-[#9A9AA8] hover:text-[#3C3C4A] p-1 rounded-lg hover:bg-[#F0ECE5]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {bugReportStatus === "sent" ? (
                  <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Bug reported — thank you!</p>
                      <p className="text-xs text-emerald-700 mt-0.5">We'll look into it soon.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-[#7C7C8A]">Describe what happened and what you expected. We'll investigate.</p>
                    <textarea
                      value={bugReport}
                      onChange={(e) => setBugReport(e.target.value)}
                      placeholder="e.g. When I clicked 'Link Bank', nothing happened..."
                      className="w-full min-h-[100px] text-sm border border-[#E5E0D8] rounded-xl px-3 py-2.5 placeholder:text-[#9A9AA8] resize-none outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-shadow"
                    />
                    <Button
                      className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-10 font-semibold text-sm"
                      onClick={handleReportBug}
                      disabled={!bugReport.trim() || bugReportStatus === "sending"}
                    >
                      {bugReportStatus === "sending" ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : "Submit Report"}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Inactivity Warning Modal ── */}
      <AnimatePresence>
        {showInactivityWarning && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-amber-600" />
                </div>
                <h2 className="text-base font-bold text-[#0D0E12] mb-1">Still there?</h2>
                <p className="text-sm text-[#7C7C8A] mb-5">
                  You've been inactive for 30 minutes. We'll sign you out in 60 seconds for your security.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-[#E5E0D8] text-[#2C2C35] h-10 text-sm"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                  <Button
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-10 font-semibold text-sm"
                    onClick={() => { warningActiveRef.current = false; setShowInactivityWarning(false); resetInactivityTimer(); }}
                  >
                    Keep Me Signed In
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PublicLayout>
  );
}
