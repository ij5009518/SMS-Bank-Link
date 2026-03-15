import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MessageSquare,
  LogOut,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ShieldCheck,
  Eye,
  EyeOff,
  Phone,
  Lock,
  User,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PublicLayout } from "@/components/layout/PublicLayout";
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

const statusColor = (status: string) => {
  if (status === "active") return "bg-green-100 text-green-800 border-green-200";
  if (status === "bank_linked") return "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "opted_out") return "bg-red-100 text-red-800 border-red-200";
  return "bg-muted text-muted-foreground";
};

export default function MyAccountPage() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [session, setSession] = useState<SessionUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign-in form
  const [signInPhone, setSignInPhone] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign-up form
  const [signUpFirst, setSignUpFirst] = useState("");
  const [signUpLast, setSignUpLast] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirm, setSignUpConfirm] = useState("");
  const [signUpConsent, setSignUpConsent] = useState(false);

  // Load existing session on mount
  useEffect(() => {
    setSession(getSession());
  }, []);

  const { data: freshUser } = useGetUser(session?.id ?? 0, { query: { enabled: !!session } });
  const { data: transactions } = useGetUserTransactions(
    session?.id ?? 0, {}, { query: { enabled: !!session } }
  );
  const { data: smsLogs } = useGetSmsLogs(
    { userId: session?.id, limit: 20 }, { query: { enabled: !!session } }
  );

  const userAccounts = (freshUser as { accounts?: Array<{ id: number; bankName: string; accountType: string; accountLastFour: string; nickname: string; currentBalance: number }> } | undefined)?.accounts ?? [];

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
      if (!res.ok) {
        setError(data.message || "Sign in failed.");
        return;
      }
      const user: SessionUser = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        onboardingStatus: data.onboardingStatus,
        optedOut: data.optedOut,
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
    if (!signUpFirst || !signUpLast || !signUpPhone || !signUpPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (signUpPassword !== signUpConfirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!signUpConsent) {
      setError("You must agree to receive SMS messages.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: signUpFirst,
          lastName: signUpLast,
          phoneNumber: signUpPhone,
          password: signUpPassword,
          smsConsent: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Sign up failed.");
        return;
      }
      const user: SessionUser = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        onboardingStatus: data.onboardingStatus,
        optedOut: data.optedOut,
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

  const displayUser = session;

  return (
    <PublicLayout>
      <div className="flex-1 flex flex-col items-center py-12 px-4 bg-slate-50/50 min-h-screen">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">

            {/* ── Auth screen ── */}
            {!session && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-3xl font-display font-bold mb-2">My Account</h1>
                  <p className="text-muted-foreground">
                    Sign in to view your balance and transaction history.
                  </p>
                </div>

                <Card className="shadow-lg border-border/60">
                  {/* Tab switcher */}
                  <div className="flex border-b border-border/60">
                    <button
                      onClick={() => { setTab("signin"); setError(null); }}
                      className={cn(
                        "flex-1 py-3.5 text-sm font-semibold transition-colors",
                        tab === "signin"
                          ? "border-b-2 border-primary text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { setTab("signup"); setError(null); }}
                      className={cn(
                        "flex-1 py-3.5 text-sm font-semibold transition-colors",
                        tab === "signup"
                          ? "border-b-2 border-primary text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Create Account
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {/* Sign In */}
                    {tab === "signin" && (
                      <motion.div
                        key="signin"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                      >
                        <CardContent className="pt-6 space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Mobile Number</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type="tel"
                                placeholder="(555) 123-4567"
                                value={signInPhone}
                                onChange={(e) => { setSignInPhone(e.target.value); setError(null); }}
                                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                                className="pl-9"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••"
                                value={signInPassword}
                                onChange={(e) => { setSignInPassword(e.target.value); setError(null); }}
                                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                                className="pl-9 pr-10"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword((v) => !v)}
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {error && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2.5">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              {error}
                            </div>
                          )}

                          <Button className="w-full" onClick={handleSignIn} disabled={isLoading}>
                            {isLoading ? "Signing in…" : "Sign In"}
                          </Button>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
                            <ShieldCheck className="w-4 h-4 shrink-0 text-primary" />
                            Your account information is kept private and secure.
                          </div>
                        </CardContent>

                        <CardFooter className="pt-0 pb-5 justify-center">
                          <p className="text-sm text-muted-foreground">
                            Don't have an account?{" "}
                            <button className="text-primary font-medium hover:underline" onClick={() => { setTab("signup"); setError(null); }}>
                              Create one
                            </button>
                            {" "}or{" "}
                            <a href="/register" className="text-primary font-medium hover:underline">
                              register with bank linking
                            </a>
                          </p>
                        </CardFooter>
                      </motion.div>
                    )}

                    {/* Sign Up */}
                    {tab === "signup" && (
                      <motion.div
                        key="signup"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                      >
                        <CardContent className="pt-6 space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">First Name</label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input placeholder="Jane" value={signUpFirst} onChange={(e) => { setSignUpFirst(e.target.value); setError(null); }} className="pl-9" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Last Name</label>
                              <Input placeholder="Doe" value={signUpLast} onChange={(e) => { setSignUpLast(e.target.value); setError(null); }} />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Mobile Number</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input type="tel" placeholder="(555) 123-4567" value={signUpPhone} onChange={(e) => { setSignUpPhone(e.target.value); setError(null); }} className="pl-9" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Password</label>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••"
                                  value={signUpPassword}
                                  onChange={(e) => { setSignUpPassword(e.target.value); setError(null); }}
                                  className="pr-10"
                                />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword((v) => !v)}>
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Confirm Password</label>
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••"
                                value={signUpConfirm}
                                onChange={(e) => { setSignUpConfirm(e.target.value); setError(null); }}
                              />
                            </div>
                          </div>

                          <div className="flex items-start gap-3 rounded-md border p-4 bg-muted/30">
                            <Checkbox
                              id="consent"
                              checked={signUpConsent}
                              onCheckedChange={(v) => { setSignUpConsent(!!v); setError(null); }}
                            />
                            <label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                              I agree to receive SMS messages from TextBank. Msg & data rates may apply. Reply STOP to cancel.
                            </label>
                          </div>

                          {error && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2.5">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              {error}
                            </div>
                          )}

                          <Button className="w-full" onClick={handleSignUp} disabled={isLoading}>
                            {isLoading ? "Creating account…" : "Create Account"}
                          </Button>

                          <p className="text-xs text-center text-muted-foreground">
                            Want to link your bank during sign-up?{" "}
                            <a href="/register" className="text-primary hover:underline">
                              Use full registration
                            </a>
                          </p>
                        </CardContent>

                        <CardFooter className="pt-0 pb-5 justify-center">
                          <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <button className="text-primary font-medium hover:underline" onClick={() => { setTab("signin"); setError(null); }}>
                              Sign in
                            </button>
                          </p>
                        </CardFooter>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )}

            {/* ── Dashboard ── */}
            {session && displayUser && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-display font-bold">
                      {displayUser.firstName} {displayUser.lastName}
                    </h1>
                    <p className="text-muted-foreground text-sm">{displayUser.phoneNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={cn("capitalize text-xs", statusColor(displayUser.onboardingStatus))}
                    >
                      {displayUser.onboardingStatus.replace("_", " ")}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-1" />
                      Sign out
                    </Button>
                  </div>
                </div>

                {/* Linked Accounts */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      Linked Bank Accounts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userAccounts.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        No bank accounts linked.{" "}
                        <a href="/register" className="underline text-primary">
                          Link one now
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userAccounts.map((acct) => (
                          <div
                            key={acct.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40"
                          >
                            <div>
                              <p className="font-medium text-sm">
                                {acct.bankName}
                                <span className="text-muted-foreground font-normal ml-1">
                                  ••••{acct.accountLastFour}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {acct.accountType} ·{" "}
                                <span className="font-mono">SMS: BAL {acct.nickname}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm">
                                ${Number(acct.currentBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground">balance</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      Recent Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!transactions || transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No transactions on record yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(transactions as Array<{
                          id: number;
                          merchantName: string;
                          category: string;
                          amount: number;
                          type: string;
                          transactionDate: string;
                        }>).slice(0, 8).map((txn) => (
                          <div key={txn.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", txn.type === "credit" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                {txn.type === "credit" ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{txn.merchantName}</p>
                                <p className="text-xs text-muted-foreground capitalize">{txn.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={cn("text-sm font-semibold", txn.type === "credit" ? "text-green-700" : "text-foreground")}>
                                {txn.type === "credit" ? "+" : "-"}$
                                {Number(txn.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(txn.transactionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* SMS History */}
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      SMS Command History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!smsLogs || smsLogs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No SMS commands sent yet. Try texting <strong>BAL</strong> to get started.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {(smsLogs as Array<{
                          id: number;
                          direction: string;
                          message: string;
                          status: string;
                          createdAt: string;
                        }>).slice(0, 20).map((log) => (
                          <div
                            key={log.id}
                            className={cn("flex gap-3 p-2.5 rounded-lg text-sm", log.direction === "inbound" ? "bg-primary/5 border border-primary/15" : "bg-muted/40 border border-border/30")}
                          >
                            <div className="shrink-0 mt-0.5">
                              {log.direction === "inbound" ? <ArrowUpRight className="w-3.5 h-3.5 text-primary" /> : <ArrowDownLeft className="w-3.5 h-3.5 text-muted-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-muted-foreground mb-0.5">
                                {log.direction === "inbound" ? "You sent" : "TextBank replied"}
                              </p>
                              <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">{log.message}</p>
                            </div>
                            <div className="shrink-0 flex items-start gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 mt-0.5" />
                              {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Commands */}
                {userAccounts.length > 0 && (
                  <Card className="border-primary/20 bg-primary/5 shadow-sm">
                    <CardContent className="pt-5 pb-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Your SMS Commands
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {userAccounts.map((acct) => (
                          <div key={acct.id} className="flex gap-2">
                            <span className="font-mono font-bold text-primary">BAL {acct.nickname}</span>
                            <span className="text-muted-foreground truncate">{acct.bankName}</span>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <span className="font-mono font-bold text-primary">TRANS</span>
                          <span className="text-muted-foreground">Recent history</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-mono font-bold text-primary">STOP</span>
                          <span className="text-muted-foreground">Opt out</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PublicLayout>
  );
}
