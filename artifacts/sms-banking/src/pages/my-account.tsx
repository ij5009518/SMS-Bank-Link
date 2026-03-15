import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Search,
  Building2,
  MessageSquare,
  LogOut,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListUsers, useGetUserTransactions, useGetSmsLogs } from "@workspace/api-client-react";

type UserAccount = {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  onboardingStatus: string;
  optedOut: boolean;
  accounts: Array<{
    id: number;
    bankName: string;
    accountType: string;
    accountLastFour: string;
    nickname: string;
    currentBalance: number;
  }>;
};

export default function MyAccountPage() {
  const [phoneInput, setPhoneInput] = useState("");
  const [searchPhone, setSearchPhone] = useState<string | null>(null);
  const [foundUser, setFoundUser] = useState<UserAccount | null>(null);
  const [notFound, setNotFound] = useState(false);

  const { data: allUsers } = useListUsers();
  const { data: transactions } = useGetUserTransactions(
    foundUser?.id ?? 0,
    {},
    { query: { enabled: !!foundUser } }
  );
  const { data: smsLogs } = useGetSmsLogs(
    { userId: foundUser?.id, limit: 20 },
    { query: { enabled: !!foundUser } }
  );

  const handleSearch = () => {
    setNotFound(false);
    setFoundUser(null);
    const normalized = phoneInput.replace(/\D/g, "");
    const match = allUsers?.find((u) => u.phoneNumber.replace(/\D/g, "") === normalized);
    if (match) {
      setFoundUser(match as UserAccount);
      setSearchPhone(phoneInput);
    } else {
      setNotFound(true);
    }
  };

  const handleSignOut = () => {
    setFoundUser(null);
    setSearchPhone(null);
    setPhoneInput("");
    setNotFound(false);
  };

  const statusColor = (status: string) => {
    if (status === "active") return "bg-green-100 text-green-800 border-green-200";
    if (status === "bank_linked") return "bg-blue-100 text-blue-800 border-blue-200";
    if (status === "opted_out") return "bg-red-100 text-red-800 border-red-200";
    return "bg-muted text-muted-foreground";
  };

  return (
    <PublicLayout>
      <div className="flex-1 flex flex-col items-center py-12 px-4 bg-slate-50/50 min-h-screen">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {!foundUser ? (
              <motion.div
                key="lookup"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                    <Phone className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-3xl font-display font-bold mb-2">My Account</h1>
                  <p className="text-muted-foreground">
                    Enter the mobile number you registered with to view your account.
                  </p>
                </div>

                <Card className="shadow-lg border-border/60">
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Registered Mobile Number
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={phoneInput}
                          onChange={(e) => {
                            setPhoneInput(e.target.value);
                            setNotFound(false);
                          }}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          className="flex-1"
                        />
                        <Button onClick={handleSearch} disabled={phoneInput.trim().length < 6}>
                          <Search className="w-4 h-4 mr-2" />
                          Look Up
                        </Button>
                      </div>
                      {notFound && (
                        <p className="text-sm text-destructive mt-1">
                          No account found for that number. Check the number and try again, or{" "}
                          <a href="/register" className="underline">
                            register here
                          </a>
                          .
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-primary" />
                      Your phone number is only used to look up your account. No password needed.
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
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
                      {foundUser.firstName} {foundUser.lastName}
                    </h1>
                    <p className="text-muted-foreground text-sm">{foundUser.phoneNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={cn("capitalize text-xs", statusColor(foundUser.onboardingStatus))}
                    >
                      {foundUser.onboardingStatus.replace("_", " ")}
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
                    {foundUser.accounts.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        No bank accounts linked.{" "}
                        <a href="/register" className="underline text-primary">
                          Link one now
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {foundUser.accounts.map((acct) => (
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
                                ${acct.currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
                              <div
                                className={cn(
                                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                                  txn.type === "credit"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                )}
                              >
                                {txn.type === "credit" ? (
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{txn.merchantName}</p>
                                <p className="text-xs text-muted-foreground capitalize">{txn.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={cn(
                                  "text-sm font-semibold",
                                  txn.type === "credit" ? "text-green-700" : "text-foreground"
                                )}
                              >
                                {txn.type === "credit" ? "+" : "-"}$
                                {Number(txn.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(txn.transactionDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
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
                          command: string | null;
                          status: string;
                          createdAt: string;
                        }>).slice(0, 20).map((log) => (
                          <div
                            key={log.id}
                            className={cn(
                              "flex gap-3 p-2.5 rounded-lg text-sm",
                              log.direction === "inbound"
                                ? "bg-primary/5 border border-primary/15"
                                : "bg-muted/40 border border-border/30"
                            )}
                          >
                            <div className="shrink-0 mt-0.5">
                              {log.direction === "inbound" ? (
                                <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
                              ) : (
                                <ArrowDownLeft className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-muted-foreground mb-0.5">
                                {log.direction === "inbound" ? "You sent" : "TextBank replied"}
                              </p>
                              <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                                {log.message}
                              </p>
                            </div>
                            <div className="shrink-0 flex items-start gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 mt-0.5" />
                              {new Date(log.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Commands reminder */}
                <Card className="border-primary/20 bg-primary/5 shadow-sm">
                  <CardContent className="pt-5 pb-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Your SMS Commands
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {foundUser.accounts.map((acct) => (
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PublicLayout>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
